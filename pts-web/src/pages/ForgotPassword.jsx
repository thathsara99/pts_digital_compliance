// src/pages/ResetPassword.jsx
import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Layout,
  Row,
  Col,
  message,
  Card,
} from 'antd';
import { MailOutlined, LockOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import loginLogo from '../assets/pts.png';
import background from '../assets/forgotpw.jpg';

const { Title, Text, Link } = Typography;
const { Content } = Layout;

const ResetPasswordPage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // First, get the reset token
      const tokenResponse = await fetch(`${process.env.REACT_APP_API_BASE}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
        }),
      });

      const tokenData = await tokenResponse.json();
      console.log('Forgot password response:', tokenData);

      if (!tokenResponse.ok) {
        message.error(tokenData.message || 'Failed to process reset request');
        setLoading(false);
        return;
      }

      // Then immediately reset the password with the token
              const resetResponse = await fetch(`${process.env.REACT_APP_API_BASE}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: values.email,
          newPassword: values.newPassword,
          confirmPassword: values.confirmPassword,
          resetToken: tokenData.resetToken,
        }),
      });

      const resetData = await resetResponse.json();
      console.log('Reset password response:', resetData);

      if (resetResponse.ok) {
        message.success('Password reset successfully!');
        navigate('/login');
      } else {
        message.error(resetData.message || 'Failed to reset password');
      }
    } catch (error) {
      console.error('Password reset error:', error);
      message.error('Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        height: '100vh',
        width: '100vw',
        backgroundImage: `url(${background})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-start',
        padding: '20px 60px',
        boxSizing: 'border-box',
        overflow: 'hidden'
      }}
    >
      <Card
        style={{
          width: '100%',
          maxWidth: 500,
          borderRadius: '15px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          border: 'none',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)'
        }}
        bodyStyle={{ padding: '40px' }}
      >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={loginLogo}
                alt="Logo"
                style={{ marginBottom: 12, width: '100px' }}
              />
              <Title level={3}>Reset Password</Title>
              <Text type="secondary">
                Enter your email and new password to reset your account.
              </Text>
            </div>

            <Form
              form={form}
              name="resetPassword"
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="email"
                label="Email Address"
                rules={[
                  { required: true, message: 'Please enter your email!' },
                  { type: 'email', message: 'Please enter a valid email!' },
                ]}
              >
                <Input
                  prefix={<MailOutlined />}
                  placeholder="you@example.com"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                  { required: true, message: 'Please enter your new password!' },
                  { min: 6, message: 'Password must be at least 6 characters long!' },
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="New Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item
                name="confirmPassword"
                label="Confirm Password"
                dependencies={['newPassword']}
                rules={[
                  { required: true, message: 'Please confirm your password!' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      if (!value || getFieldValue('newPassword') === value) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('Passwords do not match!'));
                    },
                  }),
                ]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Confirm Password"
                  size="large"
                />
              </Form.Item>

              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Reset Password
                </Button>
              </Form.Item>
            </Form>

                        <Button
              type="link"
              icon={<ArrowLeftOutlined />}
              onClick={() => navigate('/login')}
              style={{ padding: 0 }}
            >
              Back to Login
            </Button>
          </Card>
        </div>
  );
};

export default ResetPasswordPage;
