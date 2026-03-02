const mongoose = require('mongoose')

// ─── AiPrediction ─────────────────────────────────────────────────────────────
// Meeting notes: AI Predictive Analysis is the primary product differentiator.
// After 6 months of live sensor data = 80% prediction accuracy.
// Per-district: leak probability, pipe failure likelihood, health degradation rate.
// Shows daysUntilEvent, predictedType, contributing factors, recommendation.

const aiPredictionSchema = new mongoose.Schema(
    {
        districtId: { type: String, required: true, ref: 'District' },
        districtName: { type: String, required: true, ref: 'District' },
        subareaId: { type: String, required: true, ref: 'SubArea' },
        pipelineId: { type: String, required: true, ref: 'Pipeline' },

        severity: {
            type: String,
            enum: ['critical', 'warning', 'ok'],
            required: true,
        },

        // ── Core prediction metrics (meeting notes) ───────────────────────────────
        probability: { type: Number, min: 0, max: 100 }, // overall event probability %
        leakLikelihood: { type: Number, min: 0, max: 100 }, // leak probability %
        failureLikelihood: { type: Number, min: 0, max: 100 }, // pipe failure risk %
        degradationRatePerMonth: { type: Number },                 // health drop %/month

        // ── Event prediction ──────────────────────────────────────────────────────
        daysUntilEvent: { type: Number },          // how many days until predicted event
        predictedType: { type: String },          // e.g. "Pipe Burst", "Major Leak"

        // ── Supporting data ───────────────────────────────────────────────────────
        contributingFactors: { type: [String], default: [] },
        recommendation: { type: String, default: '' },

        // Approximate coordinates for map pin
        coordinates: { type: [Number], default: [] },  // [lng, lat]

        // Prediction window used when calculated (7, 30, or 90 days)
        windowDays: { type: Number, default: 30 },

        // Whether this has been actioned / dismissed
        status: {
            type: String,
            enum: ['active', 'actioned', 'dismissed'],
            default: 'active',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('AiPrediction', aiPredictionSchema)