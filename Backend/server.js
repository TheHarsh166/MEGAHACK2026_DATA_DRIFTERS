const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
require('dotenv').config();

const User = require('./models/User');
const Book = require('./models/Book');
const QuizResult = require('./models/QuizResult');
const auth = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5001;
console.log('--- STARTING SERVER ON PORT', PORT, '---');

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
  console.error('FATAL ERROR: MONGODB_URI is not defined in .env');
  console.log('Current env keys:', Object.keys(process.env).filter(k => k.includes('MONGO') || k.includes('PORT')));
  process.exit(1);
}

console.log('Connecting to MongoDB...');
mongoose.connect(mongoURI)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch(err => {
    console.error('MongoDB connection error details:', err.message);
    process.exit(1);
  });

// Routes
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already in use' });
    }

    const user = new User({ email, password });
    await user.save();

    console.log('User created:', email);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

    res.status(201).json({
      message: 'User created successfully',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    console.error('SIGNUP ERROR:', err);
    res.status(500).json({ error: err.message, details: 'Check server logs for stack trace' });
  }

});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET || 'secret_key', { expiresIn: '7d' });

    res.json({
      message: 'Login successful',
      token,
      user: { id: user._id, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Book Routes
app.post('/api/books', auth, async (req, res) => {
  try {
    const { title, date, hierarchy, sourceText } = req.body;

    const newBook = new Book({
      userId: req.userId,
      title,
      date,
      hierarchy,
      sourceText
    });

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error('Save Book Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/books', auth, async (req, res) => {
  try {
    const books = await Book.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Quiz Results Routes
app.post('/api/quizzes', auth, async (req, res) => {
  try {
    const { concept, question, options, selectedOption, correctAnswer, evaluation } = req.body;

    const quizResult = new QuizResult({
      userId: req.userId,
      concept,
      question,
      options,
      selectedOption,
      correctAnswer,
      evaluation
    });

    await quizResult.save();
    res.status(201).json(quizResult);
  } catch (err) {
    console.error('Save Quiz Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/auth/verify-token', auth, (req, res) => {
  res.json({ message: 'Token is valid', userId: req.userId });
});

app.listen(PORT, () => {
  console.log(`--- Auth server successfully running on port ${PORT} ---`);
}).on('error', (err) => {
  console.error('--- FAILED TO START SERVER:', err.message, '---');
});
