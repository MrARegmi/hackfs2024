const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const pool = new Pool({
  user: process.env.DATABASE_USER,
  host: process.env.DATABASE_HOST,
  database: process.env.DATABASE_NAME,
  password: process.env.DATABASE_PASSWORD,
  port: process.env.DATABASE_PORT,
  ssl: {
    rejectUnauthorized: process.env.DATABASE_SSL_REJECT_UNAUTHORIZED === 'true',
  },
  client_encoding: 'UTF8',
});

async function hashExists(hash) {
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM merkle_nodes WHERE node_hash = $1',
      [Buffer.from(hash, 'hex')]
    );
    return rows.length > 0;
  } catch (error) {
    console.error('Error checking if hash exists:', error);
    throw error;
  }
}

async function insertLeafHash(hash, data) {
  try {
    const binaryData = Buffer.from(JSON.stringify(data), 'utf8');
    const { rows } = await pool.query(
      'INSERT INTO merkle_nodes (node_hash, data, level) VALUES ($1, $2, 0) RETURNING id',
      [Buffer.from(hash, 'hex'), binaryData]
    );
    return rows[0].id;
  } catch (error) {
    console.error('Error inserting leaf hash:', error);
    throw error;
  }
}

async function getNodesAtLevel(level) {
  try {
    const { rows } = await pool.query(
      'SELECT id, node_hash FROM merkle_nodes WHERE level = $1',
      [level]
    );
    return rows;
  } catch (error) {
    console.error('Error getting nodes at level:', error);
    throw new Error('Database query failed');
  }
}

async function insertNode(hash, leftChildId, rightChildId, level) {
  try {
    const { rows } = await pool.query(
      'INSERT INTO merkle_nodes (node_hash, data, level, parent_id, position) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [Buffer.from(hash, 'hex'), Buffer.alloc(0), level, null, null]
    );
    return rows[0].id;
  } catch (error) {
    console.error('Error inserting node:', error);
    throw new Error('Database insert failed');
  }
}

async function updateNodeParent(id, parentId, position) {
  try {
    await pool.query('UPDATE merkle_nodes SET parent_id = $1, position = $2 WHERE id = $3', [
      parentId,
      position,
      id,
    ]);
  } catch (error) {
    console.error('Error updating node parent:', error);
    throw new Error('Database update failed');
  }
}

async function getNodeParent(id) {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM merkle_nodes WHERE id = (SELECT parent_id FROM merkle_nodes WHERE id = $1)',
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error('Error getting node parent:', error);
    throw new Error('Database query failed');
  }
}

module.exports = {
  hashExists,
  insertLeafHash,
  getNodesAtLevel,
  insertNode,
  updateNodeParent,
  getNodeParent,
};
