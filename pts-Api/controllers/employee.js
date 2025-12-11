// controllers/employee.js
const { Employee, User, Department } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

// Get all employees with user and department info
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform data to match frontend format
    const transformedEmployees = employees.map(emp => ({
      key: emp.id,
      userId: emp.userId,
      email: emp.user?.email,
      name: emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : '',
      department: emp.user?.department?.name || 'Unassigned',
      dateofBirth: emp.dateOfBirth ? emp.dateOfBirth.toLocaleDateString('en-GB') : '',
      employeeId: emp.employeeId,
      emergencyContact: emp.emergencyContact,
      niNumber: emp.niNumber,
      visaType: emp.visaType,
      eVisaShareCode: emp.eVisaShareCode,
      visaStart: emp.visaStartDate ? emp.visaStartDate.toLocaleDateString('en-GB') : '',
      visaEnd: emp.visaEndDate ? emp.visaEndDate.toLocaleDateString('en-GB') : '',
      bankName: emp.bankName,
      accountNumber: emp.accountNumber,
      sortCode: emp.sortCode,
      accountHolder: emp.accountHolder,
      nationality: emp.nationality,
      status: emp.status
    }));

    res.json({ success: true, data: transformedEmployees });
  } catch (err) {
    console.error('Error fetching employees:', err);
    res.status(500).json({ message: 'Failed to fetch employees', error: err.message });
  }
};

// Get employee by ID
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ success: true, data: employee });
  } catch (err) {
    console.error('Error fetching employee:', err);
    res.status(500).json({ message: 'Failed to fetch employee', error: err.message });
  }
};

// Create new employee
const createEmployee = async (req, res) => {
  try {
    const {
      userId,
      employeeId,
      dateOfBirth,
      nationality,
      emergencyContact,
      niNumber,
      visaType,
      eVisaShareCode,
      visaStartDate,
      visaEndDate,
      bankName,
      accountNumber,
      sortCode,
      accountHolder,
      passportPhoto,
      employmentContract,
      rightToWorkDocument
    } = req.body;

    // Check if employee ID already exists
    const existingEmployee = await Employee.findOne({ where: { employeeId } });
    if (existingEmployee) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }

    // Check if NI Number already exists
    const existingNI = await Employee.findOne({ where: { niNumber } });
    if (existingNI) {
      return res.status(400).json({ message: 'NI Number already exists' });
    }

    const employee = await Employee.create({
      userId,
      employeeId,
      dateOfBirth,
      nationality,
      emergencyContact,
      niNumber,
      visaType,
      eVisaShareCode,
      visaStartDate,
      visaEndDate,
      bankName,
      accountNumber,
      sortCode,
      accountHolder,
      passportPhoto,
      employmentContract,
      rightToWorkDocument
    });

    res.status(201).json({ success: true, data: employee });
  } catch (err) {
    console.error('Error creating employee:', err);
    res.status(500).json({ message: 'Failed to create employee', error: err.message });
  }
};

// Update employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Check if employee exists
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check for duplicate employee ID if it's being updated
    if (updates.employeeId && updates.employeeId !== employee.employeeId) {
      const existingEmployee = await Employee.findOne({ where: { employeeId: updates.employeeId } });
      if (existingEmployee) {
        return res.status(400).json({ message: 'Employee ID already exists' });
      }
    }

    // Check for duplicate NI Number if it's being updated
    if (updates.niNumber && updates.niNumber !== employee.niNumber) {
      const existingNI = await Employee.findOne({ where: { niNumber: updates.niNumber } });
      if (existingNI) {
        return res.status(400).json({ message: 'NI Number already exists' });
      }
    }

    await Employee.update(updates, { where: { id } });
    
    const updatedEmployee = await Employee.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber']
        },
        {
          model: Department,
          as: 'department',
          attributes: ['id', 'name']
        }
      ]
    });

    res.json({ success: true, data: updatedEmployee });
  } catch (err) {
    console.error('Error updating employee:', err);
    res.status(500).json({ message: 'Failed to update employee', error: err.message });
  }
};

// Delete employee
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Employee.destroy({ where: { id } });
    
    if (!deleted) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json({ success: true, message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Error deleting employee:', err);
    res.status(500).json({ message: 'Failed to delete employee', error: err.message });
  }
};

// Get employees by department
const getEmployeesByDepartment = async (req, res) => {
  try {
    const { departmentId } = req.params;
    const employees = await Employee.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber'],
          where: { departmentId },
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.json({ success: true, data: employees });
  } catch (err) {
    console.error('Error fetching employees by department:', err);
    res.status(500).json({ message: 'Failed to fetch employees by department', error: err.message });
  }
};

