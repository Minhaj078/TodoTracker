const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const DailyLog = require('../models/DailyLog');

// @route   GET api/dailylogs
// @desc    Get all daily logs for the logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const dailyLogs = await DailyLog.find({ user: req.user.id }).sort({ date: -1, createdAt: -1 });
        res.json(dailyLogs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/dailylogs
// @desc    Create a new daily log
// @access  Private
router.post('/', auth, async (req, res) => {
    const { date, logEntry } = req.body;

    try {
        const newDailyLog = new DailyLog({
            user: req.user.id,
            date,
            logEntry
        });

        const dailyLog = await newDailyLog.save();
        res.json(dailyLog);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/dailylogs/:id
// @desc    Update a daily log
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { date, logEntry } = req.body;

    const logFields = {};
    if (date) logFields.date = date;
    if (logEntry) logFields.logEntry = logEntry;

    try {
        let dailyLog = await DailyLog.findById(req.params.id);

        if (!dailyLog) return res.status(404).json({ msg: 'Daily log not found' });

        // Make sure user owns log
        if (dailyLog.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        dailyLog = await DailyLog.findByIdAndUpdate(
            req.params.id,
            { $set: logFields },
            { new: true }
        );

        res.json(dailyLog);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/dailylogs/:id
// @desc    Delete a daily log
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const dailyLog = await DailyLog.findById(req.params.id);

        if (!dailyLog) return res.status(404).json({ msg: 'Daily log not found' });

        // Make sure user owns log
        if (dailyLog.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await DailyLog.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Daily log removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;