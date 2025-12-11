// controllers/departmentController.js
const { Department } = require('../models');
const { Op } = require('sequelize');

const createDepartment = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Department name is required' });
    }
    const department = await Department.create({
      name,
      description,
      status: status !== undefined ? status : true
    });
    res.status(201).json({ success: true, data: department });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Department name must be unique' });
    }
    res.status(500).json({ message: 'Department creation failed', error: err.message });
  }
};

const updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, status } = req.body;
    if (name === '') {
      return res.status(400).json({ message: 'Department name cannot be empty' });
    }
    const [updated] = await Department.update(
      { name, description, status },
      { where: { id } }
    );
    if (!updated) return res.status(404).json({ message: 'Department not found' });
    const updatedDepartment = await Department.findByPk(id);
    res.json({ success: true, data: updatedDepartment });
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ message: 'Department name must be unique' });
    }
    res.status(500).json({ message: 'Department update failed', error: err.message });
  }
};

const updateDepartmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (typeof status !== 'boolean') {
      return res.status(400).json({ message: 'Status must be a boolean (true or false)' });
    }
    const [updated] = await Department.update(
      { status },
      { where: { id } }
    );
    if (!updated) return res.status(404).json({ message: 'Department not found' });
    const updatedDepartment = await Department.findByPk(id);
    res.json({ success: true, data: updatedDepartment });
  } catch (err) {
    res.status(500).json({ message: 'Department status update failed', error: err.message });
  }
};

const getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const department = await Department.findByPk(id);
    if (!department) return res.status(404).json({ message: 'Department not found' });
    res.json({ success: true, data: department });
  } catch (err) {
    res.status(500).json({ message: 'Fetch department failed', error: err.message });
  }
};

const getAllDepartments = async (req, res) => {
  console.log('getAllDepartments');
  try {
    const departments = await Department.findAll({
      attributes: ['id', 'name', 'description', 'status']
    });
    console.log(departments);
    res.json({ success: true, data: departments });
  } catch (err) {
    res.status(500).json({ message: 'Fetch departments failed', error: err.message });
  }
};

const deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Department.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ message: 'Department not found' });
    res.json({ success: true, message: 'Department deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Department deletion failed', error: err.message });
  }
};

module.exports = {
  createDepartment,
  updateDepartment,
  updateDepartmentStatus,
  getDepartmentById,
  getAllDepartments,
  deleteDepartment
};
