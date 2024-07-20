// Request.js (or your model file)
const mongoose = require('mongoose');

const requestSchema = new mongoose.Schema({
    date: { type: Date, required: true },
    driverId: { type: String, required: true },
    driverName: { type: String, required: true },
    cabNumber: { type: String, required: true },
    passengerName: { type: String, required: true },
    pickupLocation: { type: String, required: true },
    dropoffLocation: { type: String, required: true },
    pickupTime: { type: String, required: true },
    dropoffTime: { type: String, required: true },
    notes: { type: String }
});

const Request = mongoose.model('Request', requestSchema);
module.exports = Request
