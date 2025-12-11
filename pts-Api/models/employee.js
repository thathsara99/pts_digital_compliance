// models/employee.js
module.exports = (sequelize, DataTypes) => {
  const Employee = sequelize.define('Employee', {
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
    employeeId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false
    },
    nationality: {
      type: DataTypes.STRING,
      allowNull: false
    },
    emergencyContact: {
      type: DataTypes.STRING,
      allowNull: false
    },
    niNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    visaType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    eVisaShareCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    visaStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    visaEndDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    bankName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    sortCode: {
      type: DataTypes.STRING,
      allowNull: false
    },
    accountHolder: {
      type: DataTypes.STRING,
      allowNull: false
    },
    passportPhoto: {
      type: DataTypes.TEXT, // Base64 encoded image
      allowNull: true
    },
    employmentContract: {
      type: DataTypes.TEXT, // Base64 encoded PDF
      allowNull: true
    },
    rightToWorkDocument: {
      type: DataTypes.TEXT, // Base64 encoded document
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Terminated'),
      defaultValue: 'Active'
    }
  }, {
    timestamps: true,
    tableName: 'employees'
  });

  Employee.associate = (models) => {
    Employee.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
    // Employee doesn't need its own departmentId since it's linked through User
    // The department info can be accessed through User.department
  };

  return Employee;
}; 