// Search employees
const searchEmployees = async (req, res) => {
  try {
    const { query } = req.query;
    
    const employees = await Employee.findAll({
      where: {
        [Op.or]: [
          { employeeId: { [Op.like]: `%${query}%` } },
          { niNumber: { [Op.like]: `%${query}%` } },
          { '$user.email$': { [Op.like]: `%${query}%` } },
          { '$user.firstName$': { [Op.like]: `%${query}%` } },
          { '$user.lastName$': { [Op.like]: `%${query}%` } }
        ]
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email', 'contactNumber'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ]
    });

    res.json({ success: true, data: employees });
  } catch (err) {
    console.error('Error searching employees:', err);
    res.status(500).json({ message: 'Failed to search employees', error: err.message });
  }
};

// Get available users (users without employee records)
const getAvailableUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      where: {
        id: {
          [Op.notIn]: sequelize.literal('(SELECT userId FROM employees)')
        },
        status: true
      },
      attributes: ['id', 'firstName', 'lastName', 'email']
    });

    res.json({ success: true, data: users });
  } catch (err) {
    console.error('Error fetching available users:', err);
    res.status(500).json({ message: 'Failed to fetch available users', error: err.message });
  }
};

// Get dashboard statistics
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    // Get all employees with user and department info
    const employees = await Employee.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [
            {
              model: Department,
              as: 'department',
              attributes: ['id', 'name']
            }
          ]
        }
      ],
      where: {
        status: 'Active'
      }
    });

    // Calculate department counts
    const departmentCounts = {};
    employees.forEach(emp => {
      const deptName = emp.user?.department?.name || 'Unassigned';
      departmentCounts[deptName] = (departmentCounts[deptName] || 0) + 1;
    });

    // Get all departments for complete list
    const allDepartments = await Department.findAll({
      where: { status: true },
      attributes: ['id', 'name']
    });

    const departmentData = allDepartments.map(dept => ({
      department: dept.name,
      employees: departmentCounts[dept.name] || 0
    }));

    // Calculate visa expiry status
    let expiredCount = 0;
    let expiringSoonCount = 0;
    let validCount = 0;
    const expiryNotifications = [];

    employees.forEach(emp => {
      if (emp.visaEndDate) {
        const visaEndDate = new Date(emp.visaEndDate);
        const daysUntilExpiry = Math.ceil((visaEndDate - today) / (1000 * 60 * 60 * 24));

        if (visaEndDate < today) {
          expiredCount++;
          expiryNotifications.push({
            key: `emp-${emp.id}`,
            employee: emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown',
            visaType: emp.visaType || 'N/A',
            expiresIn: 'Expired',
            status: 'Expired'
          });
        } else if (daysUntilExpiry <= 30) {
          expiringSoonCount++;
          expiryNotifications.push({
            key: `emp-${emp.id}`,
            employee: emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown',
            visaType: emp.visaType || 'N/A',
            expiresIn: `${daysUntilExpiry} days`,
            status: 'Expiring Soon'
          });
        } else {
          validCount++;
        }
      }
    });

    // Sort notifications by expiry (expired first, then by days remaining)
    expiryNotifications.sort((a, b) => {
      if (a.status === 'Expired' && b.status !== 'Expired') return -1;
      if (a.status !== 'Expired' && b.status === 'Expired') return 1;
      if (a.status === 'Expiring Soon' && b.status === 'Expiring Soon') {
        const aDays = parseInt(a.expiresIn) || 0;
        const bDays = parseInt(b.expiresIn) || 0;
        return aDays - bDays;
      }
      return 0;
    });

    // Get recent employees for the employee list (limit to 5)
    const recentEmployees = employees
      .slice(0, 5)
      .map(emp => ({
        key: emp.id,
        name: emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown',
        department: emp.user?.department?.name || 'Unassigned',
        status: emp.status || 'Active'
      }));

    res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        departmentData,
        visaStatus: {
          expired: expiredCount,
          expiringSoon: expiringSoonCount,
          valid: validCount
        },
        expiryNotifications: expiryNotifications.slice(0, 10), // Limit to 10 for dashboard
        recentEmployees
      }
    });
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats', error: err.message });
  }
};

module.exports = {
  getAllEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getEmployeesByDepartment,
  searchEmployees,
  getAvailableUsers,
  getDashboardStats
}; 