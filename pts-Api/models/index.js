const Sequelize = require('sequelize');
const sequelize = require('../config/db');

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize, Sequelize.DataTypes);
db.Department = require('./department')(sequelize, Sequelize.DataTypes);
db.Role = require('./role')(sequelize, Sequelize.DataTypes);
db.Employee = require('./employee')(sequelize, Sequelize.DataTypes);
db.CompanyProfile = require('./companyProfile')(sequelize, Sequelize.DataTypes);
db.RegistrationDetail = require('./registrationDetail')(sequelize, Sequelize.DataTypes);
db.Document = require('./document')(sequelize, Sequelize.DataTypes);
db.Leave = require('./leave')(sequelize, Sequelize.DataTypes);
db.Attendance = require('./attendance')(sequelize, Sequelize.DataTypes);  

// Setup associations
Object.values(db).forEach(model => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
