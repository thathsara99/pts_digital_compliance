const { Leave, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Apply for leave
const applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, comment } = req.body;
    const userId = req.user.id; // From auth middleware

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Leave type, start date, and end date are required'
      });
    }

    // Calculate total days (inclusive of start and end date)
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const totalDays = end.diff(start, 'day') + 1;

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check if user has overlapping leave requests
    const overlappingLeave = await Leave.findOne({
      where: {
        userId,
        status: { [Op.in]: ['Pending', 'Approved'] },
        [Op.or]: [
          {
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: startDate }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You have an overlapping leave request for these dates'
      });
    }

    const leave = await Leave.create({
      userId,
      leaveType,
      startDate,
      endDate,
      totalDays,
      comment,
      status: 'Pending'
    });

    res.status(201).json({
      success: true,
      message: 'Leave application submitted successfully',
      data: {
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        status: leave.status,
        createdAt: leave.createdAt
      }
    });
  } catch (error) {
    console.error('Error applying leave:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get all leaves (for admin) or user's leaves (for regular users)
const getLeaves = async (req, res) => {
  try {
    const { status, leaveType, startDate, endDate, userId } = req.query;
    const currentUser = req.user;

    let whereClause = {};
    let includeClause = [
      {
        model: User,
        as: 'employee',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }
    ];

    // If not System Admin, only show user's own leaves
    if (currentUser.role !== 'System Admin') {
      whereClause.userId = currentUser.id;
    } else if (userId) {
      // Admin can filter by specific user
      whereClause.userId = userId;
    }

    // Apply filters
    if (status) {
      whereClause.status = status;
    }

    if (leaveType) {
      whereClause.leaveType = leaveType;
    }

    if (startDate && endDate) {
      whereClause[Op.or] = [
        {
          startDate: { [Op.between]: [startDate, endDate] }
        },
        {
          endDate: { [Op.between]: [startDate, endDate] }
        },
        {
          startDate: { [Op.lte]: startDate },
          endDate: { [Op.gte]: endDate }
        }
      ];
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });

    const formattedLeaves = leaves.map(leave => ({
      id: leave.id,
      employee: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '',
      employeeEmail: leave.employee?.email || '',
      leaveType: leave.leaveType,
      startDate: leave.startDate,
      endDate: leave.endDate,
      totalDays: leave.totalDays,
      comment: leave.comment,
      status: leave.status,
      rejectionReason: leave.rejectionReason,
      createdAt: leave.createdAt,
      updatedAt: leave.updatedAt
    }));

    res.json({
      success: true,
      data: formattedLeaves
    });
  } catch (error) {
    console.error('Error fetching leaves:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get leave by ID
const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const leave = await Leave.findOne({
      where: { id },
      include: [
        {
          model: User,
          as: 'employee',
          attributes: ['id', 'firstName', 'lastName', 'email']
        },
        {
          model: User,
          as: 'approver',
          attributes: ['id', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check if user has permission to view this leave
    if (currentUser.role !== 'System Admin' && leave.userId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to view this leave'
      });
    }

    res.json({
      success: true,
      data: {
        id: leave.id,
        employee: leave.employee ? `${leave.employee.firstName} ${leave.employee.lastName}` : '',
        employeeEmail: leave.employee?.email || '',
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        comment: leave.comment,
        status: leave.status,
        rejectionReason: leave.rejectionReason,
        approver: leave.approver ? `${leave.approver.firstName} ${leave.approver.lastName}` : '',
        approvedAt: leave.approvedAt,
        createdAt: leave.createdAt,
        updatedAt: leave.updatedAt
      }
    });
  } catch (error) {
    console.error('Error fetching leave:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Approve leave (System Admin only)
const approveLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    // Check if user is System Admin
    if (currentUser.role !== 'System Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only System Admin can approve/reject leaves'
      });
    }

    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave is not in pending status'
      });
    }

    // Update leave status
    await leave.update({
      status: 'Approved',
      approvedBy: currentUser.id,
      approvedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Leave approved successfully',
      data: {
        id: leave.id,
        status: leave.status,
        approvedBy: currentUser.id,
        approvedAt: leave.approvedAt
      }
    });
  } catch (error) {
    console.error('Error approving leave:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Reject leave (System Admin only)
const rejectLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { rejectionReason } = req.body;
    const currentUser = req.user;

    // Check if user is System Admin
    if (currentUser.role !== 'System Admin') {
      return res.status(403).json({
        success: false,
        message: 'Only System Admin can approve/reject leaves'
      });
    }

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Leave is not in pending status'
      });
    }

    // Update leave status
    await leave.update({
      status: 'Rejected',
      approvedBy: currentUser.id,
      approvedAt: new Date(),
      rejectionReason
    });

    res.json({
      success: true,
      message: 'Leave rejected successfully',
      data: {
        id: leave.id,
        status: leave.status,
        rejectionReason: leave.rejectionReason,
        approvedBy: currentUser.id,
        approvedAt: leave.approvedAt
      }
    });
  } catch (error) {
    console.error('Error rejecting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Update leave (user can only update their own pending leaves)
const updateLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const { leaveType, startDate, endDate, comment } = req.body;
    const currentUser = req.user;

    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check if user can update this leave
    if (currentUser.role !== 'System Admin' && leave.userId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only update your own leaves'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be updated'
      });
    }

    // Calculate total days
    const start = dayjs(startDate);
    const end = dayjs(endDate);
    const totalDays = end.diff(start, 'day') + 1;

    if (totalDays <= 0) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Check for overlapping leaves (excluding current leave)
    const overlappingLeave = await Leave.findOne({
      where: {
        userId: leave.userId,
        id: { [Op.ne]: id },
        status: { [Op.in]: ['Pending', 'Approved'] },
        [Op.or]: [
          {
            startDate: { [Op.lte]: endDate },
            endDate: { [Op.gte]: startDate }
          }
        ]
      }
    });

    if (overlappingLeave) {
      return res.status(400).json({
        success: false,
        message: 'You have an overlapping leave request for these dates'
      });
    }

    // Update leave
    await leave.update({
      leaveType,
      startDate,
      endDate,
      totalDays,
      comment
    });

    res.json({
      success: true,
      message: 'Leave updated successfully',
      data: {
        id: leave.id,
        leaveType: leave.leaveType,
        startDate: leave.startDate,
        endDate: leave.endDate,
        totalDays: leave.totalDays,
        comment: leave.comment
      }
    });
  } catch (error) {
    console.error('Error updating leave:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Delete leave (user can only delete their own pending leaves)
const deleteLeave = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser = req.user;

    const leave = await Leave.findByPk(id);
    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave not found'
      });
    }

    // Check if user can delete this leave
    if (currentUser.role !== 'System Admin' && leave.userId !== currentUser.id) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own leaves'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Only pending leaves can be deleted'
      });
    }

    await leave.destroy();

    res.json({
      success: true,
      message: 'Leave deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting leave:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get leave statistics
const getLeaveStatistics = async (req, res) => {
  try {
    const currentUser = req.user;
    let whereClause = {};

    // If not System Admin, only show user's own statistics
    if (currentUser.role !== 'System Admin') {
      whereClause.userId = currentUser.id;
    }

    const leaves = await Leave.findAll({
      where: whereClause,
      attributes: ['status', 'leaveType', 'totalDays']
    });

    // Calculate statistics
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
    const rejectedLeaves = leaves.filter(l => l.status === 'Rejected').length;

    // Calculate total days by leave type
    const annualDays = leaves
      .filter(l => l.leaveType === 'Annual' && l.status === 'Approved')
      .reduce((sum, l) => sum + l.totalDays, 0);

    const sickDays = leaves
      .filter(l => l.leaveType === 'Sick' && l.status === 'Approved')
      .reduce((sum, l) => sum + l.totalDays, 0);

    const casualDays = leaves
      .filter(l => l.leaveType === 'Casual' && l.status === 'Approved')
      .reduce((sum, l) => sum + l.totalDays, 0);

    console.log('Statistics calculation:', {
      totalLeaves,
      approvedLeaves,
      pendingLeaves,
      rejectedLeaves,
      annualDays,
      sickDays,
      casualDays,
      leaves: leaves.map(l => ({ status: l.status, leaveType: l.leaveType, totalDays: l.totalDays }))
    });

    res.json({
      success: true,
      data: {
        summary: [
          { name: 'Approved', value: approvedLeaves },
          { name: 'Pending', value: pendingLeaves },
          { name: 'Rejected', value: rejectedLeaves }
        ],
        totalLeaves,
        leaveDays: {
          annual: annualDays,
          sick: sickDays,
          casual: casualDays,
          total: annualDays + sickDays + casualDays
        }
      }
    });
  } catch (error) {
    console.error('Error fetching leave statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

module.exports = {
  applyLeave,
  getLeaves,
  getLeaveById,
  approveLeave,
  rejectLeave,
  updateLeave,
  deleteLeave,
  getLeaveStatistics
}; 