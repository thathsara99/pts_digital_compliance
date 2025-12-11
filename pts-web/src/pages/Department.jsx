import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Drawer,
  Form,
  Input,
  Switch,
  Popconfirm,
  Space,
  message,
  Row,
  Col,
  Tag,
} from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const DepartmentsPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch departments from API
  const fetchDepartments = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/departments`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch departments');
      setData(
        result.data.map((d) => ({
          key: d.id,
          name: d.name,
          description: d.description,
          active: d.status,
        }))
      );
    } catch (err) {
      setError(err.message);
      message.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const showDrawer = (record = null) => {
    if (record) {
      form.setFieldsValue({ ...record, status: record.active });
      setEditingId(record.key);
    } else {
      form.resetFields();
      setEditingId(null);
    }
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
  };

  const onFinish = async (values) => {
    setError(null);
    try {
      if (editingId) {
        // Edit department
        const res = await fetch(`${API_BASE}/departments/${editingId}`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            status: values.active,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to update department');
        message.success('Department updated successfully');
      } else {
        // Create department
        const res = await fetch(`${API_BASE}/departments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            name: values.name,
            description: values.description,
            status: values.active,
          }),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to add department');
        message.success('Department added successfully');
      }
      setVisible(false);
      fetchDepartments();
    } catch (err) {
      setError(err.message);
      message.error(`Error: ${err.message}`);
    }
  };

  const handleDelete = async (key) => {
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/departments/${key}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete department');
      message.success('Department deleted');
      fetchDepartments();
    } catch (err) {
      setError(err.message);
      message.error(`Error: ${err.message}`);
    }
  };

  const toggleStatus = async (key) => {
    setError(null);
    const dept = data.find((d) => d.key === key);
    if (!dept) return;
    try {
      const res = await fetch(`${API_BASE}/departments/${key}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: !dept.active }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update status');
      message.success('Department status updated');
      fetchDepartments();
    } catch (err) {
      setError(err.message);
      message.error(`Error: ${err.message}`);
    }
  };

  const columns = [
    {
      title: 'Department Name',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: 'Status',
      key: 'active',
      render: (_, record) => (
        <Tag color={record.active ? 'green' : 'red'}>
          {record.active ? 'Active' : 'Inactive'}
        </Tag>
      ),
    },
    {
      title: 'Action',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => showDrawer(record)}>
            Edit
          </Button>
          <Button
            type="link"
            onClick={() => toggleStatus(record.key)}
            style={{ color: record.active ? '#faad14' : '#52c41a' }}
          >
            {record.active ? 'Deactivate' : 'Activate'}
          </Button>
          <Popconfirm
            title="Are you sure to delete this department?"
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
          <h2>Departments</h2>
        </Col>
        <Col>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => showDrawer()}
          >
            Add Department
          </Button>
        </Col>
      </Row>

      {error && (
        <div style={{ color: 'red', marginBottom: 16 }}>
          <b>Error:</b> {error}
        </div>
      )}

      <Table
        columns={columns}
        dataSource={data}
        bordered
        loading={loading}
        pagination={{ pageSize: 5 }}
      />

      <Drawer
        title={editingId ? 'Edit Department' : 'Add New Department'}
        width={480}
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
          <Form.Item
            name="name"
            label="Department Name"
            rules={[{ required: true, message: 'Please enter department name' }]}
          >
            <Input placeholder="Enter department name" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea rows={4} placeholder="Enter description" />
          </Form.Item>

          <Form.Item
            name="active"
            label="Status"
            valuePropName="checked"
            initialValue={true}
          >
            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default DepartmentsPage;
