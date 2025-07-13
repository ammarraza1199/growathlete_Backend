const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
  const { fullName, email, password, role } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });
    user = new User({ fullName, email, password, role });
    await user.save();
    const token = jwt.sign({ id: user._id, role: user.role, membership: user.membership }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('JWT_SECRET used for signing in register:', process.env.JWT_SECRET);
    res.status(201).json({ token, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, membership: user.membership } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

exports.login = async (req, res) => {
  console.log('Login request body:', req.body);
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user._id, role: user.role, membership: user.membership }, process.env.JWT_SECRET, { expiresIn: '7d' });
    console.log('JWT_SECRET used for signing in login:', process.env.JWT_SECRET);
    res.json({ token, user: { _id: user._id, fullName: user.fullName, email: user.email, role: user.role, membership: user.membership } });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
}; 