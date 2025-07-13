const express = require('express');
const router = express.Router();
const BlogPost = require('../models/BlogPost');
const BlogImage = require('../models/BlogImage');
const Community = require('../models/Community'); // Import Community model
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

// Image upload config using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/blog_images');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    if (mimetype && extname) return cb(null, true);
    cb(new Error('Only image files are allowed (PNG, JPG, GIF)'));
  }
});

// Create blog post
router.post('/create-blog', protect, upload.single('featuredImage'), async (req, res) => {
  try {
    console.log('req.user:', req.user); // Add this line to debug
    console.log('req.body:', req.body);
    const { title, summary, category, tags, content, status, visibility } = req.body;
    let community = req.body.community; // Get community from req.body

    // Ensure community is a single string, not an array
    if (Array.isArray(community)) {
      community = community[0];
    }

    let featuredImageId = null;
    if (req.file) {
      const newImage = new BlogImage({
        filePath: req.file.path,
        filename: req.file.filename,
      });
      await newImage.save();
      featuredImageId = newImage._id;
    }

    const newBlog = new BlogPost({
      title,
      summary,
      category,
      tags: tags?.split(',').map(t => t.trim()),
      content,
      publication: {
        status: status === 'publish' ? 'Published' : status,
        visibility: visibility === 'public' ? 'Public' : visibility
      },
      author: req.user._id,
      featuredImage: featuredImageId,
      community: community || null, // Assign community
    });

    await newBlog.save();

    if (featuredImageId) {
      await BlogImage.findByIdAndUpdate(featuredImageId, { blogPostId: newBlog._id });
    }

    res.status(201).json({ message: 'Blog post created successfully', blog: newBlog });
  } catch (error) {
    console.error('Error creating blog post:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// Get only public published blogs (with optional community filter)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const category = req.query.category; // Get category from query parameter

    let filter = {
      'publication.status': 'Published',
      'publication.visibility': 'Public'
    };

    if (category && category !== 'All') {
      filter.category = category; // Add category filter if provided
    }

    const blogs = await BlogPost.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName')
      .populate('featuredImage')
      .populate('community', 'name sportCategory'); // Populate community

    const totalBlogs = await BlogPost.countDocuments(filter);

    res.status(200).json({
      blogs,
      currentPage: page,
      totalPages: Math.ceil(totalBlogs / limit),
      totalBlogs,
    });
  } catch (error) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// Get a single blog post
router.get('/blog/:id', async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id)
      .populate('featuredImage')
      .populate('community', 'name sportCategory'); // Populate community
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update a blog post
router.put('/blog/:id', protect, upload.single('featuredImage'), async (req, res) => {
  try {
    const updates = { ...req.body };

    if (req.file) {
      const newImage = new BlogImage({
        filePath: req.file.path,
        filename: req.file.filename,
      });
      await newImage.save();
      updates.featuredImage = newImage._id;

      const oldBlog = await BlogPost.findById(req.params.id);
      if (oldBlog && oldBlog.featuredImage) {
        const oldImage = await BlogImage.findById(oldBlog.featuredImage);
        if (oldImage && oldImage.filePath) {
          fs.unlink(oldImage.filePath, (err) => {
            if (err) console.error('Error deleting old image file:', err);
          });
        }
        await BlogImage.findByIdAndDelete(oldBlog.featuredImage);
      }
    }

    if (updates.tags) {
      updates.tags = updates.tags.split(',').map(t => t.trim());
    }

    // Handle community update
    if (updates.community) {
      updates.community = updates.community; // Ensure it's a valid ObjectId if coming from frontend
    } else if (updates.community === '') {
      updates.community = null; // Allow unsetting community
    }

    const blog = await BlogPost.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.status(200).json(blog);
  } catch (error) {
    console.error('Error updating blog post:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// Delete a blog post
router.delete('/blog/:id', protect, async (req, res) => {
  try {
    const blog = await BlogPost.findById(req.params.id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog post not found' });
    }

    if (blog.featuredImage) {
      const image = await BlogImage.findById(blog.featuredImage);
      if (image && image.filePath) {
        fs.unlink(image.filePath, (err) => {
          if (err) console.error('Error deleting image file:', err);
        });
      }
      await BlogImage.findByIdAndDelete(blog.featuredImage);
    }

    await BlogPost.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Blog post deleted' });
  } catch (error) {
    console.error('Error deleting blog post:', error);
    res.status(500).json({ error: error.message, details: error.stack });
  }
});

// Get blog posts by user ID
router.get('/user/:userId', protect, async (req, res) => {
  try {
    const userId = req.params.userId;
    const blogs = await BlogPost.find({ author: userId })
      .populate('featuredImage')
      .sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    console.error('Error fetching user blogs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all unique blog categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await BlogPost.distinct('category', { 'publication.status': 'Published', 'publication.visibility': 'Public' });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
