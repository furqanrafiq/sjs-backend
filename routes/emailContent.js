const express      = require('express')
const router       = express.Router()
const EmailContent = require('../models/EmailContent')

// GET /api/email-content
// List all email templates. Filter by ?isActive=true
router.get('/', async (req, res, next) => {
  try {
    const filter = {}
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === 'true'

    const templates = await EmailContent.find(filter).sort({ createdAt: -1 })
    res.json({ success: true, data: templates })
  } catch (err) { next(err) }
})

// GET /api/email-content/:id
// Single email template by id
router.get('/:id', async (req, res, next) => {
  try {
    const template = await EmailContent.findOne({ id: req.params.id })
    if (!template) return res.status(404).json({ success: false, message: 'Email template not found' })
    res.json({ success: true, data: template })
  } catch (err) { next(err) }
})

// POST /api/email-content
// Create a new email template
router.post('/', async (req, res, next) => {
  try {
    const { id, name, subject, htmlBody, variables, isActive } = req.body
    const template = await EmailContent.create({ id, name, subject, htmlBody, variables, isActive })
    res.status(201).json({ success: true, data: template })
  } catch (err) { next(err) }
})

// PUT /api/email-content/:id
// Update an email template
router.put('/:id', async (req, res, next) => {
  try {
    const { name, subject, htmlBody, variables, isActive } = req.body
    const template = await EmailContent.findOneAndUpdate(
      { id: req.params.id },
      { name, subject, htmlBody, variables, isActive },
      { new: true }
    )
    if (!template) return res.status(404).json({ success: false, message: 'Email template not found' })
    res.json({ success: true, data: template })
  } catch (err) { next(err) }
})

// DELETE /api/email-content/:id
// Delete an email template
router.delete('/:id', async (req, res, next) => {
  try {
    const template = await EmailContent.findOneAndDelete({ id: req.params.id })
    if (!template) return res.status(404).json({ success: false, message: 'Email template not found' })
    res.json({ success: true, message: 'Email template deleted' })
  } catch (err) { next(err) }
})

// POST /api/email-content/:id/preview
// Returns the HTML with placeholders replaced by provided values
router.post('/:id/preview', async (req, res, next) => {
  try {
    const template = await EmailContent.findOne({ id: req.params.id })
    if (!template) return res.status(404).json({ success: false, message: 'Email template not found' })

    let html = template.htmlBody
    const values = req.body.values || {}
    for (const [key, value] of Object.entries(values)) {
      html = html.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
    }

    res.json({ success: true, data: { subject: template.subject, html } })
  } catch (err) { next(err) }
})

module.exports = router
