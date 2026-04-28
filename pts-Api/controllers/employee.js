// controllers/employee.js
const { Employee, User, Department } = require('../models');
const { Op } = require('sequelize');
const sequelize = require('../config/db');

const PRIVILEGED_ROLES = new Set(['HR Manager', 'Super Admin', 'HR', 'System Admin']);
const isPrivilegedRole = (role) => PRIVILEGED_ROLES.has(role);
const isDateExpired = (dateValue) => {
  if (!dateValue) return false;
  const end = new Date(dateValue);
  const today = new Date();
  end.setHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);
  return end < today;
};

/** Validate and normalize base64 data-URL strings coming from the client */
const normalizeDataUrlString = (val) => {
  if (val == null || val === '') return { value: undefined };
  if (typeof val !== 'string') return { value: undefined };

  const trimmed = val.trim();
  const match = trimmed.match(/^data:([\w.+-]+\/[\w.+-]+);base64,([A-Za-z0-9+/=\r\n]+)$/);
  if (!match) {
    return { error: 'Invalid file format. Expected a base64 data URL.' };
  }

  const mimeType = match[1];
  const base64Payload = match[2].replace(/\s+/g, '');
  const decoded = Buffer.from(base64Payload, 'base64');
  const reEncoded = decoded.toString('base64').replace(/=+$/g, '');
  const inputNormalized = base64Payload.replace(/=+$/g, '');

  if (!decoded.length || reEncoded !== inputNormalized) {
    return { error: 'Invalid file payload. Please upload the file again.' };
  }

  return { value: `data:${mimeType};base64,${base64Payload}` };
};

