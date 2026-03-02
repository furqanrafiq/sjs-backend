const mongoose = require('mongoose')

// ─── ResponseTime ─────────────────────────────────────────────────────────────
// Avg response time per district. Used in dashboard bar chart.
// Meeting notes: always-visible bar chart, D5 is critical (tallest bar).

const responseTimeSchema = new mongoose.Schema(
    {
        districtId: { type: String, required: true, unique: true, ref: 'District' },
        label: { type: String, required: true },      // e.g. "D1"
        avgHours: { type: Number, required: true },      // e.g. 0.8
        trend: {
            type: String,
            enum: ['Improving', 'Stable', 'Worsening', 'Critical'],
            default: 'Stable',
        },
        health: {
            type: String,
            enum: ['good', 'warning', 'critical'],
            default: 'good',
        },
    },
    { timestamps: true }
)

// ─── Task ─────────────────────────────────────────────────────────────────────
// Completed tasks per district. Used in "Completed Tasks" KPI card.

const taskSchema = new mongoose.Schema(
    {
        districtId: { type: String, required: true, unique: true, ref: 'District' },
        today: { type: Number, default: 0 },
        pending: { type: Number, default: 0 },
        overdue: { type: Number, default: 0 },
        completionRate: { type: Number, default: 0 },  // 0–100 %
    },
    { timestamps: true }
)

// ─── NetGain ──────────────────────────────────────────────────────────────────
// Financial / operational net gain per district. Used in "Net Gain" KPI card.

const netGainSchema = new mongoose.Schema(
    {
        districtId: { type: String, required: true, unique: true, ref: 'District' },
        todayK: { type: Number, default: 0 },    // today in thousands (SAR/units)
        mtdM: { type: Number, default: 0 },    // month-to-date in millions
        ytdM: { type: Number, default: 0 },    // year-to-date in millions
        trendPct: { type: Number, default: 0 },    // % change vs last period
        trend: {
            type: String,
            enum: ['up', 'flat', 'down'],
            default: 'flat',
        },
    },
    { timestamps: true }
)

module.exports = {
    ResponseTime: mongoose.model('ResponseTime', responseTimeSchema),
    Task: mongoose.model('Task', taskSchema),
    NetGain: mongoose.model('NetGain', netGainSchema),
}