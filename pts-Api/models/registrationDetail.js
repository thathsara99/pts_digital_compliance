module.exports = (sequelize, DataTypes) => {
    const RegistrationDetail = sequelize.define('RegistrationDetail', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      label: {
        type: DataTypes.STRING,
        allowNull: false
      },
      value: {
        type: DataTypes.STRING,
        allowNull: false
      },
      companyProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false
      }
    }, {
      tableName: 'registration_details',
      timestamps: true
    });
  
    RegistrationDetail.associate = (models) => {
      RegistrationDetail.belongsTo(models.CompanyProfile, {
        foreignKey: 'companyProfileId',
        as: 'companyProfile'
      });
    };
  
    return RegistrationDetail;
  };
  