// Get all employees with user and department info
const getAllEmployees = async (req, res) => {
  try {
    const whereClause = {};
    if (!isPrivilegedRole(req.user?.role)) {
      whereClause.userId = req.user?.id;
    }

    const employees = await Employee.findAll({
      where: whereClause,
      attributes: {
        exclude: ['passportPhoto', 'employmentContract', 'rightToWorkDocument'],
        include: [
          // Presence flags without selecting large TEXT blobs (MySQL; table alias matches Sequelize model name)
          [
            sequelize.literal(
              '(CHAR_LENGTH(COALESCE(`Employee`.`passportPhoto`, \'\')) > 0)'
            ),
            'hasPassportPhoto'
          ],
          [
            sequelize.literal(
              '(CHAR_LENGTH(COALESCE(`Employee`.`employmentContract`, \'\')) > 0)'
            ),
            'hasEmploymentContract'
          ],
          [
            sequelize.literal(
              '(CHAR_LENGTH(COALESCE(`Employee`.`rightToWorkDocument`, \'\')) > 0)'
            ),
            'hasRightToWorkDocument'
          ]
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
      ],
      order: [['createdAt', 'DESC']]
    });

    const toBool = (v) => v === true || v === 1 || v === '1';

    // Transform data to match frontend format
    const transformedEmployees = employees.map((emp) => ({
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
      visaRenewalRequested: Boolean(emp.visaRenewalRequested),
      bankName: emp.bankName,
      accountNumber: emp.accountNumber,
      sortCode: emp.sortCode,
      accountHolder: emp.accountHolder,
      nationality: emp.nationality,
      status: emp.status,
      createdAt: emp.createdAt ? emp.createdAt.toISOString() : null,
      updatedAt: emp.updatedAt ? emp.updatedAt.toISOString() : null,
      hasPassportPhoto: toBool(emp.get('hasPassportPhoto')),
      hasEmploymentContract: toBool(emp.get('hasEmploymentContract')),
      hasRightToWorkDocument: toBool(emp.get('hasRightToWorkDocument'))
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

    if (!isPrivilegedRole(req.user?.role) && employee.userId !== req.user?.id) {
      return res.status(403).json({ message: 'Access denied' });
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
      accountHolder
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

    const filesToValidate = ['passportPhoto', 'employmentContract', 'rightToWorkDocument'];
    for (const key of filesToValidate) {
      if (key in req.body) {
        const { value, error } = normalizeDataUrlString(req.body[key]);
        if (error) {
          return res.status(400).json({ message: `${key}: ${error}` });
        }
        if (value !== undefined) req.body[key] = value;
      }
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
      visaRenewalRequested: isDateExpired(visaEndDate) ? Boolean(req.body.visaRenewalRequested) : false,
      passportPhoto: req.body.passportPhoto ?? null,
      employmentContract: req.body.employmentContract ?? null,
      rightToWorkDocument: req.body.rightToWorkDocument ?? null
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
    const updates = { ...req.body };

    ['passportPhoto', 'employmentContract', 'rightToWorkDocument'].forEach((key) => {
      if (key in updates) {
        const { value, error } = normalizeDataUrlString(updates[key]);
        if (error) {
          updates.__fileValidationError = `${key}: ${error}`;
          return;
        }
        if (value !== undefined) updates[key] = value;
        else delete updates[key];
      }
    });

    if (updates.__fileValidationError) {
      const message = updates.__fileValidationError;
      delete updates.__fileValidationError;
      return res.status(400).json({ message });
    }

    // Check if employee exists
    const employee = await Employee.findByPk(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!isPrivilegedRole(req.user?.role) && employee.userId !== req.user?.id) {
      return res.status(403).json({ message: 'You can only update your own employee details' });
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

    const effectiveVisaEndDate = updates.visaEndDate ?? employee.visaEndDate;
    if (!isDateExpired(effectiveVisaEndDate)) {
      updates.visaRenewalRequested = false;
    } else if ('visaRenewalRequested' in updates) {
      updates.visaRenewalRequested = Boolean(updates.visaRenewalRequested);
    }

    await Employee.update(updates, { where: { id } });
    
    const updatedEmployee = await Employee.findByPk(id, {
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
    const employee = await Employee.findByPk(id);

    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (!isPrivilegedRole(req.user?.role)) {
      return res.status(403).json({ message: 'Only HR Manager or Super Admin can delete employees' });
    }

    const deleted = await Employee.destroy({ where: { id } });

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
    let pendingCount = 0;
    const expiryNotifications = [];

    employees.forEach(emp => {
      const employeeName = emp.user ? `${emp.user.firstName} ${emp.user.lastName}` : 'Unknown';
      const formattedVisaStartDate = emp.visaStartDate ? new Date(emp.visaStartDate).toLocaleDateString('en-GB') : 'N/A';

      if (!emp.visaEndDate) {
        expiryNotifications.push({
          key: `emp-${emp.id}`,
          employee: employeeName,
          visaType: emp.visaType || 'N/A',
          expiresIn: 'N/A',
          visaStartDate: formattedVisaStartDate,
          expiryDate: 'N/A',
          status: 'No Visa Data'
        });
        return;
      }

      const visaEndDate = new Date(emp.visaEndDate);
      const todayStart = new Date(today);
      const visaEndDay = new Date(visaEndDate);
      todayStart.setHours(0, 0, 0, 0);
      visaEndDay.setHours(0, 0, 0, 0);
      const daysUntilExpiry = Math.ceil((visaEndDay - todayStart) / (1000 * 60 * 60 * 24));
      const formattedExpiryDate = visaEndDate.toLocaleDateString('en-GB');
      const renewalRequested = Boolean(emp.visaRenewalRequested);

      if (isDateExpired(visaEndDate) && renewalRequested) {
        pendingCount++;
        expiryNotifications.push({
          key: `emp-${emp.id}`,
          employee: employeeName,
          visaType: emp.visaType || 'N/A',
          expiresIn: 'Pending',
          visaStartDate: formattedVisaStartDate,
          expiryDate: 'Pending',
          status: 'Pending'
        });
      } else if (isDateExpired(visaEndDate)) {
        expiredCount++;
        expiryNotifications.push({
          key: `emp-${emp.id}`,
          employee: employeeName,
          visaType: emp.visaType || 'N/A',
          expiresIn: 'Expired',
          visaStartDate: formattedVisaStartDate,
          expiryDate: formattedExpiryDate,
          status: 'Expired'
        });
      } else if (daysUntilExpiry <= 30) {
        expiringSoonCount++;
        expiryNotifications.push({
          key: `emp-${emp.id}`,
          employee: employeeName,
          visaType: emp.visaType || 'N/A',
          expiresIn: `${daysUntilExpiry} days`,
          visaStartDate: formattedVisaStartDate,
          expiryDate: formattedExpiryDate,
          status: 'Expiring Soon'
        });
      } else {
        validCount++;
        expiryNotifications.push({
          key: `emp-${emp.id}`,
          employee: employeeName,
          visaType: emp.visaType || 'N/A',
          expiresIn: `${daysUntilExpiry} days`,
          visaStartDate: formattedVisaStartDate,
          expiryDate: formattedExpiryDate,
          status: 'Valid'
        });
      }
    });

    // Sort notifications by priority (expired, expiring soon, valid) then by days
    expiryNotifications.sort((a, b) => {
      const statusPriority = { Expired: 0, Pending: 1, 'Expiring Soon': 2, Valid: 3, 'No Visa Data': 4 };
      const aPriority = statusPriority[a.status] ?? 99;
      const bPriority = statusPriority[b.status] ?? 99;
      if (aPriority !== bPriority) return aPriority - bPriority;
      const aDays = parseInt(a.expiresIn) || 0;
      const bDays = parseInt(b.expiresIn) || 0;
      return aDays - bDays;
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
          valid: validCount,
          pending: pendingCount
        },
        expiryNotifications,
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