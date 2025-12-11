import React from 'react';
import { Card, Typography, Row, Col, Button } from 'antd';  // import Button
import { useNavigate } from 'react-router-dom';
import { UserOutlined, DollarOutlined, TeamOutlined, ShoppingCartOutlined, LoginOutlined } from '@ant-design/icons';
import logo from '../assets/pts.png';
import menueBack from '../assets/menueBack.jpg';

const { Title } = Typography;

const DashboardLanding = () => {
  const navigate = useNavigate();

  const cards = [
    {
      title: 'HR',
      icon: <UserOutlined style={{ fontSize: '36px', color: '#1890ff' }} />,
      onClick: () => navigate('/home'),
    },
    {
      title: 'Finance',
      icon: <DollarOutlined style={{ fontSize: '36px', color: '#52c41a' }} />,
      onClick: () => console.log('Finance Clicked'),
    },
    {
      title: 'Clients',
      icon: <TeamOutlined style={{ fontSize: '36px', color: '#eb2f96' }} />,
      onClick: () => console.log('Clients Clicked'),
    },
    {
      title: 'Procurement ',
      icon: <ShoppingCartOutlined style={{ fontSize: '36px', color: '#faad14' }} />,
      onClick: () => console.log('Procurement Clicked'),
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        boxSizing: 'border-box',
        backgroundImage: `url(${menueBack})`,
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '30px 0 30px 60px',
        overflow: 'hidden',
      }}
    >
        {/* Logo and name side by side above cards */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
          <img
            src={logo}
            alt="Path To Success Logo"
            style={{ height: 90, width: 'auto', objectFit: 'contain', marginRight: 20 }}
          />
          <Title level={2} style={{ color: '#222', marginBottom: 0, textAlign: 'left', whiteSpace: 'nowrap' }}>
            Path To Success Digital Cupboard
          </Title>
        </div>

        <Row gutter={[24, 24]} justify="center" style={{ width: '100%', maxWidth: 1000 }}>
          {cards.map((card, index) => (
            <Col key={index} xs={24} sm={12} lg={12}>
              <Card
                hoverable
                onClick={card.onClick}
                style={{
                  textAlign: 'center',
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  transition: 'transform 0.2s',
                  height: '160px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  background: 'rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(2px)',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
                bodyStyle={{ padding: '20px' }}
              >
                {card.icon}
                <Title level={4} style={{ marginTop: '12px' }}>
                  {card.title}
                </Title>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Back to Login Button */}
        <div style={{ marginTop: '40px', textAlign: 'center' }}>
          <Button
            type="primary"
            shape="round"
            icon={<LoginOutlined />}
            size="large"
            onClick={() => navigate('/login')}
            style={{ padding: '0 40px', fontWeight: '600', fontSize: '16px' }}
            ghost
          >
            Back to Login
          </Button>
        </div>
    </div>
  );
};

export default DashboardLanding;
