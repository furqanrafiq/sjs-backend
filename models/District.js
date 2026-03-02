const mongoose = require('mongoose')

// ─── District ─────────────────────────────────────────────────────────────────
// Top level of the map hierarchy: District → SubArea → Pipeline → Joint
// Health is computed bottom-up from subareas when data is seeded.

const districtSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },  // e.g. "D1"
        name: { type: String, required: true },                // e.g. "Al Olaya"
        coordinates: {
            type: [Number],   // [lng, lat]
            required: true,
        },
        health: {
            type: String,
            enum: ['good', 'warning', 'critical'],
            default: 'good',
        },
        // Zone / city area label for display
        zone: { type: String, default: '' },
    },
    { timestamps: true }
)

module.exports = mongoose.model('District', districtSchema)