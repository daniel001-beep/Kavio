const { Pool } = require('pg');

const dbUrl = "your_postgres_url_here";
const isPlaceholder = !dbUrl || dbUrl.includes("your_postgres_url_here") || dbUrl.includes("placeholder");

const pool = new Pool({
  connectionString: isPlaceholder ? "postgres://invalid-placeholder-host:5432/db" : dbUrl,
  ssl: { rejectUnauthorized: false },
});

if (isPlaceholder) {
  pool.connect = (cb) => {
    const err = new Error("Database URL is not configured. Please update POSTGRES_URL in .env.local with your database connection string.");
    if (cb) {
      cb(err, null, () => {});
      return;
    }
    return Promise.reject(err);
  };
}

pool.connect((err, client, release) => {
  if (err) {
    console.log("Success! Clean caught error:", err.message);
  } else {
    console.log("Connected successfully!");
    release();
  }
  pool.end();
});
