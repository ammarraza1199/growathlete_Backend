const mongoose = require('mongoose');

const BlogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  summary: { type: String, required: true },
  category: { type: String },
  tags: [String],
  featuredImage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BlogImage'
  },
  content: { type: String, required: true },

  publication: {
    status: { type: String, enum: ['Draft', 'Published'], default: 'Draft' },
    visibility: { type: String, enum: ['Public', 'Private'], default: 'Public' }
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  community: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Community',
    required: false,
  }
}, { timestamps: true });

module.exports = mongoose.model('BlogPost', BlogPostSchema);