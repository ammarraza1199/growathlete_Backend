const mongoose = require('mongoose');

const ContactSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Contact', ContactSchema);