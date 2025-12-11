import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Typography,
  Checkbox,
  Layout,
  Row,
  Col,
  message,
  Card,
} from 'antd';
import {
  UserOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import back from '../assets/loginBack.jpg';
import loginLogo from '../assets/pts.png';
import { setAuthToken } from '../utils/auth';

const { Title, Text, Link } = Typography;
const { Content } = Layout;

const LoginPage = ({ onLoginSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
  setLoading(true);

  // Debug: Log the environment variable
  console.log('API Base URL:', process.env.REACT_APP_API_BASE);
  console.log('All environment variables:', process.env);

  try {
    const response = await fetch(`${process.env.REACT_APP_API_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: values.username,
        password: values.password,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token & expiry time using utility function
      setAuthToken(data.token);

      message.success('Login successful!');
      if (onLoginSuccess) onLoginSuccess();
      navigate('/home');
    } else {
      message.error(data.message || 'Invalid username or password!');
    }
  } catch (error) {
    message.error('Login failed. Please try again.');
  } finally {
    setLoading(false);
  }
};

  return (
    <Layout
      style={{
        minHeight: '100vh',
        backgroundImage: `url(${back})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Row style={{ minHeight: '80vh' }} justify="start" align="middle">
        <Col xs={24} sm={24} md={24} lg={24} xl={24} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start' }}>
          <Card
            style={{
              width: '600px',
              maxWidth: '600px',
              minHeight: 'auto',
              margin: '40px 0 0 40px',
 
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <img
                src={loginLogo}
                alt="Logo"
                style={{ marginBottom: 12, width: '100px' }}
              />
              <Title level={3}> PTS Digital Cupboard</Title>
              <Text type="secondary">Path To Success Consultants Employee Managment System</Text>
            </div>
            <Form
              form={form}
              name="login"
              initialValues={{ remember: true }}
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item
                name="username"
                label="Username or Email"
                rules={[{ required: true, message: 'Please input your username or email!' }]}
              >
                <Input
                  prefix={<UserOutlined />}
                  placeholder="Enter your username or email"
                  size="large"
                />
              </Form.Item>
              <Form.Item
                name="password"
                label="Password"
                rules={[{ required: true, message: 'Please input your password!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Enter your password"
                  size="large"
                />
              </Form.Item>
              <Form.Item>
                <Row justify="space-between" align="middle">
                  <Col>
                    <Form.Item name="remember" valuePropName="checked" noStyle>
                      <Checkbox>Remember me</Checkbox>
                    </Form.Item>
                  </Col>
                  <Col>
                    <Link onClick={() => navigate('/forgot-password')} style={{ cursor: 'pointer' }}>
                      Forgot password?
                    </Link>
                  </Col>
                </Row>
              </Form.Item>
              <Form.Item>
                <Button
                  type="primary"
                  htmlType="submit"
                  block
                  size="large"
                  loading={loading}
                >
                  Log in
                </Button>
              </Form.Item>
            </Form>
          </Card>
        </Col>
      </Row>
    </Layout>
  );
};

export default LoginPage;
