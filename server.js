const express = require('express');
const connectDB = require('./config/db');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();
console.log('JWT_SECRET from .env in server.js:', process.env.JWT_SECRET);

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
const allowedOrigins = [
  'https://www.growathlete.com',
  'http://localhost:3000'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/athlete-profiles', require('./routes/athleteProfileRoutes'));
app.use('/api/blogs', require('./routes/blogRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));
app.use('/api/membership', require('./routes/membershipRoutes'));
app.use('/api/profiles', require('./routes/profileRoutes'));
app.use('/api/resumes', require('./routes/resumeRoutes'));
app.use('/api/communities', require('./routes/communityRoutes'));
app.use('/api/community-posts', require('./routes/communityPostRoutes'));
app.use('/api/follow', require('./routes/followRoutes'));

app.get('/', (req, res) => {
  res.send('🏃‍♂️ GrowAthlete India API is running!');
});

app.listen(PORT, () => {
  if (process.env.NODE_ENV === 'production') {
    console.log(`🚀 Server running on Render (port ${PORT})`);
  } else {
    console.log(`🚀 Server running locally at http://localhost:${PORT}`);
  }
});
