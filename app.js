const express = require('express');
const mongoose = require('mongoose');
const userRoutes = require('./routes/userRoutes');
const User = require('./models/User'); // Ensure you have a User model
const Request = require('./models/Request');
const bodyParser = require('body-parser');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'ejs');
app.set('views', './views');

// Middleware for parsing request body
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Set up session
app.use(session({
    secret: 'your-secret-key', // Change this to a secure random value
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Set to true if using HTTPS
}));

// Use the user router
app.use('/api/users', userRoutes);

// Render home page
app.get('/', (req, res) => {
    res.render('index');
});

// Login route
app.post('/api/login', async (req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne({ userId });

    if (user && user.password === password) {
        req.session.user = user; // Store user data in session

        // Redirect based on role
        if (user.role === 'admin') {
            return res.redirect('/admin/dashboard'); // Redirect to admin dashboard
        } else if (user.role === 'driver') {
            return res.redirect('/driver/dashboard'); // Redirect to driver bookings
        } else if (user.role === 'hod') {
            return res.redirect('/hod/dashboard'); // Redirect to HOD dashboard
        } else if (user.role === 'employee') {
            return res.redirect('/employee/dashboard'); // Redirect to employee dashboard
        }
    } else {
        res.status(401).send('Invalid credentials');
    }
});

// Admin Dashboard
app.get('/admin/dashboard', (req, res) => {
    if (req.session.user && req.session.user.role === 'admin') {
        res.render('adminDashboard'); // Render your admin dashboard view
    } else {
        res.redirect('/'); // Redirect to login if not authenticated
    }
});

// HOD Dashboard
app.get('/hod/dashboard', (req, res) => {
    if (req.session.user && req.session.user.role === 'hod') {
        res.render('hodDashboard'); // Render your HOD dashboard view
    } else {
        res.redirect('/'); // Redirect to login if not authenticated
    }
});

// View form to HOD
app.get('/hod/driverForm', (req, res) => {
    res.render('driverForm'); // Assuming 'driverForm.ejs' exists in your views directory
});

// Save HOD form to driver in MongoDB
app.post('/api/users/hod/bookings', async (req, res) => {
    try {
        const newBooking = new Request({
            date: req.body.date,
            driverId: req.body.driverId,
            driverName: req.body.driverName,
            cabNumber: req.body.cabNumber,
            passengerName: req.body.passengerName,
            pickupLocation: req.body.pickupLocation,
            dropoffLocation: req.body.dropoffLocation,
            pickupTime: req.body.pickupTime,
            dropoffTime: req.body.dropoffTime,
            notes: req.body.notes
        });

        await newBooking.save();
        res.status(201).send('Booking saved successfully');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server error');
    }
});

// Driver Dashboard
app.get('/driver/dashboard', async (req, res) => {
    if (req.session.user && req.session.user.role === 'driver') {
        try {
            const bookingList = await Request.find(); // Fetch bookings using the Request model
            res.render('driverDashboard', { bookingList }); // Render driverDashboard.ejs with bookingList data
        } catch (err) {
            console.error('Error fetching bookings:', err);
            res.status(500).send('Server error');
        }
    } else {
        res.redirect('/'); // Redirect to login if not authenticated
    }
});

// Employee Dashboard
app.get('/employee/dashboard', (req, res) => {
    if (req.session.user && req.session.user.role === 'employee') {
        res.render('employeeDashboard'); // Render your employee dashboard view
    } else {
        res.redirect('/'); // Redirect to login if not authenticated
    }
});

// Route to display bookings for HOD
app.get('/hod/bookings', async (req, res) => {
    try {
        const bookings = await Request.find(); // Fetch all bookings
        res.render('hodBookings', { bookings }); // Render the HOD view with bookings
    } catch (error) {
        console.error('Error fetching bookings:', error);
        res.status(500).send('Error fetching bookings');
    }
});

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(async () => {
        console.log('MongoDB connected');

        // Check if the admin user already exists
        const existingAdmin = await User.findOne({ userId: 'admin' });
        if (!existingAdmin) {
            // Create admin user if not exists
            const adminUser = new User({
                userId: 'admin',
                name: 'Admin',
                role: 'admin',
                department: 'Administration',
                password: '123', // Store the password as plain text (not recommended for production)
            });

            await adminUser.save();
            console.log('Admin user created');
        } else {
            console.log('Admin user already exists');
        }
    })
    .catch(err => console.log('MongoDB connection error:', err));

// Start the server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
