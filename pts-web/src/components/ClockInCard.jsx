import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  Statistic,
  Progress,
  message,
  Spin,
  Row,
  Col,
  Divider
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LogoutOutlined,
  FieldTimeOutlined,
  CalendarOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { apiClient } from '../config/api';

const { Title, Text } = Typography;

const ClockInCard = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [hasClockedOut, setHasClockedOut] = useState(false);
  const [timeWorked, setTimeWorked] = useState(0);
  const [loading, setLoading] = useState(false);
  const [statusLoading, setStatusLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState(null);
  const [statistics, setStatistics] = useState(null);

  // Fetch current status on component mount
  useEffect(() => {
    // Add a small delay to ensure the component is fully mounted
    const timer = setTimeout(() => {
      fetchCurrentStatus();
      fetchStatistics();
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
      // Don't show error message if API is not available yet
      if (error.response?.status !== 404) {
        message.error('Failed to fetch attendance status');
      }
    } finally {
      setStatusLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await apiClient.get('/attendance/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      // Set default statistics if API is not available
      setStatistics({
        totalHours: 0,
        totalDays: 0,
        averageHours: 0,
        todayHours: 0,
        weekHours: 0,
        weekDays: 0
      });
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
        // Refresh statistics after clocking in
        setTimeout(() => {
          fetchStatistics();
        }, 500);
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
        // Refresh statistics after clocking out
        setTimeout(() => {
          fetchStatistics();
        }, 500);
      }
    } catch (error) {
      console.error('Error clocking out:', error);
      message.error(error.response?.data?.message || 'Failed to clock out');
    } finally {
      setLoading(false);
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
      bodyStyle={{ padding: '20px' }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Space direction="vertical" size="small">
          <ClockCircleOutlined 
            style={{ 
              fontSize: '24px', 
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
          <Title level={4} style={{ color: 'white', margin: 0, fontSize: '20px' }}>
            Time Tracking
          </Title>
          <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '12px' }}>
            {getCurrentDate()}
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px', fontWeight: 'bold' }}>
            {getCurrentTime()}
          </Text>
        </Space>
      </div>

      {/* Current Status */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.2)', 
          borderRadius: '12px', 
          padding: '12px',
          backdropFilter: 'blur(10px)'
        }}>
          <Text style={{ color: 'white', fontSize: '16px', fontWeight: 'bold' }}>
            {isClockedIn ? 'Currently Working' : hasClockedOut ? 'Already Clocked Out' : 'Not Clocked In'}
          </Text>
          <div style={{ marginTop: '4px' }}>
            <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '20px', fontWeight: 'bold' }}>
              {formatTime(timeWorked)}
            </Text>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <Button
          type="primary"
          size="large"
          loading={loading}
          disabled={hasClockedOut && !isClockedIn}
          onClick={isClockedIn ? handleClockOut : handleClockIn}
          icon={isClockedIn ? <LogoutOutlined /> : <CheckCircleOutlined />}
          style={{
            background: hasClockedOut && !isClockedIn 
              ? '#8c8c8c' 
              : isClockedIn 
                ? '#ff4d4f' 
                : '#52c41a',
            border: 'none',
            borderRadius: '8px',
            height: '42px',
            fontSize: '15px',
            fontWeight: 'bold',
            boxShadow: hasClockedOut && !isClockedIn ? 'none' : '0 4px 12px rgba(0, 0, 0, 0.2)',
            minWidth: '160px',
            cursor: hasClockedOut && !isClockedIn ? 'not-allowed' : 'pointer'
          }}
          title={hasClockedOut && !isClockedIn ? 'You have already clocked out today. You cannot clock in again on the same day.' : ''}
        >
          {isClockedIn ? 'Clock Out' : hasClockedOut ? 'Already Clocked Out' : 'Clock In'}
        </Button>
      </div>

      {/* Statistics */}
      {statistics && (
        <>
          <Divider style={{ borderColor: 'rgba(255,255,255,0.3)' }} />
          <Row gutter={[16, 8]}>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>Today</Text>}
                  value={statistics.todayHours !== undefined ? statistics.todayHours.toFixed(2) : (isClockedIn ? parseFloat((timeWorked / 3600).toFixed(2)) : 0)}
                  suffix="hrs"
                  valueStyle={{ color: 'white', fontSize: '16px' }}
                  prefix={<FieldTimeOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }} />}
                />
              </div>
            </Col>
            <Col span={12}>
              <div style={{ textAlign: 'center' }}>
                <Statistic
                  title={<Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>This Week</Text>}
                  value={statistics.weekDays || 0}
                  suffix="days"
                  valueStyle={{ color: 'white', fontSize: '16px' }}
                  prefix={<CalendarOutlined style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }} />}
                />
              </div>
            </Col>
          </Row>
          
          {statistics.averageHours > 0 && (
            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
                Average: {statistics.averageHours} hrs/day
              </Text>
            </div>
          )}
        </>
      )}
    </Card>
  );
};

export default ClockInCard;
