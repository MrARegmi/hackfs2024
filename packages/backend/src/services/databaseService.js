const { Pool } = require("pg");
const dotenv = require("dotenv");

dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  ssl: {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === "true",
  },
});

exports.hashExists = async (hash) => {
  const res = await pool.query(
    "SELECT 1 FROM merkle_nodes WHERE node_hash = $1",
    [hash]
  );
  return res.rowCount > 0;
};

exports.insertLeafHash = async (hash) => {
  await pool.query(
    "INSERT INTO merkle_nodes (node_hash, level) VALUES ($1, 0)",
    [hash]
  );
};

exports.getNodesAtLevel = async (level) => {
  const res = await pool.query(
    "SELECT id, node_hash FROM merkle_nodes WHERE level = $1",
    [level]
  );
  return res.rows;
};

exports.insertNode = async (hash, leftChildId, rightChildId, level) => {
  const res = await pool.query(
    "INSERT INTO merkle_nodes (node_hash, left_child, right_child, level) VALUES ($1, $2, $3, $4) RETURNING id",
    [hash, leftChildId, rightChildId, level]
  );
  return res.rows[0].id;
};

exports.updateNodeParent = async (id, parentId) => {
  await pool.query("UPDATE merkle_nodes SET parent_id = $1 WHERE id = $2", [
    parentId,
    id,
  ]);
};

exports.getNodeParent = async (id) => {
  const res = await pool.query(
    "SELECT * FROM merkle_nodes WHERE id = (SELECT parent_id FROM merkle_nodes WHERE id = $1)",
    [id]
  );
  return res.rows[0];
};
