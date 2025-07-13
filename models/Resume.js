const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true, // Each user can have only one resume
  },
  profileImage: { type: String }, // Stores filename for image
  fullName: { type: String, required: true },
  dateOfBirth: { type: String },
  gender: { type: String },
  nationality: { type: String },
  email: { type: String },
  phone: { type: String },
  address: { type: String },

  athleticDetails: {
    primarySport: { type: String },
    position: { type: String },
    height: { type: Number },
    weight: { type: Number },
    dominantSide: { type: String },
    currentTeam: { type: String }
  },

  education: [
    {
      institution: String,
      qualification: String,
      year: String
    }
  ],

  careerStats: { type: String }, // For cricket, football, etc.

  achievements: [
    {
      title: String,
      date: String
    }
  ],

  tournaments: [
    {
      name: String,
      date: String,
      venue: String,
      result: String
    }
  ],

  skills: [String],

  certifications: [
    {
      name: String,
      issuer: String,
      year: String
    }
  ],

  references: [
    {
      name: String,
      position: String,
      contact: String
    }
  ],

  videoLinks: [String],
  socialLinks: [String]
});

module.exports = mongoose.model('Resume', ResumeSchema);