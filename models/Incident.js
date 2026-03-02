const mongoose = require('mongoose')

// ─── Incident ─────────────────────────────────────────────────────────────────
// Live or critical incidents detected by sensors.
// Includes AI confidence scoring with alternative scenario breakdown.
// Meeting notes: AI confidence % + alternative scenarios shown on dashboard.

const aiBreakdownSchema = new mongoose.Schema(
    {
        label: { type: String, required: true },  // e.g. "Pipeline Leak"
        pct: { type: Number, required: true },  // e.g. 90
    },
    { _id: false }
)

const incidentSchema = new mongoose.Schema(
    {
        id: { type: String, required: true, unique: true },  // e.g. "#INC-0482"
        districtId: { type: String, required: true, ref: 'District' },
        subareaId: { type: String, required: true, ref: 'SubArea' },
        pipelineId: { type: String, required: true, ref: 'Pipeline' },
        jointId: { type: String, default: null, ref: 'Joint' },  // if pinpointed

        type: { type: String, required: true },   // e.g. "Pipeline Leak"
        severity: {
            type: String,
            enum: ['warning', 'critical'],
            required: true,
        },
        status: {
            type: String,
            enum: ['critical', 'live', 'resolved'],
            required: true,
        },
        description: { type: String, default: '' },

        // Duration and timing
        duration: { type: String, default: '' },      // e.g. "2.6 hr"
        startTime: { type: String, default: '' },      // e.g. "08:42"

        // ── AI Confidence (meeting notes requirement) ─────────────────────────────
        // Primary confidence % for detected type
        aiConfidence: { type: Number, min: 0, max: 100, default: 0 },
        // Full breakdown: primary + alternative scenarios
        aiBreakdown: { type: [aiBreakdownSchema], default: [] },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Incident', incidentSchema)