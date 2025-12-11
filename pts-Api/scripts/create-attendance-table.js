const { Attendance } = require('../models');

async function createAttendanceTable() {
  try {
    console.log('🔄 Creating attendance table...');
    
    // Sync the Attendance model to create the table
    await Attendance.sync({ force: false });
    
    console.log('✅ Attendance table created successfully!');
    console.log('📊 Table structure:');
    console.log('   - id (Primary Key)');
    console.log('   - userId (Foreign Key to users)');
    console.log('   - clockInTime (DateTime)');
    console.log('   - clockOutTime (DateTime, nullable)');
    console.log('   - totalHours (Decimal)');
    console.log('   - status (Enum: Clocked In, Clocked Out)');
    console.log('   - notes (Text, nullable)');
    console.log('   - workDate (Date)');
    console.log('   - breakStartTime (DateTime, nullable)');
    console.log('   - breakEndTime (DateTime, nullable)');
    console.log('   - totalBreakTime (Decimal)');
    console.log('   - createdAt, updatedAt (Timestamps)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating attendance table:', error);
    process.exit(1);
  }
}

createAttendanceTable();

