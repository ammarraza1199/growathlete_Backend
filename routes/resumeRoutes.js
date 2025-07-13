const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const PDFDocument = require('pdfkit');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../uploads/profile_images');
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage: storage });

const createResume = async (req, res) => {
  try {
    const userId = req.user._id; 
    const existingResume = await Resume.findOne({ user: userId });

    if (existingResume) {
      return res.status(400).json({ message: 'Resume already exists for this user. Please update instead.' });
    }

    const newResume = new Resume({
      user: userId,
      ...req.body,
      profileImage: req.file ? req.file.filename : undefined,
    });

    const savedResume = await newResume.save();
    res.status(201).json(savedResume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const updateResume = async (req, res) => {
  try {
    const { id } = req.params;
    const resumeToUpdate = await Resume.findById(id);

    if (!resumeToUpdate) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    if (resumeToUpdate.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Forbidden: You can only update your own resume.' });
    }
    const updateData = { ...req.body };

    if (req.file) {
      updateData.profileImage = req.file.filename;
    }

    const updatedResume = await Resume.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedResume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    res.status(200).json(updatedResume);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

const getResume = async (req, res) => {
  try {
    console.log('Attempting to fetch resume for user ID:', req.user._id);
    const resume = await Resume.findOne({ user: req.user._id }).populate('user', 'fullName email');
    if (!resume) {
      console.log('Resume not found for user ID:', req.user._id);
      return res.status(404).json({ message: 'Resume not found' });
    }
    console.log('Resume found:', resume);
    res.status(200).json(resume);
  } catch (error) {
    console.error('Error fetching resume:', error);
    res.status(500).json({ message: error.message });
  }
}

const downloadResume = async (req, res) => {
  try {
    const resume = await Resume.findOne({ user: req.user._id }).populate('user', 'fullName email');
    if (!resume) {
      return res.status(404).json({ message: 'Resume not found' });
    }

    const doc = new PDFDocument();
    let filename = `resume_${resume.fullName}.pdf`;
    filename = encodeURIComponent(filename);

    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');

    doc.pipe(res);

    doc.fontSize(25).text(resume.fullName, { align: 'center' });
    doc.fontSize(12).text(`${resume.email} | ${resume.phone} | ${resume.address}`, { align: 'center' });
    doc.moveDown();

    if (resume.athleticDetails) {
      doc.fontSize(18).text('Athletic Details', { underline: true });
      doc.fontSize(12).text(`Primary Sport: ${resume.athleticDetails.primarySport}`);
      doc.text(`Position: ${resume.athleticDetails.position}`);
      doc.text(`Height: ${resume.athleticDetails.height} cm`);
      doc.text(`Weight: ${resume.athleticDetails.weight} kg`);
      doc.text(`Dominant Side: ${resume.athleticDetails.dominantSide}`);
      doc.text(`Current Team: ${resume.athleticDetails.currentTeam}`);
      doc.moveDown();
    }

    if (resume.education && resume.education.length > 0) {
      doc.fontSize(18).text('Education', { underline: true });
      resume.education.forEach(edu => {
        doc.fontSize(12).text(`${edu.qualification} from ${edu.institution} (${edu.year})`);
      });
      doc.moveDown();
    }

    if (resume.careerStats) {
      doc.fontSize(18).text('Career Statistics', { underline: true });
      doc.fontSize(12).text(resume.careerStats);
      doc.moveDown();
    }

    if (resume.achievements && resume.achievements.length > 0) {
      doc.fontSize(18).text('Achievements', { underline: true });
      resume.achievements.forEach(ach => {
        doc.fontSize(12).text(`${ach.title} (${ach.date})`);
      });
      doc.moveDown();
    }

    if (resume.tournaments && resume.tournaments.length > 0) {
      doc.fontSize(18).text('Tournaments', { underline: true });
      resume.tournaments.forEach(tour => {
        doc.fontSize(12).text(`${tour.name} - ${tour.result} (${tour.date}, ${tour.venue})`);
      });
      doc.moveDown();
    }

    if (resume.skills && resume.skills.length > 0) {
      doc.fontSize(18).text('Skills', { underline: true });
      doc.fontSize(12).text(resume.skills.join(', '));
      doc.moveDown();
    }

    if (resume.certifications && resume.certifications.length > 0) {
      doc.fontSize(18).text('Certifications', { underline: true });
      resume.certifications.forEach(cert => {
        doc.fontSize(12).text(`${cert.name} by ${cert.issuer} (${cert.year})`);
      });
      doc.moveDown();
    }

    if (resume.references && resume.references.length > 0) {
      doc.fontSize(18).text('References', { underline: true });
      resume.references.forEach(ref => {
        doc.fontSize(12).text(`${ref.name}, ${ref.position} - ${ref.contact}`);
      });
      doc.moveDown();
    }

    if (resume.videoLinks && resume.videoLinks.length > 0) {
      doc.fontSize(18).text('Video Links', { underline: true });
      resume.videoLinks.forEach(link => {
        doc.fontSize(12).text(link);
      });
      doc.moveDown();
    }

    if (resume.socialLinks && resume.socialLinks.length > 0) {
      doc.fontSize(18).text('Social Links', { underline: true });
      resume.socialLinks.forEach(link => {
        doc.fontSize(12).text(link);
      });
      doc.moveDown();
    }

    doc.end();
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

router.post('/', protect, upload.single('profileImage'), createResume);
router.put('/:id', protect, upload.single('profileImage'), updateResume);
router.get('/', protect, getResume);
router.get('/:id', protect, getResume);
router.get('/:id/download', protect, downloadResume);

module.exports = router;