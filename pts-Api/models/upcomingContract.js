module.exports = (sequelize, DataTypes) => {
  const UpcomingContract = sequelize.define('UpcomingContract', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
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
    tableName: 'upcoming_contracts'
  });

  UpcomingContract.associate = (models) => {
    UpcomingContract.belongsTo(models.User, {
      foreignKey: 'uploadedBy',
      as: 'uploader'
    });
  };

  return UpcomingContract;
};
