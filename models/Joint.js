const mongoose = require('mongoose')

// ─── Joint ────────────────────────────────────────────────────────────────────
// Level 4: a physical joint sensor on a pipeline segment.
// Meeting notes: joints every 25m = 40 joints/km.
// Ultrasound pings between adjacent joints to calculate exact leak distance.
// Key format: "{districtId}-{subareaId}-{pipelineId}-J{n}"

const jointSchema = new mongoose.Schema(
    {
        // Identity
        id: { type: String, required: true, unique: true }, // e.g. "D1-SA1-p1-J1"
        pipelineId: { type: String, required: true, ref: 'Pipeline' },
        subareaId: { type: String, required: true, ref: 'SubArea' },
        districtId: { type: String, required: true, ref: 'District' },
        jointNo: { type: Number, required: true },  // sequential number in the pipeline
        position: { type: [Number] },                // [lng, lat] on map

        // ── Flow ─────────────────────────────────────────────────────────────────
        flow: { type: String, default: '142 L/min' },
        flowPct: { type: Number, default: 71 },
        flowStatus: { type: String, default: 'Normal' },

        // ── Pressure ─────────────────────────────────────────────────────────────
        pressure: { type: String, default: '3.2 bar' },
        pressurePct: { type: Number, default: 64 },
        pressureStatus: { type: String, default: 'Normal' },

        // ── Water Level (% of pipe cross-section filled) ──────────────────────────
        waterLevel: { type: String, default: '78%' },
        waterLevelPct: { type: Number, default: 78 },
        waterLevelStatus: { type: String, default: 'Normal' },

        // ── Acoustic / Ultrasound Leak Detection ─────────────────────────────────
        // Meeting notes: frequency pinging between joints, calculates exact distance to leak
        acoustic: { type: String, default: '18 dB' },
        acousticPct: { type: Number, default: 18 },
        acousticStatus: { type: String, default: 'Clear' },
        // Distance to suspected leak in meters (null = no anomaly)
        leakDistanceMeters: { type: Number, default: null },

        // ── Temperature ───────────────────────────────────────────────────────────
        temperature: { type: String, default: '22°C' },
        temperaturePct: { type: Number, default: 44 },
        temperatureStatus: { type: String, default: 'Normal' },

        // ── Ground Movement / Vibration ───────────────────────────────────────────
        movementPct: { type: Number, default: 12 },
        movementStatus: { type: String, default: 'Stable' },

        // ── Soil Moisture (external pipe surface / surrounding soil) ─────────────
        moisturePct: { type: Number, default: 8 },
        moistureStatus: { type: String, default: 'Dry' },

        // ── Health ────────────────────────────────────────────────────────────────
        healthScore: { type: Number, default: 91 },       // 0–100
        health: {
            type: String,
            enum: ['good', 'warning', 'critical'],
            default: 'good',
        },
        leakProbability: { type: String, default: '2%' },

        // ── Metadata ──────────────────────────────────────────────────────────────
        pipeAge: { type: String, default: '8 years' },
        lastInspected: { type: String, default: '42 days ago' },
        notes: { type: String, default: 'All readings nominal.' },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Joint', jointSchema)