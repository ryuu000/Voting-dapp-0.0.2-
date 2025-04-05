const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function createMigrationsTable() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } finally {
    client.release();
  }
}

async function getExecutedMigrations() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT name FROM migrations ORDER BY id;');
    return result.rows.map(row => row.name);
  } finally {
    client.release();
  }
}

async function executeMigration(filename) {
  const client = await pool.connect();
  try {
    const filePath = path.join(__dirname, 'migrations', filename);
    const sql = await fs.readFile(filePath, 'utf8');

    await client.query('BEGIN');

    // Execute migration
    await client.query(sql);

    // Record migration
    await client.query(
      'INSERT INTO migrations (name) VALUES ($1);',
      [filename]
    );

    await client.query('COMMIT');
    console.log(`Executed migration: ${filename}`);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error(`Error executing migration ${filename}:`, error);
    throw error;
  } finally {
    client.release();
  }
}

async function runMigrations() {
  try {
    // Create migrations table if it doesn't exist
    await createMigrationsTable();

    // Get list of executed migrations
    const executedMigrations = await getExecutedMigrations();

    // Get list of migration files
    const files = await fs.readdir(path.join(__dirname, 'migrations'));
    const migrationFiles = files
      .filter(f => f.endsWith('.sql'))
      .sort();

    // Execute pending migrations
    for (const file of migrationFiles) {
      if (!executedMigrations.includes(file)) {
        await executeMigration(file);
      }
    }

    console.log('All migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations }; 