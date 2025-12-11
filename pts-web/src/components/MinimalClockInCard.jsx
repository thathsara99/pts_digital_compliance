import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  message,
  Spin
} from 'antd';
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
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          border: 'none',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}
        bodyStyle={{ padding: '24px', textAlign: 'center' }}
      >
        <Spin size="large" />
        <div style={{ marginTop: 16 }}>
          <Text style={{ color: 'white' }}>Loading attendance status...</Text>
        </div>
      </Card>
    );
  }

  return (
    <Card
      style={{
        background: isClockedIn 
          ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
          : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
        border: 'none',
        borderRadius: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        overflow: 'hidden'
      }}
      bodyStyle={{ padding: '24px' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Space direction="vertical" size="small">
          <div style={{ 
            fontSize: '32px', 
            color: 'white',
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }}>
            🕐
          </div>
          <Title level={3} style={{ color: 'white', margin: 0 }}>
            Time Tracking
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '14px' }}>
            {getCurrentDate()}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px', fontWeight: 'bold' }}>
            {getCurrentTime()}
          </Text>
        </Space>
      </div>

      {/* Current Status */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '12px', 
          padding: '16px',
          backdropFilter: 'blur(10px)'
        }}>
          <Text style={{ color: 'white', fontSize: '18px', fontWeight: 'bold' }}>
            {isClockedIn ? 'Currently Working' : hasClockedOut ? 'Already Clocked Out' : 'Not Clocked In'}
          </Text>
          <div style={{ marginTop: '8px' }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '24px', fontWeight: 'bold' }}>
              {formatTime(timeWorked)}
            </Text>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ textAlign: 'center', marginBottom: '24px' }}>
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={hasClockedOut && !isClockedIn}
          onClick={handleToggle}
          style={{
            background: hasClockedOut && !isClockedIn 
              ? '#8c8c8c' 
              : isClockedIn 
                ? '#ff4d4f' 
                : '#52c41a',
            border: 'none',
            borderRadius: '8px',
            height: '48px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: hasClockedOut && !isClockedIn ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.2)',
            minWidth: '160px',
            cursor: hasClockedOut && !isClockedIn ? 'not-allowed' : 'pointer'
          }}
          title={hasClockedOut && !isClockedIn ? 'You have already clocked out today. You cannot clock in again on the same day.' : ''}
        >
          {isClockedIn ? '🕐 Clock Out' : hasClockedOut ? '✅ Already Clocked Out' : '✅ Clock In'}
        </Button>
      </div>
    </Card>
  );
};

export default MinimalClockInCard;
