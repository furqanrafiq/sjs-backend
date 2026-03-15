// ─────────────────────────────────────────────────────────────────────────────
// SJS — SEED FILE
// Migrates all data from rawData.js + both HTML files into MongoDB.
// Run with: node seed/seed.js
// ─────────────────────────────────────────────────────────────────────────────

require('dotenv').config({ path: require('path').join(__dirname, '../.env') })
const mongoose = require('mongoose')
const District = require('../models/District')
const SubArea = require('../models/SubArea')
const Pipeline = require('../models/Pipeline')
const Joint = require('../models/Joint')
const Incident = require('../models/Incident')
const AiPrediction = require('../models/Aiprediction')
const { ResponseTime, Task, NetGain } = require('../models/Kpi')
const EmailContent = require('../models/EmailContent')

// ─── HEALTH HELPERS ──────────────────────────────────────────────────────────
function computeHealth(items) {
    const s = items.map((i) => i.health)
    if (s.includes('critical')) return 'critical'
    if (s.includes('warning')) return 'warning'
    return 'good'
}

// ─── JOINT SENSOR DEFAULTS ───────────────────────────────────────────────────
// const SENSOR = {
//     good: {
//         flow: '142 L/min', flowPct: 71, flowStatus: 'Normal',
//         pressure: '3.2 bar', pressurePct: 64, pressureStatus: 'Normal',
//         waterLevel: '78%', waterLevelPct: 78, waterLevelStatus: 'Normal',
//         acoustic: '18 dB', acousticPct: 18, acousticStatus: 'Clear',
//         leakDistanceMeters: null,
//         temperature: '22°C', temperaturePct: 44, temperatureStatus: 'Normal',
//         movementPct: 12, movementStatus: 'Stable',
//         moisturePct: 8, moistureStatus: 'Dry',
//         healthScore: 91, health: 'good', leakProbability: '2%',
//         pipeAge: '8 years', lastInspected: '42 days ago',
//         notes: 'All readings nominal. Next inspection in 48 days.',
//     },
//     warning: {
//         flow: '98 L/min', flowPct: 49, flowStatus: 'Below Normal',
//         pressure: '2.1 bar', pressurePct: 42, pressureStatus: 'Low',
//         waterLevel: '54%', waterLevelPct: 54, waterLevelStatus: 'Below Normal',
//         acoustic: '44 dB', acousticPct: 44, acousticStatus: 'Elevated',
//         leakDistanceMeters: null,
//         temperature: '26°C', temperaturePct: 52, temperatureStatus: 'Slightly High',
//         movementPct: 28, movementStatus: 'Minor Vibration',
//         moisturePct: 31, moistureStatus: 'Moist',
//         healthScore: 62, health: 'warning', leakProbability: '28%',
//         pipeAge: '18 years', lastInspected: '112 days ago',
//         notes: 'Pressure below threshold. Schedule inspection.',
//     },
//     critical: {
//         flow: '41 L/min', flowPct: 21, flowStatus: 'Critical Low',
//         pressure: '0.8 bar', pressurePct: 16, pressureStatus: 'Critical Low',
//         waterLevel: '24%', waterLevelPct: 24, waterLevelStatus: 'Critical',
//         acoustic: '78 dB', acousticPct: 78, acousticStatus: 'Leak Signature',
//         leakDistanceMeters: 12.4,
//         temperature: '31°C', temperaturePct: 62, temperatureStatus: 'High',
//         movementPct: 61, movementStatus: 'Significant',
//         moisturePct: 72, moistureStatus: 'Saturated',
//         healthScore: 24, health: 'critical', leakProbability: '87%',
//         pipeAge: '31 years', lastInspected: '210 days ago',
//         notes: 'URGENT: Acoustic signature indicates active leak. Immediate inspection required.',
//     },
// }

function rnd(min, max, dec) {
    dec = dec || 0
    var v = Math.random() * (max - min) + min
    return dec ? parseFloat(v.toFixed(dec)) : Math.round(v)
}
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

const PIPE_AGES = ['3 yrs', '5 yrs', '7 yrs', '8 yrs', '10 yrs', '12 yrs',
    '14 yrs', '16 yrs', '18 yrs', '22 yrs', '26 yrs', '30 yrs', '35 yrs']

