const express = require('express');
const router = express.Router();
const MembershipPlan = require('../models/MembershipPlan');

// Get all membership plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await MembershipPlan.find();
    res.status(200).json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new membership plan (admin only)
router.post('/plans', async (req, res) => {
  try {
    const newPlan = new MembershipPlan(req.body);
    await newPlan.save();
    res.status(201).json({ message: 'Membership plan created successfully', plan: newPlan });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;