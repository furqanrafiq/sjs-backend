const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const morgan = require('morgan')
require('dotenv').config()

const app = express()

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/api/districts', require('./routes/districts'))
app.use('/api/incidents', require('./routes/incidents'))
app.use('/api/predictions', require('./routes/predictions'))
app.use('/api/kpi', require('./routes/kpi'))

// ─── Health check ────────────────────────────────────────────────────────────
app.get('/', (req, res) => res.json({ status: 'SJS Backend running' }))

// ─── Error handler ───────────────────────────────────────────────────────────
app.use(require('./middleware/errorHandler'))

// ─── DB + Start ──────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log('✅ MongoDB connected')
        app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
    })
    .catch((err) => {
        console.error('❌ MongoDB connection error:', err)
        process.exit(1)
    })