import React, { useState, useEffect } from 'react';
import {
  Upload,
  Button,
  Table,
  Select,
  Form,
  Input,
  Row,
  Col,
  Space,
  message,
  Popconfirm,
  Card,
  Typography,
  Drawer,
  Spin,
} from 'antd';
import {
  UploadOutlined,
  EyeOutlined,
  DeleteOutlined,
  PlusOutlined,
} from '@ant-design/icons';
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

const { Option } = Select;
const { Title } = Typography;

const DocumentHub = () => {
  const [form] = Form.useForm();
  const [drawerForm] = Form.useForm();
  const [documents, setDocuments] = useState([]);
  const [newApplicantDocs, setNewApplicantDocs] = useState([]);
  const [filteredType, setFilteredType] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [applicantNameFilter, setApplicantNameFilter] = useState(null);
  const [applicantDocTypeFilter, setApplicantDocTypeFilter] = useState(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [employeeOptions, setEmployeeOptions] = useState([]);

  const documentTypes = [
    'Identification Docs',
    'Right to Work Check',
    'Certificates',
    'References',
    'Offer Letter',
    'Contracts',
    'Supporting Docs',
    'Other',
  ];

  const newApplicantTypes = [
    'Identification Docs',
    'Right to Work Check',
    'Certificates',
    'References',
    'CV',
  ];

  // Fetch data on component mount
  useEffect(() => {
    fetchEmployeeDocuments();
    fetchApplicantDocuments();
    fetchAvailableUsers();
  }, []);

  // Fetch employee documents
  const fetchEmployeeDocuments = async () => {
    try {
      setLoading(true);
      const response = await api.get('/documents/employee');
      if (response.data.success) {
        setDocuments(response.data.data.map(doc => ({
          ...doc,
          key: doc.id,
          file: null // Will be fetched when viewing
        })));
      }
    } catch (error) {
      console.error('Error fetching employee documents:', error);
      message.error('Failed to fetch employee documents');
    } finally {
      setLoading(false);
    }
  };

  // Fetch applicant documents
  const fetchApplicantDocuments = async () => {
    try {
      const response = await api.get('/documents/applicant');
      if (response.data.success) {
        setNewApplicantDocs(response.data.data.map(doc => ({
          ...doc,
          key: doc.id,
          file: null // Will be fetched when viewing
        })));
      }
    } catch (error) {
      console.error('Error fetching applicant documents:', error);
      message.error('Failed to fetch applicant documents');
    }
  };

  // Fetch available users for dropdown
  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/documents/users/available');
      if (response.data.success) {
        setEmployeeOptions(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching available users:', error);
      message.error('Failed to fetch available users');
    }
  };

  const handleUpload = async (info, isNewApplicant = false) => {
    const file = info.file.originFileObj;
    if (file.type !== 'application/pdf') {
      message.error('Only PDF files are allowed.');
      return;
    }

    const values = isNewApplicant ? drawerForm.getFieldsValue() : form.getFieldsValue();
    const { fileName, employeeEmail, applicantName, documentType } = values;

    if (!fileName || (!isNewApplicant && !employeeEmail) || (isNewApplicant && !applicantName)) {
      message.warning('Please complete the form before uploading.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1]; // Remove data URL prefix
        
        // Debug: Check base64 data
        console.log('Frontend - File size:', file.size);
        console.log('Frontend - Base64 length:', base64.length);
        console.log('Frontend - Base64 preview:', base64.substring(0, 100) + '...');
        
        const fileData = {
          fileName,
          documentType,
          fileData: base64,
          fileType: file.type,
          fileSize: file.size,
          ...(isNewApplicant
            ? { applicantName }
            : { userId: employeeEmail }),
        };

        const endpoint = isNewApplicant ? '/documents/applicant' : '/documents/employee';
        const response = await api.post(endpoint, fileData);

        if (response.data.success) {
          message.success(isNewApplicant ? 'New applicant document uploaded' : 'File uploaded successfully');
          if (isNewApplicant) {
            drawerForm.resetFields();
            fetchApplicantDocuments();
          } else {
            form.resetFields();
            fetchEmployeeDocuments();
          }
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading document:', error);
      message.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (record) => {
    try {
      const response = await api.get(`/documents/${record.id}`);
      if (response.data.success) {
        const { fileData, fileName } = response.data.data;
        
        // Create a blob from the data URL
        const byteCharacters = atob(fileData.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${fileName || record.fileName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        setTimeout(() => URL.revokeObjectURL(url), 100);
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      message.error('Failed to download document');
    }
  };

  const handleView = async (record) => {
    try {
      const response = await api.get(`/documents/${record.id}`);
      if (response.data.success) {
        const { fileData, fileName } = response.data.data;
        
        // Create a blob from the data URL
        const byteCharacters = atob(fileData.split(',')[1]);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: 'application/pdf' });
        
        // Create object URL and open in new tab
        const url = URL.createObjectURL(blob);
        const newWindow = window.open(url, '_blank');
        
        // Clean up the object URL after the window is loaded
        if (newWindow) {
          newWindow.addEventListener('load', () => {
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          });
        }
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      message.error('Failed to view document');
    }
  };

  const handleDelete = async (key, isNewApplicant = false) => {
    try {
      const response = await api.delete(`/documents/${key}`);
      if (response.data.success) {
        message.success('File deleted');
        if (isNewApplicant) {
          fetchApplicantDocuments();
        } else {
          fetchEmployeeDocuments();
        }
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      message.error('Failed to delete document');
    }
  };

  const filteredDocs = filteredType
    ? documents.filter(doc => doc.documentType === filteredType)
    : documents;

  const filteredNewApplicantDocs = newApplicantDocs.filter(doc => {
    const matchesName = applicantNameFilter ? doc.applicantName?.toLowerCase().includes(applicantNameFilter.toLowerCase()) : true;
    const matchesType = applicantDocTypeFilter ? doc.documentType === applicantDocTypeFilter : true;
    return matchesName && matchesType;
  });

  const columns = [
    { title: 'File Name', dataIndex: 'fileName', key: 'fileName' },
    { title: 'Employee Email', dataIndex: 'employeeEmail', key: 'employeeEmail' },
    { title: 'Document Type', dataIndex: 'documentType', key: 'documentType' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)}>View</Button>
          <Button onClick={() => handleDownload(record)}>Download</Button>
          <Popconfirm title="Are you sure to delete this file?" onConfirm={() => handleDelete(record.id)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const newApplicantColumns = [
    { title: 'File Name', dataIndex: 'fileName', key: 'fileName' },
    { title: 'Applicant Name', dataIndex: 'applicantName', key: 'applicantName' },
    { title: 'Document Type', dataIndex: 'documentType', key: 'documentType' },
    {
      title: 'Action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button icon={<EyeOutlined />} onClick={() => handleView(record)}>View</Button>
          <Button onClick={() => handleDownload(record)}>Download</Button>
          <Popconfirm title="Delete this document?" onConfirm={() => handleDelete(record.id, true)}>
            <Button danger icon={<DeleteOutlined />}>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: '30px' }}>
      <Card bordered={false} style={{ background: '#f9f9f9', borderRadius: '12px' }}>
        <Title level={3}>📄 Document Hub</Title>

        <Form form={form} layout="vertical">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="employeeEmail" label="Select Employee" rules={[{ required: true }]}>
                <Select placeholder="Select employee email" loading={loading}>
                  {employeeOptions.map(opt => <Option key={opt.value} value={opt.value}>{opt.label}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="fileName" label="File Name" rules={[{ required: true }]}>
                <Input placeholder="Enter file name" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  {documentTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
                </Select>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Upload File">
                <Upload
                  showUploadList={false}
                  accept=".pdf"
                  customRequest={({ file, onSuccess }) => {
                    handleUpload({ file: { originFileObj: file } });
                    setTimeout(() => onSuccess("ok"), 0);
                  }}
                >
                  <Button icon={<UploadOutlined />} type="primary" block loading={uploading}> Upload File </Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Form>

        <Row justify="space-between" align="middle" style={{ margin: '16px 0' }}>
          <Col>
            <Select
              allowClear
              placeholder="Filter by Document Type"
              style={{ width: 250 }}
              onChange={(value) => setFilteredType(value)}
            >
              {documentTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
            </Select>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setDrawerVisible(true)}>
              New Applicants
            </Button>
          </Col>
        </Row>

        <Table 
          dataSource={filteredDocs} 
          columns={columns} 
          bordered 
          pagination={{ pageSize: 5 }} 
          loading={loading}
        />
      </Card>

      <Drawer
        title="📂 New Applicant Documents"
        width={720}
        onClose={() => setDrawerVisible(false)}
        visible={drawerVisible}
        destroyOnClose
      >
        <Form form={drawerForm} layout="vertical">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="applicantName" label="Applicant Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="fileName" label="File Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="documentType" label="Document Type" rules={[{ required: true }]}>
                <Select placeholder="Select type">
                  {newApplicantTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item label="Upload PDF">
            <Upload
              showUploadList={false}
              accept=".pdf"
              customRequest={({ file, onSuccess }) => {
                handleUpload({ file: { originFileObj: file } }, true);
                setTimeout(() => onSuccess("ok"), 0);
              }}
            >
              <Button icon={<UploadOutlined />} type="primary" loading={uploading}> Upload File </Button>
            </Upload>
          </Form.Item>
        </Form>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Input
              placeholder="Filter by Applicant Name"
              allowClear
              onChange={e => setApplicantNameFilter(e.target.value)}
            />
          </Col>
          <Col span={12}>
            <Select
              placeholder="Filter by Document Type"
              allowClear
              style={{ width: '100%' }}
              onChange={val => setApplicantDocTypeFilter(val)}
            >
              {newApplicantTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
            </Select>
          </Col>
        </Row>

        <Table
          dataSource={filteredNewApplicantDocs}
          columns={newApplicantColumns}
          rowKey="key"
          pagination={{ pageSize: 5 }}
          loading={loading}
        />
      </Drawer>
    </div>
  );
};

export default DocumentHub;
