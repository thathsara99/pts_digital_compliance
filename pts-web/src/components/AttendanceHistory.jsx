import React, { useState, useEffect } from 'react';
import {
  Card,
  Table,
  Typography,
  Space,
  Tag,
  Button,
  DatePicker,
  Row,
  Col,
  Statistic,
  message,
  Spin,
  Empty
} from 'antd';
import {
  ClockCircleOutlined,
  CalendarOutlined,
  FieldTimeOutlined,
  TrophyOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { apiClient } from '../config/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const AttendanceHistory = () => {
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [dateRange, setDateRange] = useState([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });

  useEffect(() => {
    fetchAttendanceHistory();
    fetchStatistics();
  }, [pagination.current, pagination.pageSize, dateRange]);

  const fetchAttendanceHistory = async () => {
    try {
      setLoading(true);
      const params = {
        page: pagination.current,
        limit: pagination.pageSize,
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD')
      };

      const response = await apiClient.get('/attendance/history', { params });
      const { data } = response.data;
      
      setAttendances(data.attendances);
      setPagination(prev => ({
        ...prev,
        total: data.pagination.total
      }));
    } catch (error) {
      console.error('Error fetching attendance history:', error);
      message.error('Failed to fetch attendance history');
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const params = {
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD')
      };

      const response = await apiClient.get('/attendance/statistics', { params });
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const handleTableChange = (newPagination) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
      total: pagination.total
    });
  };

  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const formatTime = (timeString) => {
    if (!timeString) return '-';
    return dayjs(timeString).format('HH:mm:ss');
  };

  const formatDate = (dateString) => {
    return dayjs(dateString).format('MMM DD, YYYY');
  };

  const formatDateForExport = (dateString) => {
    return dayjs(dateString).format('MM/DD/YYYY');
  };

  const getStatusColor = (status) => {
    return status === 'Clocked In' ? 'processing' : 'success';
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      message.loading({ content: 'Exporting attendance data...', key: 'export', duration: 0 });
      
      // Fetch all attendance records for the date range (without pagination)
      const params = {
        page: 1,
        limit: 10000, // Large limit to get all records
        startDate: dateRange[0]?.format('YYYY-MM-DD'),
        endDate: dateRange[1]?.format('YYYY-MM-DD')
      };

      const response = await apiClient.get('/attendance/history', { params });
      const { data } = response.data;
      const allAttendances = data.attendances || [];

      if (allAttendances.length === 0) {
        message.warning('No attendance data to export');
        setLoading(false);
        message.destroy('export');
        return;
      }

      // Prepare CSV headers
      const headers = ['Date', 'Clock In', 'Clock Out', 'Total Hours', 'Status'];
      
      // Prepare CSV rows
      const csvRows = allAttendances.map(att => {
        const date = formatDateForExport(att.workDate);
        const clockIn = att.clockInTime ? dayjs(att.clockInTime).format('MM/DD/YYYY HH:mm:ss') : '-';
        const clockOut = att.clockOutTime ? dayjs(att.clockOutTime).format('MM/DD/YYYY HH:mm:ss') : '-';
        const totalHours = att.totalHours ? parseFloat(att.totalHours).toFixed(2) : '0.00';
        const status = att.status || '-';
        
        // Escape commas and quotes in data
        const escapeCSV = (str) => {
          if (str === null || str === undefined) return '';
          const strValue = String(str);
          if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n')) {
            return `"${strValue.replace(/"/g, '""')}"`;
          }
          return strValue;
        };
        
        return [escapeCSV(date), escapeCSV(clockIn), escapeCSV(clockOut), escapeCSV(totalHours), escapeCSV(status)];
      });

      // Combine headers and rows (rows are already escaped)
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => row.join(','))
      ].join('\n');

      // Create blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `attendance_export_${dateRange[0]?.format('YYYY-MM-DD')}_to_${dateRange[1]?.format('YYYY-MM-DD')}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      message.success({ content: 'Attendance data exported successfully!', key: 'export', duration: 3 });
    } catch (error) {
      console.error('Error exporting attendance data:', error);
      message.error({ content: 'Failed to export attendance data', key: 'export', duration: 3 });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'workDate',
      key: 'workDate',
      render: (date) => (
        <Space>
          <CalendarOutlined />
          <Text strong>{formatDate(date)}</Text>
        </Space>
      ),
      sorter: (a, b) => dayjs(a.workDate).unix() - dayjs(b.workDate).unix()
    },
    {
      title: 'Clock In',
      dataIndex: 'clockInTime',
      key: 'clockInTime',
      render: (time) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#52c41a' }} />
          <Text>{formatTime(time)}</Text>
        </Space>
      )
    },
    {
      title: 'Clock Out',
      dataIndex: 'clockOutTime',
      key: 'clockOutTime',
      render: (time) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#ff4d4f' }} />
          <Text>{formatTime(time)}</Text>
        </Space>
      )
    },
    {
      title: 'Total Hours',
      dataIndex: 'totalHours',
      key: 'totalHours',
      render: (hours) => (
        <Space>
          <FieldTimeOutlined style={{ color: '#1890ff' }} />
          <Text strong style={{ color: hours > 0 ? '#52c41a' : '#d9d9d9' }}>
            {hours ? `${hours}h` : '-'}
          </Text>
        </Space>
      ),
      sorter: (a, b) => (a.totalHours || 0) - (b.totalHours || 0)
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status}
        </Tag>
      )
    }
  ];

  return (
    <div>
      {/* Statistics Cards */}
      {statistics && (
        <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Total Hours"
                value={statistics.totalHours}
                suffix="hrs"
                prefix={<FieldTimeOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Working Days"
                value={statistics.totalDays}
                suffix="days"
                prefix={<CalendarOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card>
              <Statistic
                title="Average Hours"
                value={statistics.averageHours}
                suffix="hrs/day"
                prefix={<TrophyOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Space>
              <Text strong>Date Range:</Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateRangeChange}
                style={{ width: '100%' }}
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Button 
              type="primary"
              icon={<DownloadOutlined />}
              onClick={exportToCSV}
              loading={loading}
            >
              Export to CSV
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Attendance Table */}
      <Card
        title={
          <Space>
            <ClockCircleOutlined />
            <span>Attendance History</span>
          </Space>
        }
        extra={
          <Button 
            type="primary" 
            onClick={fetchAttendanceHistory}
            loading={loading}
          >
            Refresh
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={attendances}
          rowKey="id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} records`
          }}
          onChange={handleTableChange}
          locale={{
            emptyText: (
              <Empty
                description="No attendance records found"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )
          }}
        />
      </Card>
    </div>
  );
};

export default AttendanceHistory;

