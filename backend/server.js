
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();
app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const JWT_SECRET = 'SAM_PRO_SECURE_2025_SECRET';
const ADMIN_MASTER_SECRET = process.env.ADMIN_MASTER_SECRET || 'SAM_MASTER_2025_VIP'; // مفتاح المدير العام

// Middleware للتحقق من الترخيص العادي للنسخ
const validateLicense = async (req, res, next) => {
  const licenseKey = req.headers['x-license-key'];
  if (!licenseKey) return res.status(401).json({ error: 'License key missing' });

  const result = await pool.query('SELECT * FROM licenses WHERE license_key = $1 AND status = $2', [licenseKey, 'active']);
  if (result.rows.length === 0) return res.status(403).json({ error: 'Invalid or revoked license' });

  req.license = result.rows[0];
  next();
};

// Middleware خاص بلوحة المدير العام
const validateMasterAdmin = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== ADMIN_MASTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized Master Access' });
  }
  next();
};

// ... (Endpoints الأخرى تبقى كما هي)

// لوحة المدير - جلب بيانات أي نسخة عبر الـ Key (محمي بمفتاح المدير العام)
app.get('/api/manager/view/:targetKey', validateMasterAdmin, async (req, res) => {
  const { targetKey } = req.params;
  try {
    const licenseRes = await pool.query('SELECT * FROM licenses WHERE license_key = $1', [targetKey]);
    if (licenseRes.rows.length === 0) return res.status(404).json({ error: 'License not found' });
    
    const licenseId = licenseRes.rows[0].id;
    const employees = await pool.query('SELECT * FROM employees WHERE license_id = $1', [licenseId]);
    const logs = await pool.query('SELECT * FROM logs WHERE license_id = $1 ORDER BY timestamp DESC LIMIT 100', [licenseId]);
    
    res.json({ employees: employees.rows, logs: logs.rows, info: licenseRes.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, () => console.log('Server running on port 3000'));
