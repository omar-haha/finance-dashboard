const express = require('express');
const router = express.Router();
const { pool } = require('../db/db');

router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM transactions ORDER BY date DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, category, amount, type, date } = req.body;
  if (!title || !category || !amount || !type || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { rows } = await pool.query(
      'INSERT INTO transactions (title, category, amount, type, date) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [title, category, amount, type, date]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/summary/monthly', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT TO_CHAR(date::date, 'YYYY-MM') as month,
             SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
             SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
      FROM transactions
      GROUP BY month
      ORDER BY month DESC
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM transactions WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: 'Transaction not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
