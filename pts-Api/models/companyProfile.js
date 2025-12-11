module.exports = (sequelize, DataTypes) => {
    const CompanyProfile = sequelize.define('CompanyProfile', {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      companyName: DataTypes.STRING,
      companyAddress: DataTypes.STRING,
      companyEmail: DataTypes.STRING,
      companyContact: DataTypes.STRING,
      companyWebsite: DataTypes.STRING,
      companyFaceBook: DataTypes.STRING,
  
      hawickMarketPayeeCode: DataTypes.STRING,
      accountOfficeReferences: DataTypes.STRING,
      companyTaxCode: DataTypes.STRING,
      localAuthorityName: DataTypes.STRING,
      localPoliceContact: DataTypes.STRING,
  
      maintainEmergency: DataTypes.TEXT,
      regsiteredManagerContactNumber: DataTypes.STRING,
      nameOfRegisteredManager: DataTypes.STRING,
      companyOfficeHours: DataTypes.STRING,
      registeredProviderName: DataTypes.STRING,
      mediaEnquiryHandlingPerson: DataTypes.STRING,
      responsibleForComplaints: DataTypes.STRING,
      securitySystemProvider: DataTypes.STRING,
      securityAlarmContactNumber: DataTypes.STRING,
    }, {
      tableName: 'company_profiles',
      timestamps: true
    });
  
    CompanyProfile.associate = (models) => {
      CompanyProfile.hasMany(models.RegistrationDetail, {
        foreignKey: 'companyProfileId',
        as: 'registrationDetails',
        onDelete: 'CASCADE'
      });
    };
  
    return CompanyProfile;
  };
  