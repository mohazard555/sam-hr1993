
/**
 * نظام إدارة التراخيص العالمي - إصدار SAM Pro 7.0 (Cloud Connected)
 * تطوير: مهند أحمد
 */

// قائمة 100 مفتاح ترخيص فريدة
export const VALID_LICENSES = [
  "SAM-PRO-1001-A2B3", "SAM-PRO-1002-C4D5", "SAM-PRO-1003-E6F7", "SAM-PRO-1004-G8H9", "SAM-PRO-1005-I0J1",
  "SAM-PRO-1006-K2L3", "SAM-PRO-1007-M4N5", "SAM-PRO-1008-O6P7", "SAM-PRO-1009-Q8R9", "SAM-PRO-1010-S0T1",
  "SAM-PRO-1011-U2V3", "SAM-PRO-1012-W4X5", "SAM-PRO-1013-Y6Z7", "SAM-PRO-1014-A8B9", "SAM-PRO-1015-C0D1",
  "SAM-PRO-1016-E2F3", "SAM-PRO-1017-G4H5", "SAM-PRO-1018-I6J7", "SAM-PRO-1019-K8L9", "SAM-PRO-1020-M0N1",
  "SAM-PRO-1021-O2P3", "SAM-PRO-1022-Q4R5", "SAM-PRO-1023-S6T7", "SAM-PRO-1024-U8V9", "SAM-PRO-1025-W0X1",
  "SAM-PRO-1026-Y2Z3", "SAM-PRO-1027-A4B5", "SAM-PRO-1028-C6D7", "SAM-PRO-1029-E8F9", "SAM-PRO-1030-G0H1",
  "SAM-PRO-1031-I2J3", "SAM-PRO-1032-K4L5", "SAM-PRO-1033-M6N7", "SAM-PRO-1034-O8P9", "SAM-PRO-1035-Q0R1",
  "SAM-PRO-1036-S2T3", "SAM-PRO-1037-U4V5", "SAM-PRO-1038-W6X7", "SAM-PRO-1039-Y8Z9", "SAM-PRO-1040-A0B1",
  "SAM-PRO-1041-C2D3", "SAM-PRO-1042-E4F5", "SAM-PRO-1043-G6H7", "SAM-PRO-1044-I8J9", "SAM-PRO-1045-K0L1",
  "SAM-PRO-1046-M2N3", "SAM-PRO-1047-O4P5", "SAM-PRO-1048-Q6R7", "SAM-PRO-1049-S8T9", "SAM-PRO-1050-U0V1",
  "SAM-PRO-1051-W2X3", "SAM-PRO-1052-Y4Z5", "SAM-PRO-1053-A6B7", "SAM-PRO-1054-C8D9", "SAM-PRO-1055-E0F1",
  "SAM-PRO-1056-G2H3", "SAM-PRO-1057-I4J5", "SAM-PRO-1058-K6L7", "SAM-PRO-1059-M8N9", "SAM-PRO-1060-O0P1",
  "SAM-PRO-1061-Q2R3", "SAM-PRO-1062-S4T5", "SAM-PRO-1063-U6V7", "SAM-PRO-1064-W8X9", "SAM-PRO-1065-Y0Z1",
  "SAM-PRO-1066-A2B3", "SAM-PRO-1067-C4D5", "SAM-PRO-1068-E6F7", "SAM-PRO-1069-G8H9", "SAM-PRO-1070-I0J1",
  "SAM-PRO-1071-K2L3", "SAM-PRO-1072-M4N5", "SAM-PRO-1073-O6P7", "SAM-PRO-1074-Q8R9", "SAM-PRO-1075-S0T1",
  "SAM-PRO-1076-U2V3", "SAM-PRO-1077-W4X5", "SAM-PRO-1078-Y6Z7", "SAM-PRO-1079-A8B9", "SAM-PRO-1080-C0D1",
  "SAM-PRO-1081-E2F3", "SAM-PRO-1082-G4H5", "SAM-PRO-1083-I6J7", "SAM-PRO-1084-K8L9", "SAM-PRO-1085-M0N1",
  "SAM-PRO-1086-O2P3", "SAM-PRO-1087-Q4R5", "SAM-PRO-1088-S6T7", "SAM-PRO-1089-U8V9", "SAM-PRO-1090-W0X1",
  "SAM-PRO-1091-Y2Z3", "SAM-PRO-1092-A4B5", "SAM-PRO-1093-C6D7", "SAM-PRO-1094-E8F9", "SAM-PRO-1095-G0H1",
  "SAM-PRO-1096-I2J3", "SAM-PRO-1097-K4L5", "SAM-PRO-1098-M6N7", "SAM-PRO-1099-O8P9", "SAM-PRO-1100-Q0R1"
];

