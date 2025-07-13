const express = require('express');
const router = express.Router();
const Community = require('../models/Community');
const { protect } = require('../middleware/authMiddleware');

// @route   POST /api/communities
// @desc    Create a community
// @access  Private (Admin/Authorized User)
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, sportCategory } = req.body;

    const newCommunity = new Community({
      name,
      description,
      sportCategory,
      createdBy: req.user.id,
    });

    const community = await newCommunity.save();
    res.status(201).json(community);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/communities
// @desc    Get all communities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const communities = await Community.find().sort({ name: 1 });
    res.json(communities);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET /api/communities/:id
// @desc    Get community by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const community = await Community.findById(req.params.id).populate('createdBy', 'fullName');

    if (!community) {
      return res.status(404).json({ msg: 'Community not found' });
    }

    res.json(community);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Community not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   PUT /api/communities/:id
// @desc    Update a community
// @access  Private (Admin/Authorized User)
router.put('/:id', protect, async (req, res) => {
  const { name, description, sportCategory } = req.body;

  // Build community object
  const communityFields = {};
  if (name) communityFields.name = name;
  if (description) communityFields.description = description;
  if (sportCategory) communityFields.sportCategory = sportCategory;

  try {
    let community = await Community.findById(req.params.id);

    if (!community) return res.status(404).json({ msg: 'Community not found' });

    // Ensure user owns community (or is admin if roles are implemented)
    if (community.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    community = await Community.findByIdAndUpdate(
      req.params.id,
      { $set: communityFields },
      { new: true }
    );

    res.json(community);
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Community not found' });
    }
    res.status(500).send('Server Error');
  }
});

// @route   DELETE /api/communities/:id
// @desc    Delete a community
// @access  Private (Admin/Authorized User)
router.delete('/:id', protect, async (req, res) => {
  try {
    const community = await Community.findById(req.params.id);

    if (!community) {
      return res.status(404).json({ msg: 'Community not found' });
    }

    // Ensure user owns community (or is admin if roles are implemented)
    if (community.createdBy.toString() !== req.user.id) {
      return res.status(401).json({ msg: 'User not authorized' });
    }

    await Community.findByIdAndRemove(req.params.id);

    res.json({ msg: 'Community removed' });
  } catch (err) {
    console.error(err.message);
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ msg: 'Community not found' });
    }
    res.status(500).send('Server Error');
  }
});

module.exports = router;
