import React, { useState, useEffect } from 'react';
import {
  Layout,
  Typography,
  Row,
  Col,
  Card,
  Button,
  Table,
  Badge,
  Tag,
  Space,
  Divider,
  Spin,
  message
} from 'antd';
import { Pie, Bar } from '@ant-design/plots';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TeamOutlined,
  ExclamationCircleOutlined,
  FieldTimeOutlined,
  UserOutlined,
  ScheduleOutlined,
  CheckCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ClockInWrapper from '../components/ClockInWrapper';
import { apiClient } from '../config/api';
import './Home.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

const App = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    totalEmployees: 0,
    departmentData: [],
    visaStatus: { expired: 0, expiringSoon: 0, valid: 0 },
    expiryNotifications: [],
    recentEmployees: []
  });

  // Employee Table Data
  const employeeColumns = [
    { 
      title: 'Name', 
      dataIndex: 'name',
      render: (text) => <Text strong>{text}</Text>
    },
    { 
      title: 'Department', 
      dataIndex: 'department',
      render: (text) => <Text type="secondary">{text || 'Unassigned'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => {
        const colorMap = {
          Active: 'green',
          Inactive: 'orange',
          Terminated: 'red',
        };
        const iconMap = {
          Active: <CheckCircleOutlined />,
          Inactive: <FieldTimeOutlined />,
          Terminated: <ExclamationCircleOutlined />
        };
        return (
          <Tag 
            color={colorMap[status] || 'default'}
            icon={iconMap[status]}
          >
            {status || 'Active'}
          </Tag>
        );
      },
    },
  ];

  // Notification Table Data
  const notificationColumns = [
    { 
      title: 'Employee', 
      dataIndex: 'employee',
      render: (text) => <Text strong>{text}</Text>
    },
    { 
      title: 'Visa Type', 
      dataIndex: 'visaType',
      render: (text) => <Text type="secondary">{text}</Text>
    },
    { 
      title: 'Expires In', 
      dataIndex: 'expiresIn',
      render: (text) => <Text type="warning">{text}</Text>
    },
    {
      title: 'Expiry Date',
      dataIndex: 'expiryDate',
      render: (text) => <Text>{text || 'N/A'}</Text>
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status) => (
        <Badge 
          status={
            status === 'Expiring Soon'
              ? 'warning'
              : status === 'Valid'
                ? 'success'
                : 'error'
          }
          text={status} 
        />
      ),
    },
  ];

  // Fetch dashboard data
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/employees/dashboard-stats');
      if (response.data.success) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      // Retry once for transient network/timeouts on hard refresh.
      try {
        const retryResponse = await apiClient.get('/employees/dashboard-stats');
        if (retryResponse.data.success) {
          setDashboardData(retryResponse.data.data);
          return;
        }
      } catch (retryError) {
        console.error('Error fetching dashboard data:', retryError);
        const errorMessage = retryError.response?.data?.message || 'Failed to load dashboard data';
        message.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // Prepare chart data
  const visaStatusData = [
    { type: 'Expired', value: dashboardData.visaStatus.expired },
    { type: 'Expiring Soon', value: dashboardData.visaStatus.expiringSoon },
    { type: 'Valid', value: dashboardData.visaStatus.valid },
  ];

  const departmentData = dashboardData.departmentData || [];

  const barConfig = {
    data: departmentData,
    xField: 'employees',
    yField: 'department',
    seriesField: 'department',
    legend: false,
    color: ({ department }) => {
      const colors = {
        'HR': '#1890ff',
        'IT': '#13c2c2',
        'Finance': '#722ed1',
        'Operations': '#eb2f96',
        'Marketing': '#fa8c16'
      };
      return colors[department] || '#1890ff';
    },
    height: 180,
    meta: {
      employees: {
        alias: 'Employees',
      },
    },
    xAxis: {
      label: {
        formatter: (val) => `${val}`,
      },
    },
  };

  const exportExpiryNotificationsPdf = () => {
    const allNotifications = dashboardData.expiryNotifications || [];
    const expiredCount = allNotifications.filter((item) => item.status === 'Expired').length;
    const expiringSoonCount = allNotifications.filter((item) => item.status === 'Expiring Soon').length;
    const validCount = allNotifications.filter((item) => item.status === 'Valid').length;
    const noVisaDataCount = allNotifications.filter((item) => item.status === 'No Visa Data').length;

    if (allNotifications.length === 0) {
      message.info('No visa records available to export');
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    doc.setFontSize(16);
    doc.text('PATH TO SUCCESS CONSULTANTS', 14, 16);
    doc.setFontSize(11);
    doc.text('Digital Cupboard', 14, 23);
    doc.setFontSize(12);
    doc.text('Visa Expiry Notification Report', 14, 31);
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString('en-GB')}`, 14, 37);
    doc.setFontSize(11);
    doc.text('Summary', 14, 45);
    doc.setFontSize(10);
    doc.text(`Expired: ${expiredCount}`, 14, 51);
    doc.text(`Expiring Soon (<=30 days): ${expiringSoonCount}`, 70, 51);
    doc.text(`Valid: ${validCount}`, 132, 51);
    doc.text(`No Visa Data: ${noVisaDataCount}`, 168, 51);

    autoTable(doc, {
      startY: 57,
      head: [['Employee', 'Visa Type', 'Visa Period', 'Expires In', 'Status']],
      body: allNotifications.map((item) => ([
        item.employee || 'N/A',
        item.visaType || 'N/A',
        `${item.visaStartDate || 'N/A'} - ${item.expiryDate || 'N/A'}`,
        item.expiresIn || 'N/A',
        item.status || 'N/A',
      ])),
      styles: {
        fontSize: 9,
        cellPadding: 2.5,
      },
      headStyles: {
        fillColor: [30, 64, 175],
      },
    });

    doc.save(`visa-expiry-report-${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  if (loading) {
    return (
      <Layout style={{ minHeight: '100vh' }}>
        <Content style={{ margin: '24px', padding: '24px', borderRadius: '8px' }}>
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        </Content>
      </Layout>
    );
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <Layout className="dashboard-layout">
      <Content className="dashboard-content">
        <div className="dashboard-hero">
          <div>
            <Text className="dashboard-hero-label">Operations Overview</Text>
            <Title level={2} className="dashboard-hero-title">Employee Dashboard</Title>
            <Text className="dashboard-hero-subtitle">
              Keep track of workforce status, visa compliance, and daily attendance in one place.
            </Text>
          </div>
          <div className="dashboard-date-pill">{today}</div>
        </div>

        <Row gutter={[24, 24]} style={{ marginBottom: 24 }} className="dashboard-top-row">
          <Col xs={24} sm={12} lg={8} className="dashboard-top-col">
            <Card 
              className="dashboard-card"
              title={
                <Space>
                  <TeamOutlined />
                  <span>Employees</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #eef2f7', padding: '0 16px' }}
              bodyStyle={{ padding: '16px' }}
            >
              <Title level={2} className="dashboard-kpi-value">
                {dashboardData.totalEmployees}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
                Total employees in the organization
              </Text>
              {departmentData.length > 0 && <Bar {...barConfig} />}
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={8} className="dashboard-top-col">
            <ClockInWrapper />
          </Col>

          <Col xs={24} sm={24} lg={8} className="dashboard-top-col">
            <Card 
              className="dashboard-card"
              title={
                <Space>
                  <ExclamationCircleOutlined />
                  <span>Right Work Status</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #eef2f7', padding: '0 16px' }}
              bodyStyle={{ padding: '16px' }}
            >
              <div className="status-summary">
                <div className="status-chip warning">
                  <Text type="secondary">Expiring Soon</Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#faad14' }}>
                    {dashboardData.visaStatus.expiringSoon}
                  </Title>
                </div>
                <div className="status-chip danger">
                  <Text type="secondary">Expired</Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#ff4d4f' }}>
                    {dashboardData.visaStatus.expired}
                  </Title>
                </div>
                <div className="status-chip success">
                  <Text type="secondary">Valid</Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#52c41a' }}>
                    {dashboardData.visaStatus.valid}
                  </Title>
                </div>
              </div>
              {visaStatusData.some(item => item.value > 0) && (
                <Pie
                  data={visaStatusData}
                  angleField="value"
                  colorField="type"
                  innerRadius={0.6}
                  radius={0.8}
                  label={{
                    text: "value",
                    offset: "-30%",
                    style: {
                      fontSize: 12,
                      textAlign: "center"
                    }
                  }}
                  legend={{ position: "bottom" }}
                  tooltip={{ showMarkers: true }}
                  interactions={[{ type: "element-active" }]}
                  color={['#ff4d4f', '#faad14', '#52c41a']}
                  height={180}
                  statistic={{
                    content: {
                      style: {
                        fontSize: "14px",
                        color: "#595959"
                      },
                      content: "Visa Status"
                    }
                  }}
                />
              )}
            </Card>
          </Col>
        </Row>

        <Divider style={{ margin: '8px 0 20px' }} />

        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card 
              className="dashboard-card dashboard-table-card"
              title={
                <Space>
                  <UserOutlined />
                  <span>Employee List</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #eef2f7' }}
              extra={<Button type="link" onClick={() => navigate('/employee-management')}>View All</Button>}
            >
              <Table 
                dataSource={dashboardData.recentEmployees || []} 
                columns={employeeColumns} 
                pagination={{ pageSize: 5, showSizeChanger: false }} 
                size="middle"
                className="dashboard-table"
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              className="dashboard-card dashboard-table-card"
              title={
                <Space>
                  <ScheduleOutlined />
                  <span>Expiry Notifications</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #eef2f7' }}
              extra={(
                <Space>
                  <Button onClick={exportExpiryNotificationsPdf}>Export PDF</Button>
                  <Button type="link" onClick={() => navigate('/employee-management')}>View All</Button>
                </Space>
              )}
            >
              <Table 
                dataSource={dashboardData.expiryNotifications || []} 
                columns={notificationColumns} 
                pagination={{ pageSize: 5, showSizeChanger: false }} 
                size="middle"
                className="dashboard-table"
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App;