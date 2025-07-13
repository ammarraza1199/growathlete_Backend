const express = require('express');
const router = express.Router();
const { createOrUpdateProfile, getProfileByUserId, getCurrentProfile, getAllProfiles, deleteProfile } = require('../controllers/athleteProfileController');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

// @route   POST api/athlete-profiles
// @desc    Create or update athlete profile
// @access  Private (athlete only)
router.post('/', protect, authorizeRoles('athlete'), createOrUpdateProfile);

// @route   GET api/athlete-profiles/me
// @desc    Get current user's profile
// @access  Private (athlete only)
router.get('/me', protect, authorizeRoles('athlete'), getCurrentProfile);

// @route   GET api/athlete-profiles/:userId
// @desc    Get athlete profile by user ID
// @access  Public
router.get('/:userId', getProfileByUserId);

// @route   GET api/athlete-profiles
// @desc    Get all athlete profiles
// @access  Public
router.get('/', getAllProfiles);

// @route   DELETE api/athlete-profiles
// @desc    Delete athlete profile
// @access  Private (athlete only)
router.delete('/', protect, authorizeRoles('athlete'), deleteProfile);

module.exports = router;