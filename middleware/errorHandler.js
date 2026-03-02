// eslint-disable-next-line no-unused-vars
module.exports = (err, req, res, next) => {
    console.error("Error caught by middleware:", err)

    // Ensure status is a valid HTTP code, fallback to 500
    const statusCode = err.status && err.status >= 400 && err.status < 600 ? err.status : 500

    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        // Optional: include stack trace only in dev
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    })
}