const { Task, User, TaskHistory } = require('../models');

const PRIVILEGED_ROLES = new Set(['HR Manager', 'Super Admin', 'System Admin']);
const isPrivilegedRole = (role) => PRIVILEGED_ROLES.has(role);

const formatTask = (task) => ({
  id: task.id,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  userId: task.userId,
  createdBy: task.createdBy,
  assigneeName: task.assignee ? `${task.assignee.firstName} ${task.assignee.lastName}` : '',
  assigneeEmail: task.assignee?.email || '',
  createdAt: task.createdAt,
  updatedAt: task.updatedAt
});

const logTaskHistory = async ({ taskId, action, details, changedBy }) => {
  await TaskHistory.create({ taskId, action, details: details || null, changedBy });
};

const getTasks = async (req, res) => {
  try {
    const { status, userId } = req.query;
    const where = {};
    const privileged = isPrivilegedRole(req.user?.role);

    if (status) where.status = status;
    if (!privileged) where.userId = req.user.id;
    else if (userId) where.userId = userId;

    const tasks = await Task.findAll({
      where,
      include: [{
        model: User,
        as: 'assignee',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    res.json({ success: true, data: tasks.map(formatTask) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch tasks', error: error.message });
  }
};

const createTask = async (req, res) => {
  try {
    const { title, description, status, priority, dueDate, userId } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });

    const privileged = isPrivilegedRole(req.user?.role);
    const assigneeId = privileged ? (userId || req.user.id) : req.user.id;

    const assignee = await User.findByPk(assigneeId);
    if (!assignee) return res.status(404).json({ success: false, message: 'Assignee not found' });

    const task = await Task.create({
      title,
      description: description || null,
      status: status || 'Pending',
      priority: priority || 'Medium',
      dueDate: dueDate || null,
      userId: assigneeId,
      createdBy: req.user.id
    });

    const created = await Task.findByPk(task.id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    await logTaskHistory({
      taskId: task.id,
      action: 'Created',
      details: `Task created with status "${task.status}"`,
      changedBy: req.user.id
    });

    res.status(201).json({ success: true, data: formatTask(created) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to create task', error: error.message });
  }
};

const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, dueDate, userId } = req.body;
    const privileged = isPrivilegedRole(req.user?.role);

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!privileged && task.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const nextAssignee = privileged && userId ? userId : task.userId;
    if (privileged && userId) {
      const assignee = await User.findByPk(userId);
      if (!assignee) return res.status(404).json({ success: false, message: 'Assignee not found' });
    }

    const previous = {
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      userId: task.userId
    };

    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      status: status ?? task.status,
      priority: priority ?? task.priority,
      dueDate: dueDate ?? task.dueDate,
      userId: nextAssignee
    });

    const changes = [];
    if (title !== undefined && title !== previous.title) changes.push(`Title: "${previous.title}" -> "${title}"`);
    if (description !== undefined && description !== previous.description) changes.push('Description updated');
    if (status !== undefined && status !== previous.status) changes.push(`Status: "${previous.status}" -> "${status}"`);
    if (priority !== undefined && priority !== previous.priority) changes.push(`Priority: "${previous.priority}" -> "${priority}"`);
    if (dueDate !== undefined && dueDate !== previous.dueDate) changes.push(`Due Date changed`);
    if (nextAssignee !== previous.userId) changes.push('Assignee changed');

    await logTaskHistory({
      taskId: task.id,
      action: 'Updated',
      details: changes.length ? changes.join(' | ') : 'Task details updated',
      changedBy: req.user.id
    });

    const updated = await Task.findByPk(id, {
      include: [{ model: User, as: 'assignee', attributes: ['id', 'firstName', 'lastName', 'email'] }]
    });

    res.json({ success: true, data: formatTask(updated) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update task', error: error.message });
  }
};

const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!['Pending', 'In Progress', 'Completed'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!isPrivilegedRole(req.user?.role) && task.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const oldStatus = task.status;
    await task.update({ status });
    await logTaskHistory({
      taskId: task.id,
      action: 'Status Changed',
      details: `Status changed from "${oldStatus}" to "${status}"`,
      changedBy: req.user.id
    });
    res.json({ success: true, message: 'Task status updated' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status', error: error.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!isPrivilegedRole(req.user?.role) && task.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await logTaskHistory({
      taskId: task.id,
      action: 'Deleted',
      details: `Task "${task.title}" deleted`,
      changedBy: req.user.id
    });

    await task.destroy();
    res.json({ success: true, message: 'Task deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete task', error: error.message });
  }
};

const getTaskHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ success: false, message: 'Task not found' });
    if (!isPrivilegedRole(req.user?.role) && task.userId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    const history = await TaskHistory.findAll({
      where: { taskId: id },
      include: [{
        model: User,
        as: 'changer',
        attributes: ['id', 'firstName', 'lastName', 'email']
      }],
      order: [['createdAt', 'DESC']]
    });

    const formatted = history.map((h) => ({
      id: h.id,
      action: h.action,
      details: h.details,
      changedBy: h.changedBy,
      changedByName: h.changer ? `${h.changer.firstName} ${h.changer.lastName}` : '',
      changedByEmail: h.changer?.email || '',
      createdAt: h.createdAt
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch task history', error: error.message });
  }
};

module.exports = {
  getTasks,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getTaskHistory
};
