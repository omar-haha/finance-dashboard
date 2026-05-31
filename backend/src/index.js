require('dotenv').config();
const express = require('express');
const cors = require('cors');
const transactionsRouter = require('./routes/transactions');
const categoriesRouter = require('./routes/categories');
const { initDatabase } = require('./db/db');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.use('/api/transactions', transactionsRouter);
app.use('/api/categories', categoriesRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Finance Dashboard backend is running' });
});

initDatabase()
  .then(() => app.listen(PORT, () => console.log(`Server listening on port ${PORT}`)))
  .catch((err) => { console.error('Failed to initialize database:', err); process.exit(1); });
