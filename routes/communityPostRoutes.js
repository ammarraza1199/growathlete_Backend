const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const CommunityPost = require('../models/CommunityPost');
const Community = require('../models/Community');

// Multer storage configuration for community posts
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/community_posts';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
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

// @route   POST /api/community-posts
// @desc    Create a community post
// @access  Private
router.post('/', protect, upload.single('image'), async (req, res) => {
  try {
    const { text } = req.body;
    const image = req.file ? req.file.path : null;

    if (!text && !image) {
      return res.status(400).json({ message: 'Post must contain text or an image.' });
    }

    const newPost = new CommunityPost({
      text,
      image,
      author: req.user._id,
    });

    await newPost.save();

    res.status(201).json(newPost);
  } catch (error) {
    console.error('Error creating community post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/community-posts
// @desc    Get all community posts with pagination
// @access  Public
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const posts = await CommunityPost.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('author', 'fullName profilePicture') // Populate author details
      .populate('likes', 'fullName') // Populate users who liked the post
      .populate({
        path: 'comments.user',
        select: 'fullName profilePicture', // Populate user details for comments
      });

    const totalPosts = await CommunityPost.countDocuments({});

    res.status(200).json({
      posts,
      currentPage: page,
      totalPages: Math.ceil(totalPosts / limit),
      totalPosts,
    });
  } catch (error) {
    console.error('Error fetching community posts:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/community-posts/:id/like
// @desc    Like or unlike a community post
// @access  Private
router.put('/:id/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if the post has already been liked by this user
    const isLiked = post.likes.includes(req.user._id);

    if (isLiked) {
      // Unlike the post
      post.likes = post.likes.filter(
        (like) => like.toString() !== req.user._id.toString()
      );
    } else {
      // Like the post
      post.likes.push(req.user._id);
    }

    await post.save();
    res.status(200).json(post.likes);
  } catch (error) {
    console.error('Error liking/unliking post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/community-posts/:id/comment
// @desc    Add a comment to a community post
// @access  Private
router.post('/:id/comment', protect, async (req, res) => {
  try {
    const { text } = req.body;
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    if (!text) {
      return res.status(400).json({ message: 'Comment text is required' });
    }

    const newComment = {
      user: req.user._id,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Populate the user field for the newly added comment before sending the response
    const populatedPost = await CommunityPost.findById(req.params.id).populate({
      path: 'comments.user',
      select: 'fullName profilePicture',
    });

    res.status(201).json(populatedPost.comments[populatedPost.comments.length - 1]); // Return the newly added comment
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/community-posts/:id
// @desc    Delete a community post
// @access  Private (only author or admin)
router.delete('/:id', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: 'Post not found' });
    }

    // Check if user is author of the post
    if (post.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'User not authorized' });
    }

    // Delete image file if it exists
    if (post.image) {
      fs.unlink(post.image, (err) => {
        if (err) console.error('Error deleting image file:', err);
      });
    }

    await post.deleteOne();

    res.status(200).json({ message: 'Post removed' });
  } catch (error) {
    console.error('Error deleting community post:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;