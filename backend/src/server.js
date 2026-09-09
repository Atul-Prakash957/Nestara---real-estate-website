const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
require('dotenv').config(); // Load environment variables from .env file

const authRoutes = require('./routes/authRoutes');
const propertyRoutes = require('./routes/propertyRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// --- Middleware Setup ---
// CORS allows our frontend (React) to communicate with this backend API
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
// Parse incoming JSON data in requests
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Simple health check route to test if server is up
app.get('/api/health', (req, res) => res.json({ success: true, message: 'API is running' }));

// --- API Routes ---
// Connect our route files to specific URL paths
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/admin', adminRoutes);

// --- Error Handling ---
// 404 handler for unknown routes
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// Global error handler: catches errors thrown by asyncHandler or next(error)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
