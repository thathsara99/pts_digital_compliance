const { Attendance, User } = require('../models');
const { Op } = require('sequelize');
const dayjs = require('dayjs');

// Clock In
const clockIn = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = dayjs().format('YYYY-MM-DD');
    const currentTime = new Date();

    // Check if user has any attendance record for today (clocked in or clocked out)
    const existingAttendance = await Attendance.findOne({
      where: {
        userId,
        workDate: currentDate
      }
    });

    if (existingAttendance) {
      if (existingAttendance.status === 'Clocked In') {
        return res.status(400).json({
          success: false,
          message: 'You are already clocked in today'
        });
      } else if (existingAttendance.status === 'Clocked Out') {
        return res.status(400).json({
          success: false,
          message: 'You have already clocked out today. You cannot clock in again on the same day.'
        });
      }
    }

    const attendance = await Attendance.create({
      userId,
      clockInTime: currentTime,
      workDate: currentDate,
      status: 'Clocked In'
    });

    res.status(201).json({
      success: true,
      message: 'Successfully clocked in',
      data: {
        id: attendance.id,
        clockInTime: attendance.clockInTime,
        workDate: attendance.workDate,
        status: attendance.status
      }
    });
  } catch (error) {
    console.error('Error clocking in:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock in',
      error: error.message
    });
  }
};

// Clock Out
const clockOut = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = dayjs().format('YYYY-MM-DD');
    const currentTime = new Date();

    // Find today's attendance record
    const attendance = await Attendance.findOne({
      where: {
        userId,
        workDate: currentDate,
        status: 'Clocked In'
      }
    });

    if (!attendance) {
      return res.status(400).json({
        success: false,
        message: 'You are not clocked in today'
      });
    }

    // Calculate total hours worked
    const clockInTime = new Date(attendance.clockInTime);
    const totalMilliseconds = currentTime - clockInTime;
    const totalHours = totalMilliseconds / (1000 * 60 * 60); // Convert to hours

    await attendance.update({
      clockOutTime: currentTime,
      totalHours: parseFloat(totalHours.toFixed(2)),
      status: 'Clocked Out'
    });

    res.json({
      success: true,
      message: 'Successfully clocked out',
      data: {
        id: attendance.id,
        clockInTime: attendance.clockInTime,
        clockOutTime: currentTime,
        totalHours: parseFloat(totalHours.toFixed(2)),
        status: 'Clocked Out'
      }
    });
  } catch (error) {
    console.error('Error clocking out:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to clock out',
      error: error.message
    });
  }
};

// Get current attendance status
const getCurrentStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const currentDate = dayjs().format('YYYY-MM-DD');

    const attendance = await Attendance.findOne({
      where: {
        userId,
        workDate: currentDate
      },
      include: [{
        model: User,
        as: 'employee',
        attributes: ['firstName', 'lastName', 'email']
      }]
    });

    if (!attendance) {
      return res.json({
        success: true,
        data: {
          isClockedIn: false,
          status: 'Not clocked in',
          currentTime: new Date(),
          workDate: currentDate
        }
      });
    }

    // Calculate current time worked if still clocked in
    let currentTimeWorked = 0;
    if (attendance.status === 'Clocked In') {
      const clockInTime = new Date(attendance.clockInTime);
      const now = new Date();
      const timeDiff = now - clockInTime;
      currentTimeWorked = timeDiff / (1000 * 60 * 60); // Convert to hours
    }

    res.json({
      success: true,
      data: {
        isClockedIn: attendance.status === 'Clocked In',
        status: attendance.status,
        clockInTime: attendance.clockInTime,
        clockOutTime: attendance.clockOutTime,
        totalHours: attendance.totalHours,
        currentTimeWorked: parseFloat(currentTimeWorked.toFixed(2)),
        workDate: attendance.workDate,
        employee: attendance.employee
      }
    });
  } catch (error) {
    console.error('Error getting attendance status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance status',
      error: error.message
    });
  }
};

// Get attendance history
const getAttendanceHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, page = 1, limit = 10 } = req.query;

    const whereClause = { userId };
    
    if (startDate && endDate) {
      whereClause.workDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const offset = (page - 1) * limit;

    const { count, rows } = await Attendance.findAndCountAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'employee',
        attributes: ['firstName', 'lastName', 'email']
      }],
      order: [['workDate', 'DESC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        attendances: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / limit)
        }
      }
    });
  } catch (error) {
    console.error('Error getting attendance history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance history',
      error: error.message
    });
  }
};

// Get attendance statistics
const getAttendanceStatistics = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;
    const currentDate = dayjs().format('YYYY-MM-DD');

    const whereClause = { userId };
    
    if (startDate && endDate) {
      whereClause.workDate = {
        [Op.between]: [startDate, endDate]
      };
    }

    const attendances = await Attendance.findAll({
      where: whereClause,
      attributes: ['totalHours', 'workDate', 'status', 'clockInTime', 'clockOutTime']
    });

    const totalHours = attendances.reduce((sum, att) => sum + (parseFloat(att.totalHours) || 0), 0);
    const totalDays = attendances.length;
    const averageHours = totalDays > 0 ? totalHours / totalDays : 0;

    // Get today's attendance
    const todayAttendance = await Attendance.findOne({
      where: {
        userId,
        workDate: currentDate
      }
    });

    let todayHours = 0;
    if (todayAttendance) {
      if (todayAttendance.status === 'Clocked In' && todayAttendance.clockInTime) {
        // Still clocked in - calculate current hours worked
        const clockInTime = new Date(todayAttendance.clockInTime);
        const now = new Date();
        const timeDiff = now - clockInTime;
        todayHours = timeDiff / (1000 * 60 * 60); // Convert to hours
      } else if (todayAttendance.totalHours) {
        // Clocked out - use stored total hours
        todayHours = parseFloat(todayAttendance.totalHours) || 0;
      }
    }

    // Get current week's data
    const weekStart = dayjs().startOf('week').format('YYYY-MM-DD');
    const weekEnd = dayjs().endOf('week').format('YYYY-MM-DD');
    
    const weekAttendances = await Attendance.findAll({
      where: {
        userId,
        workDate: {
          [Op.between]: [weekStart, weekEnd]
        }
      },
      attributes: ['totalHours', 'workDate', 'status', 'clockInTime']
    });

    // Calculate week hours (including today's current time if still clocked in)
    let weekHours = 0;
    weekAttendances.forEach(att => {
      if (att.workDate === currentDate && att.status === 'Clocked In' && att.clockInTime) {
        // For today, use calculated hours if still clocked in
        const clockInTime = new Date(att.clockInTime);
        const now = new Date();
        const timeDiff = now - clockInTime;
        weekHours += timeDiff / (1000 * 60 * 60);
      } else {
        // For other days or clocked out records, use totalHours
        weekHours += parseFloat(att.totalHours) || 0;
      }
    });

    // Count unique working days in the week (exclude days with 0 hours unless clocked in)
    const uniqueDays = new Set();
    weekAttendances.forEach(att => {
      if (att.totalHours > 0 || att.status === 'Clocked In') {
        uniqueDays.add(att.workDate);
      }
    });

    res.json({
      success: true,
      data: {
        totalHours: parseFloat(totalHours.toFixed(2)),
        totalDays,
        averageHours: parseFloat(averageHours.toFixed(2)),
        todayHours: parseFloat(todayHours.toFixed(2)),
        weekHours: parseFloat(weekHours.toFixed(2)),
        weekDays: uniqueDays.size
      }
    });
  } catch (error) {
    console.error('Error getting attendance statistics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get attendance statistics',
      error: error.message
    });
  }
};

module.exports = {
  clockIn,
  clockOut,
  getCurrentStatus,
  getAttendanceHistory,
  getAttendanceStatistics
};
