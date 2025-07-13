const mongoose = require('mongoose');

const AthleteProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  sport: { type: String, required: true },
  achievements: [{ type: String }],
  statistics: { type: Object },
  bio: { type: String, maxlength: 500 },
  contact: {
    phone: { type: String },
    socialMedia: [{ name: String, url: String }],
  },
  location: { type: String },
  // Add more fields as needed for comprehensive athlete profiles
}, { timestamps: true });

module.exports = mongoose.model('AthleteProfile', AthleteProfileSchema); 