import React, { useState } from 'react';
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
  Col 
} from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Option } = Select;

const TemplatesPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [data, setData] = useState([
    {
      key: '1',
      templateName: 'Invoice Template',
      type: 'Document',
      requireComment: true,
      requireUsername: false,
    },
    {
      key: '2',
      templateName: 'Report Template',
      type: 'Report',
      requireComment: false,
      requireUsername: true,
    },
  ]);

  const showDrawer = (record = null) => {
    if (record) {
      form.setFieldsValue(record);
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

  const onFinish = (values) => {
    if (editingId) {
      // Update existing record
      setData(data.map(item => item.key === editingId ? { ...values, key: editingId } : item));
      message.success('Template updated successfully');
    } else {
      // Add new record
      const newRecord = {
        ...values,
        key: Date.now().toString(),
      };
      setData([...data, newRecord]);
      message.success('Template added successfully');
    }
    setVisible(false);
  };

  const handleDelete = (key) => {
    setData(data.filter(item => item.key !== key));
    message.success('Template deleted successfully');
  };

  const columns = [
    {
      title: 'Template Name',
      dataIndex: 'templateName',
      key: 'templateName',
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: 'Action',
      key: 'action',
      width: 200, // Fixed width for action column
      render: (_, record) => (
        <Space size="middle">
          <Button 
            type="link" 
            icon={<EditOutlined />} 
            onClick={() => showDrawer(record)}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure to delete this template?"
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
          <h2>Templates</h2>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={() => showDrawer()}
          >
            Add New
          </Button>
        </Col>
      </Row>

      <Table 
        columns={columns} 
        dataSource={data} 
        bordered
        pagination={{ pageSize: 5 }}
      />

      <Drawer
        title={editingId ? "Edit Template" : "Add New Template"}
        width={500}
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
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          <Form.Item
            name="templateName"
            label="Template Name"
            rules={[{ required: true, message: 'Please enter template name' }]}
          >
            <Input placeholder="Enter template name" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select template type' }]}
          >
            <Select placeholder="Select template type">
              <Option value="Document">Document</Option>
              <Option value="Report">Report</Option>
              <Option value="Form">Form</Option>
              <Option value="Email">Email</Option>
            </Select>
          </Form.Item>

          <Form.Item name="requireComment" valuePropName="checked">
            <Checkbox>Require Comment</Checkbox>
          </Form.Item>

          <Form.Item name="requireUsername" valuePropName="checked">
            <Checkbox>Require Username</Checkbox>
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default TemplatesPage;