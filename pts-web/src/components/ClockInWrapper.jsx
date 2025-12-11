import React from 'react';
import MinimalClockInCard from './MinimalClockInCard';

const ClockInWrapper = () => {
  // Using minimal version to avoid any icon import issues
  // This version uses emojis instead of Ant Design icons
  return <MinimalClockInCard />;
};

export default ClockInWrapper;
