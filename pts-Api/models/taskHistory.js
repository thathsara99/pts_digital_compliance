module.exports = (sequelize, DataTypes) => {
  const TaskHistory = sequelize.define('TaskHistory', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    taskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'tasks',
        key: 'id'
      }
    },
    action: {
      type: DataTypes.ENUM('Created', 'Updated', 'Status Changed', 'Deleted'),
      allowNull: false
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    changedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'task_histories'
  });

  TaskHistory.associate = (models) => {
    TaskHistory.belongsTo(models.Task, {
      foreignKey: 'taskId',
      as: 'task'
    });
    TaskHistory.belongsTo(models.User, {
      foreignKey: 'changedBy',
      as: 'changer'
    });
  };

  return TaskHistory;
};
