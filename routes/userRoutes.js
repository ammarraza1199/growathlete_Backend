const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');
const User = require('../models/User');
const Follow = require('../models/Follow'); // Import Follow model
const BlogPost = require('../models/BlogPost'); // Import BlogPost model
const { protect } = require('../middleware/authMiddleware'); // Import protect middleware

// Register new user
router.post('/register', registerUser);

// Login user
router.post('/login', loginUser);

// @route   POST /api/users/:id/follow
// @desc    Follow a user
// @access  Private
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const userIdToFollow = req.params.id;
    const currentUserId = req.user.id;

    if (userIdToFollow === currentUserId) {
      return res.status(400).json({ msg: 'You cannot follow yourself' });
    }

    const existingFollow = await Follow.findOne({
      follower: currentUserId,
      following: userIdToFollow,
    });

    if (existingFollow) {
      return res.status(400).json({ msg: 'Already following this user' });
    }

    const newFollow = new Follow({
      follower: currentUserId,
      following: userIdToFollow,
    });

    await newFollow.save();

    // Update follower/following counts
    await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } });
    await User.findByIdAndUpdate(userIdToFollow, { $inc: { followersCount: 1 } });

    res.json({ msg: 'User followed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/users/:id/unfollow
// @desc    Unfollow a user
// @access  Private
router.delete('/:id/unfollow', protect, async (req, res) => {
  try {
    const userIdToUnfollow = req.params.id;
    const currentUserId = req.user.id;

    const follow = await Follow.findOneAndRemove({
      follower: currentUserId,
      following: userIdToUnfollow,
    });

    if (!follow) {
      return res.status(400).json({ msg: 'You are not following this user' });
    }

    // Update follower/following counts
    await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(userIdToUnfollow, { $inc: { followersCount: -1 } });

    res.json({ msg: 'User unfollowed successfully' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/:id/profile-stats
// @desc    Get user profile stats (posts, followers, following)
// @access  Public
router.get('/:id/profile-stats', async (req, res) => {
  try {
    const userId = req.params.id;

    const user = await User.findById(userId).select('followersCount followingCount');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    const postsCount = await BlogPost.countDocuments({ author: userId });

    res.json({
      postsCount,
      followersCount: user.followersCount,
      followingCount: user.followingCount,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/users/:followerId/following/:followingId
// @desc    Check if a user is following another
// @access  Private
router.get('/:followerId/following/:followingId', protect, async (req, res) => {
  try {
    const { followerId, followingId } = req.params;

    const isFollowing = await Follow.exists({
      follower: followerId,
      following: followingId,
    });

    res.json({ isFollowing: !!isFollowing });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// Protected route example (using new protect middleware)
router.get('/profile', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

module.exports = router;