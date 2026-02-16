
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
// مفتاح المدير العام المعتمد
const ADMIN_MASTER_SECRET = process.env.ADMIN_MASTER_SECRET || 'SAM-PRO-MASTER-1993';

/**
 * Middleware: التحقق من الترخيص العادي (للموظفين والعمليات العادية)
 * يتحقق من بصمة الجهاز المربوطة بالمفتاح
 */
const validateLicenseWithFingerprint = async (req, res, next) => {
  const licenseKey = req.headers['x-license-key'];
  const hwid = req.headers['x-hwid']; // بصمة الجهاز

  if (!licenseKey || !hwid) return res.status(401).json({ error: 'License or HWID missing' });

  try {
    const result = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1 AND hwid = $2 AND status = $3',
      [licenseKey, hwid, 'active']
    );
    if (result.rows.length === 0) return res.status(403).json({ error: 'Unauthorized device or inactive license' });
    
    req.license = result.rows[0];
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
};

/**
 * Middleware: التحقق الخاص بالمدير العام (للمراقبة السحابية)
 * يعتمد فقط على مفتاح الماستر السري
 */
const validateMasterAdmin = (req, res, next) => {
  const adminSecret = req.headers['x-admin-secret'];
  if (adminSecret !== ADMIN_MASTER_SECRET) {
    return res.status(401).json({ error: 'Unauthorized Master Access' });
  }
  next();
};

// --- مسارات المراقبة (مفصولة تماماً عن بصمة الجهاز) ---

/**
 * جلب بيانات أي نسخة عبر مفتاح الترخيص (للمدير العام فقط)
 * الشرط الوحيد: المفتاح صحيح ومفعل في السيستم
 */
app.get('/api/manager/view/:targetKey', validateMasterAdmin, async (req, res) => {
  const { targetKey } = req.params;
  try {
    // التحقق من وجود المفتاح وحالته فقط (بدون HWID)
    const licenseRes = await pool.query(
      'SELECT * FROM licenses WHERE license_key = $1 AND status = $2', 
      [targetKey, 'active']
    );
    
    if (licenseRes.rows.length === 0) {
      return res.status(404).json({ error: 'License key not found or is currently inactive' });
    }
    
    const licenseData = licenseRes.rows[0];
    const licenseId = licenseData.id;

    // جلب البيانات المرتبطة بهذا الترخيص
    const employees = await pool.query('SELECT * FROM employees WHERE license_id = $1', [licenseId]);
    const logs = await pool.query('SELECT * FROM logs WHERE license_id = $1 ORDER BY timestamp DESC LIMIT 100', [licenseId]);
    
    res.json({ 
      employees: employees.rows, 
      logs: logs.rows, 
      info: {
        id: licenseData.id,
        license_key: licenseData.license_key,
        activated_at: licenseData.activated_at,
        device_name: licenseData.device_name,
        last_sync: licenseData.last_sync
      } 
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal Server Error: ' + err.message });
  }
});

app.listen(3000, () => console.log('SAM Pro Cloud Server running on port 3000'));
