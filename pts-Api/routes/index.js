// routes/index.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth');
const userController = require('../controllers/user');
const departmentController = require('../controllers/department');
const roleController = require('../controllers/role');
const employeeController = require('../controllers/employee');
const authenticate = require('../middlewares/authMiddleware');
const companyProfileController = require('../controllers/companyProfile');
const documentController = require('../controllers/document');
const leaveController = require('../controllers/leave');
const attendanceController = require('../controllers/attendance');

// Auth
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.post('/verify-reset-token', authController.verifyResetToken);

// User management
router.post('/users', userController.createUser);
router.put('/users/:id', authenticate, userController.updateUser);
router.get('/users/department/:departmentId', authenticate, userController.getUsersByDepartment);
router.get('/users/:id', authenticate, userController.getUserById);
router.get('/users', authenticate, userController.getAllUsers);
router.patch('/users/:id/status', authenticate, userController.updateUserStatus);
router.patch('/users/:id/password', authenticate, userController.updatePassword);
router.delete('/users/:id', authenticate, userController.deleteUser);
router.get('/profile', authenticate, userController.getUserProfile);

// Department routes
router.post('/departments', departmentController.createDepartment);
router.put('/departments/:id', authenticate, departmentController.updateDepartment);
router.patch('/departments/:id/status', authenticate, departmentController.updateDepartmentStatus);
router.get('/departments', departmentController.getAllDepartments);
router.get('/departments/:id', authenticate, departmentController.getDepartmentById);
router.delete('/departments/:id', authenticate, departmentController.deleteDepartment);

// Role routes
router.get('/roles', roleController.getAllRoles);

// Employee routes
router.get('/employees', authenticate, employeeController.getAllEmployees);
router.get('/employees/dashboard-stats', authenticate, employeeController.getDashboardStats);
router.get('/employees/available-users', authenticate, employeeController.getAvailableUsers);
router.get('/employees/search', authenticate, employeeController.searchEmployees);
router.get('/employees/department/:departmentId', authenticate, employeeController.getEmployeesByDepartment);
router.get('/employees/:id', authenticate, employeeController.getEmployeeById);
router.post('/employees', authenticate, employeeController.createEmployee);
router.put('/employees/:id', authenticate, employeeController.updateEmployee);
router.delete('/employees/:id', authenticate, employeeController.deleteEmployee);

// Company Profile routes
router.get('/company-profile', companyProfileController.getCompanyProfile);
router.post('/company-profile', companyProfileController.createCompanyProfile);

// Document routes
router.post('/documents/employee', authenticate, documentController.uploadEmployeeDocument);
router.post('/documents/applicant', authenticate, documentController.uploadApplicantDocument);
router.get('/documents/employee', authenticate, documentController.getEmployeeDocuments);
router.get('/documents/applicant', authenticate, documentController.getApplicantDocuments);
router.get('/documents/:id', authenticate, documentController.getDocumentById);
router.delete('/documents/:id', authenticate, documentController.deleteDocument);
router.get('/documents/users/available', authenticate, documentController.getAvailableUsers);
router.get('/documents/test/large-data', authenticate, documentController.testLargeData);
router.get('/documents/debug/:id', authenticate, documentController.debugDocument);

// Leave routes
router.post('/leaves', authenticate, leaveController.applyLeave);
router.get('/leaves', authenticate, leaveController.getLeaves);
router.get('/leaves/statistics', authenticate, leaveController.getLeaveStatistics);
router.get('/leaves/:id', authenticate, leaveController.getLeaveById);
router.put('/leaves/:id', authenticate, leaveController.updateLeave);
router.delete('/leaves/:id', authenticate, leaveController.deleteLeave);
router.patch('/leaves/:id/approve', authenticate, leaveController.approveLeave);
router.patch('/leaves/:id/reject', authenticate, leaveController.rejectLeave);

// Attendance routes
router.post('/attendance/clock-in', authenticate, attendanceController.clockIn);
router.post('/attendance/clock-out', authenticate, attendanceController.clockOut);
router.get('/attendance/status', authenticate, attendanceController.getCurrentStatus);
router.get('/attendance/history', authenticate, attendanceController.getAttendanceHistory);
router.get('/attendance/statistics', authenticate, attendanceController.getAttendanceStatistics);

module.exports = router;
