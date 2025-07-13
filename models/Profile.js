const mongoose = require('mongoose');

const ProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  profileImage: { filename: String, contentType: String }, // Changed to store filename
  fullName: { type: String, required: true },
  dateOfBirth: { type: String },
  gender: { type: String },
  location: { type: String }, // city, state

  athleticInfo: {
    primarySport: { type: String },
    currentLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', 'semi-professional', 'professional'] },
    bio: { type: String }
  },

  achievements: [
    {
      title: String,
      date: String,
      description: String
    }
  ],

  contact: {
    email: { type: String },
    phone: { type: String }
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Profile' }],
  posts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BlogPost' }] // Assuming a BlogPost model for posts
}, { timestamps: true });

module.exports = mongoose.model('Profile', ProfileSchema);