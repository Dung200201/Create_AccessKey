// api/generate-access-key.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '45.32.114.225',
  user: 'socialking',
  password: 'WBKibkWhGBx4Ppfx',
  database: 'socialking',
};

function generateAccessKey() {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digits = '0123456789';
  let key = '';
  for (let i = 0; i < 3; i++) {
    key += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  for (let i = 0; i < 3; i++) {
    key += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return key;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const { email, months } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required in query string' });
  }

  const monthsInt = parseInt(months);
  if (isNaN(monthsInt) || monthsInt <= 0) {
    return res.status(400).json({ message: 'Months must be a positive number' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      await connection.end();
      return res.status(200).json({ message: 'Email already exists', user: rows[0] });
    }

    let accessKey;
    let exists = true;

    do {
      accessKey = generateAccessKey();
      const [keyRows] = await connection.execute(
        'SELECT * FROM users WHERE access_key = ?',
        [accessKey]
      );
      exists = keyRows.length > 0;
    } while (exists);

    const activeDate = new Date();

    await connection.execute(
      `INSERT INTO users (email, license_key, access_key, status, active_date, expiry_date, months)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [email, '', accessKey, 'no_active', activeDate, null, monthsInt]
    );

    await connection.end();
    return res.status(201).json({ message: 'User created', email, accessKey });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
