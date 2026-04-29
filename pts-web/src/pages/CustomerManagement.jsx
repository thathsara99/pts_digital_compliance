import React, { useEffect, useMemo, useState } from 'react';
import { Button, Drawer, Form, Input, message, Popconfirm, Select, Space, Table, Typography, Upload } from 'antd';
import { EditOutlined, PlusOutlined, FileAddOutlined, InboxOutlined } from '@ant-design/icons';
import PageBanner from '../components/PageBanner';
import { getCurrentUserRole } from '../utils/auth';
import mammoth from 'mammoth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const CustomerManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [visible, setVisible] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [existingContractDrawerVisible, setExistingContractDrawerVisible] = useState(false);
  const [upcomingContractDrawerVisible, setUpcomingContractDrawerVisible] = useState(false);
  const [existingContractCustomerId, setExistingContractCustomerId] = useState(null);
  const [existingContractDocuments, setExistingContractDocuments] = useState([]);
  const [existingContractUploads, setExistingContractUploads] = useState([]);
  const [existingContractLoading, setExistingContractLoading] = useState(false);
  const [upcomingContractDocuments, setUpcomingContractDocuments] = useState([]);
  const [upcomingContractUploads, setUpcomingContractUploads] = useState([]);
  const [upcomingCustomFileName, setUpcomingCustomFileName] = useState('');
  const [upcomingContractLoading, setUpcomingContractLoading] = useState(false);
  const [previewDrawerVisible, setPreviewDrawerVisible] = useState(false);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewType, setPreviewType] = useState('none');
  const [previewSrc, setPreviewSrc] = useState('');
  const [previewHtml, setPreviewHtml] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const role = getCurrentUserRole();
  const isEmployee = role === 'Employee';

  const pageTitle = useMemo(() => (isEmployee ? 'My Customers' : 'Customer Management'), [isEmployee]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers`, { headers: { ...getAuthHeaders() } });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch customers');
      setCustomers(result.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignableEmployees = async () => {
    try {
      const res = await fetch(`${API_BASE}/customers/assignable-employees`, { headers: { ...getAuthHeaders() } });
      const result = await res.json();
      if (res.ok) {
        setEmployees(result.data || []);
      }
    } catch (error) {
      // silent fallback for page usability
    }
  };

  useEffect(() => {
    fetchCustomers();
    if (!isEmployee) {
      fetchAssignableEmployees();
    }
  }, [isEmployee]);

  const openCreateDrawer = () => {
    setEditingCustomer(null);
    form.resetFields();
    setVisible(true);
  };

  const openEditDrawer = (record) => {
    setEditingCustomer(record);
    form.setFieldsValue({
      customerName: record.customerName,
      contactNumber: record.contactNumber,
      address: record.address,
      industry: record.industry,
      assignedEmployeeId: record.assignedEmployeeId,
      status: record.status
    });
    setVisible(true);
  };

  const saveCustomer = async (values) => {
    try {
      const url = editingCustomer ? `${API_BASE}/customers/${editingCustomer.id}` : `${API_BASE}/customers`;
      const method = editingCustomer ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(values)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save customer');
      message.success(editingCustomer ? 'Customer updated' : 'Customer created');
      setVisible(false);
      fetchCustomers();
    } catch (error) {
      message.error(error.message);
    }
  };

  const fetchExistingContracts = async (customerId) => {
    if (!customerId) {
      setExistingContractDocuments([]);
      return;
    }
    setExistingContractLoading(true);
    try {
      const res = await fetch(`${API_BASE}/customers/${customerId}/contracts`, {
        headers: { ...getAuthHeaders() }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch contracts');
      setExistingContractDocuments(result.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setExistingContractLoading(false);
    }
  };

  const fetchUpcomingContracts = async () => {
    setUpcomingContractLoading(true);
    try {
      const res = await fetch(`${API_BASE}/upcoming-contracts`, {
        headers: { ...getAuthHeaders() }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch upcoming contracts');
      setUpcomingContractDocuments(result.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setUpcomingContractLoading(false);
    }
  };

  const openExistingContractDrawer = () => {
    setExistingContractDrawerVisible(true);
    setExistingContractUploads([]);
    setExistingContractDocuments([]);
  };

  const closeExistingContractDrawer = () => {
    setExistingContractDrawerVisible(false);
    setExistingContractUploads([]);
    setExistingContractDocuments([]);
    setExistingContractCustomerId(null);
  };

  const openUpcomingContractDrawer = () => {
    setUpcomingContractDrawerVisible(true);
    setUpcomingContractUploads([]);
    setUpcomingCustomFileName('');
    fetchUpcomingContracts();
  };

  const closeUpcomingContractDrawer = () => {
    setUpcomingContractDrawerVisible(false);
    setUpcomingContractUploads([]);
    setUpcomingContractDocuments([]);
    setUpcomingCustomFileName('');
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
    reader.readAsDataURL(file);
  });

  const handleExistingContractUploadListChange = ({ fileList }) => {
    setExistingContractUploads(fileList);
  };

  const handleUpcomingContractUploadListChange = ({ fileList }) => {
    setUpcomingContractUploads(fileList);
  };

  const dataUrlToArrayBuffer = (dataUrl) => {
    const base64 = dataUrl.split(',')[1] || '';
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i += 1) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  const openContractPreview = async (record) => {
    const mimeType = record.mimeType || '';
    const fileName = record.fileName || 'Document';
    setPreviewTitle(fileName);
    setPreviewDrawerVisible(true);
    setPreviewLoading(true);
    setPreviewHtml('');
    setPreviewSrc('');
    setPreviewType('none');

    try {
      setPreviewSrc(record.documentData || '');
      if (mimeType === 'application/pdf') {
        setPreviewType('pdf');
        return;
      }

      if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
        const arrayBuffer = dataUrlToArrayBuffer(record.documentData);
        const result = await mammoth.convertToHtml({ arrayBuffer });
        setPreviewType('html');
        setPreviewHtml(result.value || '<p>No preview content available.</p>');
        return;
      }

      setPreviewType('unsupported');
    } catch (error) {
      setPreviewType('unsupported');
    } finally {
      setPreviewLoading(false);
    }
  };

  const closePreviewDrawer = () => {
    setPreviewDrawerVisible(false);
    setPreviewTitle('');
    setPreviewType('none');
    setPreviewSrc('');
    setPreviewHtml('');
    setPreviewLoading(false);
  };

  const uploadExistingContracts = async () => {
    if (!existingContractCustomerId) {
      message.warning('Please select a customer');
      return;
    }
    const files = existingContractUploads.map((entry) => entry.originFileObj).filter(Boolean);
    if (!files.length) {
      message.warning('Please select at least one contract document');
      return;
    }
    if (files.some((file) => file.size / 1024 / 1024 > 10)) {
      message.error('Each document must be smaller than 10MB');
      return;
    }

    try {
      const documents = await Promise.all(
        files.map(async (file) => {
          const fileData = await readFileAsDataUrl(file);
          return { fileName: file.name, fileData };
        })
      );

      const res = await fetch(`${API_BASE}/customers/${existingContractCustomerId}/contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ documents })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to upload contracts');

      message.success('Contract documents uploaded');
      setExistingContractUploads([]);
      fetchExistingContracts(existingContractCustomerId);
    } catch (error) {
      message.error(error.message);
    }
  };

  const uploadUpcomingContracts = async () => {
    const files = upcomingContractUploads.map((entry) => entry.originFileObj).filter(Boolean);
    if (!files.length) {
      message.warning('Please select one upcoming contract document');
      return;
    }
    if (files.length > 1 && upcomingCustomFileName.trim()) {
      message.warning('Custom file name can be used only when uploading one file');
      return;
    }

    try {
      const documents = await Promise.all(
        files.map(async (file) => {
          const fileData = await readFileAsDataUrl(file);
          return {
            fileName: file.name,
            customFileName: files.length === 1 ? upcomingCustomFileName.trim() : '',
            fileData
          };
        })
      );

      const res = await fetch(`${API_BASE}/upcoming-contracts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ documents })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to upload upcoming contracts');

      message.success('Upcoming contract uploaded');
      setUpcomingContractUploads([]);
      setUpcomingCustomFileName('');
      fetchUpcomingContracts();
    } catch (error) {
      message.error(error.message);
    }
  };

  const deleteExistingContract = async (record) => {
    if (!existingContractCustomerId) {
      message.warning('Please select a customer');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/customers/${existingContractCustomerId}/contracts/${record.id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete contract');
      message.success('Contract deleted');
      fetchExistingContracts(existingContractCustomerId);
    } catch (error) {
      message.error(error.message);
    }
  };

  const deleteUpcomingContract = async (record) => {
    try {
      const res = await fetch(`${API_BASE}/upcoming-contracts/${record.id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete upcoming contract');
      message.success('Upcoming contract deleted');
      fetchUpcomingContracts();
    } catch (error) {
      message.error(error.message);
    }
  };

  const exportCustomersToPdf = () => {
    const doc = new jsPDF();
    const companyName = 'PATH TO SUCCESS CONSULTANTS LTD';
    const applicationName = 'Digital Cupboard';
    const reportName = isEmployee ? 'My Customers Report' : 'Customer Details Report';
    const generatedOn = new Date().toLocaleString();

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, 14, 14);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Application: ${applicationName}`, 14, 21);
    doc.text(`Report Name: ${reportName}`, 14, 27);
    doc.text(`Generated On: ${generatedOn}`, 14, 33);

    autoTable(doc, {
      head: [['Customer Name', 'Contact Number', 'Industry', 'Status', 'Assigned Employee']],
      body: customers.map((customer) => [
        customer.customerName || '—',
        customer.contactNumber || '—',
        customer.industry || '—',
        customer.status || '—',
        customer.assignedEmployee ? `${customer.assignedEmployee.firstName} ${customer.assignedEmployee.lastName}` : 'Unassigned'
      ]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [24, 144, 255] },
      margin: { top: 40, left: 10, right: 10, bottom: 12 },
      horizontalPageBreak: true
    });

    doc.save(isEmployee ? 'MyCustomers.pdf' : 'CustomerDetails.pdf');
  };

  const columns = [
    { title: 'Customer Name', dataIndex: 'customerName' },
    { title: 'Contact Number', dataIndex: 'contactNumber' },
    { title: 'Industry', dataIndex: 'industry' },
    { title: 'Status', dataIndex: 'status' },
    {
      title: 'Assigned Employee',
      render: (_, record) => {
        const employee = record.assignedEmployee;
        return employee ? `${employee.firstName} ${employee.lastName}` : 'Unassigned';
      }
    },
    ...(!isEmployee ? [{
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditDrawer(record)}>
            Edit
          </Button>
        </Space>
      )
    }] : [])
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageBanner
        label="Clients"
        title={pageTitle}
        subtitle={isEmployee ? 'View customers assigned to you.' : 'Onboard customers and assign to employees.'}
        actions={!isEmployee ? (
          <Space>
            <Button onClick={exportCustomersToPdf}>Export to PDF</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
              Add Customer
            </Button>
          </Space>
        ) : (
          <Space>
            <Button onClick={exportCustomersToPdf}>Export to PDF</Button>
          </Space>
        )}
      />

      {!isEmployee && (
        <Space style={{ marginBottom: 16 }}>
          <Button icon={<FileAddOutlined />} onClick={openExistingContractDrawer}>
            Existing Customer Contracts
          </Button>
          <Button icon={<FileAddOutlined />} onClick={openUpcomingContractDrawer}>
            Upcoming Contracts
          </Button>
        </Space>
      )}

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={customers}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
        }}
      />

      {!isEmployee && (
        <>
          <Drawer
            title={editingCustomer ? 'Edit Customer' : 'Add Customer'}
            open={visible}
            onClose={() => setVisible(false)}
            width={520}
            footer={(
              <div style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={() => form.submit()}>
                  {editingCustomer ? 'Update' : 'Create'}
                </Button>
              </div>
            )}
          >
            <Form form={form} layout="vertical" onFinish={saveCustomer}>
              <Form.Item name="customerName" label="Customer Name" rules={[{ required: true }]}>
                <Input />
              </Form.Item>
              <Form.Item name="contactNumber" label="Contact Number">
                <Input />
              </Form.Item>
              <Form.Item name="address" label="Address">
                <Input.TextArea rows={2} />
              </Form.Item>
              <Form.Item name="industry" label="Industry">
                <Input />
              </Form.Item>
              <Form.Item name="assignedEmployeeId" label="Assign Employee">
                <Select
                  allowClear
                  options={employees.map((emp) => ({
                    label: `${emp.firstName} ${emp.lastName} (${emp.email})`,
                    value: emp.id
                  }))}
                />
              </Form.Item>
              <Form.Item name="status" label="Status" initialValue="Active">
                <Select options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
              </Form.Item>
            </Form>
          </Drawer>

          <Drawer
            title="Manage Existing Customer Contracts"
            open={existingContractDrawerVisible}
            onClose={closeExistingContractDrawer}
            width={620}
            footer={(
              <div style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={uploadExistingContracts}>
                  Upload Selected Documents
                </Button>
              </div>
            )}
          >
            <Typography.Title level={5}>Select Customer</Typography.Title>
            <Select
              placeholder="Select customer"
              style={{ width: '100%', marginBottom: 16 }}
              value={existingContractCustomerId}
              onChange={(value) => {
                setExistingContractCustomerId(value);
                fetchExistingContracts(value);
              }}
              options={customers.map((customer) => ({
                label: customer.customerName,
                value: customer.id
              }))}
            />
            <Typography.Title level={5}>Upload Customer Contract Documents</Typography.Title>
            <Upload
              beforeUpload={() => false}
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              fileList={existingContractUploads}
              onChange={handleExistingContractUploadListChange}
            >
              <Button icon={<InboxOutlined />}>Select PDF/Word files</Button>
            </Upload>

            <Typography.Title level={5} style={{ marginTop: 24 }}>Uploaded Customer Contracts</Typography.Title>
            <Table
              rowKey="id"
              loading={existingContractLoading}
              dataSource={existingContractDocuments}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
              }}
              columns={[
                { title: 'File Name', dataIndex: 'fileName' },
                {
                  title: 'Uploaded On',
                  dataIndex: 'createdAt',
                  render: (value) => (value ? new Date(value).toLocaleString() : '—')
                },
                {
                  title: 'View',
                  render: (_, record) => (
                    <Button type="link" onClick={() => openContractPreview(record)}>Open</Button>
                  )
                },
                {
                  title: 'Delete',
                  render: (_, record) => (
                    <Popconfirm
                      title="Delete this contract document?"
                      onConfirm={() => deleteExistingContract(record)}
                    >
                      <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                  )
                }
              ]}
            />
          </Drawer>

          <Drawer
            title="Manage Upcoming Contracts"
            open={upcomingContractDrawerVisible}
            onClose={closeUpcomingContractDrawer}
            width={620}
            footer={(
              <div style={{ textAlign: 'right' }}>
                <Button type="primary" onClick={uploadUpcomingContracts}>
                  Upload Upcoming Contract
                </Button>
              </div>
            )}
          >
            <Typography.Title level={5}>Upload Upcoming Contract (No customer required)</Typography.Title>
            <Form layout="vertical">
              <Form.Item label="Custom File Name (optional)">
                <Input
                  placeholder="Enter custom file name"
                  value={upcomingCustomFileName}
                  onChange={(e) => setUpcomingCustomFileName(e.target.value)}
                />
              </Form.Item>
            </Form>
            <Upload
              beforeUpload={() => false}
              multiple
              accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              fileList={upcomingContractUploads}
              onChange={handleUpcomingContractUploadListChange}
            >
              <Button icon={<InboxOutlined />}>Select PDF/Word files</Button>
            </Upload>

            <Typography.Title level={5} style={{ marginTop: 24 }}>Uploaded Upcoming Contracts</Typography.Title>
            <Table
              rowKey="id"
              loading={upcomingContractLoading}
              dataSource={upcomingContractDocuments}
              pagination={{
                pageSize: 5,
                showSizeChanger: true,
                pageSizeOptions: ['5', '10', '20'],
                showTotal: (total, range) => `${range[0]}-${range[1]} of ${total}`
              }}
              columns={[
                { title: 'File Name', dataIndex: 'fileName' },
                {
                  title: 'Uploaded On',
                  dataIndex: 'createdAt',
                  render: (value) => (value ? new Date(value).toLocaleString() : '—')
                },
                {
                  title: 'View',
                  render: (_, record) => (
                    <Button type="link" onClick={() => openContractPreview(record)}>Open</Button>
                  )
                },
                {
                  title: 'Delete',
                  render: (_, record) => (
                    <Popconfirm
                      title="Delete this upcoming contract?"
                      onConfirm={() => deleteUpcomingContract(record)}
                    >
                      <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                  )
                }
              ]}
            />
          </Drawer>

          <Drawer
            title={`Document Preview${previewTitle ? ` - ${previewTitle}` : ''}`}
            open={previewDrawerVisible}
            onClose={closePreviewDrawer}
            width={860}
          >
            {previewLoading && <Typography.Text>Loading preview...</Typography.Text>}
            {!previewLoading && previewType === 'pdf' && (
              <iframe
                title={previewTitle || 'Document Preview'}
                src={previewSrc}
                style={{ width: '100%', height: '75vh', border: '1px solid #f0f0f0', borderRadius: 6 }}
              />
            )}
            {!previewLoading && previewType === 'html' && (
              <div
                style={{ maxHeight: '75vh', overflow: 'auto', padding: 12, border: '1px solid #f0f0f0', borderRadius: 6 }}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
              />
            )}
            {!previewLoading && previewType === 'unsupported' && (
              <Space direction="vertical">
                <Typography.Text>
                  This file type cannot be rendered inline. You can still open it in a new tab.
                </Typography.Text>
                <Typography.Link href={previewSrc || '#'} onClick={(e) => {
                  if (!previewSrc) e.preventDefault();
                }} target="_blank" rel="noreferrer">
                  Open in new tab
                </Typography.Link>
              </Space>
            )}
          </Drawer>
        </>
      )}
    </div>
  );
};

export default CustomerManagement;
