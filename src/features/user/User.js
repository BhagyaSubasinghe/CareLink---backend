const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { 
      type: String, 
      required: [true, 'First name is required'], 
      trim: true 
    },
    lastName: { 
      type: String, 
      required: [true, 'Last name is required'], 
      trim: true 
    },
    email: { 
      type: String, 
      required: [true, 'Email is required'], 
      unique: true, 
      lowercase: true, 
      trim: true,
      match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
    },
    phone: { 
      type: String, 
      required: [true, 'Phone number is required'],
      unique: true, 
      trim: true,
      match: [/^\d{10}$/, 'Phone must be 10 digits']
    },
    password: { 
      type: String, 
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false // Don't return password by default
    },
    profilePicture: { 
      type: String, 
      default: null 
    },
    role: { 
      type: String, 
      enum: ['patient', 'doctor', 'admin'], 
      default: 'patient' 
    },
    verified: { 
      type: Boolean, 
      default: false 
    },
    verificationToken: { 
      type: String, 
      select: false 
    },
    verificationTokenExpires: { 
      type: Date, 
      select: false 
    },
    resetPasswordToken: { 
      type: String, 
      select: false 
    },
    resetPasswordExpires: { 
      type: Date, 
      select: false 
    },
    lastLogin: { 
      type: Date, 
      default: null 
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next();
  }
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Method to compare passwords
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
