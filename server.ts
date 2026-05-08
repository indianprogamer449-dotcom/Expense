import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import mongoose from 'mongoose';

// MongoDB Connection Setup
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => console.log('Connected to MongoDB Atlas'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.warn('MONGODB_URI is not defined. Set it in the settings menu to enable cloud database.');
}

// Transaction Schema
const transactionSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, required: true },
  note: { type: String, default: '' },
  date: { type: String, required: true },
  isRecurring: { type: Boolean, default: false }
}, { timestamps: true });

const TransactionModel = mongoose.model('Transaction', transactionSchema);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get('/api/transactions', async (req, res) => {
    try {
      if (!MONGODB_URI) {
        return res.status(400).json({ error: 'MongoDB connection not configured' });
      }
      const docs = await TransactionModel.find().sort({ date: -1 });
      res.json(docs);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', async (req, res) => {
    try {
      if (!MONGODB_URI) {
        return res.status(400).json({ error: 'MongoDB connection not configured' });
      }
      
      const transactions = req.body;
      
      // We use bulkWrite or deleteMany+insertMany for simple sync of the entire array 
      // from client (assuming the client sends the full state as per current App.tsx logic)
      if (Array.isArray(transactions)) {
        await TransactionModel.deleteMany({}); // Clear old and replace with current UI state
        if (transactions.length > 0) {
          await TransactionModel.insertMany(transactions);
        }
        res.json({ success: true });
      } else {
        res.status(400).json({ error: 'Invalid data format' });
      }
    } catch (error) {
      console.error('Save error:', error);
      res.status(500).json({ error: 'Failed to save transactions' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
