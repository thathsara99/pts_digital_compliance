import React from 'react';
import { Layout, Typography, Space } from 'antd';
import {
  ClockCircleOutlined
} from '@ant-design/icons';
import AttendanceHistory from '../components/AttendanceHistory';
import PageBanner from '../components/PageBanner';

const { Content } = Layout;
const { Title } = Typography;

const Attendance = () => {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ margin: '24px', padding: '24px', borderRadius: '8px' }}>
        <PageBanner
          label="Attendance"
          title="Attendance Management"
          subtitle="Track employee attendance logs and working patterns."
          actions={(
            <Space>
              <ClockCircleOutlined style={{ color: '#fff' }} />
            </Space>
          )}
        />

        {/* Attendance History */}
        <AttendanceHistory />
      </Content>
    </Layout>
  );
};

export default Attendance;

