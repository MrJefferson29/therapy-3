// models/Ai.js
const mongoose = require("mongoose");

const aiSchema = new mongoose.Schema({
    prompt: {
        type: String,
        required: true,
    },
    response: {
        type: String,
        required: true,
    },
    session: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    },
    model: {
        type: String,
        enum: ['llama2', 'gemini', 'deepseek'],
        default: 'llama2'
    },
    isCrisis: {
        type: Boolean,
        default: false
    },
    crisisLevel: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    crisisType: {
        type: String,
        default: 'none'
    },
    crisisConfidence: {
        type: Number,
        min: 0,
        max: 1,
        default: 0
    }
}, { timestamps: true });

const Ai = mongoose.model("Ai", aiSchema);

module.exports = Ai;