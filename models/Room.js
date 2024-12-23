const mongoose = require("mongoose");

const roomSchema = new mongoose.Schema({
    roomName: {
        type: String,
        required: true
    },
    roomId: {
        type: String,
        required: true
    },
    betAmount: {
        type: Number,
        required: true
    },
    whoWon: {
        type: Number,
        default: 0
    },
    user_1_id: {
        type: String,
    },
    user_2_id: {
        type: String,
    },
    user_1_state: {
        type: Array,
        default: []
    },
    user_2_state: {
        type: Array,
        default: []
    },
    gameState: {
        type: Array,
        default: []
    },
    isAvailable: {
        type: Boolean,
        default: true
    },
    isFinished: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Room', roomSchema);