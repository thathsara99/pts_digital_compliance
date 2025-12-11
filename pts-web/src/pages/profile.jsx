import React, { useState, useEffect } from 'react';
import {
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  message,
  Row,
  Col,
  Card,
  Divider,
} from 'antd';
import { UploadOutlined, SaveOutlined, LockOutlined, UserOutlined } from '@ant-design/icons';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:5000/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const ProfilePage = () => {
  const [form] = Form.useForm();
  const [previewUrl, setPreviewUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);

  // Fetch profile data from API
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_BASE}/profile`, {
          headers: { ...getAuthHeaders() },
        });
        const result = await res.json();
        if (res.ok && result.data) {
          setProfileData(result.data);
          form.setFieldsValue({
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            email: result.data.email,
            phoneNumber: result.data.contactNumber,
          });
          if (result.data.profilePicture) {
            setPreviewUrl(result.data.profilePicture);
          }
        } else {
          message.error('Failed to fetch profile data');
        }
      } catch (err) {
        message.error('Error fetching profile data');
      }
    };

    fetchProfile();
  }, [form]);

  const handleImageChange = (info) => {
    const file = info.file;
    if (!file) return;

    const originFile = file.originFileObj || file;

    const isJpgOrPng = originFile.type === 'image/jpeg' || originFile.type === 'image/png';
    if (!isJpgOrPng) {
      message.error('Only JPG/PNG files are allowed!');
      return;
    }

    const isLt2M = originFile.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must be smaller than 2MB!');
      return;
    }

    // Compress image before converting to base64
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Set canvas size (max 300x300 for profile pictures)
      const maxSize = 300;
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxSize) {
          height = (height * maxSize) / width;
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7);
      
      // Validate the compressed base64 string
      if (compressedBase64 && compressedBase64.startsWith('data:image/')) {
        setPreviewUrl(compressedBase64);
        message.success('Image selected and compressed!');
        console.log('Compressed image loaded, size:', compressedBase64.length, 'characters');
      } else {
        message.error('Failed to process image properly');
      }
    };

    img.onerror = () => {
      message.error('Error loading image');
    };

    // Create object URL for the image
    const objectUrl = URL.createObjectURL(originFile);
    img.src = objectUrl;
  };

  const onFinish = async (values) => {
    setLoading(true);

    try {
      // Handle password update separately if new password is provided
      if (values.newPassword) {
        if (!values.currentPassword) {
          message.error('Current password is required to change password');
          setLoading(false);
          return;
        }

        if (values.newPassword !== values.confirmPassword) {
          message.error('New passwords do not match!');
          setLoading(false);
          return;
        }

        // Update password
        const passwordRes = await fetch(`${API_BASE}/users/${profileData.id}/password`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
          body: JSON.stringify({
            currentPassword: values.currentPassword,
            newPassword: values.newPassword
          }),
        });

        const passwordResult = await passwordRes.json();
        if (!passwordRes.ok) throw new Error(passwordResult.message || 'Failed to update password');
        
        message.success('Password updated successfully');
        
        // Clear password fields
        form.setFieldsValue({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      }

      // Handle profile update (excluding password)
      const updateData = {
        firstName: values.firstName,
        lastName: values.lastName,
        contactNumber: values.phoneNumber,
      };

      // Always include profile picture if it has changed or if it's a new image
      if (previewUrl && previewUrl !== profileData?.profilePicture) {
        // Validate the base64 string before sending
        if (previewUrl.startsWith('data:image/') && previewUrl.length > 100) {
          updateData.profilePicture = previewUrl;
          console.log('Updating profile picture, size:', previewUrl.length, 'characters');
        } else {
          message.error('Invalid image data');
          setLoading(false);
          return;
        }
      }

      console.log('Profile update data:', updateData);

      const res = await fetch(`${API_BASE}/users/${profileData.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updateData),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update profile');

      message.success('Profile updated successfully');
      
      // Notify MainLayout to refresh profile data
      window.dispatchEvent(new CustomEvent('profileUpdated'));
      
      // Refresh profile data
      const profileRes = await fetch(`${API_BASE}/profile`, {
        headers: { ...getAuthHeaders() },
      });
      const profileResult = await profileRes.json();
      if (profileRes.ok && profileResult.data) {
        setProfileData(profileResult.data);
        // Update the preview URL with the new profile picture
        if (profileResult.data.profilePicture) {
          setPreviewUrl(profileResult.data.profilePicture);
          console.log('Profile picture updated from server, size:', profileResult.data.profilePicture.length);
        }
        console.log('Profile refreshed:', profileResult.data);
      }
    } catch (err) {
      message.error(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: '20px' }}>
      <Card title="My Profile">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={24}>
            <Col span={6} style={{ textAlign: 'center' }}>
              <Avatar 
                size={100} 
                src={previewUrl || profileData?.profilePicture} 
                icon={<UserOutlined />}
              />
              <Upload
                key={Date.now()}
                showUploadList={false}
                beforeUpload={() => false}
                onChange={handleImageChange}
              >
                <Button icon={<UploadOutlined />} size="small" style={{ marginTop: 10 }}>
                  Change Picture
                </Button>
              </Upload>
            </Col>

            <Col span={18}>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item
                    name="firstName"
                    label="First Name"
                    rules={[{ required: true, message: 'Enter first name' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="lastName"
                    label="Last Name"
                    rules={[{ required: true, message: 'Enter last name' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="email"
                    label="Email"
                    rules={[{ required: true, type: 'email', message: 'Enter valid email' }]}
                  >
                    <Input disabled />
                  </Form.Item>
                </Col>

                <Col span={12}>
                  <Form.Item
                    name="phoneNumber"
                    label="Phone Number"
                    rules={[{ required: true, message: 'Enter phone number' }]}
                  >
                    <Input />
                  </Form.Item>
                </Col>
              </Row>
            </Col>
          </Row>

          <Divider />

          <Card
            title="Change Password"
            size="small"
            style={{ marginBottom: 16 }}
            bodyStyle={{ padding: '16px' }}
          >
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item
                  name="currentPassword"
                  label="Current Password"
                  rules={[
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!getFieldValue('newPassword') || value) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error('Current password is required to change password'));
                      },
                    }),
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Enter current password" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="newPassword"
                  label="New Password"
                  rules={[
                    {
                      min: 6,
                      message: 'New password must be at least 6 characters',
                    },
                  ]}
                >
                  <Input.Password prefix={<LockOutlined />} placeholder="Enter new password" />
                </Form.Item>
              </Col>

              <Col span={8}>
                <Form.Item
                  name="confirmPassword"
                  label="Confirm New Password"
                  dependencies={['newPassword']}
                  rules={[
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
                  <Input.Password prefix={<LockOutlined />} placeholder="Confirm new password" />
                </Form.Item>
              </Col>
            </Row>
          </Card>

          <Form.Item style={{ textAlign: 'right' }}>
            <Button
              type="primary"
              htmlType="submit"
              icon={<SaveOutlined />}
              loading={loading}
            >
              Save Profile
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ProfilePage;
