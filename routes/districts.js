const express = require('express')
const router = express.Router()
const District = require('../models/District')
const SubArea = require('../models/SubArea')
const Pipeline = require('../models/Pipeline')
const Joint = require('../models/Joint')

// GET /api/districts
// All districts with computed health. Used for map level 1.
router.get('/', async (req, res, next) => {
    try {
        const districts = await District.find().sort('id')
        res.json({ success: true, data: districts })
    } catch (err) { next(err) }
})

// GET /api/districts/:id
// Single district with full stats (subareas, pipelines count, health)
router.get('/:id', async (req, res, next) => {
    try {
        const district = await District.findOne({ id: req.params.id })
        if (!district) return res.status(404).json({ success: false, message: 'District not found' })

        const subAreas = await SubArea.find({ districtId: req.params.id }).sort('id')
        res.json({ success: true, data: { ...district.toObject(), subAreas } })
    } catch (err) { next(err) }
})

// GET /api/districts/:id/subareas
// SubAreas for a district. Used for map level 2 (click district → show subareas).
router.get('/:id/subareas', async (req, res, next) => {
    try {
        const subAreas = await SubArea.find({ districtId: req.params.id }).sort('id')
        res.json({ success: true, data: subAreas })
    } catch (err) { next(err) }
})

// GET /api/subareas/:id/pipelines
// Pipelines for a subarea. Used for map level 3 (click subarea → show pipelines).
router.get('/subareas/:id/pipelines', async (req, res, next) => {
    try {
        const pipelines = await Pipeline.find({ subareaId: req.params.id }).sort('id')
        res.json({ success: true, data: pipelines })
    } catch (err) { next(err) }
})

// GET /api/pipelines/:id/joints
// All joints for a pipeline. Used for map level 4 detail panel.
router.get('/pipelines/:id/joints', async (req, res, next) => {
    try {
        const joints = await Joint.find({ pipelineId: req.params.id }).sort('jointNo')
        res.json({ success: true, data: joints })
    } catch (err) { next(err) }
})

// GET /api/joints/:id
// Single joint with full sensor data. Shown in pipe detail panel.
router.get('/joints/:id', async (req, res, next) => {
    try {
        const joint = await Joint.findOne({ id: req.params.id })
        if (!joint) return res.status(404).json({ success: false, message: 'Joint not found' })
        res.json({ success: true, data: joint })
    } catch (err) { next(err) }
})

module.exports = router