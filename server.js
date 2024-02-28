const { Client } = require("pg");

const client = new Client({
  connectionString:
    process.env.DATABASE_URL || "postgres://localhost:5432/acme_hr_directory",
});

async function init() {
  try {
    await client.connect();

    const SQL = `
      DROP TABLE IF EXISTS departments;
      DROP TABLE IF EXISTS employees;

      CREATE TABLE employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        title VARCHAR(100)
      );

      CREATE TABLE departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      INSERT INTO employees(name, title) VALUES
        ('John Doe', 'Manager'),
        ('Jane Smith', 'Team Lead'),
        ('Michael Johnson', 'Software Engineer'),
        ('Emily Brown', 'Product Manager'),
        ('Alex Davis', 'Sales Representative');

      INSERT INTO departments(name) VALUES
        ('Management'),
        ('Engineering'),
        ('Sales'),
        ('Marketing');
    `;

    await client.query(SQL);
    console.log('Database initialized successfully.');

    await client.end();
  } catch (err) {
    console.error('Error initializing database:', err.message);
    await client.end();
  }
}

init();

