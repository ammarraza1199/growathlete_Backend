const User = require('../models/User');
const Profile = require('../models/Profile');

// Follow a user
exports.followUser = async (req, res) => {
  console.log('Reached followUser controller');
  try {
    console.log('Inside try block of followUser');
    const followerId = req.user.id; // ID of the user performing the follow
    console.log('Follower ID:', followerId);
    const { followeeId: profileIdToFollow } = req.body; // Profile ID of the user being followed
    console.log('Profile ID to follow:', profileIdToFollow);

    // Find the profile to follow and get its associated user ID
    const profileToFollow = await Profile.findById(profileIdToFollow);
    if (!profileToFollow) {
      console.log('Profile to follow not found');
      return res.status(404).json({ message: 'Profile not found.' });
    }
    const followeeUserId = profileToFollow.user; // This is the actual user ID
    console.log('Followee User ID:', followeeUserId);

    if (followerId === followeeUserId.toString()) {
      console.log('Attempted to follow self');
      return res.status(400).json({ message: 'You cannot follow yourself.' });
    }

    const follower = await User.findById(followerId);
    const followee = await User.findById(followeeUserId);
    console.log('Follower and Followee fetched');

    if (!follower || !followee) {
      console.log('User not found (after profile lookup)');
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if already following
    if (follower.following.includes(followeeUserId)) {
      console.log('Already following');
      return res.status(400).json({ message: 'You are already following this user.' });
    }

    follower.following.push(followeeUserId);
    followee.followers.push(followerId);

    await follower.save();
    await followee.save();
    console.log('Follower and Followee saved');

    res.status(200).json({ message: 'User followed successfully.' });
    console.log('Response sent');
  } catch (error) {
    console.error('Error in followUser:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  console.log('Reached unfollowUser controller');
  try {
    const followerId = req.user.id; // ID of the user performing the unfollow
    console.log('Unfollower ID:', followerId);
    const { id: profileIdToUnfollow } = req.params; // Profile ID of the user being unfollowed (from URL params)
    console.log('Profile ID to unfollow:', profileIdToUnfollow);

    // Find the profile to unfollow and get its associated user ID
    const profileToUnfollow = await Profile.findById(profileIdToUnfollow);
    if (!profileToUnfollow) {
      console.log('Profile to unfollow not found');
      return res.status(404).json({ message: 'Profile not found.' });
    }
    const followeeUserId = profileToUnfollow.user; // This is the actual user ID
    console.log('Unfollowee User ID:', followeeUserId);

    const follower = await User.findById(followerId);
    const followee = await User.findById(followeeUserId);
    console.log('Unfollower and Unfollowee fetched');

    if (!follower || !followee) {
      console.log('User not found (after profile lookup) for unfollow');
      return res.status(404).json({ message: 'User not found.' });
    }

    // Check if not following
    if (!follower.following.includes(followeeUserId)) {
      console.log('Not following this user');
      return res.status(400).json({ message: 'You are not following this user.' });
    }

    follower.following = follower.following.filter(id => id.toString() !== followeeUserId.toString());
    followee.followers = followee.followers.filter(id => id.toString() !== followerId.toString());

    await follower.save();
    await followee.save();
    console.log('Unfollower and Unfollowee saved');

    res.status(200).json({ message: 'User unfollowed successfully.' });
    console.log('Unfollow response sent');
  } catch (error) {
    console.error('Error in unfollowUser:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

