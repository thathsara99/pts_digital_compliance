import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Select,
  DatePicker,
  Switch,
  Popconfirm,
  Space,
  message,
  Row,
  Col,
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Option } = Select;

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const UserManagementPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [roles, setRoles] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filters, setFilters] = useState({
    username: '',
    department: '',
    role: '',
  });

  const [filteredData, setFilteredData] = useState(users);

  // Fetch roles, departments, and users from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const res = await fetch(`${API_BASE}/roles`);
        const result = await res.json();
        if (res.ok && result.data) {
          setRoles(result.data);
        } else {
          setRoles([]);
        }
      } catch (err) {
        setRoles([]);
      }
    };
    const fetchDepartments = async () => {
      try {
        const res = await fetch(`${API_BASE}/departments`, {
          headers: { ...getAuthHeaders() },
        });
        const result = await res.json();
        if (res.ok && result.data) {
          setDepartments(result.data);
        } else {
          setDepartments([]);
        }
      } catch (err) {
        setDepartments([]);
      }
    };
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/users`, {
          headers: { ...getAuthHeaders() },
        });
        const result = await res.json();
        if (res.ok && result.data) {
          setUsers(result.data);
        } else {
          setUsers([]);
        }
      } catch (err) {
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRoles();
    fetchDepartments();
    fetchUsers();
  }, []);

  // Replace static data with users from API
  useEffect(() => {
    setFilteredData(users.map(user => ({
      key: user.id,
      firstName: user.firstName,
      middleName: user.middleName,
      lastName: user.lastName,
      gender: user.gender,
      dob: user.dateOfBirth,
      contact: user.contactNumber,
      role: user.role,
      username: user.username,
      email: user.email,
      department: user.department ? user.department.name : '',
      password: '••••••••',
      status: user.status,
    })));
  }, [users]);

  const showDrawer = (record = null) => {
    if (record) {
      const formData = {
        ...record,
        dob: dayjs(record.dob),
      };
      form.setFieldsValue(formData);
      setEditingId(record.key);
    } else {
      form.resetFields();
      setEditingId(null);
    }
    setVisible(true);
  };

  const onClose = () => setVisible(false);

  const onFinish = async (values) => {
    const formattedValues = {
      ...values,
      dob: values.dob.format('YYYY-MM-DD'),
    };
    try {
      if (editingId) {
        // Edit user via API
        const res = await fetch(`${API_BASE}/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            firstName: formattedValues.firstName,
            middleName: formattedValues.middleName,
            lastName: formattedValues.lastName,
            gender: formattedValues.gender,
            dateOfBirth: formattedValues.dob,
            contactNumber: formattedValues.contact,
            role: formattedValues.role,
            username: formattedValues.username,
            email: formattedValues.email,
            departmentId: departments.find(dep => dep.name === formattedValues.department)?.id || null,
            status: formattedValues.status,
            password: formattedValues.password // Only update if provided
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to update user');
        message.success('User updated successfully');
        // Refresh users
        const usersRes = await fetch(`${API_BASE}/users`, { headers: { ...getAuthHeaders() } });
        const usersResult = await usersRes.json();
        setUsers(usersResult.data || []);
      } else {
        // Add new user via API
        const res = await fetch(`${API_BASE}/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            firstName: formattedValues.firstName,
            middleName: formattedValues.middleName,
            lastName: formattedValues.lastName,
            gender: formattedValues.gender,
            dateOfBirth: formattedValues.dob,
            contactNumber: formattedValues.contact,
            role: formattedValues.role,
            username: formattedValues.username,
            email: formattedValues.email,
            departmentId: departments.find(dep => dep.name === formattedValues.department)?.id || null,
            status: formattedValues.status,
            password: formattedValues.password
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to add user');
        message.success('User added successfully');
        // Refresh users
        const usersRes = await fetch(`${API_BASE}/users`, { headers: { ...getAuthHeaders() } });
        const usersResult = await usersRes.json();
        setUsers(usersResult.data || []);
      }
      setVisible(false);
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (key) => {
    try {
      const res = await fetch(`${API_BASE}/users/${key}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete user');
      message.success('User deleted successfully');
      // Refresh users
      const usersRes = await fetch(`${API_BASE}/users`, { headers: { ...getAuthHeaders() } });
      const usersResult = await usersRes.json();
      setUsers(usersResult.data || []);
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  // Add status toggle handler
  const handleStatusToggle = async (key, currentStatus) => {
    try {
      const res = await fetch(`${API_BASE}/users/${key}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: !currentStatus }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update user status');
      message.success('User status updated');
      // Refresh users
      const usersRes = await fetch(`${API_BASE}/users`, { headers: { ...getAuthHeaders() } });
      const usersResult = await usersRes.json();
      setUsers(usersResult.data || []);
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      title: 'First Name',
      dataIndex: 'firstName',
      key: 'firstName',
    },
    {
      title: 'Last Name',
      dataIndex: 'lastName',
      key: 'lastName',
    },
    {
      title: 'Username',
      dataIndex: 'username',
      key: 'username',
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
    },
    {
      title: 'Department',
      dataIndex: 'department',
      key: 'department',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status, record) => (
        <Switch
          checked={status}
          checkedChildren="Active"
          unCheckedChildren="Inactive"
          onChange={() => handleStatusToggle(record.key, status)}
        />
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} onClick={() => showDrawer(record)}>
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this user?"
            onConfirm={() => handleDelete(record.key)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />}>
              Delete
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <h2>User Management</h2>
        </Col>
        <Col>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showDrawer()}>
            Add New User
          </Button>
        </Col>
      </Row>

      {/* Filters */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Input
            placeholder="Filter by Username"
            value={filters.username}
            onChange={e => setFilters(prev => ({ ...prev, username: e.target.value }))}
            allowClear
          />
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter by Department"
            value={filters.department || undefined}
            onChange={value => setFilters(prev => ({ ...prev, department: value }))}
            allowClear
            style={{ width: '100%' }}
          >
            {departments.map(dep => (
              <Option key={dep.id} value={dep.name}>{dep.name}</Option>
            ))}
          </Select>
        </Col>
        <Col span={6}>
          <Select
            placeholder="Filter by Role"
            value={filters.role || undefined}
            onChange={value => setFilters(prev => ({ ...prev, role: value }))}
            allowClear
            style={{ width: '100%' }}
          >
            {roles.map(role => (
              <Option key={role.name} value={role.name}>{role.name}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Table
        columns={columns}
        dataSource={filteredData}
        bordered
        pagination={{ pageSize: 5 }}
        loading={loading}
      />

      <Drawer
        title={editingId ? 'Edit User' : 'Add New User'}
        width={600}
        onClose={onClose}
        visible={visible}
        bodyStyle={{ paddingBottom: 80 }}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button onClick={onClose} style={{ marginRight: 8 }}>
              Cancel
            </Button>
            <Button onClick={() => form.submit()} type="primary">
              Submit
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="firstName" label="First Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="middleName" label="Middle Name">
            <Input />
          </Form.Item>
          <Form.Item name="lastName" label="Last Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="gender" label="Gender" rules={[{ required: true }]}>
            <Select placeholder="Select gender">
              <Option value="Male">Male</Option>
              <Option value="Female">Female</Option>
              <Option value="Other">Other</Option>
            </Select>
          </Form.Item>
          <Form.Item name="dob" label="Date of Birth" rules={[{ required: true }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="contact" label="Contact Number" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select placeholder="Select role">
              {roles.map(role => (
                <Option key={role.name} value={role.name}>{role.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="department" label="Department" rules={[{ required: true }]}>
            <Select placeholder="Select department">
              {departments.map(dep => (
                <Option key={dep.id} value={dep.name}>{dep.name}</Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="username" label="Username" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="status" label="Status" valuePropName="checked">
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default UserManagementPage;
