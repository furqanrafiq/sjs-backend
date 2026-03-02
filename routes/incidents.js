const express  = require('express')
const router   = express.Router()
const Incident = require('../models/Incident')

// GET /api/incidents
// All incidents. Filterable by ?status=critical, ?status=live, ?district=D5
router.get('/', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.status)   filter.status     = req.query.status
    if (req.query.district) filter.districtId = req.query.district
    if (req.query.severity) filter.severity   = req.query.severity

    const incidents = await Incident.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: incidents })
  } catch (err) { next(err) }
})

// GET /api/incidents/:id
// Single incident with full AI confidence breakdown
router.get('/:id', async (req, res, next) => {
  try {
    const incident = await Incident.findOne({ id: req.params.id })
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' })
    res.json({ success: true, data: incident })
  } catch (err) { next(err) }
})

// PATCH /api/incidents/:id/status
// Update incident status (e.g. resolve it)
router.patch('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body
    const incident = await Incident.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true }
    )
    if (!incident) return res.status(404).json({ success: false, message: 'Incident not found' })
    res.json({ success: true, data: incident })
  } catch (err) { next(err) }
})

module.exports = router