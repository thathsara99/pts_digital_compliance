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
  Spin,
  Tag,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { PieChart, Pie, Cell, Tooltip, Legend } from 'recharts';
import dayjs from 'dayjs';
import axios from 'axios';

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

  console.log('Pie chart data:', leaveSummaryData);
  console.log('Statistics state:', statistics);

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
              {(currentUser?.role === 'System Admin' || record.employeeEmail === currentUser?.email) && (
                <Button type="link" icon={<EditOutlined />} onClick={() => showDrawer(record)}>Edit</Button>
              )}
              {currentUser?.role === 'System Admin' && (
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
              {(currentUser?.role === 'System Admin' || record.employeeEmail === currentUser?.email) && (
                <Popconfirm title="Are you sure to delete this leave?" onConfirm={() => handleDelete(record.id)}>
                  <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
                </Popconfirm>
              )}
            </>
          )}
          {record.status !== 'Pending' && currentUser?.role === 'System Admin' && (
            <Popconfirm title="Are you sure to delete this leave?" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" danger icon={<DeleteOutlined />}>Delete</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><h2>Leave Management</h2></Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showDrawer()}>Apply Leave</Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 20 }}>
        <Col span={8}>
          <RangePicker
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            style={{ width: '100%' }}
          />
        </Col>
        <Col span={8}>
          <Select
            placeholder="Filter by Employee"
            allowClear
            onChange={(value) => setFilters({ ...filters, employee: value })}
            style={{ width: '100%' }}
            disabled={currentUser?.role !== 'System Admin'}
          >
            {[...new Set(data.map(d => d.employee))].map(emp => (
              <Option key={emp} value={emp}>{emp}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      {/* Pie Chart and Summary Cards */}
<Row gutter={16} style={{ marginBottom: 24 }}>
  <Col xs={24} md={12}>
    <Card title="Leave Summary (Pie Chart)" bordered={false}>
      {leaveSummaryData.length > 0 && leaveSummaryData.some(item => item.value > 0) ? (
        <PieChart width={300} height={250}>
          <Pie
            data={leaveSummaryData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {leaveSummaryData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      ) : (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          No leave data available
        </div>
      )}
    </Card>
  </Col>

        <Col xs={24} md={12}>
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Card title="Total Annual Leave" bordered={false}>
              <h3 style={{ margin: 0 }}>20 Days</h3>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Taken Annual Leave" bordered={false}>
              <h3 style={{ margin: 0 }}>{statistics.leaveDays.annual} Days</h3>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Taken Sick Leave" bordered={false}>
              <h3 style={{ margin: 0 }}>{statistics.leaveDays.sick} Days</h3>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Taken Casual Leave" bordered={false}>
              <h3 style={{ margin: 0 }}>{statistics.leaveDays.casual} Days</h3>
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Remaining Annual Leave" bordered={false}>
              <h3 style={{ margin: 0 }}>{20 - statistics.leaveDays.annual} Days</h3>
            </Card>
          </Col>
        </Row>
      </Col>
</Row>



      {/* Table */}
      <Table
        columns={columns}
        dataSource={getFilteredData()}
        bordered
        pagination={{ pageSize: 5 }}
        loading={loading}
      />

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
