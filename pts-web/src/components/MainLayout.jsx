import React, { useState, useEffect  } from "react";
import {
  Layout, Menu, Switch, Avatar, Typography, Space, Dropdown, Drawer, Button, Grid, message
} from "antd";
import {
  UserOutlined, HomeOutlined, InfoCircleOutlined, LogoutOutlined, MenuOutlined,
  SlackCircleFilled,
  MoneyCollectFilled,
  CalendarFilled,
  WalletFilled,
  TeamOutlined,
  CompassFilled,
  FolderAddFilled,
  IdcardOutlined,
  ClockCircleOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { ConfigProvider, theme } from "antd";
import logo from "../assets/logpts.png";
import profile from "../assets/apple-touch-icon.png";
import ptsLogo from "../assets/pts.png";
import { isTokenValid, clearAuthToken, getTimeUntilExpiry, formatTimeRemaining } from "../utils/auth";

const { Header, Content, Footer } = Layout;
const { Title } = Typography;
const { useBreakpoint } = Grid;

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const MainLayout = ({ children, onLogout }) => {
  
  const [darkMode, setDarkMode] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  // Function to fetch user profile data
  const fetchUserProfile = async () => {
    try {
      const res = await fetch(`${API_BASE}/profile`, {
        headers: { ...getAuthHeaders() },
      });
      const result = await res.json();
      if (res.ok && result.data) {
        setUserProfile(result.data);
        console.log('Profile data loaded in MainLayout:', result.data.firstName);
      }
    } catch (err) {
      console.error('Error fetching user profile in MainLayout:', err);
    }
  };

  // Fetch user profile data
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Refresh profile data when navigating to profile page
  useEffect(() => {
    const handleRouteChange = () => {
      // Refresh profile data when user navigates to profile page
      if (window.location.pathname === '/profile') {
        fetchUserProfile();
      }
    };

    const handleProfileUpdate = () => {
      // Refresh profile data when profile is updated
      console.log('Profile updated event received, refreshing profile data...');
      fetchUserProfile();
    };

    // Listen for route changes
    window.addEventListener('popstate', handleRouteChange);
    
    // Listen for profile update events
    window.addEventListener('profileUpdated', handleProfileUpdate);
    
    // Also refresh when component mounts
    fetchUserProfile();

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('profileUpdated', handleProfileUpdate);
    };
  }, []);

  useEffect(() => {
    const checkTokenExpiry = () => {
      if (!isTokenValid()) {
        // Token expired or doesn't exist
        if (onLogout) {
          onLogout();
        } else {
          clearAuthToken();
        }
        message.warning("Your session has expired. Please log in again.");
        navigate("/login");
      } else {
        // Check if session is about to expire (within 30 minutes)
        const timeUntilExpiry = getTimeUntilExpiry();
        const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds
        
        if (timeUntilExpiry > 0 && timeUntilExpiry <= thirtyMinutes) {
          setShowSessionWarning(true);
        } else {
          setShowSessionWarning(false);
        }
      }
    };

    // Check on load
    checkTokenExpiry();

    // Check every minute
    const interval = setInterval(checkTokenExpiry, 60 * 1000);

    return () => clearInterval(interval);
  }, [navigate, onLogout]);

  const headerBgColor = '#001529';
  const headerTextColor = 'rgba(255, 255, 255, 0.85)';

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      clearAuthToken();
    }
    navigate('/login');
  };
  

  const userMenu = (
    <Menu
      items={[
        {
          key: '1',
          label: 'Profile',
          icon: <UserOutlined />,
          onClick: () => navigate('/profile')
        },
        { type: 'divider' },
        {
          key: '2',
          label: 'Company Profile',
          icon: <CompassFilled />,
          onClick: () => navigate('/companyprofile')
        },
        { type: 'divider' },
        {
          key: '3',
          label: 'Logout',
          icon: <LogoutOutlined />,
          onClick: handleLogout
        }
      ]}
    />
  );

  const menuItems = [
    {
      key: "1",
      label: <Link to="/home" onClick={() => setDrawerVisible(false)}>Dashboard</Link>,
      icon: <HomeOutlined />
    },
    {
      key: "2",
      label: <Link to="/department" onClick={() => setDrawerVisible(false)}>Department</Link>,
      icon: <TeamOutlined />
    },
    {
      key: "3",
      label: <Link to="/users" onClick={() => setDrawerVisible(false)}>Users</Link>,
      icon: <UserOutlined />
    },
    {
      key: "4",
      label: <Link to="/employee" onClick={() => setDrawerVisible(false)}>Employee Management</Link>,
      icon: <IdcardOutlined />
    },
    {
      key: "5",
      label: <Link to="/documents" onClick={() => setDrawerVisible(false)}>Document Hub</Link>,
      icon: <FolderAddFilled />
    },
    {
      key: "6",
      label: <Link to="/leave" onClick={() => setDrawerVisible(false)}>Leave Management</Link>,
      icon: <CalendarFilled />
    },
    {
      key: "7",
      label: <Link to="/attendance" onClick={() => setDrawerVisible(false)}>Attendance</Link>,
      icon: <ClockCircleOutlined />
    },
  ];

  return (
    <ConfigProvider
      theme={{
        algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 8,
        }
      }}
    >
      <Layout
        style={{
          minHeight: "100vh",
          backgroundImage: `url(${ptsLogo})`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "center",
          backgroundSize: "20%",
          opacity: 1,
        }}
      >
        <Header
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: '0 16px',
            height: 64,
            backgroundColor: headerBgColor,
            zIndex: 1000
          }}
        >
          <Space>
            <Title level={4} style={{ color: headerTextColor, margin: 0 }}>
              <Link to="/home">
                <img src={logo} alt="Logo" style={{ height: 40 }} />
              </Link>
            </Title>
            {!isMobile && (
              <Menu
                theme="dark"
                mode="horizontal"
                defaultSelectedKeys={["1"]}
                items={menuItems}
                style={{
                  backgroundColor: 'transparent',
                  borderBottom: 'none',
                  lineHeight: '64px',
                  width: '950px'
                }}
              />
            )}
          </Space>

          <Space>
            <Switch
              checked={darkMode}
              onChange={setDarkMode}
              checkedChildren="🌙"
              unCheckedChildren="☀️"
              style={{ backgroundColor: '#1890ff' }}
            />
            <Dropdown overlay={userMenu} trigger={['click']}>
              <Avatar
                src={userProfile?.profilePicture}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer', backgroundColor: '#1890ff' }}
                onError={() => {
                  // If image fails to load, it will show the icon instead
                  console.log('Profile picture failed to load in MainLayout, showing default icon');
                }}
              />
            </Dropdown>
            {isMobile && (
              <Button
                icon={<MenuOutlined style={{ color: '#fff' }} />}
                type="text"
                onClick={() => setDrawerVisible(true)}
              />
            )}
          </Space>
        </Header>

        <Drawer
          title="Menu"
          placement="left"
          onClose={() => setDrawerVisible(false)}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          <Menu
            mode="vertical"
            items={menuItems}
            style={{ borderRight: 0 }}
          />
        </Drawer>

        <Content style={{
          margin: "24px 16px",
          padding: 24,
          minHeight: 280,
          background: darkMode ? "#141414" : "#ffffffdd",
          borderRadius: 8,
          backdropFilter: 'blur(2px)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
          {showSessionWarning && (
            <div style={{
              backgroundColor: '#fff2e8',
              border: '1px solid #ffbb96',
              borderRadius: 6,
              padding: '12px 16px',
              marginBottom: 16,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <span style={{ color: '#d46b08' }}>
                ⚠️ Your session will expire in {formatTimeRemaining(getTimeUntilExpiry())}. 
                Please save your work and log in again if needed.
              </span>
              <Button 
                size="small" 
                type="link" 
                onClick={() => setShowSessionWarning(false)}
                style={{ color: '#d46b08' }}
              >
                Dismiss
              </Button>
            </div>
          )}
          {children}
        </Content>

        <Footer style={{
          textAlign: 'center',
          background: darkMode ? '#1f1f1f' : '#f0f2f5',
          padding: '16px 0',
          borderTop: `1px solid ${darkMode ? '#303030' : '#e8e8e8'}`,
          color: darkMode ? 'rgba(255, 255, 255, 0.65)' : 'rgba(0, 0, 0, 0.65)'
        }}>
          Path to Success Consultants ©{new Date().getFullYear()}
        </Footer>
      </Layout>
    </ConfigProvider>
  );
};

export default MainLayout;
