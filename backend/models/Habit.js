// const mongoose = require('mongoose');

// const HabitSchema = new mongoose.Schema({
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     title: {
//         type: String,
//         required: true
//     },
//     description: {
//         type: String
//     },
//     timeOfDay: {
//         type: String, // e.g., 'Morning', 'Afternoon', 'Evening', 'Night'
//         enum: ['Morning', 'Afternoon', 'Evening', 'Night', ''], // Include empty string for optional
//         default: ''
//     },
//     completedDates: [{
//         type: String // Store dates as 'YYYY-MM-DD' strings
//     }],
//     createdAt: {
//         type: Date,
//         default: Date.now
//     }
// });

// module.exports = mongoose.model('Habit', HabitSchema);


// backend/models/Habit.js (example)
const mongoose = require('mongoose');

const HabitSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    timeOfDay: { // For storing Morning/Afternoon/Evening/Night
        type: String,
        enum: ['Morning', 'Afternoon', 'Evening', 'Night', ''], // Empty string for optional
    },
    // If you intend to save a specific target date for the habit:
    targetDate: { // Renamed from 'date' to 'targetDate' for clarity
        type: Date,
    },
    completedDates: { // Array of dates (YYYY-MM-DD strings) when habit was completed
        type: [String],
        default: [],
    },
    // If you decide to add a 'status' field for columns:
    // status: {
    //     type: String,
    //     enum: ['toStart', 'inProgress', 'completed'],
    //     default: 'toStart',
    // },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Habit', HabitSchema);