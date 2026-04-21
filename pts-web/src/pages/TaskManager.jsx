import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Timeline,
  Tag,
  Typography,
  message
} from 'antd';
import { DeleteOutlined, EditOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { apiClient } from '../config/api';
import { getCurrentUserRole } from '../utils/auth';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const { TextArea } = Input;
const { Title, Text } = Typography;
const { Option } = Select;

const STATUSES = ['Pending', 'In Progress', 'Completed'];
const PRIORITY_COLORS = { High: 'red', Medium: 'orange', Low: 'green' };

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [draggedTaskId, setDraggedTaskId] = useState(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [taskHistory, setTaskHistory] = useState([]);
  const [historyTaskTitle, setHistoryTaskTitle] = useState('');
  const boardRef = useRef(null);
  const [form] = Form.useForm();
  const role = getCurrentUserRole();
  const canManageAll = ['HR Manager', 'Super Admin', 'System Admin'].includes(role);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/tasks');
      if (res.data?.success) setTasks(res.data.data || []);
    } catch (error) {
      message.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!canManageAll) return;
    try {
      const res = await apiClient.get('/users');
      if (res.data?.data) {
        const employeeUsers = res.data.data.filter((u) => u.role === 'Employee');
        setUsers(employeeUsers.map((u) => ({
          value: u.id,
          label: `${u.firstName} ${u.lastName} (${u.email})`
        })));
      }
    } catch (error) {
      message.error('Failed to load users');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchUsers();
  }, [canManageAll]);

  const groupedTasks = useMemo(
    () => STATUSES.reduce((acc, s) => ({ ...acc, [s]: tasks.filter((t) => t.status === s) }), {}),
    [tasks]
  );

  const openCreateModal = () => {
    setEditingTask(null);
    form.resetFields();
    form.setFieldsValue({ status: 'Pending', priority: 'Medium' });
    setModalOpen(true);
  };

  const openEditModal = (task) => {
    setEditingTask(task);
    form.setFieldsValue({
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      userId: task.userId,
      dueDate: task.dueDate ? dayjs(task.dueDate) : null
    });
    setModalOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      const payload = {
        title: values.title,
        description: values.description || null,
        priority: values.priority,
        status: values.status,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null,
        userId: values.userId
      };
      if (editingTask) {
        await apiClient.put(`/tasks/${editingTask.id}`, payload);
        message.success('Task updated');
      } else {
        await apiClient.post('/tasks', payload);
        message.success('Task created');
      }
      setModalOpen(false);
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to save task');
    }
  };

  const onDropToStatus = async (status) => {
    if (!draggedTaskId) return;
    try {
      await apiClient.patch(`/tasks/${draggedTaskId}/status`, { status });
      setDraggedTaskId(null);
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to move task');
    }
  };

  const deleteTask = async (id) => {
    try {
      await apiClient.delete(`/tasks/${id}`);
      message.success('Task deleted');
      fetchTasks();
    } catch (error) {
      message.error(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const openHistory = async (task) => {
    try {
      setHistoryTaskTitle(task.title);
      setHistoryOpen(true);
      setHistoryLoading(true);
      const res = await apiClient.get(`/tasks/${task.id}/history`);
      if (res.data?.success) setTaskHistory(res.data.data || []);
    } catch (error) {
      message.error('Failed to load task history');
      setTaskHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  const exportBoardAsImage = async () => {
    try {
      if (!boardRef.current) return;
      const canvas = await html2canvas(boardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imageUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `task-board-${dayjs().format('YYYYMMDD-HHmmss')}.png`;
      link.click();
      message.success('Task board exported as image');
    } catch (error) {
      message.error('Failed to export image');
    }
  };

  const exportBoardAsPdf = async () => {
    try {
      if (!boardRef.current) return;
      const canvas = await html2canvas(boardRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      const imageData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 10;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let y = 5;
      let remainingHeight = imgHeight;

      pdf.addImage(imageData, 'PNG', 5, y, imgWidth, imgHeight);
      remainingHeight -= pageHeight - 10;

      while (remainingHeight > 0) {
        pdf.addPage();
        y = 5 - (imgHeight - remainingHeight);
        pdf.addImage(imageData, 'PNG', 5, y, imgWidth, imgHeight);
        remainingHeight -= pageHeight - 10;
      }

      pdf.save(`task-board-${dayjs().format('YYYYMMDD-HHmmss')}.pdf`);
      message.success('Task board exported as PDF');
    } catch (error) {
      message.error('Failed to export PDF');
    }
  };

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col><Title level={3} style={{ margin: 0 }}>Task Manager</Title></Col>
        <Col>
          <Space>
            <Button onClick={exportBoardAsImage}>Export as Image</Button>
            <Button onClick={exportBoardAsPdf}>Export as PDF</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal}>
              Add Task
            </Button>
          </Space>
        </Col>
      </Row>

      <Row gutter={16} ref={boardRef}>
        {STATUSES.map((status) => (
          <Col span={8} key={status}>
            <Card
              title={status}
              loading={loading}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => onDropToStatus(status)}
              style={{ height: '70vh' }}
              bodyStyle={{ height: 'calc(70vh - 57px)', overflowY: 'auto', paddingRight: 8 }}
            >
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {groupedTasks[status]?.map((task) => (
                  <Card
                    key={task.id}
                    size="small"
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    title={task.title}
                    extra={(
                      <Space size={8}>
                        {task.status === 'Completed' && (
                          <span
                            title="Completed"
                            style={{
                              width: 10,
                              height: 10,
                              borderRadius: '50%',
                              backgroundColor: '#52c41a',
                              display: 'inline-block'
                            }}
                          />
                        )}
                        <Tag color={PRIORITY_COLORS[task.priority]}>{task.priority}</Tag>
                      </Space>
                    )}
                  >
                    {task.description && <Text type="secondary">{task.description}</Text>}
                    <div style={{ marginTop: 8 }}>
                      <Text strong>Assignee: </Text>
                      <Text>{task.assigneeName || task.assigneeEmail || '-'}</Text>
                    </div>
                    {task.dueDate && (
                      <div>
                        <Text strong>Due: </Text>
                        <Text>{dayjs(task.dueDate).format('DD/MM/YYYY')}</Text>
                      </div>
                    )}
                    <Space style={{ marginTop: 10 }}>
                      <Button size="small" icon={<HistoryOutlined />} onClick={() => openHistory(task)}>
                        History
                      </Button>
                      <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(task)}>
                        Edit
                      </Button>
                      <Button
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => deleteTask(task.id)}
                      >
                        Delete
                      </Button>
                    </Space>
                  </Card>
                ))}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal
        title={editingTask ? 'Edit Task' : 'Create Task'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        destroyOnClose
      >
        <Form form={form} layout="vertical" onFinish={onSubmit}>
          <Form.Item name="title" label="Title" rules={[{ required: true, message: 'Please enter task title' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="description" label="Description">
            <TextArea rows={3} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item name="priority" label="Priority" rules={[{ required: true }]}>
                <Select>
                  <Option value="Low">Low</Option>
                  <Option value="Medium">Medium</Option>
                  <Option value="High">High</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select>
                  {STATUSES.map((s) => <Option key={s} value={s}>{s}</Option>)}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="dueDate" label="Due Date">
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
          </Form.Item>
          {canManageAll && (
            <Form.Item name="userId" label="Assign To">
              <Select allowClear placeholder="Select assignee">
                {users.map((u) => <Option key={u.value} value={u.value}>{u.label}</Option>)}
              </Select>
            </Form.Item>
          )}
        </Form>
      </Modal>

      <Modal
        title={`Task History - ${historyTaskTitle}`}
        open={historyOpen}
        onCancel={() => setHistoryOpen(false)}
        footer={null}
      >
        <Card loading={historyLoading} bordered={false}>
          <Timeline
            items={(taskHistory || []).map((h) => ({
              children: (
                <div>
                  <Text strong>{h.action}</Text>
                  <div><Text type="secondary">{h.details || '-'}</Text></div>
                  <div>
                    <Text type="secondary">
                      By {h.changedByName || h.changedByEmail || 'Unknown'} on {dayjs(h.createdAt).format('DD/MM/YYYY HH:mm')}
                    </Text>
                  </div>
                </div>
              )
            }))}
          />
          {!historyLoading && (!taskHistory || taskHistory.length === 0) && (
            <Text type="secondary">No history records found.</Text>
          )}
        </Card>
      </Modal>
    </div>
  );
};

export default TaskManager;
