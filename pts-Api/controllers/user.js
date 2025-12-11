const bcrypt = require('bcryptjs');
const { User, Department } = require('../models');

const createUser = async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ ...rest, password: hashedPassword });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ message: 'User creation failed', error: err.message });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    console.log('Updating user:', id, 'with data:', Object.keys(updates));

    // Validate profile picture if it's being updated
    if (updates.profilePicture) {
      if (!updates.profilePicture.startsWith('data:image/') || updates.profilePicture.length < 100) {
        return res.status(400).json({ message: 'Invalid profile picture data' });
      }
      
      // Check if base64 string is complete (should end with proper base64 characters)
      const base64Part = updates.profilePicture.split(',')[1];
      if (!base64Part || base64Part.length < 100) {
        return res.status(400).json({ message: 'Incomplete profile picture data' });
      }
      
      console.log('Profile picture size:', updates.profilePicture.length, 'characters');
      console.log('Base64 part length:', base64Part.length, 'characters');
    }

    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }

    const [updated] = await User.update(updates, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    
    const updatedUser = await User.findByPk(id, {
      include: [{ model: Department, as: 'department' }]
    });
    
    console.log('User updated successfully:', updatedUser.id);
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    console.error('User update error:', err);
    res.status(500).json({ message: 'User update failed', error: err.message });
  }
};

const getUsersByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const users = await User.findAll({ where: { departmentId } });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Fetch users failed', error: err.message });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id, { include: [{ model: Department, as: 'department' }] });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Fetch user failed', error: err.message });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      include: [{ model: Department, as: 'department' }]
    });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ message: 'Fetch users failed', error: err.message });
  }
};

const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (typeof status !== 'boolean') {
      return res.status(400).json({ message: 'Status must be a boolean (true or false)' });
    }
    const [updated] = await User.update({ status }, { where: { id } });
    if (!updated) return res.status(404).json({ message: 'User not found' });
    const updatedUser = await User.findByPk(id);
    res.json({ success: true, data: updatedUser });
  } catch (err) {
    res.status(500).json({ message: 'User status update failed', error: err.message });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await User.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, message: 'User deleted' });
  } catch (err) {
    res.status(500).json({ message: 'User deletion failed', error: err.message });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id; // From auth middleware
    const user = await User.findByPk(userId, {
      include: [{ model: Department, as: 'department' }],
      attributes: { exclude: ['password'] } // Don't send password
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ message: 'Fetch profile failed', error: err.message });
  }
};

const updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Get user with current password
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await User.update({ password: hashedNewPassword }, { where: { id } });

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Password update failed', error: err.message });
  }
};

module.exports = {
  createUser,
  updateUser,
  getUsersByDepartment,
  getUserById,
  getAllUsers,
  updateUserStatus,
  deleteUser,
  getUserProfile,
  updatePassword
};
