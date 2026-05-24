const express = require('express');
const router = express.Router();
const { db } = require('../db/sqlite');

router.get('/', (req, res) => {
  db.all('SELECT * FROM transactions ORDER BY date DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

router.post('/', (req, res) => {
  const { title, category, amount, type, date } = req.body;
  if (!title || !category || !amount || !type || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const stmt = db.prepare(
    'INSERT INTO transactions (title, category, amount, type, date) VALUES (?, ?, ?, ?, ?)'
  );

  stmt.run(title, category, amount, type, date, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ id: this.lastID, title, category, amount, type, date });
  });
});

router.get('/summary/monthly', (req, res) => {
  db.all(
    `SELECT strftime('%Y-%m', date) as month,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
      FROM transactions
      GROUP BY month
      ORDER BY month DESC`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM transactions WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json({ success: true });
  });
});

module.exports = router;
