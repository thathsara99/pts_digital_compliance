const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize('pts_compliance', 'hawick_compliance', 'zExL?~3teMz94ekr', {
  host: '217.154.54.148',
  dialect: 'mysql',
  port: 3306,
  logging: false,
  dialectOptions: {
    // Increase max allowed packet size and other settings
    maxAllowedPacket: 67108864, // 64MB
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});

sequelize.authenticate()
  .then(async () => {
    console.log('✅ Connected to MySQL Database via Sequelize!');
    
    // Set MySQL session variables for large data handling
    try {
      await sequelize.query('SET SESSION max_allowed_packet = 67108864'); // 64MB
      await sequelize.query('SET SESSION wait_timeout = 28800'); // 8 hours
      await sequelize.query('SET SESSION interactive_timeout = 28800'); // 8 hours
      console.log('✅ MySQL session variables configured for large data handling');
    } catch (error) {
      console.warn('⚠️ Could not set MySQL session variables:', error.message);
    }
  })
  .catch(err => console.error('❌ Unable to connect to the database:', err));

module.exports = sequelize;
