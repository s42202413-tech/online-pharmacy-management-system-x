 const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MySQL Connection Setup
const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'pharmacy_db'
});

// Connect to Database
db.connect((err) => {
  if (err) {
    console.error('❌ MySQL Connection Error:', err.message);
    return;
  }
  console.log('✅ MySQL Database (pharmacy_db) Connected!');
});

// --- API ROUTES: MEDICINES ---

app.get('/api/medicines', (req, res) => {
  const sql = 'SELECT * FROM medicines';
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching medicines:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

app.post('/api/medicines', (req, res) => {
  const { name, category, price, stock, description } = req.body;
  const sql = 'INSERT INTO medicines (name, category, price, stock, description) VALUES (?, ?, ?, ?, ?)';
  
  db.query(sql, [name, category, price, stock, description], (err, result) => {
    if (err) {
      console.error('Error adding medicine:', err);
      return res.status(500).json({ error: 'Failed to add medicine' });
    }
    res.status(201).json({ message: 'Medicine added successfully!', id: result.insertId });
  });
});

app.put('/api/medicines/:id', (req, res) => {
  const medicineId = req.params.id;
  const { name, category, price, stock, description } = req.body;
  const sql = 'UPDATE medicines SET name = ?, category = ?, price = ?, stock = ?, description = ? WHERE medicine_id = ?';
  
  db.query(sql, [name, category, price, stock, description, medicineId], (err, result) => {
    if (err) {
      console.error('Error updating medicine:', err);
      return res.status(500).json({ error: 'Failed to update medicine' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json({ message: 'Medicine updated successfully!' });
  });
});

app.delete('/api/medicines/:id', (req, res) => {
  const medicineId = req.params.id;
  const sql = 'DELETE FROM medicines WHERE medicine_id = ?';
  
  db.query(sql, [medicineId], (err, result) => {
    if (err) {
      console.error('Error deleting medicine:', err);
      return res.status(500).json({ error: 'Failed to delete medicine' });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }
    res.json({ message: 'Medicine deleted successfully!' });
  });
});

// --- API ROUTES: SALES ---

app.post('/api/sales', (req, res) => {
  const { medicine_id, quantity } = req.body;

  const checkSql = 'SELECT * FROM medicines WHERE medicine_id = ?';
  db.query(checkSql, [medicine_id], (err, results) => {
    if (err || results.length === 0) {
      return res.status(404).json({ error: 'Medicine not found' });
    }

    const medicine = results[0];
    if (medicine.stock < quantity) {
      return res.status(400).json({ error: 'Insufficient stock available!' });
    }

    const total_price = medicine.price * quantity;

    const saleSql = 'INSERT INTO sales (medicine_id, quantity, total_price) VALUES (?, ?, ?)';
    db.query(saleSql, [medicine_id, quantity, total_price], (err, result) => {
      if (err) {
        console.error('Error recording sale:', err);
        return res.status(500).json({ error: 'Failed to record sale' });
      }

      const updateStockSql = 'UPDATE medicines SET stock = stock - ? WHERE medicine_id = ?';
      db.query(updateStockSql, [quantity, medicine_id], (err) => {
        if (err) {
          console.error('Error updating stock:', err);
          return res.status(500).json({ error: 'Failed to update stock' });
        }

        res.status(201).json({ 
          message: 'Sale recorded successfully!', 
          sale_id: result.insertId, 
          total_price 
        });
      });
    });
  });
});

app.get('/api/sales', (req, res) => {
  const sql = `
    SELECT s.sale_id, m.name AS medicine_name, s.quantity, s.total_price, s.sale_date 
    FROM sales s 
    JOIN medicines m ON s.medicine_id = m.medicine_id
    ORDER BY s.sale_date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) {
      console.error('Error fetching sales:', err);
      return res.status(500).json({ error: 'Database error' });
    }
    res.json(results);
  });
});

// --- API ROUTES: USERS ---

app.post('/api/users/register', (req, res) => {
  const { full_name, email, password_hash, role } = req.body;
  const sql = 'INSERT INTO users (full_name, email, password_hash, role) VALUES (?, ?, ?, ?)';

  db.query(sql, [full_name, email, password_hash, role || 'staff'], (err, result) => {
    if (err) {
      console.error('Error registering user:', err);
      return res.status(500).json({ error: 'Email already exists or database error' });
    }
    res.status(201).json({ message: 'User registered successfully!', user_id: result.insertId });
  });
});

app.post('/api/users/login', (req, res) => {
  const { email, password_hash } = req.body;
  const sql = 'SELECT * FROM users WHERE email = ? AND password_hash = ?';

  db.query(sql, [email, password_hash], (err, results) => {
    if (err) {
      console.error('Error during login:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = results[0];
    res.json({ message: 'Login successful!', user: { id: user.user_id, name: user.full_name, email: user.email, role: user.role } });
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});