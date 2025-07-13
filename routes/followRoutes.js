const express = require('express');
const router = express.Router();
const { followUser, unfollowUser } = require('../controllers/followController');
const { protect } = require('../middleware/authMiddleware');

// @route   POST api/follow
// @desc    Follow a user
// @access  Private
router.post('/', protect, followUser);

// @route   DELETE api/follow/:id
// @desc    Unfollow a user
// @access  Private
router.delete('/:id', protect, unfollowUser);

module.exports = router;