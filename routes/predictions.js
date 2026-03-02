const express      = require('express')
const router       = express.Router()
const AiPrediction = require('../models/AiPrediction')

// GET /api/predictions
// All predictions. Filterable by ?severity=critical, ?district=D5, ?window=30
router.get('/', async (req, res, next) => {
  try {
    const filter = { status: 'active' }
    if (req.query.severity) filter.severity   = req.query.severity
    if (req.query.district) filter.districtId = req.query.district
    if (req.query.window)   filter.windowDays = Number(req.query.window)

    const predictions = await AiPrediction
      .find(filter)
      .sort({ severity: 1, daysUntilEvent: 1 })  // critical first, soonest first

    // Summary counts alongside data
    const allActive  = await AiPrediction.find({ status: 'active' })
    const summary = {
      total:    allActive.length,
      critical: allActive.filter((p) => p.severity === 'critical').length,
      warning:  allActive.filter((p) => p.severity === 'warning').length,
    }

    res.json({ success: true, data: predictions, summary })
  } catch (err) { next(err) }
})

// GET /api/predictions/district/:districtId
// All predictions for a single district — used in AI Predictive card per district
router.get('/district/:districtId', async (req, res, next) => {
  try {
    const predictions = await AiPrediction
      .find({ districtId: req.params.districtId, status: 'active' })
      .sort({ daysUntilEvent: 1 })
    res.json({ success: true, data: predictions })
  } catch (err) { next(err) }
})

// PATCH /api/predictions/:id/action
// Mark a prediction as actioned or dismissed
router.patch('/:id/action', async (req, res, next) => {
  try {
    const { status } = req.body  // 'actioned' or 'dismissed'
    const prediction = await AiPrediction.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    )
    if (!prediction) return res.status(404).json({ success: false, message: 'Prediction not found' })
    res.json({ success: true, data: prediction })
  } catch (err) { next(err) }
})

module.exports = router