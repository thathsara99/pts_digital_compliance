// models/attendance.js
module.exports = (sequelize, DataTypes) => {
  const Attendance = sequelize.define('Attendance', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    clockInTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    clockOutTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalHours: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM('Clocked In', 'Clocked Out'),
      defaultValue: 'Clocked In'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    workDate: {
      type: DataTypes.DATEONLY,
      allowNull: false
    },
    breakStartTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    breakEndTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    totalBreakTime: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      defaultValue: 0
    }
  }, {
    timestamps: true,
    tableName: 'attendances',
    indexes: [
      {
        fields: ['userId', 'workDate']
      },
      {
        fields: ['workDate']
      }
    ]
  });

  Attendance.associate = (models) => {
    Attendance.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'employee'
    });
  };

  return Attendance;
};
