// api/list-users.js
const mysql = require('mysql2/promise');

const dbConfig = {
  host: '45.32.114.225',
  user: 'socialking',
  password: 'WBKibkWhGBx4Ppfx',
  database: 'socialking',
};

function buildDateCondition(filter) {
  const now = new Date();
  const today = new Date(now.setHours(0, 0, 0, 0));
  const conditions = {
    expired: `expiry_date IS NOT NULL AND expiry_date < ?`,
    'expiring-today': `DATE(expiry_date) = CURDATE()`,
    'expiring-3days': `expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 3 DAY)`,
    'expiring-week': `expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY)`,
    'expiring-month': `expiry_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 30 DAY)`,
    'this-month': `MONTH(expiry_date) = MONTH(CURDATE()) AND YEAR(expiry_date) = YEAR(CURDATE())`,
    'next-month': `MONTH(expiry_date) = MONTH(DATE_ADD(CURDATE(), INTERVAL 1 MONTH)) AND YEAR(expiry_date) = YEAR(DATE_ADD(CURDATE(), INTERVAL 1 MONTH))`
  };
  return conditions[filter] || null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Only GET requests allowed' });
  }

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  const { email, status, expiryDateFilter } = req.query;

  const whereClauses = [`status != 'service_guests'`];
  const params = [];

  // Filter theo email (LIKE)
  if (email) {
    whereClauses.push(`email LIKE ?`);
    params.push(`%${email}%`);
  }

  // Filter theo status (chính xác)
  if (status) {
    whereClauses.push(`status = ?`);
    params.push(status);
  }

  // Filter theo ngày hết hạn
  const dateCondition = buildDateCondition(expiryDateFilter);
  if (dateCondition) {
    whereClauses.push(dateCondition);
    if (expiryDateFilter === 'expired') {
      params.push(new Date()); // truyền ngày hôm nay
    }
  }

  const whereSQL = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  try {
    const connection = await mysql.createConnection(dbConfig);

    const [users] = await connection.execute(
      `SELECT email, status, expiry_date FROM users
       ${whereSQL}
       ORDER BY expiry_date ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const [[{ total }]] = await connection.execute(
      `SELECT COUNT(*) as total FROM users ${whereSQL}`,
      params
    );

    await connection.end();

    return res.status(200).json({ users, total, page, limit });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}
