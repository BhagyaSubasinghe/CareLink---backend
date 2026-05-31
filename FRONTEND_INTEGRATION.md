# Frontend Integration Guide - CareLink Auth API

## Overview
This guide shows how to integrate your CareLink frontend React application with the backend authentication API.

---

## 1. Setup API Service

Update your `src/services/api.js` file:

```javascript
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired, clear and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 2. Create Auth Service

Create `src/services/authService.js`:

```javascript
import api from './api';

const authService = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', {
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        phone: userData.phone,
        password: userData.password,
        confirmPassword: userData.confirmPassword,
      });
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Registration failed' };
    }
  },

  // Login user
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Login failed' };
    }
  },

  // Get current user
  getCurrentUser: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Failed to fetch user' };
    }
  },

  // Update user profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Update failed' };
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Request failed' };
    }
  },

  // Reset password
  resetPassword: async (token, password, confirmPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword,
      });
      
      if (response.data.token) {
        localStorage.setItem('authToken', response.data.token);
      }
      
      return response.data;
    } catch (error) {
      throw error.response?.data || { success: false, message: 'Reset failed' };
    }
  },

  // Logout
  logout: () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  },

  // Check if user is logged in
  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  // Get stored user
  getStoredUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
};

export default authService;
```

---

## 3. Update Login Component

Update `src/pages/Login.jsx`:

```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Facebook, Mail, Lock } from '@mui/icons-material';
import authService from '../services/authService';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import './Login.css';

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [forgotPasswordOpen, setForgotPasswordOpen] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authService.login(formData.email, formData.password);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.user));
      
      // Redirect to dashboard
      navigate('/dashboard');
    } catch (error) {
      setApiError(error.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    alert('Google login integration coming soon');
  };

  const handleFacebookLogin = () => {
    alert('Facebook login integration coming soon');
  };

  return (
    <Container maxWidth="sm" className="login-container">
      <Card className="login-card">
        <CardContent>
          <Box className="login-header">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Welcome Back
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Login to access your CareLink account
            </Typography>
          </Box>

          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

          <Box className="social-login">
            <Button fullWidth variant="outlined" startIcon={<Google />} onClick={handleGoogleLogin} sx={{ mb: 1 }}>
              Login with Google
            </Button>
            <Button fullWidth variant="outlined" startIcon={<Facebook />} onClick={handleFacebookLogin}>
              Login with Facebook
            </Button>
          </Box>

          <Divider sx={{ my: 2 }}>
            <Typography variant="caption" color="textSecondary">
              or login with email
            </Typography>
          </Divider>

          <form onSubmit={handleSubmit} className="login-form">
            <TextField
              fullWidth
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              error={!!errors.email}
              helperText={errors.email}
              variant="outlined"
              size="medium"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Mail sx={{ color: 'action.active', mr: 1 }} />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              error={!!errors.password}
              helperText={errors.password}
              variant="outlined"
              size="medium"
              margin="normal"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock sx={{ color: 'action.active', mr: 1 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Box className="login-options">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                }
                label="Remember me"
              />
              <Typography
                component="button"
                variant="body2"
                sx={{ color: 'primary.main', cursor: 'pointer', background: 'none', border: 'none', p: 0 }}
                onClick={() => setForgotPasswordOpen(true)}
              >
                Forgot Password?
              </Typography>
            </Box>

            <Button
              fullWidth
              type="submit"
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Login'}
            </Button>
          </form>

          <Typography variant="body2" align="center" color="textSecondary" sx={{ mt: 2 }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
              Sign up here
            </Link>
          </Typography>
        </CardContent>
      </Card>

      <ForgotPasswordDialog open={forgotPasswordOpen} onClose={() => setForgotPasswordOpen(false)} />
    </Container>
  );
}
```

---

## 4. Update Register Component

Update `src/pages/Register.jsx`:

```javascript
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  LinearProgress,
  Alert,
  InputAdornment,
  IconButton,
  Check,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Google, Facebook, Person, Mail, Lock, Phone, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import authService from '../services/authService';
import ForgotPasswordDialog from '../components/ForgotPasswordDialog';
import './Register.css';

const PASSWORD_REQUIREMENTS = {
  length: { regex: /.{8,}/, label: 'At least 8 characters' },
  uppercase: { regex: /[A-Z]/, label: 'One uppercase letter' },
  lowercase: { regex: /[a-z]/, label: 'One lowercase letter' },
  number: { regex: /[0-9]/, label: 'One number' },
  special: { regex: /[!@#$%^&*]/, label: 'One special character (!@#$%^&*)' },
};

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const calculatePasswordStrength = (password) => {
    if (!password) return 0;
    let strength = 0;
    Object.values(PASSWORD_REQUIREMENTS).forEach((req) => {
      if (req.regex.test(password)) strength += 20;
    });
    return strength;
  };

  const getPasswordStrengthLabel = (strength) => {
    if (strength === 0) return { label: 'No password', color: 'default' };
    if (strength < 40) return { label: 'Weak', color: 'error' };
    if (strength < 60) return { label: 'Fair', color: 'warning' };
    if (strength < 80) return { label: 'Good', color: 'info' };
    return { label: 'Strong', color: 'success' };
  };

  const passwordStrength = calculatePasswordStrength(formData.password);
  const passwordStrengthLabel = getPasswordStrengthLabel(passwordStrength);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Phone must be 10 digits';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (passwordStrength < 60) {
      newErrors.password = 'Password is too weak';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      newErrors.terms = 'You must agree to terms and conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setApiError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await authService.register(formData);
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(response.user));
      
      setSuccess(true);

      // Redirect after success
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      setApiError(error.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Container maxWidth="sm" className="register-container">
        <Box className="success-state">
          <CheckIcon sx={{ fontSize: 80, color: '#10b981', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Registration Successful!
          </Typography>
          <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
            Your account has been created. Redirecting to dashboard...
          </Typography>
          <LinearProgress sx={{ mb: 2 }} />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm" className="register-container">
      <Card className="register-card">
        <CardContent>
          <Box className="register-header">
            <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
              Create Account
            </Typography>
            <Typography variant="body1" color="textSecondary">
              Join CareLink to manage your health
            </Typography>
          </Box>

          {apiError && <Alert severity="error" sx={{ mb: 2 }}>{apiError}</Alert>}

          <form onSubmit={handleSubmit} className="register-form">
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <TextField
                label="First Name"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                error={!!errors.firstName}
                helperText={errors.firstName}
                size="small"
              />
              <TextField
                label="Last Name"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                error={!!errors.lastName}
                helperText={errors.lastName}
                size="small"
              />
            </Box>

            <TextField
              fullWidth
              label="Email Address"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              error={!!errors.email}
              helperText={errors.email}
              margin="normal"
              InputProps={{ startAdornment: <InputAdornment position="start"><Mail /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="Phone Number"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              error={!!errors.phone}
              helperText={errors.phone || 'Format: 1234567890'}
              margin="normal"
              InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
            />

            <TextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleInputChange}
              error={!!errors.password}
              helperText={errors.password}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {/* Password Strength Indicator */}
            <Box sx={{ mt: 1 }}>
              <LinearProgress
                variant="determinate"
                value={passwordStrength}
                sx={{
                  height: 6,
                  backgroundColor: '#e0e0e0',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: passwordStrengthLabel.color === 'error' ? '#d32f2f' : passwordStrengthLabel.color === 'warning' ? '#f57c00' : '#10b981',
                  },
                }}
              />
              <Typography variant="caption" sx={{ mt: 0.5 }}>
                Strength: {passwordStrengthLabel.label}
              </Typography>
            </Box>

            {/* Password Requirements */}
            <Box sx={{ mt: 2, mb: 2 }}>
              {Object.entries(PASSWORD_REQUIREMENTS).map(([key, requirement]) => (
                <Box key={key} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                  {requirement.regex.test(formData.password) ? (
                    <CheckIcon sx={{ fontSize: 18, color: '#10b981', mr: 1 }} />
                  ) : (
                    <CloseIcon sx={{ fontSize: 18, color: '#ccc', mr: 1 }} />
                  )}
                  <Typography
                    variant="caption"
                    sx={{
                      color: requirement.regex.test(formData.password) ? '#10b981' : '#999',
                    }}
                  >
                    {requirement.label}
                  </Typography>
                </Box>
              ))}
            </Box>

            <TextField
              fullWidth
              label="Confirm Password"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              margin="normal"
              InputProps={{
                startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <FormControlLabel
              control={<Checkbox checked={agreeToTerms} onChange={(e) => setAgreeToTerms(e.target.checked)} />}
              label="I agree to terms and conditions"
              sx={{ mt: 2, mb: 1 }}
            />
            {errors.terms && <Typography color="error" variant="caption">{errors.terms}</Typography>}

            <Button fullWidth type="submit" variant="contained" sx={{ mt: 3 }} disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>

            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: '#1976d2', textDecoration: 'none', fontWeight: 600 }}>
                Login here
              </Link>
            </Typography>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
```

---

## 5. Setup Environment Variables

Create `.env` file in the frontend root:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

---

## 6. Setup .env file in Backend

Create `.env` file in the backend root:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/carelink
JWT_SECRET=your_super_secret_jwt_key_change_in_production
FRONTEND_URL=http://localhost:3000
```

---

## Running the Application

### Backend
```bash
cd CareLink-backend
npm install
npm run dev
```

### Frontend
```bash
cd CareLink-frontend
npm install
npm start
```

---

## Testing the Integration

1. **Register** at `http://localhost:3000/register`
2. **Login** at `http://localhost:3000/login`
3. **View Profile** at `http://localhost:3000/dashboard`

---

## Troubleshooting

### CORS Error
- Check `FRONTEND_URL` in backend `.env`
- Ensure backend server is running on correct port

### Token Invalid
- Clear localStorage
- Logout and login again
- Check `JWT_SECRET` matches between frontend and backend

### MongoDB Connection Error
- Ensure MongoDB is running
- Check `MONGO_URI` is correct
- Verify MongoDB credentials

---

## Next Steps

1. Implement password reset email functionality
2. Add email verification for new accounts
3. Implement refresh token system
4. Add OAuth integration (Google, Facebook)
5. Add user role management
6. Implement audit logging

