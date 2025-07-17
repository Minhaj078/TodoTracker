const mongoose = require('mongoose');

const DailyLogSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    date: {
        type: String, // Store as 'YYYY-MM-DD'
        required: true
    },
    logEntry: {
        type: String,
        required: true
    },
    // You could add a reference to a task if a log entry is about a specific task
    // taskId: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Task'
    // },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('DailyLog', DailyLogSchema);