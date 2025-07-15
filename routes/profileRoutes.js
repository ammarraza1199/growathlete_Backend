const express = require('express');
const router = express.Router();
const Profile = require('../models/Profile');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const multer = require('multer');

// Multer setup for file uploads
const storage = multer.memoryStorage(); // Use memory storage

const upload = multer({ storage: storage });

// @route   GET /api/profile
// @desc    Get user profile
// @access  Private
const getProfile = async (req, res) => {
  try {
    console.log('Attempting to fetch profile for user:', req.user._id);
    const profile = await Profile.findOne({ user: req.user._id });
    console.log('Profile fetch result:', profile);
    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @route   POST /api/profile/create-profile
// @desc    Create new profile
// @access  Private
router.post('/create-profile', protect, upload.single('profileImage'), async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, location, primarySport, currentLevel, bio, achievements, email, phone } = req.body;

    const profileFields = {
      user: req.user._id,
      fullName,
      dateOfBirth,
      gender,
      location,
      athleticInfo: {
        primarySport,
        currentLevel,
        bio,
      },
      achievements: achievements.split('\n').map(item => ({ title: item.trim(), date: new Date(), description: '' })),
      contact: {
        email,
        phone,
      },
    };

    if (req.file) {
      profileFields.profileImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const newProfile = new Profile(profileFields);
    await newProfile.save();
    console.log('Profile created for user:', req.user._id, 'Profile data:', newProfile);
    res.status(201).json({ message: 'Profile created successfully', profile: newProfile });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

// @route   PUT /api/profile
// @desc    Update user profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { fullName, dateOfBirth, gender, location, primarySport, currentLevel, bio, achievements, email, phone } = req.body;

    const profileFields = {
      fullName,
      dateOfBirth,
      gender,
      location,
      athleticInfo: {
        primarySport,
        currentLevel,
        bio,
      },
      achievements: achievements.split('\n').map(item => ({ title: item.trim(), date: new Date(), description: '' })),
      contact: {
        email,
        phone,
      },
    };

    if (req.file) {
      profileFields.profileImage = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    let profile = await Profile.findOne({ user: req.user._id });

    if (profile) {
      // Update
      profile = await Profile.findOneAndUpdate(
        { user: req.user._id },
        { $set: profileFields },
        { new: true, runValidators: true }
      );
      return res.json({ message: 'Profile updated successfully', profile: profile });
    }

    res.status(404).json({ message: 'Profile not found for this user' });

  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/profile/:id
// @desc    Get single profile by ID
// @access  Private (or Public if desired, but protect is used here)
const getProfileById = async (req, res) => {
  try {
    const profile = await Profile.findById(req.params.id)
      .populate('user', 'fullName email')
      .populate('followers', 'fullName') // Populate followers with their full names
      .populate('following', 'fullName') // Populate following with their full names
      .populate('posts'); // Populate posts

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }
    res.json(profile);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const followProfile = async (req, res) => {
  try {
    const profileToFollowId = req.params.id;
    const currentUserId = req.user._id;

    // Find the profile to be followed
    const profileToFollow = await Profile.findById(profileToFollowId);
    if (!profileToFollow) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Find the current user's profile
    const currentUserProfile = await Profile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      return res.status(404).json({ message: 'Current user profile not found.' });
    }

    // Prevent following self
    if (profileToFollow.user.toString() === currentUserId.toString()) {
      return res.status(400).json({ message: 'You cannot follow your own profile.' });
    }

    // Add current user to the followed profile's followers if not already there
    if (!profileToFollow.followers.includes(currentUserProfile._id)) {
      profileToFollow.followers.unshift(currentUserProfile._id);
      await profileToFollow.save();
    }

    // Add followed profile to current user's following if not already there
    if (!currentUserProfile.following.includes(profileToFollow._id)) {
      currentUserProfile.following.unshift(profileToFollow._id);
      await currentUserProfile.save();
    }

    // Re-fetch the profile to return updated follower/following counts
    const updatedProfileToFollow = await Profile.findById(profileToFollowId)
      .populate('user', 'fullName email')
      .populate('followers', 'fullName')
      .populate('following', 'fullName')
      .populate('posts');

    res.status(200).json(updatedProfileToFollow);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

const unfollowProfile = async (req, res) => {
  try {
    const profileToUnfollowId = req.params.id;
    const currentUserId = req.user._id;

    // Find the profile to be unfollowed
    const profileToUnfollow = await Profile.findById(profileToUnfollowId);
    if (!profileToUnfollow) {
      return res.status(404).json({ message: 'Profile not found.' });
    }

    // Find the current user's profile
    const currentUserProfile = await Profile.findOne({ user: currentUserId });
    if (!currentUserProfile) {
      return res.status(404).json({ message: 'Current user profile not found.' });
    }

    // Remove current user from the unfollowed profile's followers
    profileToUnfollow.followers = profileToUnfollow.followers.filter(
      (followerId) => followerId.toString() !== currentUserProfile._id.toString()
    );
    await profileToUnfollow.save();

    // Remove unfollowed profile from current user's following
    currentUserProfile.following = currentUserProfile.following.filter(
      (followingId) => followingId.toString() !== profileToUnfollow._id.toString()
    );
    await currentUserProfile.save();

    // Re-fetch the profile to return updated follower/following counts
    const updatedProfileToUnfollow = await Profile.findById(profileToUnfollowId)
      .populate('user', 'fullName email')
      .populate('followers', 'fullName')
      .populate('following', 'fullName')
      .populate('posts');

    res.status(200).json(updatedProfileToUnfollow);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

// @route   GET /api/profile/all-except-me
// @desc    Get all profiles except the current user's
// @access  Private
const getAllProfilesExceptCurrentUser = async (req, res) => {
  try {
    // Exclude current user
    const profiles = await Profile.find({ user: { $ne: req.user._id } }).populate('user');
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server error' });
  }
};

// Get all profiles (protected, only for admin or specific roles if needed)
router.get('/profiles', protect, async (req, res) => {
  try {
    const profiles = await Profile.find({}); // Fetches all profiles, consider filtering by user if needed
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Public endpoint to get all profiles
router.get('/all', async (req, res) => {
  try {
    const profiles = await Profile.find({});
    res.status(200).json(profiles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete profile
router.delete('/profile/:id', protect, async (req, res) => {
  try {
    const deleted = await Profile.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!deleted) return res.status(404).json({ message: 'Profile not found or unauthorized' });
    res.status(200).json({ message: 'Profile deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Route definitions
router.get('/', protect, getProfile);
router.put('/', protect, upload.single('profileImage'), updateProfile);
router.get('/all-except-me', protect, getAllProfilesExceptCurrentUser);
router.get('/:id', protect, getProfileById);

module.exports = router;