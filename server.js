const express = require('express');
const { Client } = require('pg');
const morgan = require('morgan');

const app = express();
const port = process.env.PORT || 3000;

const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgres://localhost:5432/acme_hr_directory',

});

app.use(express.json());
app.use(morgan('dev'));

app.get('/api/categories', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM categories;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/notes', async (req, res, next) => {
  try {
    const SQL = `SELECT * FROM notes ORDER BY created_at DESC;`;
    const response = await client.query(SQL);
    res.send(response.rows);
  } catch (ex) {
    next(ex);
  }
});

app.post('/api/notes', async (req, res, next) => {
  try {
    const { txt, category_id } = req.body;
    const SQL = `
      INSERT INTO notes(txt, category_id)
      VALUES($1, $2)
      RETURNING *;
    `;
    const response = await client.query(SQL, [txt, category_id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const { txt, ranking, category_id } = req.body;
    const SQL = `
      UPDATE notes
      SET txt = $1, ranking = $2, category_id = $3, updated_at = now()
      WHERE id = $4
      RETURNING *;
    `;
    const response = await client.query(SQL, [txt, ranking, category_id, req.params.id]);
    res.send(response.rows[0]);
  } catch (ex) {
    next(ex);
  }
});

app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const SQL = `
      DELETE FROM notes
      WHERE id = $1;
    `;
    await client.query(SQL, [req.params.id]);
    res.sendStatus(204);
  } catch (ex) {
    next(ex);
  }
});

// Add foreign key constraint
async function addForeignKeyConstraint() {
  try {
    const SQL = `
      ALTER TABLE employees
      ADD CONSTRAINT fk_department_id
      FOREIGN KEY (department_id)
      REFERENCES departments(id)
      ON DELETE CASCADE;
    `;
    await client.query(SQL);
    console.log('Foreign key constraint added successfully.');
  } catch (err) {
    console.error('Error adding foreign key constraint:', err.message);
  }
}

// Initialize database, add foreign key constraint, and start server
async function init() {
  try {
    await client.connect();
    console.log('Connected to database');

    // Create tables and seed data
    const SQL = `
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        title VARCHAR(100),
        department_id INTEGER
      );

      INSERT INTO departments (name) VALUES
        ('Management'),
        ('Engineering'),
        ('Sales'),
        ('Marketing');

      INSERT INTO employees (name, title, department_id) VALUES
        ('John Doe', 'Manager', 1),
        ('Jane Smith', 'Team Lead', 1),
        ('Michael Johnson', 'Software Engineer', 2),
        ('Emily Brown', 'Product Manager', 4),
        ('Alex Davis', 'Sales Representative', 3);
    `;
    await client.query(SQL);
    console.log('Database initialized successfully.');

    await addForeignKeyConstraint();
    app.listen(port, () => console.log(`Server listening on port ${port}`));
  } catch (err) {
    console.error('Error initializing database:', err.message);
  }
}

init();
