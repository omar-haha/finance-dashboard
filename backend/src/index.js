const express = require('express');
const cors = require('cors');
const transactionsRouter = require('./routes/transactions');
const { initDatabase } = require('./db/sqlite');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

initDatabase();

app.use('/api/transactions', transactionsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Finance Dashboard backend is running' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
