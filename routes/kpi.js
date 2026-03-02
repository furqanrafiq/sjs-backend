const express = require('express')
const router = express.Router()
const Incident = require('../models/Incident')
const AiPrediction = require('../models/AiPrediction')
const District = require('../models/District')
const { ResponseTime, Task, NetGain } = require('../models/Kpi')

// GET /api/kpi/summary
// Top-level numbers for all 6 KPI cards on the dashboard
router.get('/summary', async (req, res, next) => {
    try {
        const [
            criticalCount,
            liveCount,
            responseTimes,
            tasks,
            netGains,
            aiPredictions,
        ] = await Promise.all([
            Incident.countDocuments({ status: 'critical' }),
            Incident.countDocuments({ status: 'live' }),
            ResponseTime.find(),
            Task.find(),
            NetGain.find(),
            AiPrediction.find({ status: 'active' }),
        ])

        const avgResponseHours = responseTimes.length
            ? +(responseTimes.reduce((s, r) => s + r.avgHours, 0) / responseTimes.length).toFixed(1)
            : 0

        const completedToday = tasks.reduce((s, t) => s + t.today, 0)
        const totalNetGainTodayK = netGains.reduce((s, g) => s + g.todayK, 0)

        res.json({
            success: true,
            data: {
                criticalCount,
                liveCount,
                avgResponseHours,
                completedToday,
                totalNetGainTodayK,
                aiCriticalCount: aiPredictions.filter((p) => p.severity === 'critical').length,
                aiTotalCount: aiPredictions.length,
            },
        })
    } catch (err) { next(err) }
})

// GET /api/kpi/network-health
// Overall network health score for the banner.
// Computed from district health counts.
router.get('/network-health', async (req, res, next) => {
    try {
        const districts = await District.find()
        const total = districts.length
        const critical = districts.filter((d) => d.health === 'critical').length
        const warning = districts.filter((d) => d.health === 'warning').length
        const good = districts.filter((d) => d.health === 'good').length
        const score = total
            ? Math.round(((good * 100 + warning * 60 + critical * 10) / (total * 100)) * 100)
            : 0
        const status = critical > 0 ? 'critical' : warning > 0 ? 'warning' : 'good'

        res.json({ success: true, data: { score, total, critical, warning, good, status } })
    } catch (err) { next(err) }
})

// GET /api/kpi/response-times
// Per-district bar chart data
router.get('/response-times', async (req, res, next) => {
    try {
        const data = await ResponseTime.find().sort('districtId')
        res.json({ success: true, data })
    } catch (err) { next(err) }
})

// GET /api/kpi/tasks
// Per-district task completion table
router.get('/tasks', async (req, res, next) => {
    try {
        const data = await Task.find().sort('districtId')
        res.json({ success: true, data })
    } catch (err) { next(err) }
})

// GET /api/kpi/net-gains
// Per-district net gain data
router.get('/net-gains', async (req, res, next) => {
    try {
        const data = await NetGain.find().sort('districtId')
        res.json({ success: true, data })
    } catch (err) { next(err) }
})

// GET /api/kpi/rankings
// Rankings computed from tasks, response times, health
router.get('/rankings', async (req, res, next) => {
    try {
        const [districts, responseTimes, tasks, netGains] = await Promise.all([
            District.find(),
            ResponseTime.find(),
            Task.find(),
            NetGain.find(),
        ])

        const rankings = districts.map((d) => {
            const rt = responseTimes.find((r) => r.districtId === d.id) || {}
            const task = tasks.find((t) => t.districtId === d.id) || {}
            const gains = netGains.find((g) => g.districtId === d.id) || {}
            return {
                districtId: d.id,
                name: d.name,
                health: d.health,
                avgResponseHrs: rt.avgHours ?? 0,
                responseTrend: rt.trend ?? 'Stable',
                completionRate: task.completionRate ?? 0,
                todayNetGainK: gains.todayK ?? 0,
                trendPct: gains.trendPct ?? 0,
            }
        }).sort((a, b) => b.completionRate - a.completionRate)

        res.json({ success: true, data: rankings })
    } catch (err) { next(err) }
})

// GET /api/kpi/district-controller/:districtId
// Everything the district controller page needs in a single call
router.get('/district-controller/:districtId', async (req, res, next) => {
    try {
        const id = req.params.districtId
        const [
            district,
            incidents,
            rt,
            task,
            gains,
            predictions,
        ] = await Promise.all([
            District.findOne({ id }),
            Incident.find({ districtId: id }).sort({ createdAt: -1 }),
            ResponseTime.findOne({ districtId: id }),
            Task.findOne({ districtId: id }),
            NetGain.findOne({ districtId: id }),
            AiPrediction.find({ districtId: id, status: 'active' }),
        ])

        if (!district) return res.status(404).json({ success: false, message: 'District not found' })

        res.json({
            success: true,
            data: {
                district,
                incidents,
                responseTimes: rt,
                tasks: task,
                netGains: gains,
                aiPredictions: predictions,
                criticalCount: incidents.filter((i) => i.status === 'critical').length,
                liveCount: incidents.filter((i) => i.status === 'live').length,
            },
        })
    } catch (err) { next(err) }
})

module.exports = router