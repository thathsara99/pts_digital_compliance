module.exports = (sequelize, DataTypes) => {
  const Customer = sequelize.define('Customer', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customerName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false
    },
    contactNumber: {
      type: DataTypes.STRING,
      allowNull: false
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    industry: {
      type: DataTypes.STRING,
      allowNull: true
    },
    assignedEmployeeId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'users',
        key: 'id'
      },
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      defaultValue: 'Active'
    }
  }, {
    timestamps: true,
    tableName: 'customers'
  });

  Customer.associate = (models) => {
    Customer.belongsTo(models.User, {
      foreignKey: 'assignedEmployeeId',
      as: 'assignedEmployee'
    });
    Customer.hasMany(models.CustomerContract, {
      foreignKey: 'customerId',
      as: 'contracts'
    });
  };

  return Customer;
};