function randomSensor(health) {
    if (health === 'good') {
        const flowPct = rnd(60, 92), pressurePct = rnd(58, 86), waterLevelPct = rnd(68, 94)
        const acousticPct = rnd(6, 26), temperaturePct = rnd(28, 50)
        const movementPct = rnd(3, 18), moisturePct = rnd(3, 14)
        const healthScore = rnd(82, 99), leakProb = rnd(1, 8)
        return {
            flow: `${rnd(115, 185)} L/min`, flowPct, flowStatus: pick(['Normal', 'Optimal', 'Steady', 'Good']),
            pressure: `${rnd(28, 44, 1)} bar`, pressurePct, pressureStatus: pick(['Normal', 'Stable', 'Optimal', 'OK']),
            waterLevel: `${waterLevelPct}%`, waterLevelPct, waterLevelStatus: pick(['Normal', 'Optimal', 'Within Range', 'Good']),
            acoustic: `${rnd(8, 24)} dB`, acousticPct, acousticStatus: pick(['Clear', 'Nominal', 'Silent', 'No Signal']),
            leakDistanceMeters: null,
            temperature: `${rnd(18, 25)}°C`, temperaturePct, temperatureStatus: pick(['Normal', 'Cool', 'Optimal', 'Stable']),
            movementPct, movementStatus: pick(['Stable', 'Minimal', 'No Movement', 'Steady']),
            moisturePct, moistureStatus: pick(['Dry', 'Normal', 'Acceptable', 'Low']),
            healthScore, health: 'good', leakProbability: `${leakProb}%`,
            pipeAge: pick(PIPE_AGES.slice(0, 7)),
            lastInspected: `${rnd(7, 80)} days ago`,
            notes: pick([
                'All readings nominal.',
                'Sensors stable. No anomalies detected.',
                'Flow and pressure within expected range.',
                'Routine monitoring — no action required.',
                'Last ultrasound ping returned clean signal.',
            ]),
        }
    }
    if (health === 'warning') {
        const flowPct = rnd(36, 58), pressurePct = rnd(30, 52), waterLevelPct = rnd(42, 64)
        const acousticPct = rnd(30, 58), temperaturePct = rnd(46, 64)
        const movementPct = rnd(18, 40), moisturePct = rnd(20, 46)
        const healthScore = rnd(46, 74), leakProb = rnd(16, 44)
        const hasLeak = Math.random() > 0.55
        return {
            flow: `${rnd(75, 120)} L/min`, flowPct, flowStatus: pick(['Below Normal', 'Reduced', 'Low Flow', 'Declining']),
            pressure: `${rnd(14, 28, 1)} bar`, pressurePct, pressureStatus: pick(['Low', 'Below Threshold', 'Reduced', 'Dropping']),
            waterLevel: `${waterLevelPct}%`, waterLevelPct, waterLevelStatus: pick(['Below Normal', 'Low', 'Watch', 'Dropping']),
            acoustic: `${rnd(32, 58)} dB`, acousticPct, acousticStatus: pick(['Elevated', 'Moderate Signal', 'Irregular', 'Monitor']),
            leakDistanceMeters: hasLeak ? rnd(6, 42, 1) : null,
            temperature: `${rnd(24, 30)}°C`, temperaturePct, temperatureStatus: pick(['Slightly High', 'Elevated', 'Above Normal', 'Warm']),
            movementPct, movementStatus: pick(['Minor Vibration', 'Low Movement', 'Slight Shift', 'Monitor']),
            moisturePct, moistureStatus: pick(['Moist', 'Damp', 'Elevated', 'Above Normal']),
            healthScore, health: 'warning', leakProbability: `${leakProb}%`,
            pipeAge: pick(PIPE_AGES.slice(4, 10)),
            lastInspected: `${rnd(90, 160)} days ago`,
            notes: pick([
                'Pressure below threshold. Schedule inspection.',
                'Flow declining — monitor closely.',
                'Elevated acoustic reading. Possible early leak.',
                'Moisture above baseline. Further testing recommended.',
                'Multiple sensors trending negative. Raise priority.',
            ]),
        }
    }
    // critical
    const flowPct = rnd(8, 28), pressurePct = rnd(6, 22), waterLevelPct = rnd(12, 32)
    const acousticPct = rnd(64, 96), temperaturePct = rnd(56, 80)
    const movementPct = rnd(50, 84), moisturePct = rnd(56, 90)
    const healthScore = rnd(8, 36), leakProb = rnd(70, 97)
    return {
        flow: `${rnd(18, 55)} L/min`, flowPct, flowStatus: pick(['Critical Low', 'Severely Reduced', 'Near Zero', 'Emergency']),
        pressure: `${rnd(4, 13, 1)} bar`, pressurePct, pressureStatus: pick(['Critical Low', 'Pressure Loss', 'Failure', 'Emergency']),
        waterLevel: `${waterLevelPct}%`, waterLevelPct, waterLevelStatus: pick(['Critical', 'Emergency', 'Failure', 'Severe']),
        acoustic: `${rnd(66, 96)} dB`, acousticPct, acousticStatus: pick(['Leak Signature', 'Active Leak', 'Critical Signal', 'Emergency']),
        leakDistanceMeters: rnd(3, 30, 1),
        temperature: `${rnd(28, 37)}°C`, temperaturePct, temperatureStatus: pick(['High', 'Critically High', 'Overheating', 'Danger']),
        movementPct, movementStatus: pick(['Significant', 'Structural Movement', 'Critical Shift', 'Danger']),
        moisturePct, moistureStatus: pick(['Saturated', 'Flooded', 'Critical', 'Waterlogged']),
        healthScore, health: 'critical', leakProbability: `${leakProb}%`,
        pipeAge: pick(PIPE_AGES.slice(8)),
        lastInspected: `${rnd(170, 280)} days ago`,
        notes: pick([
            'URGENT: Acoustic signature indicates active leak. Immediate inspection required.',
            'CRITICAL: Pressure failure detected. Excavation required within 24 hours.',
            'EMERGENCY: Flow near zero. Pipe blockage or rupture suspected.',
            'URGENT: Saturated soil around joint. Active leak confirmed by ultrasound.',
            'CRITICAL: Multiple sensor failures. Pipe replacement recommended immediately.',
        ]),
    }
}

