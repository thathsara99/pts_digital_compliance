// controllers/role.js
const { Role } = require('../models');

const getAllRoles = async (req, res) => {
    console.log('getAllRoles');
  try {
    const roles = await Role.findAll({ attributes: ['id', 'name', 'description'] });
    console.log(roles);
    res.json({ success: true, data: roles });
  } catch (err) {
    res.status(500).json({ message: 'Fetch roles failed', error: err.message });
  }
};

module.exports = { getAllRoles }; 