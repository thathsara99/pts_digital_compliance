import React from 'react';
import { Layout, Typography, Space } from 'antd';
import {
  ClockCircleOutlined
} from '@ant-design/icons';
import AttendanceHistory from '../components/AttendanceHistory';

const { Content } = Layout;
const { Title } = Typography;

const Attendance = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '24px', padding: '24px', borderRadius: '8px' }}>
        <Title level={2} style={{ marginBottom: '24px' }}>
          <Space>
            <ClockCircleOutlined />
            Attendance Management
          </Space>
        </Title>

        {/* Attendance History */}
        <AttendanceHistory />
      </Content>
    </Layout>
  );
};

export default Attendance;

