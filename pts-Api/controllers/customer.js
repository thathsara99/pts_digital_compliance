const { Customer, User } = require('../models');

const EMPLOYEE_ROLES = new Set(['Employee']);
const isEmployeeRole = (role) => EMPLOYEE_ROLES.has(role);

const getCustomers = async (req, res) => {
  try {
    const whereClause = {};
    if (isEmployeeRole(req.user?.role)) {
      whereClause.assignedEmployeeId = req.user.id;
    }

    const customers = await Customer.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'assignedEmployee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch customers', error: error.message });
  }
};

const createCustomer = async (req, res) => {
  try {
    const customer = await Customer.create({
      customerName: req.body.customerName,
      email: req.body.email,
      contactNumber: req.body.contactNumber,
      address: req.body.address,
      industry: req.body.industry,
      assignedEmployeeId: req.body.assignedEmployeeId || null,
      status: req.body.status || 'Active'
    });

    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to create customer', error: error.message });
  }
};

const updateCustomer = async (req, res) => {
  try {
    if (isEmployeeRole(req.user?.role)) {
      return res.status(403).json({ message: 'Employees cannot edit customers' });
    }

    const customer = await Customer.findByPk(req.params.id);
    if (!customer) return res.status(404).json({ message: 'Customer not found' });

    await customer.update(req.body);
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update customer', error: error.message });
  }
};

const getAssignableEmployees = async (req, res) => {
  try {
    const users = await User.findAll({
      where: { role: 'Employee', status: true },
      attributes: ['id', 'firstName', 'lastName', 'email'],
      order: [['firstName', 'ASC']]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch employees for assignment', error: error.message });
  }
};

module.exports = {
  getCustomers,
  createCustomer,
  updateCustomer,
  getAssignableEmployees
};
