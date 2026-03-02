// backend/db/connectToDB.js
const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function connectToDB() {
    if (cached.conn) return cached.conn;

    if (!cached.promise) {
        cached.promise = mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            connectTimeoutMS: 60000, // 60s timeout
        }).then((m) => m);
    }

    cached.conn = await cached.promise;
    return cached.conn;
}

module.exports = connectToDB;