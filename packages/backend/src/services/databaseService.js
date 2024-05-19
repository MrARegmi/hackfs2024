const { Pool } = require("pg");

// Create a new pool instance with our database configuration
const pool = new Pool({
  user: "postgres",
  host: "hackfs-logfile-instance.c9kk0qeoiarl.us-east-2.rds.amazonaws.com",
  database: "hackfs_logfile",
  password: "postgres",
  port: 5432,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Function to check if a hash exists in the database
exports.hashExists = async (hash) => {
  const client = await pool.connect();

  try {
    const result = await client.query("SELECT 1 FROM hashes WHERE hash = $1", [
      hash,
    ]);
    return result.rowCount > 0;
  } finally {
    client.release();
  }
};

// Function to insert a new hash into the database
exports.insertHash = async (hash) => {
  const client = await pool.connect();

  try {
    await client.query("INSERT INTO hashes (hash) VALUES ($1)", [hash]);
  } finally {
    client.release();
  }
};
