require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing database...');
    console.log('🔗 DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
    
    // Read schema file
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Execute schema
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully');
    
    // Test connection
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0]);
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      console.log('✅ Database initialization complete');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database initialization failed:', error);
      process.exit(1);
    });
}

module.exports = initializeDatabase;
