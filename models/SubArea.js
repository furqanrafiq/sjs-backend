const mongoose = require('mongoose')

// ─── SubArea ──────────────────────────────────────────────────────────────────
// Level 2: belongs to a District. Contains multiple Pipelines.
// Each subarea maps to a sector (A/B/C/D) within the district controller view.

const subAreaSchema = new mongoose.Schema(
  {
    id:          { type: String, required: true, unique: true },  // e.g. "D1-SA1"
    districtId:  { type: String, required: true, ref: 'District' },
    name:        { type: String, required: true },                 // e.g. "Olaya North"
    coordinates: { type: [Number], required: true },               // [lng, lat]
    health: {
      type:    String,
      enum:    ['good', 'warning', 'critical'],
      default: 'good',
    },
    // Sector letter assigned in district controller view (A, B, C, D)
    sectorLetter: { type: String, default: '' },
  },
  { timestamps: true }
)

module.exports = mongoose.model('SubArea', subAreaSchema)