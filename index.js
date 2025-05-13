const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');

const app = express();
app.use(cors());

// Cấu hình kết nối MySQL
const dbConfig = {
  host: '45.32.114.225',
  user: 'socialking',
  password: 'WBKibkWhGBx4Ppfx',
  database: 'socialking',
};

// Hàm tạo access_key ngẫu nhiên (3 chữ + 3 số)
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

// API dạng query string
app.get('/generate-access-key', async (req, res) => {
  const email = req.query.email;
  const months = parseInt(req.query.months);

  if (!email) {
    return res.status(400).json({ message: 'Email is required in query string' });
  }

  if (isNaN(months) || months <= 0) {
    return res.status(400).json({ message: 'Months must be a positive number' });
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    // Kiểm tra email đã tồn tại
    const [rows] = await connection.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (rows.length > 0) {
      await connection.end();
      return res.status(200).json({ message: 'Email already exists', user: rows[0] });
    }

    // Tạo accessKey duy nhất
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
      [email, '', accessKey, 'no_active', activeDate, null, months]
    );

    await connection.end();
    return res.status(201).json({ message: 'User created', email, accessKey });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Internal server error' });
  }
});

// Khởi động server
app.listen(3000, () => {
  console.log('API running at http://localhost:3000');
});