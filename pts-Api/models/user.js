// models/User.js
module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    middleName: {
      type: DataTypes.STRING
    },
    lastName: {
      type: DataTypes.STRING
    },
    gender: {
      type: DataTypes.ENUM('Male', 'Female', 'Other'),
      allowNull: false
    },
    dateOfBirth: {
      type: DataTypes.DATE,
      allowNull: false
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('System Admin', 'Company Admin', 'HR', 'Accountant', 'Manager', 'Employee'),
      allowNull: false
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    profilePicture: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    departmentId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'departments',
        key: 'id'
      },
      allowNull: true
    }
  }, {
    timestamps: true,
    tableName: 'users'
  });

  User.associate = (models) => {
    User.belongsTo(models.Department, {
      foreignKey: 'departmentId',
      as: 'department'
    });
    
    // Add association to Employee
    User.hasOne(models.Employee, {
      foreignKey: 'userId',
      as: 'employee'
    });

    // Add association to Documents
    User.hasMany(models.Document, {
      foreignKey: 'userId',
      as: 'documents'
    });

    // Add association to Leaves (as employee)
    User.hasMany(models.Leave, {
      foreignKey: 'userId',
      as: 'leaves'
    });

    // Add association to Leaves (as approver)
    User.hasMany(models.Leave, {
      foreignKey: 'approvedBy',
      as: 'approvedLeaves'
    });
  };

  return User;
};
