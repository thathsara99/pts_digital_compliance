import React, { useEffect, useState, useRef } from 'react';
import {
  Table, Button, Drawer, Form, Input, Select, DatePicker, Upload, message,
  Space, Row, Col, Popconfirm, Tooltip, Typography
} from 'antd';
import {
  InboxOutlined, PlusOutlined, LeftOutlined, RightOutlined, EditOutlined, DeleteOutlined
} from '@ant-design/icons';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { getCurrentUserRole } from '../utils/auth';
import PageBanner from '../components/PageBanner';
dayjs.extend(customParseFormat);

const { Option } = Select;
const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const DATE_FORMAT = 'DD/MM/YYYY';

const EmployeeManagementPage = () => {
  const [form] = Form.useForm();
  const [visible, setVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [filteredEmail, setFilteredEmail] = useState(null);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employeeData, setEmployeeData] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  /** Blocks submit while image/FileReader processing is in flight (avoids saving null blobs). */
  const [uploadProcessingCount, setUploadProcessingCount] = useState(0);
  const uploadBusyRef = useRef(0);
  /** In-drawer previews for contract PDFs / images (mirrors saved data URLs). */
  const [docPreviews, setDocPreviews] = useState({
    employmentContract: null,
    rightToWorkDocument: null
  });
  /** Upload fields must not use Form `name` with Upload (fileList overwrites base64). */
  const documentFieldsRef = useRef({
    passportPhoto: null,
    employmentContract: null,
    rightToWorkDocument: null
  });
  const currentRole = getCurrentUserRole();
  const canManageAllEmployees = ['HR Manager', 'Super Admin', 'HR', 'System Admin'].includes(currentRole);

  const beginUploadProcessing = () => {
    uploadBusyRef.current += 1;
    setUploadProcessingCount((c) => c + 1);
  };
  const endUploadProcessing = () => {
    uploadBusyRef.current = Math.max(0, uploadBusyRef.current - 1);
    setUploadProcessingCount((c) => Math.max(0, c - 1));
  };

  const resolveUploadFile = (info) => {
    if (!info.fileList?.length) return null;
    const entry = info.fileList[info.fileList.length - 1];
    const raw = entry.originFileObj ?? entry;
    return raw instanceof Blob ? raw : null;
  };

  // Fetch countries
  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Failed to fetch countries');
        }
        return response.json();
      })
      .then((data) => {
        const countryNames = data
          .map((country) => country.name.common)
          .filter(name => name) // Filter out any null/undefined names
          .sort();
        setCountries(countryNames);
      })
      .catch((error) => {
        console.error('Error fetching countries:', error);
        // Fallback to a basic list of countries if API fails
        const fallbackCountries = [
          'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria', 'Azerbaijan',
          'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan', 'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi',
          'Cabo Verde', 'Cambodia', 'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica', 'Croatia', 'Cuba', 'Cyprus', 'Czech Republic',
          'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic',
          'Ecuador', 'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia',
          'Fiji', 'Finland', 'France',
          'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
          'Haiti', 'Honduras', 'Hungary',
          'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Ivory Coast',
          'Jamaica', 'Japan', 'Jordan',
          'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait', 'Kyrgyzstan',
          'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
          'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico', 'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar',
          'Namibia', 'Nauru', 'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway',
          'Oman',
          'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
          'Qatar',
          'Romania', 'Russia', 'Rwanda',
          'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
          'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
          'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan',
          'Vanuatu', 'Vatican City', 'Venezuela', 'Vietnam',
          'Yemen',
          'Zambia', 'Zimbabwe'
        ];
        setCountries(fallbackCountries);
      });
  }, []);

  // Fetch employees and available users
  useEffect(() => {
    fetchEmployees();
    fetchAvailableUsers();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/employees`, {
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setEmployeeData(result.data);
      } else {
        message.error('Failed to fetch employees');
      }
    } catch (err) {
      message.error('Error fetching employees');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch(`${API_BASE}/users`, {
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        // Filter out System Admin and Company Admin users
        const filteredUsers = result.data.filter(user => 
          user.role !== 'System Admin' && user.role !== 'Company Admin'
        );
        setAvailableUsers(filteredUsers);
      }
    } catch (err) {
      console.error('Error fetching available users:', err);
    }
  };

  const showDrawer = () => {
    form.resetFields();
    setPreviewUrl(null);
    documentFieldsRef.current = {
      passportPhoto: null,
      employmentContract: null,
      rightToWorkDocument: null
    };
    setDocPreviews({ employmentContract: null, rightToWorkDocument: null });
    setEditingEmployee(null);
    setVisible(true);
  };

  const onClose = () => {
    setVisible(false);
    setEditingEmployee(null);
  };

  const handlePhotoUpload = (info) => {
    if (!info.fileList?.length) {
      documentFieldsRef.current.passportPhoto = null;
      setPreviewUrl(null);
      return;
    }
    const file = resolveUploadFile(info);
    if (!file) return;

    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('Only image files are allowed!');
      return;
    }

    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return;
    }

    beginUploadProcessing();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      try {
        const maxSize = 300;
        let { width, height } = img;

        if (width > height) {
          if (width > maxSize) {
            height = (height * maxSize) / width;
            width = maxSize;
          }
        } else if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
        setPreviewUrl(compressedBase64);
        documentFieldsRef.current.passportPhoto = compressedBase64;
        message.success('Photo uploaded and compressed!');
      } finally {
        URL.revokeObjectURL(objectUrl);
        endUploadProcessing();
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      message.error('Error processing image');
      endUploadProcessing();
    };

    img.src = objectUrl;
  };

  const handleDocumentUpload = (info, fieldName) => {
    if (!info.fileList?.length) {
      documentFieldsRef.current[fieldName] = null;
      setDocPreviews((p) => ({ ...p, [fieldName]: null }));
      return;
    }
    const file = resolveUploadFile(info);
    if (!file) return;

    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('File must be smaller than 5MB!');
      return;
    }

    beginUploadProcessing();
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      documentFieldsRef.current[fieldName] = dataUrl;
      setDocPreviews((p) => ({ ...p, [fieldName]: dataUrl }));
      message.success('Document uploaded!');
      endUploadProcessing();
    };
    reader.onerror = () => {
      message.error('Could not read the file. Try again.');
      endUploadProcessing();
    };
    reader.readAsDataURL(file);
  };

  const onFinish = async (values) => {
    try {
      if (uploadBusyRef.current > 0) {
        message.warning('Wait until file uploads finish processing, then save again.');
        return;
      }
      // Validate required date fields
      if (!values.dateOfBirth) {
        message.error('Date of Birth is required');
        return;
      }
      if (!values.visaStart) {
        message.error('Visa Start Date is required');
        return;
      }
      if (!values.visaEnd) {
        message.error('Visa End Date is required');
        return;
      }

      const employeeData = {
        userId: values.userId,
        employeeId: values.employeeId,
        dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
        nationality: values.nationality,
        emergencyContact: values.emergencyContact,
        niNumber: values.niNumber,
        visaType: values.visaType,
        eVisaShareCode: values.eVisaShareCode,
        visaStartDate: values.visaStart.format('YYYY-MM-DD'),
        visaEndDate: values.visaEnd.format('YYYY-MM-DD'),
        bankName: values.bankName,
        accountNumber: values.accountNumber,
        sortCode: values.sortCode,
        accountHolder: values.accountHolder,
        passportPhoto: documentFieldsRef.current.passportPhoto,
        employmentContract: documentFieldsRef.current.employmentContract,
        rightToWorkDocument: documentFieldsRef.current.rightToWorkDocument
      };

      if (editingEmployee) {
        // Update employee
        const res = await fetch(`${API_BASE}/employees/${editingEmployee.key}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(employeeData),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to update employee');
        message.success('Employee updated successfully');
      } else {
        // Create employee
        const res = await fetch(`${API_BASE}/employees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify(employeeData),
        });
        const result = await res.json();
        if (!res.ok) throw new Error(result.message || 'Failed to create employee');
        message.success('Employee created successfully');
      }

      setVisible(false);
      fetchEmployees();
      fetchAvailableUsers(); // Refresh available users
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  const exportToExcel = () => {
    const data = employeeData.map(({ key, ...row }) => row);
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Employees');
    XLSX.writeFile(workbook, 'EmployeeDetails.xlsx');
  };

  const exportToPDF = () => {
    const doc = new jsPDF();

    const pdfColumns = [
      { key: 'email', title: 'Employee Email' },
      { key: 'name', title: 'Name' },
      { key: 'department', title: 'Department' },
      { key: 'dateofBirth', title: 'Date of Birth' },
      { key: 'employeeId', title: 'Employee ID' },
      { key: 'emergencyContact', title: 'Emergency Contact' },
      { key: 'niNumber', title: 'NI Number' },
      { key: 'visaType', title: 'Visa Type' },
      { key: 'eVisaShareCode', title: 'E-Visa Share Code' },
      { key: 'visaStart', title: 'Visa Start' },
      { key: 'visaEnd', title: 'Visa End' },
      { key: 'bankName', title: 'Bank Name' },
      { key: 'accountNumber', title: 'Account Number' },
      { key: 'sortCode', title: 'Sort Code' },
      { key: 'accountHolder', title: 'Account Holder' },
      { key: 'nationality', title: 'Nationality' },
      { key: 'status', title: 'Status' },
      { key: 'hasPassportPhoto', title: 'Passport Photo' },
      { key: 'hasEmploymentContract', title: 'Employment Contract' },
      { key: 'hasRightToWorkDocument', title: 'Right To Work' },
      { key: 'createdAt', title: 'Created' },
      { key: 'updatedAt', title: 'Updated' }
    ];

    const formatPdfValue = (key, value) => {
      if (value == null || value === '') return '—';
      if (
        key === 'hasPassportPhoto' ||
        key === 'hasEmploymentContract' ||
        key === 'hasRightToWorkDocument'
      ) {
        return value ? 'Yes' : 'No';
      }
      if (key === 'createdAt' || key === 'updatedAt') {
        return dayjs(value).isValid() ? dayjs(value).format('DD/MM/YYYY HH:mm') : '—';
      }
      return String(value);
    };

    autoTable(doc, {
      head: [pdfColumns.map((c) => c.title)],
      body: filteredData.map((row) => pdfColumns.map((c) => formatPdfValue(c.key, row[c.key]))),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [24, 144, 255] },
      margin: { top: 12, left: 8, right: 8, bottom: 12 },
      horizontalPageBreak: true
    });
    doc.save('EmployeeDetails.pdf');
  };

  const editEmployee = async (record) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${record.key}`, {
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch employee details');

      const employee = result.data;
      setEditingEmployee(record);
      setPreviewUrl(employee.passportPhoto || null);
      documentFieldsRef.current = {
        passportPhoto: employee.passportPhoto || null,
        employmentContract: employee.employmentContract || null,
        rightToWorkDocument: employee.rightToWorkDocument || null
      };
      setDocPreviews({
        employmentContract: employee.employmentContract || null,
        rightToWorkDocument: employee.rightToWorkDocument || null
      });
      setVisible(true);

      const initialValues = {
        userId: employee.userId,
        employeeId: employee.employeeId,
        dateOfBirth: employee.dateOfBirth ? dayjs(employee.dateOfBirth) : null,
        nationality: employee.nationality,
        emergencyContact: employee.emergencyContact,
        niNumber: employee.niNumber,
        visaType: employee.visaType,
        eVisaShareCode: employee.eVisaShareCode,
        visaStart: employee.visaStartDate ? dayjs(employee.visaStartDate) : null,
        visaEnd: employee.visaEndDate ? dayjs(employee.visaEndDate) : null,
        bankName: employee.bankName,
        accountNumber: employee.accountNumber,
        sortCode: employee.sortCode,
        accountHolder: employee.accountHolder
      };

      form.setFieldsValue(initialValues);
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  const deleteEmployee = async (key) => {
    try {
      const res = await fetch(`${API_BASE}/employees/${key}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete employee');
      
      message.success('Employee deleted successfully');
      fetchEmployees();
      fetchAvailableUsers(); // Refresh available users
    } catch (err) {
      message.error(`Error: ${err.message}`);
    }
  };

  const renderStoredDocPreview = (dataUrl, label) => {
    if (!dataUrl) return null;
    if (dataUrl.startsWith('data:image/')) {
      return (
        <img
          src={dataUrl}
          alt={label}
          style={{ marginTop: 8, maxWidth: '100%', borderRadius: 4, border: '1px solid #f0f0f0' }}
        />
      );
    }
    if (dataUrl.startsWith('data:application/pdf')) {
      return (
        <div style={{ marginTop: 8 }}>
          <iframe
            title={label}
            src={dataUrl}
            style={{ width: '100%', height: 260, border: '1px solid #f0f0f0', borderRadius: 4 }}
          />
          <div>
            <Typography.Link href={dataUrl} target="_blank" rel="noreferrer">
              Open in new tab
            </Typography.Link>
          </div>
        </div>
      );
    }
    return (
      <div style={{ marginTop: 8 }}>
        <Typography.Text type="secondary">Document attached — </Typography.Text>
        <Typography.Link href={dataUrl} target="_blank" rel="noreferrer">
          Open or download
        </Typography.Link>
      </div>
    );
  };

  const columns = [
    { title: 'Employee Email', dataIndex: 'email', key: 'email' },
    { title: 'Employee ID', dataIndex: 'employeeId', key: 'employeeId' },
    { title: 'NI Number', dataIndex: 'niNumber', key: 'niNumber' },
    { title: 'Bank Name', dataIndex: 'bankName', key: 'bankName' },
    {
      title: 'Documents',
      key: 'documents',
      width: 112,
      render: (_, r) => (
        <Space size={4}>
          <Tooltip title="Passport photo">
            <span style={{ fontWeight: 600, color: r.hasPassportPhoto ? '#52c41a' : '#d9d9d9' }}>P</span>
          </Tooltip>
          <Tooltip title="Employment contract">
            <span style={{ fontWeight: 600, color: r.hasEmploymentContract ? '#52c41a' : '#d9d9d9' }}>C</span>
          </Tooltip>
          <Tooltip title="Right to work">
            <span style={{ fontWeight: 600, color: r.hasRightToWorkDocument ? '#52c41a' : '#d9d9d9' }}>R</span>
          </Tooltip>
        </Space>
      )
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')
    },
    {
      title: 'Updated',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      render: (v) => (v ? dayjs(v).format('DD/MM/YYYY HH:mm') : '—')
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => editEmployee(record)} />
          {canManageAllEmployees && (
            <Popconfirm title="Delete this employee?" onConfirm={() => deleteEmployee(record.key)}>
              <Button danger icon={<DeleteOutlined />} />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  const filteredData = filteredEmail
    ? employeeData.filter(emp => emp.email === filteredEmail)
    : employeeData;

  return (
    <div style={{ padding: 24 }}>
      <PageBanner
        label="Workforce"
        title="Employee Management"
        subtitle="Manage employee records, documents, and export reports."
        actions={(
          <Space>
            <Button onClick={exportToExcel}>Export to Excel</Button>
            <Button onClick={exportToPDF}>Export to PDF</Button>
            {canManageAllEmployees && (
              <Button type="primary" icon={<PlusOutlined />} onClick={showDrawer}>
                Add Employee
              </Button>
            )}
          </Space>
        )}
      />

      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Select
            placeholder="Filter by Email"
            onChange={setFilteredEmail}
            allowClear
            style={{ width: 260 }}
          >
            {Array.from(new Set(employeeData.map(emp => emp.email))).map(email => (
              <Option key={email} value={email}>{email}</Option>
            ))}
          </Select>
        </Col>
      </Row>

      <Table 
        columns={columns} 
        dataSource={filteredData} 
        loading={loading}
        rowKey="key"
      />

      <Drawer
        title={editingEmployee ? 'Edit Employee Details' : 'Add Employee Details'}
        width={600}
        onClose={onClose}
        open={visible}
        footer={
          <div style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              disabled={uploadProcessingCount > 0}
              onClick={() => form.submit()}
            >
              {uploadProcessingCount > 0 ? 'Processing upload…' : editingEmployee ? 'Update' : 'Submit'}
            </Button>
          </div>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="userId"
            label="Select Employee (User)"
            rules={[{ required: true, message: 'Please select an employee' }]}
          >
            <Select placeholder="Choose user">
              {availableUsers.map(user => (
                <Option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="dateOfBirth" label="Date of Birth" rules={[{ required: true, message: 'Please select date of birth' }]}>
            <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item name="nationality" label="Nationality" rules={[{ required: true, message: 'Please select nationality' }]}>
            <Select
              showSearch
              placeholder="Select nationality"
              optionFilterProp="children"
              filterOption={(input, option) =>
                option.children.toLowerCase().includes(input.toLowerCase())
              }
            >
              {countries.map((country) => (
                <Select.Option key={country} value={country}>
                  {country}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="employeeId" label="Employee ID" rules={[{ required: true, message: 'Please enter employee ID' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="emergencyContact" label="Emergency Contact" rules={[{ required: true, message: 'Please enter emergency contact' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Passport Photo">
            <Upload beforeUpload={() => false} maxCount={1} accept="image/*" onChange={handlePhotoUpload}>
              <Button icon={<InboxOutlined />}>Upload</Button>
            </Upload>
            {previewUrl && (
              <img
                src={previewUrl}
                alt="Preview"
                style={{ marginTop: 8, width: 180, maxWidth: '100%', height: 'auto' }}
              />
            )}
          </Form.Item>

          <Form.Item label="Employment Contract">
            <Upload 
              beforeUpload={() => false} 
              maxCount={1} 
              accept=".pdf,.doc,.docx"
              onChange={(info) => handleDocumentUpload(info, 'employmentContract')}
            >
              <Button icon={<InboxOutlined />}>Upload</Button>
            </Upload>
            {renderStoredDocPreview(docPreviews.employmentContract, 'Employment contract')}
          </Form.Item>

          <Form.Item name="niNumber" label="NI Number" rules={[{ required: true, message: 'Please enter NI number' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="visaType" label="Visa Type" rules={[{ required: true, message: 'Please enter visa type' }]}>
            <Input />
          </Form.Item>

          <Form.Item name="eVisaShareCode" label="E-Visa Share Code" rules={[{ required: true, message: 'Please enter E-Visa share code' }]}>
            <Input />
          </Form.Item>

          <Form.Item label="Right to Work Document">
            <Upload 
              beforeUpload={() => false} 
              maxCount={1} 
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              onChange={(info) => handleDocumentUpload(info, 'rightToWorkDocument')}
            >
              <Button icon={<InboxOutlined />}>Upload</Button>
            </Upload>
            {renderStoredDocPreview(docPreviews.rightToWorkDocument, 'Right to work')}
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="visaStart" label="Visa Start Date" rules={[{ required: true, message: 'Please select visa start date' }]}>
                <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="visaEnd" label="Visa End Date" rules={[{ required: true, message: 'Please select visa end date' }]}>
                <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="bankName" label="Bank Name" rules={[{ required: true, message: 'Please enter bank name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="accountNumber" label="Account Number" rules={[{ required: true, message: 'Please enter account number' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sortCode" label="Sort Code" rules={[{ required: true, message: 'Please enter sort code' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="accountHolder" label="Account Holder Name" rules={[{ required: true, message: 'Please enter account holder name' }]}>
            <Input />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default EmployeeManagementPage;
