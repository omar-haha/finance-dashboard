require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { pool, initDatabase } = require('../src/db/db');

const CATEGORIES = [
  'Food', 'Transport', 'Rent', 'Entertainment',
  'Health', 'Shopping', 'Utilities', 'Salary', 'Freelance',
];

const TRANSACTIONS = [
  // May 2026
  { title: 'Monthly salary',      category: 'Salary',        amount: 3200.00, type: 'income',  date: '2026-05-01' },
  { title: 'Rent',                category: 'Rent',          amount: 1350.00, type: 'expense', date: '2026-05-01' },
  { title: 'Grocery run',         category: 'Food',          amount:   94.50, type: 'expense', date: '2026-05-06' },
  { title: 'Bus pass',            category: 'Transport',     amount:   42.00, type: 'expense', date: '2026-05-05' },
  { title: 'Pharmacy',            category: 'Health',        amount:   31.80, type: 'expense', date: '2026-05-10' },
  { title: 'Netflix',             category: 'Entertainment', amount:   17.99, type: 'expense', date: '2026-05-03' },
  // April 2026
  { title: 'Monthly salary',      category: 'Salary',        amount: 3200.00, type: 'income',  date: '2026-04-01' },
  { title: 'Freelance project',   category: 'Freelance',     amount:  620.00, type: 'income',  date: '2026-04-20' },
  { title: 'Rent',                category: 'Rent',          amount: 1350.00, type: 'expense', date: '2026-04-01' },
  { title: 'Dinner with friends', category: 'Food',          amount:   76.40, type: 'expense', date: '2026-04-14' },
  { title: 'Amazon order',        category: 'Shopping',      amount:  112.99, type: 'expense', date: '2026-04-18' },
  { title: 'Electricity bill',    category: 'Utilities',     amount:   71.30, type: 'expense', date: '2026-04-08' },
  { title: 'Gym membership',      category: 'Health',        amount:   45.00, type: 'expense', date: '2026-04-02' },
  { title: 'Uber rides',          category: 'Transport',     amount:   38.50, type: 'expense', date: '2026-04-22' },
  // March 2026
  { title: 'Monthly salary',      category: 'Salary',        amount: 3200.00, type: 'income',  date: '2026-03-01' },
  { title: 'Freelance project',   category: 'Freelance',     amount:  350.00, type: 'income',  date: '2026-03-28' },
  { title: 'Rent',                category: 'Rent',          amount: 1350.00, type: 'expense', date: '2026-03-01' },
  { title: 'Groceries',           category: 'Food',          amount:   88.20, type: 'expense', date: '2026-03-09' },
  { title: 'Coffee & lunch',      category: 'Food',          amount:   47.60, type: 'expense', date: '2026-03-22' },
  { title: 'Concert tickets',     category: 'Entertainment', amount:  145.00, type: 'expense', date: '2026-03-20' },
  { title: 'Internet bill',       category: 'Utilities',     amount:   58.00, type: 'expense', date: '2026-03-05' },
  { title: 'New jacket',          category: 'Shopping',      amount:   89.00, type: 'expense', date: '2026-03-15' },
];

async function seed() {
  await initDatabase();

  console.log('Seeding categories...');
  for (const name of CATEGORIES) {
    await pool.query(
      'INSERT INTO categories (name) VALUES ($1) ON CONFLICT (name) DO NOTHING',
      [name]
    );
  }

  console.log('Seeding transactions...');
  for (const tx of TRANSACTIONS) {
    await pool.query(
      'INSERT INTO transactions (title, category, amount, type, date) VALUES ($1, $2, $3, $4, $5)',
      [tx.title, tx.category, tx.amount, tx.type, tx.date]
    );
  }

  console.log(`Done — ${CATEGORIES.length} categories, ${TRANSACTIONS.length} transactions.`);
  await pool.end();
}

seed().catch((err) => { console.error('Seed failed:', err.message); process.exit(1); });
