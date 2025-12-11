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
      title: 'Status',
      dataIndex: 'status',
      render: (status) => (
        <Badge 
          status={status === 'Expiring Soon' ? 'warning' : 'error'} 
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
      console.error('Error fetching dashboard data:', error);
      message.error('Failed to load dashboard data');
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

  const pieConfig = {
    data: visaStatusData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    label: {
      position: 'inner',
      content: ({ percent }) => `${(percent * 100).toFixed(0)}%`,
      style: {
        fontSize: 12,
        textAlign: 'center',
      },
    },
    interactions: [{ type: 'element-active' }],
    color: ['#ff4d4f', '#faad14', '#52c41a'],
    height: 180,
    statistic: {
      title: false,
      content: {
        style: {
          fontSize: '14px',
          color: '#595959',
        },
        content: 'Visa Status',
      },
    },
  };

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

  return (
    <Layout style={{ minHeight: '100vh'}}>
      
      <Content style={{ margin: '24px', padding: '24px',  borderRadius: '8px',  }}>
      <Title level={3} >Employee Dashboard</Title>
        {/* Top Cards - Now Balanced */}
        <Row gutter={[24, 24]} style={{ marginBottom: 24 }}>
          {/* Employees Card */}
          <Col xs={24} sm={12} lg={8}>
            <Card 
              title={
                <Space>
                  <TeamOutlined />
                  <span>Employees</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '0 16px' }}
              bodyStyle={{ padding: '16px' }}
            >
              <Title level={2} style={{ fontSize: '36px', margin: '8px 0', color: '#1890ff' }}>
                {dashboardData.totalEmployees}
              </Title>
              <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>Total employees</Text>
              {departmentData.length > 0 && <Bar {...barConfig} />}
            </Card>
          </Col>

          {/* Time Tracking Card */}
          <Col xs={24} sm={12} lg={8}>
            <ClockInWrapper />
          </Col>

          {/* Visa Status Card */}
          <Col xs={24} sm={24} lg={8}>
            <Card 
              title={
                <Space>
                  <ExclamationCircleOutlined />
                  <span>Right Work Status</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #f0f0f0', padding: '0 16px' }}
              bodyStyle={{ padding: '16px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <Text type="secondary">Expiring Soon</Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#faad14' }}>
                    {dashboardData.visaStatus.expiringSoon}
                  </Title>
                </div>
                <div>
                  <Text type="secondary">Expired</Text>
                  <Title level={4} style={{ margin: '4px 0', color: '#ff4d4f' }}>
                    {dashboardData.visaStatus.expired}
                  </Title>
                </div>
                <div>
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

        <Divider />

        {/* Tables Section */}
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <UserOutlined />
                  <span>Employee List</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
              extra={<Button type="link" onClick={() => navigate('/employee-management')}>View All</Button>}
            >
              <Table 
                dataSource={dashboardData.recentEmployees || []} 
                columns={employeeColumns} 
                pagination={false} 
                size="middle"
                style={{ borderRadius: '8px' }}
              />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            <Card 
              title={
                <Space>
                  <ScheduleOutlined />
                  <span>Expiry Notifications</span>
                </Space>
              } 
              bordered={false}
              headStyle={{ borderBottom: '1px solid #f0f0f0' }}
              extra={<Button type="link" onClick={() => navigate('/employee-management')}>View All</Button>}
            >
              <Table 
                dataSource={dashboardData.expiryNotifications || []} 
                columns={notificationColumns} 
                pagination={false} 
                size="middle"
                style={{ borderRadius: '8px' }}
              />
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
};

export default App;