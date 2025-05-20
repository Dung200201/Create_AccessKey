// pages/api/renew-access-key.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '45.32.114.225',
  user: 'socialking',
  password: 'WBKibkWhGBx4Ppfx',
  database: 'socialking',
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET allowed' });
  }

  const { email, months } = req.query;

  if (!email) {
    return res.status(400).json({ message: 'Email is required' });
  }

  const monthsInt = parseInt(months);
  if (isNaN(monthsInt) || monthsInt <= 0) {
    return res.status(400).json({ message: 'Months must be a positive number' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [rows] = await connection.execute(
      'SELECT expiry_date FROM users WHERE email = ?',
      [email]
    );

    if (rows.length === 0) {
      await connection.end();
      return res.status(404).json({ message: 'User not found' });
    }

    let expiry = rows[0].expiry_date;
    let currentDate = new Date();

    let newExpiryDate;
    if (expiry) {
      let currentExpiry = new Date(expiry);
      newExpiryDate = new Date(currentExpiry.setMonth(currentExpiry.getMonth() + monthsInt));
    } else {
      newExpiryDate = new Date(currentDate.setMonth(currentDate.getMonth() + monthsInt));
    }

    await connection.execute(
      'UPDATE users SET expiry_date = ? WHERE email = ?',
      [newExpiryDate, email]
    );

    await connection.end();

    return res.status(200).json({
      message: 'Expiry date updated successfully',
      newExpiryDate: newExpiryDate.toISOString().split('T')[0]
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
