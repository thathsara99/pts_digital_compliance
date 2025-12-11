// models/document.js
module.exports = (sequelize, DataTypes) => {
  const Document = sequelize.define('Document', {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    fileName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    documentType: {
      type: DataTypes.ENUM(
        'Identification Docs',
        'Right to Work Check',
        'Certificates',
        'References',
        'Offer Letter',
        'Contracts',
        'Supporting Docs',
        'CV',
        'Other'
      ),
      allowNull: false
    },
    fileData: {
      type: DataTypes.TEXT('LONG'), // Base64 encoded file data - can store up to 4,294,967,295 characters
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING,
      allowNull: false
    },
    fileSize: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    // For existing employees
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    // For new applicants (not in system yet)
    applicantName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    applicantEmail: {
      type: DataTypes.STRING,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive', 'Deleted'),
      defaultValue: 'Active'
    }
  }, {
    timestamps: true,
    tableName: 'documents'
  });

  Document.associate = (models) => {
    Document.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });
  };

  return Document;
}; 