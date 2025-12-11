import React, { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Typography,
  Space,
  message
} from 'antd';
import {
  ClockCircleOutlined,
  CheckCircleOutlined,
  LogoutOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const SimpleClockInCard = () => {
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [timeWorked, setTimeWorked] = useState(0);

  // Timer effect
  useEffect(() => {
    let interval = null;
    if (isClockedIn) {
      interval = setInterval(() => {
        setTimeWorked(prevTime => prevTime + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isClockedIn]);

  const handleToggle = () => {
    if (isClockedIn) {
      message.success('Successfully clocked out!');
      setIsClockedIn(false);
      setTimeWorked(0);
    } else {
      message.success('Successfully clocked in!');
      setIsClockedIn(true);
      setTimeWorked(0);
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
          <ClockCircleOutlined 
            style={{ 
              fontSize: '32px', 
              color: 'white',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            }} 
          />
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
            {isClockedIn ? 'Currently Working' : 'Not Clocked In'}
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
          onClick={handleToggle}
          icon={isClockedIn ? <LogoutOutlined /> : <CheckCircleOutlined />}
          style={{
            background: isClockedIn ? '#ff4d4f' : '#52c41a',
            border: 'none',
            borderRadius: '8px',
            height: '48px',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
            minWidth: '160px'
          }}
        >
          {isClockedIn ? 'Clock Out' : 'Clock In'}
        </Button>
      </div>
    </Card>
  );
};

export default SimpleClockInCard;

