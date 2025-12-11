const fs = require('fs');
const path = require('path');
const sequelize = require('../config/db');

async function createDocumentsTable() {
  try {
    console.log('🔄 Creating documents table...');
    
    // Read the SQL migration file
    const sqlPath = path.join(__dirname, '../migrations/create-documents-table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    
    // Execute the SQL
    await sequelize.query(sql);
    
    console.log('✅ Documents table created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating documents table:', error);
    process.exit(1);
  }
}

createDocumentsTable(); 