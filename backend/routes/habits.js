const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Habit = require('../models/Habit');

// @route   GET api/habits
// @desc    Get all habits for the logged in user
// @access  Private
router.get('/', auth, async (req, res) => {
    try {
        const habits = await Habit.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.json(habits);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/habits
// @desc    Create a new habit
// @access  Private
router.post('/', auth, async (req, res) => {
    const { title, description, timeOfDay } = req.body;

    try {
        const newHabit = new Habit({
            user: req.user.id,
            title,
            description,
            timeOfDay
        });

        const habit = await newHabit.save();
        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/habits/:id
// @desc    Update a habit
// @access  Private
router.put('/:id', auth, async (req, res) => {
    const { title, description, timeOfDay, completedDates } = req.body;

    // Build habit object
    const habitFields = {};
    if (title) habitFields.title = title;
    if (description) habitFields.description = description;
    if (timeOfDay) habitFields.timeOfDay = timeOfDay;
    if (completedDates) habitFields.completedDates = completedDates;

    try {
        let habit = await Habit.findById(req.params.id);

        if (!habit) return res.status(404).json({ msg: 'Habit not found' });

        // Make sure user owns habit
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        habit = await Habit.findByIdAndUpdate(
            req.params.id,
            { $set: habitFields },
            { new: true }
        );

        res.json(habit);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE api/habits/:id
// @desc    Delete a habit
// @access  Private
router.delete('/:id', auth, async (req, res) => {
    try {
        const habit = await Habit.findById(req.params.id);

        if (!habit) return res.status(404).json({ msg: 'Habit not found' });

        // Make sure user owns habit
        if (habit.user.toString() !== req.user.id) {
            return res.status(401).json({ msg: 'Not authorized' });
        }

        await Habit.findByIdAndDelete(req.params.id);

        res.json({ msg: 'Habit removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;