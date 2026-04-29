import React, { useEffect, useRef, useState } from 'react';
import { Button, Drawer, Form, Input, message, Popconfirm, Select, Space, Table, Typography, Upload } from 'antd';
import { DeleteOutlined, EditOutlined, InboxOutlined, PlusOutlined } from '@ant-design/icons';
import PageBanner from '../components/PageBanner';
import { getCurrentUserRole } from '../utils/auth';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import dayjs from 'dayjs';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';
const SUPPLIER_ALLOWED_ROLES = ['Super Admin', 'HR Admin', 'HR Manager', 'HR', 'System Admin', 'Company Admin'];

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const SupplierManagement = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filePreviews, setFilePreviews] = useState([]);
  const supportDocRef = useRef([]);
  const currentRole = getCurrentUserRole();
  const canAccess = SUPPLIER_ALLOWED_ROLES.includes(currentRole);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/suppliers`, { headers: { ...getAuthHeaders() } });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch suppliers');
      setSuppliers(result.data || []);
    } catch (error) {
      message.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_BASE}/departments`, { headers: { ...getAuthHeaders() } });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to fetch departments');
      const activeDepartments = (result.data || []).filter((d) => d.status !== false);
      setDepartments(activeDepartments);
    } catch (error) {
      message.error(error.message);
    }
  };

  useEffect(() => {
    if (canAccess) {
      fetchSuppliers();
      fetchDepartments();
    }
  }, [canAccess]);

  const openCreateDrawer = () => {
    setEditingSupplier(null);
    supportDocRef.current = [];
    setFilePreviews([]);
    form.resetFields();
    setVisible(true);
  };

  const readFileAsDataUrl = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => resolve(event.target.result);
    reader.onerror = () => reject(new Error('Failed to read one or more files'));
    reader.readAsDataURL(file);
  });

  const parseSupportingDocuments = (record) => {
    if (Array.isArray(record.supportingDocuments)) return record.supportingDocuments;
    if (!record.supportingDocument) return [];
    if (typeof record.supportingDocument === 'string' && record.supportingDocument.trim().startsWith('[')) {
      try {
        const parsed = JSON.parse(record.supportingDocument);
        return Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        return [];
      }
    }
    return [record.supportingDocument];
  };

  const handleDocumentUpload = async (info) => {
    if (!info.fileList?.length) {
      supportDocRef.current = [];
      setFilePreviews([]);
      return;
    }
    const files = info.fileList.map((entry) => entry.originFileObj).filter(Boolean);
    if (files.some((file) => file.size / 1024 / 1024 > 5)) {
      message.error('Each file must be smaller than 5MB');
      return;
    }
    try {
      const docs = await Promise.all(files.map(readFileAsDataUrl));
      supportDocRef.current = docs;
      setFilePreviews(docs);
    } catch (error) {
      message.error(error.message);
    }
  };

  const openEditDrawer = (record) => {
    const docs = parseSupportingDocuments(record);
    setEditingSupplier(record);
    supportDocRef.current = docs;
    setFilePreviews(docs);
    form.setFieldsValue({
      supplierName: record.supplierName,
      contactPerson: record.contactPerson,
      contactNumber: record.contactNumber,
      departmentName: record.departmentName,
      address: record.address,
      notes: record.notes,
      status: record.status
    });
    setVisible(true);
  };

  const saveSupplier = async (values) => {
    try {
      const payload = { ...values, supportingDocuments: supportDocRef.current };
      const url = editingSupplier ? `${API_BASE}/suppliers/${editingSupplier.id}` : `${API_BASE}/suppliers`;
      const method = editingSupplier ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to save supplier');

      message.success(editingSupplier ? 'Supplier updated' : 'Supplier created');
      setVisible(false);
      fetchSuppliers();
    } catch (error) {
      message.error(error.message);
    }
  };

  const deleteSupplier = async (id) => {
    try {
      const res = await fetch(`${API_BASE}/suppliers/${id}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() }
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to delete supplier');
      message.success('Supplier deleted');
      fetchSuppliers();
    } catch (error) {
      message.error(error.message);
    }
  };

  const exportCsv = () => {
    const headers = ['Supplier Name', 'Contact Person', 'Contact Number', 'Department', 'Address', 'Notes', 'Status'];
    const rows = suppliers.map((s) => [
      s.supplierName,
      s.contactPerson,
      s.contactNumber,
      s.departmentName,
      s.address || '',
      s.notes || '',
      s.status
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'SupplierDetails.csv';
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const exportPdf = () => {
    const doc = new jsPDF();
    const companyName = 'PATH TO SUCCESS CONSULTANTS LTD';
    const applicationName = 'Digital Cupboard';
    const reportName = 'Supplier Details Report';
    const generatedOn = dayjs().format('DD/MM/YYYY HH:mm');

    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text(companyName, 14, 14);
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    doc.text(`Application: ${applicationName}`, 14, 21);
    doc.text(`Report Name: ${reportName}`, 14, 27);
    doc.text(`Generated On: ${generatedOn}`, 14, 33);

    autoTable(doc, {
      head: [['Supplier Name', 'Contact Person', 'Contact Number', 'Department', 'Status']],
      body: suppliers.map((s) => [s.supplierName, s.contactPerson, s.contactNumber, s.departmentName, s.status]),
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [24, 144, 255] },
      margin: { top: 40, left: 10, right: 10, bottom: 12 },
      horizontalPageBreak: true
    });
    doc.save('SupplierDetails.pdf');
  };

  if (!canAccess) {
    return (
      <div style={{ padding: 24 }}>
        <Typography.Title level={4}>Access denied</Typography.Title>
        <Typography.Text>You do not have permission to access Supplier Management.</Typography.Text>
      </div>
    );
  }

  const columns = [
    {
      title: 'Supplier Name',
      dataIndex: 'supplierName',
      sorter: (a, b) => (a.supplierName || '').localeCompare(b.supplierName || ''),
      defaultSortOrder: 'ascend'
    },
    {
      title: 'Contact Person',
      dataIndex: 'contactPerson',
      sorter: (a, b) => (a.contactPerson || '').localeCompare(b.contactPerson || '')
    },
    {
      title: 'Contact Number',
      dataIndex: 'contactNumber',
      sorter: (a, b) => (a.contactNumber || '').localeCompare(b.contactNumber || '')
    },
    {
      title: 'Department',
      dataIndex: 'departmentName',
      sorter: (a, b) => (a.departmentName || '').localeCompare(b.departmentName || '')
    },
    {
      title: 'Status',
      dataIndex: 'status',
      sorter: (a, b) => (a.status || '').localeCompare(b.status || '')
    },
    {
      title: 'Supporting Documents',
      render: (_, record) => {
        const docs = parseSupportingDocuments(record);
        if (!docs.length) return 'None';
        return (
          <Space direction="vertical" size={2}>
            <Typography.Text>{docs.length} document(s)</Typography.Text>
            {docs.slice(0, 2).map((doc, idx) => (
              <Typography.Link key={`${record.id}-doc-${idx}`} href={doc} target="_blank" rel="noreferrer">
                Open document {idx + 1}
              </Typography.Link>
            ))}
          </Space>
        );
      }
    },
    {
      title: 'Actions',
      render: (_, record) => (
        <Space>
          <Button icon={<EditOutlined />} onClick={() => openEditDrawer(record)} />
          <Popconfirm title="Delete this supplier?" onConfirm={() => deleteSupplier(record.id)}>
            <Button danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: 24 }}>
      <PageBanner
        label="Partners"
        title="Supplier Management"
        subtitle="Manage suppliers and supporting documents."
        actions={(
          <Space>
            <Button onClick={exportCsv}>Export CSV</Button>
            <Button onClick={exportPdf}>Export PDF</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateDrawer}>
              Add Supplier
            </Button>
          </Space>
        )}
      />

      <Table rowKey="id" loading={loading} columns={columns} dataSource={suppliers} />

      <Drawer
        title={editingSupplier ? 'Edit Supplier' : 'Add Supplier'}
        open={visible}
        onClose={() => setVisible(false)}
        width={520}
        footer={(
          <div style={{ textAlign: 'right' }}>
            <Button type="primary" onClick={() => form.submit()}>
              {editingSupplier ? 'Update' : 'Create'}
            </Button>
          </div>
        )}
      >
        <Form form={form} layout="vertical" onFinish={saveSupplier}>
          <Form.Item name="supplierName" label="Supplier Name" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="contactPerson" label="Contact Person">
            <Input />
          </Form.Item>
          <Form.Item name="contactNumber" label="Contact Number">
            <Input />
          </Form.Item>
          <Form.Item name="departmentName" label="Department">
            <Select
              showSearch
              placeholder="Select department"
              optionFilterProp="label"
              options={departments.map((department) => ({
                label: department.name,
                value: department.name
              }))}
            />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="status" label="Status" initialValue="Active">
            <Select options={[{ label: 'Active', value: 'Active' }, { label: 'Inactive', value: 'Inactive' }]} />
          </Form.Item>
          <Form.Item label="Supporting Documents">
            <Upload beforeUpload={() => false} multiple onChange={handleDocumentUpload}>
              <Button icon={<InboxOutlined />}>Upload</Button>
            </Upload>
            {filePreviews.length > 0 && (
              <Space direction="vertical" style={{ marginTop: 8 }}>
                {filePreviews.map((doc, idx) => (
                  <Typography.Link key={`preview-${idx}`} href={doc} target="_blank" rel="noreferrer">
                    View uploaded document {idx + 1}
                  </Typography.Link>
                ))}
              </Space>
            )}
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default SupplierManagement;