// استخدام خدمة RESTful API لتخزين البيانات عالمياً (يمكن استبداله بـ Firebase لاحقاً)
const CLOUD_DATABASE_URL = "https://api.restful-api.dev/objects";
const SYSTEM_SALT = "SAM_SECURE_VAULT_2025_V700";
const DB_NAME = "SAM_SECURITY_STORAGE";
const STORE_NAME = "license_records";

const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

const setHiddenItem = async (key: string, value: string): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

const getHiddenItem = async (key: string): Promise<string | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const getPlatformType = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  return "Web Device";
};

export const generateHardwareID = async (): Promise<string> => {
  const n = window.navigator;
  const s = window.screen;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  let canvasHash = "C_HASH_V1";
  if (ctx) {
    ctx.textBaseline = "top";
    ctx.font = "16px 'Courier'";
    ctx.fillStyle = "#000"; ctx.fillText("SAM-PRO-SECURITY", 0, 0);
    canvasHash = canvas.toDataURL().slice(-50);
  }

  const raw = `${n.platform}-${n.language}-${n.hardwareConcurrency}-${s.colorDepth}-${canvasHash}`;
  const msgUint8 = new TextEncoder().encode(raw + SYSTEM_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase().slice(0, 32);
};

export const encryptData = async (text: string, deviceSecret: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(deviceSecret + SYSTEM_SALT), { name: "PBKDF2" }, false, ["deriveKey"]
  );
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: encoder.encode("SAM_V7_SALT"), iterations: 50000, hash: "SHA-256" },
    keyMaterial, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  return btoa(String.fromCharCode(...combined));
};

export const decryptData = async (encryptedBase64: string, deviceSecret: string): Promise<string> => {
  try {
    const combined = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", encoder.encode(deviceSecret + SYSTEM_SALT), { name: "PBKDF2" }, false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: encoder.encode("SAM_V7_SALT"), iterations: 50000, hash: "SHA-256" },
      keyMaterial, { name: "AES-GCM", length: 256 }, false, ["decrypt"]
    );
    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (e) { return ""; }
};

/**
 * دالة التفعيل الحقيقية التي تتواصل مع قاعدة بيانات عالمية
 */
export const callActivationAPI = async (licenseKey: string, hwid: string) => {
  try {
    // 1. جلب كافة سجلات التفعيل من السيرفر السحابي
    const response = await fetch(CLOUD_DATABASE_URL);
    const allRecords = await response.json();

    // البحث عن هذا المفتاح في السيرفر
    const existingRecord = allRecords.find((obj: any) => 
      obj.data && obj.data.licenseKey === licenseKey
    );

    if (existingRecord) {
      // 2. إذا كان المفتاح موجوداً مسبقاً، نتحقق هل هو لنفس الجهاز؟
      if (existingRecord.data.hwid !== hwid) {
        return { 
          success: false, 
          message: `❌ هذا المفتاح مستخدم بالفعل على جهاز آخر (بصمة: ${existingRecord.data.hwid.slice(0,6)}...). الترخيص يسمح بجهاز واحد فقط.` 
        };
      }
      return { success: true, message: "تمت إعادة التحقق من الترخيص بنجاح." };
    } else {
      // 3. إذا كان المفتاح جديداً، نقوم بتسجيله وربطه بهذا الجهاز عالمياً
      const registrationResponse = await fetch(CLOUD_DATABASE_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: `License_${licenseKey}`,
          data: {
            licenseKey: licenseKey,
            hwid: hwid,
            platform: getPlatformType(),
            activatedAt: new Date().toISOString()
          }
        })
      });

      if (registrationResponse.ok) {
        return { success: true, message: "تم تفعيل المفتاح وربطه بجهازك الحالي سحابياً." };
      }
      throw new Error("Cloud Error");
    }
  } catch (error) {
    return { success: false, message: "❌ فشل الاتصال بسيرفر التراخيص. يرجى التأكد من جودة الإنترنت." };
  }
};

export const checkActivationStatus = async () => {
  const encryptedPayload = await getHiddenItem('SAM_LIC_BLOB_V7');
  if (!encryptedPayload) return { status: 'unactivated' };

  const hwid = await generateHardwareID();
  const decrypted = await decryptData(encryptedPayload, hwid);
  
  if (!decrypted) {
    return { status: 'error', message: '⚠️ خطأ أمني: البيانات المحلية لا تتطابق مع بصمة هذا الجهاز. يرجى إعادة التفعيل بالإنترنت.' };
  }

  try {
    const data = JSON.parse(decrypted);
    if (data.hwid === hwid && data.active) {
      return { status: 'activated', key: data.key };
    }
    return { status: 'unactivated' };
  } catch (e) {
    return { status: 'unactivated' };
  }
};

export const saveActivation = async (key: string, hwid: string) => {
  const secureData = JSON.stringify({ key, hwid, active: true, timestamp: Date.now() });
  const encrypted = await encryptData(secureData, hwid);
  await setHiddenItem('SAM_LIC_BLOB_V7', encrypted);
};
