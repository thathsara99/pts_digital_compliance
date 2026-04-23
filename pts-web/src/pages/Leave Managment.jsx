import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  Checkbox,
  Popconfirm,
  Space,
  message,
  Row,
  Col,
  DatePicker,
  Card,
  Modal,
  Tag,
  Typography,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import dayjs from 'dayjs';
import axios from 'axios';
import { getCurrentUserRole } from '../utils/auth';
import './LeaveManagement.css';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_BASE || 'http://localhost:5000/api',
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);


const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF4D4F'];

const LeaveManagementPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filters, setFilters] = useState({ dateRange: null, employee: null });
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    summary: [],
    totalLeaves: 0,
    leaveDays: { annual: 0, sick: 0, casual: 0, total: 0 }
  });
  const [currentUser, setCurrentUser] = useState(null);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [selectedLeaveId, setSelectedLeaveId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const currentRole = getCurrentUserRole();
  const canViewAllLeaveData = ['HR Manager', 'Super Admin', 'System Admin'].includes(currentRole);

  // Fetch current user profile
  useEffect(() => {
    fetchCurrentUser();
  }, []);

  // Fetch leaves and statistics
  useEffect(() => {
    fetchLeaves();
    fetchStatistics();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/profile');
      if (response.data.success) {
        setCurrentUser(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves');
      if (response.data.success) {
        setData(response.data.data.map(leave => ({
          ...leave,
          key: leave.id
        })));
      }
    } catch (error) {
      console.error('Error fetching leaves:', error);
      message.error('Failed to fetch leaves');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/leaves/statistics');
      if (response.data.success) {
        console.log('Statistics data:', response.data.data);
        setStatistics(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const showDrawer = (record = null) => {
    if (record) {
      form.setFieldsValue({
        ...record,
        dateRange: [dayjs(record.startDate), dayjs(record.endDate)]
      });
      setEditingId(record.id);
    } else {
      form.resetFields();
      setEditingId(null);
    }
    setVisible(true);
  };

  const onClose = () => setVisible(false);

  const onFinish = async (values) => {
    try {
      const payload = {
        leaveType: values.leaveType,
        startDate: values.dateRange[0].format('YYYY-MM-DD'),
        endDate: values.dateRange[1].format('YYYY-MM-DD'),
        comment: values.comment
      };

      if (editingId) {
        const response = await api.put(`/leaves/${editingId}`, payload);
        if (response.data.success) {
          message.success('Leave updated successfully');
          fetchLeaves();
          fetchStatistics();
        }
      } else {
        const response = await api.post('/leaves', payload);
        if (response.data.success) {
          message.success('Leave applied successfully');
          fetchLeaves();
          fetchStatistics();
        }
      }
      setVisible(false);
    } catch (error) {
      console.error('Error saving leave:', error);
      message.error(error.response?.data?.message || 'Failed to save leave');
    }
  };

  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/leaves/${id}`);
      if (response.data.success) {
        message.success('Leave deleted successfully');
        fetchLeaves();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error deleting leave:', error);
      message.error(error.response?.data?.message || 'Failed to delete leave');
    }
  };

  const handleApprove = async (id) => {
    try {
      const response = await api.patch(`/leaves/${id}/approve`);
      if (response.data.success) {
        message.success('Leave approved successfully');
        fetchLeaves();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error approving leave:', error);
      message.error(error.response?.data?.message || 'Failed to approve leave');
    }
  };

  const handleReject = async (id, reason) => {
    try {
      const response = await api.patch(`/leaves/${id}/reject`, { rejectionReason: reason });
      if (response.data.success) {
        message.success('Leave rejected successfully');
        fetchLeaves();
        fetchStatistics();
        setRejectModalVisible(false);
        setRejectReason('');
        setSelectedLeaveId(null);
      }
    } catch (error) {
      console.error('Error rejecting leave:', error);
      message.error(error.response?.data?.message || 'Failed to reject leave');
    }
  };

  const showRejectModal = (id) => {
    setSelectedLeaveId(id);
    setRejectModalVisible(true);
  };

  const getFilteredData = () => {
    let filtered = [...data];
    const { dateRange, employee } = filters;
    if (employee) {
      filtered = filtered.filter(item => item.employee === employee);
    }
    if (dateRange) {
      const [start, end] = dateRange;
      filtered = filtered.filter(item =>
        dayjs(item.startDate).isBetween(start, end, null, '[]') ||
        dayjs(item.endDate).isBetween(start, end, null, '[]')
      );
    }
    return filtered;
  };

  const getStatusTag = (status) => {
    const colorMap = {
      'Pending': 'orange',
      'Approved': 'green',
      'Rejected': 'red'
    };
    return <Tag color={colorMap[status]}>{status}</Tag>;
  };

  const leaveSummaryData = statistics.summary || [
    { name: 'Approved', value: 0 },
    { name: 'Pending', value: 0 },
    { name: 'Rejected', value: 0 },
  ];

  const columns = [
    { title: 'Employee', dataIndex: 'employee', key: 'employee' },
    { title: 'Leave Type', dataIndex: 'leaveType', key: 'leaveType' },
    { title: 'Start Date', dataIndex: 'startDate', key: 'startDate' },
    { title: 'End Date', dataIndex: 'endDate', key: 'endDate' },
    { title: 'Total Days', dataIndex: 'totalDays', key: 'totalDays' },
    { title: 'Comment', dataIndex: 'comment', key: 'comment' },
    { 
      title: 'Status', 
      dataIndex: 'status', 
      key: 'status',
      render: (status) => getStatusTag(status)
    },
    {
      title: 'Action',
      key: 'action',
      width: 250,
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'Pending' && (
            <>
              {(canViewAllLeaveData || record.employeeEmail === currentUser?.email) && (
                <Button type="link" icon={<EditOutlined />} onClick={() => showDrawer(record)}>Edit</Button>
              )}
              {canViewAllLeaveData && (
                <>
                  <Button 
                    type="link" 
                    icon={<CheckOutlined />} 
                    style={{ color: 'green' }}
                    onClick={() => handleApprove(record.id)}
                  >
                    Approve
                  </Button>
                  <Button 
                    type="link" 
                    icon={<CloseOutlined />} 
                    style={{ color: 'red' }}
                    onClick={() => showRejectModal(record.id)}
                  >
                    Reject
                  </Button>
                </>
              )}
              {(canViewAllLeaveData || record.employeeEmail === currentUser?.email) && (
                <Popconfirm title="Are you sure to delete this leave?" onConfirm={() => handleDelete(record.id)}>
                  <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
                </Popconfirm>
              )}
            </>
          )}
          {record.status !== 'Pending' && canViewAllLeaveData && (
            <Popconfirm title="Are you sure to delete this leave?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  const metricCards = [
    { label: 'Total Annual Leave', value: 20, tone: 'primary' },
    { label: 'Taken Annual Leave', value: statistics.leaveDays.annual, tone: 'default' },
    { label: 'Taken Sick Leave', value: statistics.leaveDays.sick, tone: 'warning' },
    { label: 'Taken Casual Leave', value: statistics.leaveDays.casual, tone: 'success' },
    { label: 'Remaining Annual Leave', value: Math.max(20 - statistics.leaveDays.annual, 0), tone: 'highlight' },
  ];

  return (
    <div className="leave-page">
      <div className="leave-hero">
        <div>
          <Text className="leave-hero-label">Leave Operations</Text>
          <Title level={2} className="leave-hero-title">Leave Management</Title>
          <Text className="leave-hero-subtitle">
            Manage leave requests, approvals, and balances with a clearer and faster workflow.
          </Text>
        </div>
        <div className="leave-hero-actions">
          <div className="leave-date-pill">{today}</div>
          <Button className="leave-apply-btn" type="primary" icon={<PlusOutlined />} onClick={() => showDrawer()}>
            Apply Leave
          </Button>
        </div>
      </div>

      <Card className="leave-filter-card" bordered={false}>
        <Row gutter={16}>
          <Col xs={24} md={12} lg={8}>
            <Text className="leave-filter-label">Date Range</Text>
          <RangePicker
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            style={{ width: '100%', marginTop: 6 }}
          />
          </Col>
          <Col xs={24} md={12} lg={8}>
            <Text className="leave-filter-label">Employee</Text>
          <Select
            placeholder="Filter by Employee"
            allowClear
            onChange={(value) => setFilters({ ...filters, employee: value })}
            style={{ width: '100%', marginTop: 6 }}
            disabled={!canViewAllLeaveData}
          >
            {[...new Set(data.map(d => d.employee))].map(emp => (
              <Option key={emp} value={emp}>{emp}</Option>
            ))}
          </Select>
          </Col>
        </Row>
      </Card>

      <Row gutter={[20, 20]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={10}>
          <Card className="leave-card leave-summary-card" title="Leave Summary" bordered={false}>
            {leaveSummaryData.length > 0 && leaveSummaryData.some(item => item.value > 0) ? (
              <div className="leave-pie-wrap">
                <PieChart width={320} height={250}>
                  <Pie
                    data={leaveSummaryData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={82}
                    label
                  >
                    {leaveSummaryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </div>
            ) : (
              <div className="leave-empty-state">No leave data available</div>
            )}
          </Card>
          </Col>
        <Col xs={24} lg={14}>
          <Row gutter={[14, 14]}>
            {metricCards.map((item) => (
              <Col xs={24} sm={12} key={item.label}>
                <Card className={`leave-metric-card ${item.tone}`} bordered={false}>
                  <Text className="metric-label">{item.label}</Text>
                  <Title level={3} className="metric-value">{item.value} Days</Title>
                </Card>
              </Col>
            ))}
          </Row>
        </Col>
      </Row>

      <Card className="leave-card leave-table-card" bordered={false}>
        <Table
          columns={columns}
          dataSource={getFilteredData()}
          pagination={{ pageSize: 6 }}
          loading={loading}
          className="leave-table"
          scroll={{ x: 1100 }}
        />
      </Card>

      {/* Reject Modal */}
      <Modal
        title="Reject Leave"
        visible={rejectModalVisible}
        onOk={() => handleReject(selectedLeaveId, rejectReason)}
        onCancel={() => {
          setRejectModalVisible(false);
          setRejectReason('');
          setSelectedLeaveId(null);
        }}
        okText="Reject"
        cancelText="Cancel"
        okButtonProps={{ danger: true }}
      >
        <Form layout="vertical">
          <Form.Item
            label="Rejection Reason"
            required
          >
            <Input.TextArea
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejecting this leave request..."
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Drawer Form */}
      <Drawer
        title={editingId ? "Edit Leave" : "Apply Leave"}
        width={500}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>Cancel</Button>
            <Button onClick={() => form.submit()} type="primary">Submit</Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="dateRange"
            label="Leave Start & End Date"
            rules={[{ required: true, message: 'Please select leave dates' }]}
          >
            <RangePicker style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item
            name="leaveType"
            label="Leave Type"
            rules={[{ required: true, message: 'Please select leave type' }]}
          >
            <Select placeholder="Select leave type">
              <Option value="Annual">Annual</Option>
              <Option value="Sick">Sick</Option>
              <Option value="Casual">Casual</Option>
              <Option value="Maternity">Maternity</Option>
              <Option value="Paternity">Paternity</Option>
              <Option value="Unpaid">Unpaid</Option>
            </Select>
          </Form.Item>

          <Form.Item name="comment" label="Comment">
            <Input.TextArea rows={3} placeholder="Add a comment (optional)" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default LeaveManagementPage;
