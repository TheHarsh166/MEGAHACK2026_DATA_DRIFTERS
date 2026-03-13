const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: false
  },
  googleId: {
    type: String,
    unique: true,
    sparse: true
  },
  name: String,
  picture: String
}, { timestamps: true });

// Hash password before saving - Modern async/await pattern for Mongoose v9+
userSchema.pre('save', async function() {
  const user = this;
  if (!user.isModified('password') || !user.password) return;

  try {
    console.log('Hashing password for:', user.email);
    const hash = await bcrypt.hash(user.password, 10);
    user.password = hash;
    console.log('Password hashed successfully');
  } catch (err) {
    console.error('Bcrypt error:', err);
    throw err;
  }
});

// Compare password method
userSchema.methods.comparePassword = function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
