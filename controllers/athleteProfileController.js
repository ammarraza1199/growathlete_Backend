const AthleteProfile = require('../models/AthleteProfile');

// Create or Update Athlete Profile
exports.createOrUpdateProfile = async (req, res) => {
  const { sport, achievements, statistics, bio, contact } = req.body;

  const profileFields = {};
  profileFields.user = req.user.id;
  if (sport) profileFields.sport = sport;
  if (achievements) profileFields.achievements = achievements;
  if (statistics) profileFields.statistics = statistics;
  if (bio) profileFields.bio = bio;
  if (contact) profileFields.contact = contact;

  try {
    let profile = await AthleteProfile.findOne({ user: req.user.id });

    if (profile) {
      // Update
      profile = await AthleteProfile.findOneAndUpdate(
        { user: req.user.id },
        { $set: profileFields },
        { new: true }
      );
      return res.json(profile);
    } else {
      // Create
      profile = new AthleteProfile(profileFields);
      await profile.save();
      return res.status(201).json(profile);
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get Athlete Profile by User ID
exports.getProfileByUserId = async (req, res) => {
  try {
    const profile = await AthleteProfile.findOne({ user: req.params.userId }).populate('user', ['name', 'email']);
    if (!profile) return res.status(404).json({ message: 'Profile not found' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get Current User's Profile
exports.getCurrentProfile = async (req, res) => {
  try {
    const profile = await AthleteProfile.findOne({ user: req.user.id }).populate('user', ['name', 'email']);
    if (!profile) return res.status(404).json({ message: 'Profile not found for this user' });
    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Get All Athlete Profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await AthleteProfile.find().populate('user', ['fullName', 'email']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

// Delete Athlete Profile
exports.deleteProfile = async (req, res) => {
  try {
    await AthleteProfile.findOneAndRemove({ user: req.user.id });
    res.json({ message: 'Profile deleted' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
}; 