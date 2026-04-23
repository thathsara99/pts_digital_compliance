import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  message,
  Spin
} from 'antd';
import { CheckCircleOutlined, ClockCircleOutlined, LogoutOutlined } from '@ant-design/icons';
import { apiClient } from '../config/api';

const { Title, Text } = Typography;

const MinimalClockInCard = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [hasClockedOut, setHasClockedOut] = useState(false);
  const [timeWorked, setTimeWorked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);

  // Fetch current status on component mount
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCurrentStatus();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isClockedIn && attendanceData?.clockInTime) {
      interval = setInterval(() => {
        const clockInTime = new Date(attendanceData.clockInTime);
        const now = new Date();
        const timeDiff = now - clockInTime;
        setTimeWorked(timeDiff / 1000); // Convert to seconds
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn, attendanceData]);

  const fetchCurrentStatus = async () => {
    try {
      setStatusLoading(true);
      const response = await apiClient.get('/attendance/status');
      const { data } = response.data;
      
      setIsClockedIn(data.isClockedIn);
      setHasClockedOut(data.status === 'Clocked Out');
      setAttendanceData(data);
      
      if (data.isClockedIn && data.clockInTime) {
        const clockInTime = new Date(data.clockInTime);
        const now = new Date();
        const timeDiff = now - clockInTime;
        setTimeWorked(timeDiff / 1000);
      }
    } catch (error) {
      console.error('Error fetching attendance status:', error);
      if (error.response?.status !== 404) {
        message.error('Failed to fetch attendance status');
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const handleClockIn = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/attendance/clock-in');
      
      if (response.data.success) {
        message.success('Successfully clocked in!');
        setIsClockedIn(true);
        setTimeWorked(0);
        await fetchCurrentStatus();
      }
    } catch (error) {
      console.error('Error clocking in:', error);
      message.error(error.response?.data?.message || 'Failed to clock in');
    } finally {
      setLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setLoading(true);
      const response = await apiClient.post('/attendance/clock-out');
      
      if (response.data.success) {
        message.success('Successfully clocked out!');
        setIsClockedIn(false);
        setHasClockedOut(true);
        setTimeWorked(0);
        await fetchCurrentStatus();
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      message.error(error.response?.data?.message || 'Failed to clock out');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    if (isClockedIn) {
      handleClockOut();
    } else {
      handleClockIn();
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const getCurrentDate = () => {
    return new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (statusLoading) {
    return (
      <Card 
        style={{
          background: '#ffffff',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
          height: '100%'
        }}
        bodyStyle={{ padding: '24px', textAlign: 'center' }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text type="secondary">Loading attendance status...</Text>
        </div>
      </Card>
    );
  }

  const statusText = isClockedIn
    ? 'Currently Working'
    : hasClockedOut
      ? 'Already Clocked Out'
      : 'Ready to Clock In';

  return (
    <Card
      style={{
        background: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '16px',
        boxShadow: '0 12px 24px rgba(15, 23, 42, 0.08)',
        height: '100%'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Space direction="vertical" size="small">
          <div style={{
            width: 42,
            height: 42,
            borderRadius: 12,
            background: '#eff6ff',
            color: '#2563eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto',
            fontSize: 20,
          }}>
            <ClockCircleOutlined />
          </div>
          <Title level={4} style={{ color: '#0f172a', margin: 0 }}>
            Time Tracking
          </Title>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {getCurrentDate()}
          </Text>
          <Text style={{ color: '#475569', fontSize: '15px', fontWeight: 600 }}>
            {getCurrentTime()}
          </Text>
        </Space>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div style={{
          borderRadius: '12px',
          padding: '14px',
          border: '1px solid #e2e8f0',
          background: '#f8fafc'
        }}>
          <Text style={{ color: '#334155', fontSize: '14px', fontWeight: 600 }}>
            {statusText}
          </Text>
          <div style={{ marginTop: 6 }}>
            <Text style={{ color: '#0f172a', fontSize: '26px', fontWeight: 700 }}>
              {formatTime(timeWorked)}
            </Text>
          </div>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={hasClockedOut && !isClockedIn}
          onClick={handleToggle}
          icon={isClockedIn ? <LogoutOutlined /> : <CheckCircleOutlined />}
          style={{
            background: hasClockedOut && !isClockedIn 
              ? '#94a3b8' 
              : isClockedIn 
                ? '#ef4444' 
                : '#16a34a',
            border: 'none',
            borderRadius: '10px',
            height: '44px',
            fontSize: '15px',
            fontWeight: 600,
            boxShadow: hasClockedOut && !isClockedIn ? 'none' : '0 8px 18px rgba(2, 6, 23, 0.15)',
            minWidth: '190px',
            cursor: hasClockedOut && !isClockedIn ? 'not-allowed' : 'pointer'
          }}
          title={hasClockedOut && !isClockedIn ? 'You have already clocked out today. You cannot clock in again on the same day.' : ''}
        >
          {isClockedIn ? 'Clock Out' : hasClockedOut ? 'Already Clocked Out' : 'Clock In'}
        </Button>
      </div>
    </Card>
  );
};

export default MinimalClockInCard;
