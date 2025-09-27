const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/auth_system')
  .then(async () => {
    console.log('MongoDB connected');

    try {
      // Find the first user or a specific user
      const user = await User.findOne({ email: '1221023259210355555@facebook.local' }); // Your Facebook test user

      if (!user) {
        console.log('User not found. Creating first admin user...');

        // Create a default admin user
        const adminUser = new User({
          name: 'Admin User',
          email: 'admin@authsystem.com',
          password: 'AdminPassword123!', // You should change this
          role: 'admin',
          isVerified: true
        });

        await adminUser.save();
        console.log('Admin user created:', adminUser.email);
      } else {
        // Make existing user an admin
        user.role = 'admin';
        await user.save();
        console.log('User updated to admin:', user.email);
      }

      console.log('Admin setup complete!');
    } catch (error) {
      console.error('Error:', error);
    }

    process.exit();
  })
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });