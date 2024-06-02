const { Pool } = require('pg');
const dotenv = require('dotenv');
const logger = require('../utils/logger');

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
  logger.info(`Checking if hash exists: ${hash}`);
  try {
    const { rows } = await pool.query(
      'SELECT 1 FROM merkle_nodes WHERE node_hash = $1',
      [Buffer.from(hash, 'hex')]
    );
    logger.info(`Hash exists result: ${JSON.stringify(rows)}`);
    return rows.length > 0;
  } catch (error) {
    logger.error('Error checking if hash exists:', error);
    throw error;
  }
}

async function insertLeafHash(hash, data) {
  logger.info(`Inserting leaf hash: ${hash}, data: ${JSON.stringify(data)}`);
  try {
    const binaryData = Buffer.from(JSON.stringify(data), 'utf8');
    const { rows } = await pool.query(
      'INSERT INTO merkle_nodes (node_hash, data, level) VALUES ($1, $2, 0) RETURNING id',
      [Buffer.from(hash, 'hex'), binaryData]
    );
    logger.info(`Inserted leaf hash result: ${JSON.stringify(rows)}`);
    return rows[0].id;
  } catch (error) {
    logger.error('Error inserting leaf hash:', error);
    throw error;
  }
}

async function getNodesAtLevel(level) {
  logger.info(`Getting nodes at level: ${level}`);
  try {
    const { rows } = await pool.query(
      'SELECT id, node_hash FROM merkle_nodes WHERE level = $1',
      [level]
    );
    logger.info(`Nodes at level result: ${JSON.stringify(rows)}`);
    return rows;
  } catch (error) {
    logger.error('Error getting nodes at level:', error);
    throw new Error('Database query failed');
  }
}

async function insertNode(hash, leftChildId, rightChildId, level) {
  logger.info(`Inserting node: ${hash}, leftChildId: ${leftChildId}, rightChildId: ${rightChildId}, level: ${level}`);
  try {
    const { rows } = await pool.query(
      'INSERT INTO merkle_nodes (node_hash, data, level) VALUES ($1, $2, $3) RETURNING id',
      [Buffer.from(hash, 'hex'), Buffer.alloc(0), level]
    );
    logger.info(`Inserted node result: ${JSON.stringify(rows)}`);
    return rows[0].id;
  } catch (error) {
    logger.error('Error inserting node:', error);
    throw new Error('Database insert failed');
  }
}

async function updateNodeParent(id, parentId, position, level) {
  logger.info(`Updating node parent: id: ${id}, parentId: ${parentId}, position: ${position}, level: ${level}`);
  try {
    await pool.query('UPDATE merkle_nodes SET parent_id = $1, position = $2, level = $3 WHERE id = $4', [
      parentId,
      position,
      level,
      id,
    ]);
    logger.info(`Updated node parent: id: ${id}, parentId: ${parentId}, position: ${position}, level: ${level}`);
  } catch (error) {
    logger.error('Error updating node parent:', error);
    throw new Error('Database update failed');
  }
}

async function getNodeParent(id) {
  logger.info(`Getting node parent for id: ${id}`);
  try {
    const { rows } = await pool.query(
      'SELECT * FROM merkle_nodes WHERE id = (SELECT parent_id FROM merkle_nodes WHERE id = $1)',
      [id]
    );
    logger.info(`Node parent result: ${JSON.stringify(rows)}`);
    return rows[0];
  } catch (error) {
    logger.error('Error getting node parent:', error);
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