// ─── PIPELINE CHAIN BUILDER ──────────────────────────────────────────────────
// Meeting notes: joints every 25m. Each step ≈ 0.0002° ≈ 22m.
const STEP = {
    east: [0.00022, 0],
    north: [0, 0.00020],
    northeast: [0.00016, 0.00015],
}

function makeChain(saId, startLng, startLat, healthList, dir) {
    const [dLng, dLat] = STEP[dir] || STEP.east
    const districtId = saId.split('-')[0]

    return healthList.map((health, i) => {
        const lng1 = startLng + i * dLng
        const lat1 = startLat + i * dLat
        const lng2 = lng1 + dLng
        const lat2 = lat1 + dLat
        return {
            id: `${saId}-p${i + 1}`,
            subareaId: saId,
            districtId,
            health,
            waypoints: [[lng1, lat1], [lng2, lat2]],
            jointCount: 2,
            lengthMeters: 25,
        }
    })
}

// ─────────────────────────────────────────────────────────────────────────────
// RAW DISTRICT DATA (from rawData.js)
// ─────────────────────────────────────────────────────────────────────────────
const rawDistricts = [
    {
        id: 'D1', name: 'Al Olaya', coordinates: [46.6833, 24.6917],
        subAreas: [
            {
                id: 'D1-SA1', name: 'Olaya North', coordinates: [46.6800, 24.6970],
                pipelines: makeChain('D1-SA1', 46.6785, 24.6965, ['good', 'good', 'warning', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D1-SA2', name: 'Olaya South', coordinates: [46.6800, 24.6860],
                pipelines: makeChain('D1-SA2', 46.6785, 24.6855, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D1-SA3', name: 'Olaya East', coordinates: [46.6890, 24.6917],
                pipelines: makeChain('D1-SA3', 46.6875, 24.6912, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D1-SA4', name: 'Olaya West', coordinates: [46.6750, 24.6917],
                pipelines: makeChain('D1-SA4', 46.6735, 24.6912, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D2', name: 'Al Malaz', coordinates: [46.7167, 24.6667],
        subAreas: [
            {
                id: 'D2-SA1', name: 'Malaz North', coordinates: [46.7130, 24.6730],
                pipelines: makeChain('D2-SA1', 46.7115, 24.6725, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D2-SA2', name: 'Malaz South', coordinates: [46.7130, 24.6600],
                pipelines: makeChain('D2-SA2', 46.7115, 24.6595, ['good', 'warning', 'good', 'warning', 'critical', 'good', 'critical', 'good', 'warning', 'good'], 'east')
            },
            {
                id: 'D2-SA3', name: 'Malaz East', coordinates: [46.7220, 24.6667],
                pipelines: makeChain('D2-SA3', 46.7205, 24.6662, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D2-SA4', name: 'Malaz West', coordinates: [46.7080, 24.6667],
                pipelines: makeChain('D2-SA4', 46.7065, 24.6662, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D3', name: 'Al Murabba', coordinates: [46.7050, 24.6900],
        subAreas: [
            {
                id: 'D3-SA1', name: 'Murabba North', coordinates: [46.7020, 24.6960],
                pipelines: makeChain('D3-SA1', 46.7005, 24.6955, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D3-SA2', name: 'Murabba South', coordinates: [46.7020, 24.6840],
                pipelines: makeChain('D3-SA2', 46.7005, 24.6835, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D3-SA3', name: 'Murabba East', coordinates: [46.7100, 24.6900],
                pipelines: makeChain('D3-SA3', 46.7085, 24.6895, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D3-SA4', name: 'Murabba West', coordinates: [46.6970, 24.6900],
                pipelines: makeChain('D3-SA4', 46.6955, 24.6895, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D4', name: 'Al Wurud', coordinates: [46.6680, 24.7100],
        subAreas: [
            {
                id: 'D4-SA1', name: 'Wurud North', coordinates: [46.6650, 24.7160],
                pipelines: makeChain('D4-SA1', 46.6635, 24.7155, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D4-SA2', name: 'Wurud South', coordinates: [46.6650, 24.7040],
                pipelines: makeChain('D4-SA2', 46.6635, 24.7035, ['good', 'warning', 'good', 'warning', 'good', 'good', 'warning', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D4-SA3', name: 'Wurud East', coordinates: [46.6730, 24.7100],
                pipelines: makeChain('D4-SA3', 46.6715, 24.7095, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D4-SA4', name: 'Wurud Center', coordinates: [46.6680, 24.7100],
                pipelines: makeChain('D4-SA4', 46.6665, 24.7095, ['good', 'good', 'warning', 'good', 'good', 'good', 'good', 'warning', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D5', name: 'Al Sahafa', coordinates: [46.6380, 24.7580],
        subAreas: [
            {
                id: 'D5-SA1', name: 'Sahafa North', coordinates: [46.6330, 24.7650],
                pipelines: makeChain('D5-SA1', 46.6315, 24.7645, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D5-SA2', name: 'Sahafa South', coordinates: [46.6330, 24.7510],
                pipelines: makeChain('D5-SA2', 46.6315, 24.7505, ['warning', 'critical', 'critical', 'warning', 'good', 'critical', 'warning', 'good', 'warning', 'good'], 'east')
            },
            {
                id: 'D5-SA3', name: 'Sahafa East', coordinates: [46.6430, 24.7580],
                pipelines: makeChain('D5-SA3', 46.6415, 24.7575, ['good', 'warning', 'good', 'good', 'warning', 'good', 'good', 'good', 'warning', 'good'], 'northeast')
            },
            {
                id: 'D5-SA4', name: 'Sahafa Center', coordinates: [46.6380, 24.7580],
                pipelines: makeChain('D5-SA4', 46.6365, 24.7575, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D6', name: 'Al Nakheel', coordinates: [46.6450, 24.7780],
        subAreas: [
            {
                id: 'D6-SA1', name: 'Nakheel Mall Area', coordinates: [46.6480, 24.7750],
                pipelines: makeChain('D6-SA1', 46.6465, 24.7745, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D6-SA2', name: 'Nakheel North', coordinates: [46.6420, 24.7850],
                pipelines: makeChain('D6-SA2', 46.6405, 24.7845, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D6-SA3', name: 'Nakheel South', coordinates: [46.6420, 24.7710],
                pipelines: makeChain('D6-SA3', 46.6405, 24.7705, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D6-SA4', name: 'Nakheel East', coordinates: [46.6530, 24.7780],
                pipelines: makeChain('D6-SA4', 46.6515, 24.7775, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D7', name: 'Al Rawdah', coordinates: [46.6600, 24.7200],
        subAreas: [
            {
                id: 'D7-SA1', name: 'Rawdah North', coordinates: [46.6570, 24.7270],
                pipelines: makeChain('D7-SA1', 46.6555, 24.7265, ['good', 'warning', 'good', 'good', 'warning', 'good', 'good', 'good', 'good', 'warning'], 'east')
            },
            {
                id: 'D7-SA2', name: 'Rawdah South', coordinates: [46.6570, 24.7130],
                pipelines: makeChain('D7-SA2', 46.6555, 24.7125, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D7-SA3', name: 'Rawdah East', coordinates: [46.6660, 24.7200],
                pipelines: makeChain('D7-SA3', 46.6645, 24.7195, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'north')
            },
            {
                id: 'D7-SA4', name: 'Rawdah West', coordinates: [46.6530, 24.7200],
                pipelines: makeChain('D7-SA4', 46.6515, 24.7195, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D8', name: 'Al Naseem', coordinates: [46.7750, 24.7050],
        subAreas: [
            {
                id: 'D8-SA1', name: 'Naseem North', coordinates: [46.7720, 24.7120],
                pipelines: makeChain('D8-SA1', 46.7705, 24.7115, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D8-SA2', name: 'Naseem South', coordinates: [46.7720, 24.6980],
                pipelines: makeChain('D8-SA2', 46.7705, 24.6975, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D8-SA3', name: 'Naseem East', coordinates: [46.7820, 24.7050],
                pipelines: makeChain('D8-SA3', 46.7805, 24.7045, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D8-SA4', name: 'Naseem Center', coordinates: [46.7750, 24.7050],
                pipelines: makeChain('D8-SA4', 46.7735, 24.7045, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D9', name: 'Al Shifa', coordinates: [46.7280, 24.5900],
        subAreas: [
            {
                id: 'D9-SA1', name: 'Shifa North', coordinates: [46.7250, 24.5970],
                pipelines: makeChain('D9-SA1', 46.7235, 24.5965, ['critical', 'warning', 'critical', 'good', 'warning', 'critical', 'good', 'warning', 'good', 'good'], 'east')
            },
            {
                id: 'D9-SA2', name: 'Shifa South', coordinates: [46.7250, 24.5830],
                pipelines: makeChain('D9-SA2', 46.7235, 24.5825, ['good', 'warning', 'good', 'good', 'good', 'warning', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D9-SA3', name: 'Shifa East', coordinates: [46.7340, 24.5900],
                pipelines: makeChain('D9-SA3', 46.7325, 24.5895, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'north')
            },
            {
                id: 'D9-SA4', name: 'Shifa Center', coordinates: [46.7280, 24.5900],
                pipelines: makeChain('D9-SA4', 46.7265, 24.5895, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
    {
        id: 'D10', name: 'Al Sulimaniyah', coordinates: [46.6780, 24.7020],
        subAreas: [
            {
                id: 'D10-SA1', name: 'Sulimaniyah North', coordinates: [46.6760, 24.7080],
                pipelines: makeChain('D10-SA1', 46.6745, 24.7075, ['good', 'warning', 'good', 'good', 'good', 'warning', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D10-SA2', name: 'Sulimaniyah South', coordinates: [46.6760, 24.6960],
                pipelines: makeChain('D10-SA2', 46.6745, 24.6955, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
            {
                id: 'D10-SA3', name: 'Sulimaniyah East', coordinates: [46.6830, 24.7020],
                pipelines: makeChain('D10-SA3', 46.6815, 24.7015, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'northeast')
            },
            {
                id: 'D10-SA4', name: 'Sulimaniyah West', coordinates: [46.6720, 24.7020],
                pipelines: makeChain('D10-SA4', 46.6705, 24.7015, ['good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good', 'good'], 'east')
            },
        ],
    },
]

// ─── INCIDENTS (from rawData.js + dashboard HTML) ────────────────────────────
const incidentData = [
    {
        id: '#INC-0482', districtId: 'D5', subareaId: 'D5-SA2', pipelineId: 'D5-SA2-p2',
        type: 'Pipeline Leak', aiConfidence: 90,
        aiBreakdown: [
            { label: 'Pipeline Leak', pct: 90 },
            { label: 'Pressure Anomaly', pct: 7 },
            { label: 'Sensor Fault', pct: 3 },
        ],
        severity: 'critical', status: 'critical',
        duration: '2.6 hr', startTime: '08:42',
        description: 'Significant pressure loss detected between joints 2–3. Suspected pipe fracture.',
    },
    {
        id: '#INC-0481', districtId: 'D2', subareaId: 'D2-SA2', pipelineId: 'D2-SA2-p3',
        type: 'Pressure Drop', aiConfidence: 76,
        aiBreakdown: [
            { label: 'Pressure Drop', pct: 76 },
            { label: 'Partial Blockage', pct: 15 },
            { label: 'Valve Failure', pct: 9 },
        ],
        severity: 'critical', status: 'critical',
        duration: '1.6 hr', startTime: '09:58',
        description: 'Pressure dropped below threshold on Al Malaz Park main line.',
    },
    {
        id: '#INC-0475', districtId: 'D9', subareaId: 'D9-SA1', pipelineId: 'D9-SA1-p1',
        type: 'Flow Anomaly', aiConfidence: 83,
        aiBreakdown: [
            { label: 'Unauthorized Draw', pct: 83 },
            { label: 'Wear/Tear Leak', pct: 12 },
            { label: 'Vibration Damage', pct: 5 },
        ],
        severity: 'critical', status: 'critical',
        duration: '3.1 hr', startTime: '08:26',
        description: 'Abnormal flow rate detected. Possible unauthorized connection or theft.',
    },
    {
        id: '#INC-0483', districtId: 'D1', subareaId: 'D1-SA1', pipelineId: 'D1-SA1-p3',
        type: 'Moisture', aiConfidence: 61,
        aiBreakdown: [
            { label: 'Ground Moisture', pct: 61 },
            { label: 'Minor Seepage', pct: 29 },
            { label: 'Condensation', pct: 10 },
        ],
        severity: 'warning', status: 'live',
        duration: '0.6 hr', startTime: '10:22',
        description: 'Elevated moisture reading at joint 3, Kingdom Tower Area.',
    },
    {
        id: '#INC-0484', districtId: 'D4', subareaId: 'D4-SA2', pipelineId: 'D4-SA2-p2',
        type: 'Flow Drop', aiConfidence: 58,
        aiBreakdown: [
            { label: 'Partial Blockage', pct: 58 },
            { label: 'Valve Narrowing', pct: 27 },
            { label: 'Sediment Build-up', pct: 15 },
        ],
        severity: 'warning', status: 'live',
        duration: '0.4 hr', startTime: '11:05',
        description: 'Flow rate down 30% in Wurud South sector.',
    },
    {
        id: '#INC-0485', districtId: 'D7', subareaId: 'D7-SA1', pipelineId: 'D7-SA1-p2',
        type: 'Movement', aiConfidence: 52,
        aiBreakdown: [
            { label: 'Ground Shift', pct: 52 },
            { label: 'Heavy Traffic', pct: 33 },
            { label: 'Construction Nearby', pct: 15 },
        ],
        severity: 'warning', status: 'live',
        duration: '0.2 hr', startTime: '11:40',
        description: 'Vibration/movement sensor triggered in Rawdah North.',
    },
]

// ─── AI PREDICTIONS (from rawData.js + meeting notes) ────────────────────────
const predictionData = [
    {
        districtId: 'D5', subareaId: 'D5-SA2', pipelineId: 'D5-SA2-p2',
        severity: 'critical', daysUntilEvent: 5, probability: 94,
        predictedType: 'Pipe Burst',
        leakLikelihood: 94, failureLikelihood: 87, degradationRatePerMonth: 4.2,
        contributingFactors: [
            'Pipe age exceeds 30 years',
            'Pressure fluctuations over 6 months',
            'Joint 2 showing acoustic signature of micro-fracture',
        ],
        recommendation: 'URGENT: Schedule excavation within 72 hours. Focus on joint 2–3 segment.',
        coordinates: [46.6316, 24.7506],
    },
    {
        districtId: 'D9', subareaId: 'D9-SA1', pipelineId: 'D9-SA1-p1',
        severity: 'critical', daysUntilEvent: 9, probability: 88,
        predictedType: 'Major Leak',
        leakLikelihood: 88, failureLikelihood: 74, degradationRatePerMonth: 3.8,
        contributingFactors: [
            'Acoustic readings elevated for 3 weeks',
            'Flow inconsistency detected at joint 1',
            'Historical leak in same corridor in 2021',
        ],
        recommendation: 'Inspect joints 1–3. Deploy acoustic sensor sweep before weekend.',
        coordinates: [46.7236, 24.5966],
    },
    {
        districtId: 'D2', subareaId: 'D2-SA2', pipelineId: 'D2-SA2-p6',
        severity: 'critical', daysUntilEvent: 12, probability: 81,
        predictedType: 'Pressure Failure',
        leakLikelihood: 81, failureLikelihood: 69, degradationRatePerMonth: 3.1,
        contributingFactors: [
            'Critical joint flagged at position 6',
            'Downstream pressure 40% below baseline',
            'Corrosion pattern consistent with imminent failure',
        ],
        recommendation: 'Replace segment D2-SA2-p6. Temporary pressure reduction recommended.',
        coordinates: [46.7148, 24.6551],
    },
    {
        districtId: 'D1', subareaId: 'D1-SA1', pipelineId: 'D1-SA1-p3',
        severity: 'warning', daysUntilEvent: 30, probability: 62,
        predictedType: 'Minor Seepage',
        leakLikelihood: 62, failureLikelihood: 35, degradationRatePerMonth: 1.4,
        contributingFactors: [
            'Moisture sensor elevated since last month',
            'Joint 3 showing slight pressure gradient',
        ],
        recommendation: 'Schedule routine inspection within 2 weeks.',
        coordinates: [46.6817, 24.6949],
    },
    {
        districtId: 'D4', subareaId: 'D4-SA2', pipelineId: 'D4-SA2-p2',
        severity: 'warning', daysUntilEvent: 21, probability: 55,
        predictedType: 'Flow Restriction',
        leakLikelihood: 40, failureLikelihood: 55, degradationRatePerMonth: 1.8,
        contributingFactors: [
            'Sediment build-up pattern detected',
            'Flow rate declining 2% per week',
        ],
        recommendation: 'Schedule flushing operation for Wurud South within 3 weeks.',
        coordinates: [46.6636, 24.7036],
    },
    {
        districtId: 'D7', subareaId: 'D7-SA1', pipelineId: 'D7-SA1-p2',
        severity: 'warning', daysUntilEvent: 45, probability: 48,
        predictedType: 'Ground Movement Impact',
        leakLikelihood: 38, failureLikelihood: 48, degradationRatePerMonth: 1.1,
        contributingFactors: [
            'Vibration readings above baseline',
            'New construction detected nearby',
        ],
        recommendation: 'Monitor weekly. Alert construction team of pipe proximity.',
        coordinates: [46.6556, 24.7266],
    },
    {
        districtId: 'D10', subareaId: 'D10-SA1', pipelineId: 'D10-SA1-p2',
        severity: 'warning', daysUntilEvent: 60, probability: 44,
        predictedType: 'Age-related Degradation',
        leakLikelihood: 44, failureLikelihood: 38, degradationRatePerMonth: 0.9,
        contributingFactors: [
            'Pipe segment age 22 years',
            'Warning reading on joint 2 and 6',
        ],
        recommendation: 'Include in next quarterly maintenance cycle.',
        coordinates: [46.6746, 24.7076],
    },
]

// ─── KPI DATA (from rawData.js + dashboard HTML) ─────────────────────────────
const responseTimeData = [
    { districtId: 'D1', label: 'D1', avgHours: 0.8, trend: 'Improving', health: 'good' },
    { districtId: 'D2', label: 'D2', avgHours: 1.1, trend: 'Stable', health: 'good' },
    { districtId: 'D3', label: 'D3', avgHours: 1.9, trend: 'Worsening', health: 'warning' },
    { districtId: 'D4', label: 'D4', avgHours: 1.2, trend: 'Stable', health: 'good' },
    { districtId: 'D5', label: 'D5', avgHours: 2.4, trend: 'Critical', health: 'critical' },
    { districtId: 'D6', label: 'D6', avgHours: 0.9, trend: 'Improving', health: 'good' },
    { districtId: 'D7', label: 'D7', avgHours: 1.4, trend: 'Stable', health: 'warning' },
    { districtId: 'D8', label: 'D8', avgHours: 0.7, trend: 'Improving', health: 'good' },
    { districtId: 'D9', label: 'D9', avgHours: 2.1, trend: 'Worsening', health: 'critical' },
    { districtId: 'D10', label: 'D10', avgHours: 1.3, trend: 'Stable', health: 'warning' },
]

const taskData = [
    { districtId: 'D1', today: 12, pending: 1, overdue: 0, completionRate: 92 },
    { districtId: 'D2', today: 9, pending: 2, overdue: 0, completionRate: 82 },
    { districtId: 'D3', today: 7, pending: 4, overdue: 1, completionRate: 58 },
    { districtId: 'D4', today: 10, pending: 1, overdue: 0, completionRate: 83 },
    { districtId: 'D5', today: 6, pending: 5, overdue: 2, completionRate: 46 },
    { districtId: 'D6', today: 4, pending: 0, overdue: 0, completionRate: 100 },
    { districtId: 'D7', today: 8, pending: 2, overdue: 0, completionRate: 80 },
    { districtId: 'D8', today: 11, pending: 1, overdue: 0, completionRate: 88 },
    { districtId: 'D9', today: 5, pending: 6, overdue: 3, completionRate: 38 },
    { districtId: 'D10', today: 9, pending: 2, overdue: 0, completionRate: 77 },
]

const netGainData = [
    { districtId: 'D1', todayK: 62, mtdM: 1.2, ytdM: 8.4, trendPct: 34, trend: 'up' },
    { districtId: 'D2', todayK: 44, mtdM: 0.9, ytdM: 6.1, trendPct: 22, trend: 'up' },
    { districtId: 'D3', todayK: 38, mtdM: 0.7, ytdM: 4.8, trendPct: 0, trend: 'flat' },
    { districtId: 'D4', todayK: 51, mtdM: 1.0, ytdM: 7.2, trendPct: 18, trend: 'up' },
    { districtId: 'D5', todayK: 57, mtdM: 1.1, ytdM: 7.9, trendPct: -8, trend: 'down' },
    { districtId: 'D6', todayK: 32, mtdM: 0.6, ytdM: 4.1, trendPct: 41, trend: 'up' },
    { districtId: 'D7', todayK: 40, mtdM: 0.8, ytdM: 5.5, trendPct: 10, trend: 'up' },
    { districtId: 'D8', todayK: 55, mtdM: 1.1, ytdM: 7.6, trendPct: 28, trend: 'up' },
    { districtId: 'D9', todayK: 29, mtdM: 0.5, ytdM: 3.7, trendPct: -15, trend: 'down' },
    { districtId: 'D10', todayK: 43, mtdM: 0.8, ytdM: 5.9, trendPct: 5, trend: 'up' },
]

// ─── EMAIL CONTENT TEMPLATES ─────────────────────────────────────────────────
const emailContentData = [
    {
        id: 'EMAIL-001',
        name: 'request_received',
        subject: 'We have received your request',
        variables: ['name', 'title'],
        htmlBody: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Request Received</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:system-ui,sans-serif;font-size:12pt;color:#333;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f4f4f4;">
    <tr>
      <td align="center" style="padding:40px 0;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;">
          <!-- Logo -->
          <tr>
            <td style="padding:30px 40px 10px 40px;">
              <img src="{{logoUrl}}" alt="logo" style="max-height:40px;" />
            </td>
          </tr>
          <tr><td style="padding:0 40px;"><hr style="border:none;border-top:1px solid #e0e0e0;" /></td></tr>
          <!-- Body -->
          <tr>
            <td style="padding:30px 40px;">
              <p style="margin:0 0 20px 0;"><strong>Hi {{name}},</strong></p>
              <p style="margin:0 0 20px 0;">Thank you for reaching out to us! We have received your request: &ldquo;{{title}}&rdquo;, and we&rsquo;ll do our best to process it within 3 business days.</p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:0 40px 40px 40px;">
              <p style="margin:0;">Best regards,<br/><strong>The [Company Name] Team</strong></p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// SEED FUNCTION
// ─────────────────────────────────────────────────────────────────────────────
async function seed() {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Connected to MongoDB')

    // Clear existing data
    console.log('🗑  Clearing existing collections...')
    await Promise.all([
        District.deleteMany({}),
        SubArea.deleteMany({}),
        Pipeline.deleteMany({}),
        Joint.deleteMany({}),
        Incident.deleteMany({}),
        AiPrediction.deleteMany({}),
        ResponseTime.deleteMany({}),
        Task.deleteMany({}),
        NetGain.deleteMany({}),
        EmailContent.deleteMany({}),
    ])

    console.log('🌱 Seeding districts, subareas, pipelines, joints...')

    for (const raw of rawDistricts) {
        // ── Compute health bottom-up ──────────────────────────────────────────────
        const subAreasWithHealth = raw.subAreas.map((sa) => {
            const pipelinesWithHealth = sa.pipelines // already have health from makeChain
            const saHealth = computeHealth(pipelinesWithHealth)
            return { ...sa, health: saHealth, pipelines: pipelinesWithHealth }
        })
        const districtHealth = computeHealth(subAreasWithHealth)

        // ── Insert District ───────────────────────────────────────────────────────
        await District.create({
            id: raw.id,
            name: raw.name,
            coordinates: raw.coordinates,
            health: districtHealth,
        })

        for (let saIdx = 0; saIdx < subAreasWithHealth.length; saIdx++) {
            const sa = subAreasWithHealth[saIdx]

            // ── Insert SubArea ──────────────────────────────────────────────────────
            await SubArea.create({
                id: sa.id,
                districtId: raw.id,
                name: sa.name,
                coordinates: sa.coordinates,
                health: sa.health,
                sectorLetter: ['A', 'B', 'C', 'D'][saIdx] || String(saIdx),
            })

            for (const pipe of sa.pipelines) {
                // ── Insert Pipeline ─────────────────────────────────────────────────
                await Pipeline.create({
                    id: pipe.id,
                    subareaId: sa.id,
                    districtId: raw.id,
                    health: pipe.health,
                    waypoints: pipe.waypoints,
                    jointCount: 2,
                    lengthMeters: 25,
                })

                // ── Insert Joints (one per waypoint endpoint) ───────────────────────
                // const sensor = SENSOR[pipe.health]
                for (let jIdx = 0; jIdx < pipe.waypoints.length; jIdx++) {
                    await Joint.create({
                        id: `${pipe.id}-J${jIdx + 1}`,
                        pipelineId: pipe.id,
                        subareaId: sa.id,
                        districtId: raw.id,
                        jointNo: jIdx + 1,
                        position: pipe.waypoints[jIdx],
                        ...randomSensor(pipe.health),   // ← each joint gets fresh random data
                    })
                }
            }
        }
        console.log(`  ✓ ${raw.id} — ${raw.name}`)
    }

    console.log('🌱 Seeding incidents...')
    await Incident.insertMany(incidentData)
    console.log(`  ✓ ${incidentData.length} incidents`)

    console.log('🌱 Seeding AI predictions...')
    await AiPrediction.insertMany(predictionData)
    console.log(`  ✓ ${predictionData.length} predictions`)

    console.log('🌱 Seeding KPI data...')
    await ResponseTime.insertMany(responseTimeData)
    await Task.insertMany(taskData)
    await NetGain.insertMany(netGainData)
    console.log(`  ✓ Response times, tasks, net gains for all districts`)

    console.log('🌱 Seeding email content templates...')
    await EmailContent.insertMany(emailContentData)
    console.log(`  ✓ ${emailContentData.length} email templates`)

    console.log('\n🎉 Seed complete!')
    console.log(`   Districts:   ${rawDistricts.length}`)
    console.log(`   SubAreas:    ${rawDistricts.reduce((s, d) => s + d.subAreas.length, 0)}`)
    const totalPipes = rawDistricts.reduce((s, d) => s + d.subAreas.reduce((ss, sa) => ss + sa.pipelines.length, 0), 0)
    console.log(`   Pipelines:   ${totalPipes}`)
    console.log(`   Joints:      ${totalPipes * 2}`)
    console.log(`   Incidents:   ${incidentData.length}`)
    console.log(`   Predictions: ${predictionData.length}`)

    await mongoose.disconnect()
    process.exit(0)
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err)
    process.exit(1)
})