import React from 'react';
import { Typography } from 'antd';
import './PageBanner.css';

const { Title, Text } = Typography;

const PageBanner = ({ title, subtitle, actions, label = 'Workspace' }) => {
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="shared-page-banner">
      <div>
        <Text className="shared-page-banner-label">{label}</Text>
        <Title level={2} className="shared-page-banner-title">{title}</Title>
        {subtitle && <Text className="shared-page-banner-subtitle">{subtitle}</Text>}
      </div>
      <div className="shared-page-banner-right">
        <div className="shared-page-banner-date">{today}</div>
        {actions && <div className="shared-page-banner-actions">{actions}</div>}
      </div>
    </div>
  );
};

export default PageBanner;
