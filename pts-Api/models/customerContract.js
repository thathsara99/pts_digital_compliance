module.exports = (sequelize, DataTypes) => {
  const CustomerContract = sequelize.define('CustomerContract', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    customerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'customers',
        key: 'id'
      }
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    mimeType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentData: {
      type: DataTypes.TEXT('long'),
      allowNull: false
    },
    uploadedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    }
  }, {
    timestamps: true,
    tableName: 'customer_contracts'
  });

  CustomerContract.associate = (models) => {
    CustomerContract.belongsTo(models.Customer, {
      foreignKey: 'customerId',
      as: 'customer'
    });
    CustomerContract.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
  };

  return CustomerContract;
};
