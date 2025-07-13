const mongoose = require('mongoose');

const BlogImageSchema = new mongoose.Schema({
  filePath: {
    type: String,
    required: true
  },
  filename: {
    type: String
  },
  blogPostId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogPost',
    required: false // Will be set after BlogPost is created
  }
}, { timestamps: true });

module.exports = mongoose.model('BlogImage', BlogImageSchema);