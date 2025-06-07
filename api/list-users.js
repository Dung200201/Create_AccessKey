// api/list-customers.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '45.32.114.225',
  user: 'socialking',
  password: 'WBKibkWhGBx4Ppfx',
  database: 'socialking',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.execute(
      `SELECT email, status, expiry_date FROM users ORDER BY expiry_date ASC`
    );

    await connection.end();

    return res.status(200).json({ users });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
