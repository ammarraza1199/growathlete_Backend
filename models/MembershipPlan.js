const mongoose = require('mongoose');

const MembershipPlanSchema = new mongoose.Schema({
  name: { type: String, required: true, enum: ['Free', 'Premium', 'Sponsorship'] },
  pricePerMonth: { type: Number, required: true },
  features: [String]
});

module.exports = mongoose.model('MembershipPlan', MembershipPlanSchema);