const mongoose = require('mongoose')

// ─── Pipeline ─────────────────────────────────────────────────────────────────
// Level 3: belongs to a SubArea. A pipeline segment between two joints.
// Waypoints are used by Mapbox Directions API to draw the real road route.
// Joint spacing: 25m = 40 joints/km (from meeting notes).

const pipelineSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },  // e.g. "D1-SA1-p1"
        subareaId: { type: String, required: true, ref: 'SubArea' },
        districtId: { type: String, required: true, ref: 'District' },
        health: {
            type: String,
            enum: ['good', 'warning', 'critical'],
            default: 'good',
        },
        // Mapbox waypoints [[lng, lat], [lng, lat]]
        waypoints: {
            type: [[Number]],
            required: true,
        },
        // Joint count = pipe length / 25m (from meeting notes)
        jointCount: { type: Number, default: 2 },
        // Approximate segment length in meters
        lengthMeters: { type: Number, default: 25 },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Pipeline', pipelineSchema)