
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // استبدله برابط PostgreSQL الحقيقي
});

const JWT_SECRET = 'SAM_PRO_SECURE_2025_SECRET';

// Middleware للتحقق من الترخيص
const validateLicense = async (req, res, next) => {
  const licenseKey = req.headers['x-license-key'];
  if (!licenseKey) return res.status(401).json({ error: 'License key missing' });

  const result = await pool.query('SELECT * FROM licenses WHERE license_key = $1 AND status = $2', [licenseKey, 'active']);
  if (result.rows.length === 0) return res.status(403).json({ error: 'Invalid or revoked license' });

  req.license = result.rows[0];
  next();
};

// تفعيل الترخيص لأول مرة
app.post('/api/activate', async (req, res) => {
  const { licenseKey, deviceName } = req.body;
  try {
    const result = await pool.query('SELECT * FROM licenses WHERE license_key = $1', [licenseKey]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'License key not found' });
    
    await pool.query('UPDATE licenses SET device_name = $1 WHERE license_key = $2', [deviceName, licenseKey]);
    const token = jwt.sign({ licenseId: result.rows[0].id }, JWT_SECRET);
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// جلب الموظفين (مع عزل البيانات)
app.get('/api/employees', validateLicense, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM employees WHERE license_id = $1 ORDER BY name ASC', [req.license.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// إضافة موظف مع تسجيل Log
app.post('/api/employees', validateLicense, async (req, res) => {
  const { name, position, department, base_salary } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO employees (license_id, name, position, department, base_salary) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.license.id, name, position, department, base_salary]
    );
    
    // تسجيل في الـ Logs
    await pool.query(
      'INSERT INTO logs (license_id, action, target_table, target_id, new_data) VALUES ($1, $2, $3, $4, $5)',
      [req.license.id, 'CREATE', 'employees', result.rows[0].id, result.rows[0]]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// لوحة المدير - جلب بيانات أي نسخة عبر الـ Key
app.get('/api/manager/view/:targetKey', async (req, res) => {
  const { targetKey } = req.params;
  try {
    const licenseRes = await pool.query('SELECT * FROM licenses WHERE license_key = $1', [targetKey]);
    if (licenseRes.rows.length === 0) return res.status(404).json({ error: 'License not found' });
    
    const licenseId = licenseRes.rows[0].id;
    const employees = await pool.query('SELECT * FROM employees WHERE license_id = $1', [licenseId]);
    const logs = await pool.query('SELECT * FROM logs WHERE license_id = $1 ORDER BY timestamp DESC LIMIT 50', [licenseId]);
    
    res.json({ employees: employees.rows, logs: logs.rows, info: licenseRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
