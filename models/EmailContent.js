const mongoose = require('mongoose')

// ─── EmailContent ────────────────────────────────────────────────────────────
// Stores email templates with HTML body content and placeholder variables.
// Variables like {{name}}, {{title}} are replaced at send time.

const emailContentSchema = new mongoose.Schema(
    {
        id:          { type: String, required: true, unique: true },
        name:        { type: String, required: true },           // template name e.g. "request_received"
        subject:     { type: String, required: true },           // email subject line
        htmlBody:    { type: String, required: true },           // full HTML email body
        variables:   { type: [String], default: [] },            // placeholder keys e.g. ["name", "title"]
        isActive:    { type: Boolean, default: true },
    },
    { timestamps: true }
)

module.exports = mongoose.model('EmailContent', emailContentSchema)
