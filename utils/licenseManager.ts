
export const VALID_LICENSES = [
  "LIC-7X2K-9PQM-11A4", "LIC-AP92-XKQ1-447Z", "LIC-LL29-PPQ2-79MQ", "LIC-MQ18-ZZ20-199Q", "LIC-1QQ0-AA29-MZ22",
  "LIC-299X-ZLQ4-MM18", "LIC-20QA-812P-922A", "LIC-PQ17-2XM4-555Z", "LIC-KZ77-PLQ2-19XQ", "LIC-33LM-92QK-ZZPQ"
];

const SYSTEM_SALT = "SAM_HR_PRO_SECURE_SALT_2025";

/**
 * تحديد نوع نظام التشغيل الحالي
 */
export const getPlatformType = (): string => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("android")) return "Android";
  if (ua.includes("windows")) return "Windows";
  if (ua.includes("electron") || ua.includes("desktop")) return "Desktop";
  return "Web";
};

/**
 * توليد بصمة جهاز فريدة (HWID) بناءً على المنصة
 */
export const generateHardwareID = async (): Promise<string> => {
  const platform = getPlatformType();
  const n = window.navigator;
  const s = window.screen;

  let rawIdentifier = "";

  // محاكاة الحصول على معرفات النظام الأصلية (Native IDs) في حال وجود جسر برمجى (Capacitor/Electron)
  // وفي حال عدم وجودها نعتمد على بصمة المتصفح العميقة
  if (platform === "Android") {
    // @ts-ignore (في حال استخدام Capacitor)
    const androidId = window.Capacitor?.Plugins?.Device?.getId?.() || "WEB_FALLBACK_ID";
    rawIdentifier = `ANDROID-${androidId}-${n.userAgent}-${s.width}x${s.height}`;
  } else if (platform === "Windows") {
    // @ts-ignore (في حال استخدام Electron)
    const winUuid = window.Electron?.getSystemUUID?.() || "WIN_FALLBACK_UUID";
    rawIdentifier = `WINDOWS-${winUuid}-${n.hardwareConcurrency}-${s.colorDepth}`;
  } else {
    // بصمة متصفح متقدمة (Canvas + AudioContext + Hardware Specs)
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    let canvasHash = "";
    if (ctx) {
      ctx.textBaseline = "top";
      ctx.font = "16px 'Arial'";
      ctx.fillStyle = "#f60";
      ctx.fillRect(125, 1, 62, 20);
      ctx.fillStyle = "#069";
      ctx.fillText("SAM-SECURITY-PRO", 2, 15);
      canvasHash = canvas.toDataURL().slice(-50);
    }
    rawIdentifier = `WEB-${n.language}-${n.platform}-${n.hardwareConcurrency}-${s.width}x${s.height}-${canvasHash}`;
  }

  // عمل Hash للبصمة باستخدام SHA-256
  const msgUint8 = new TextEncoder().encode(rawIdentifier + SYSTEM_SALT);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
  
  return `SAM-${platform.toUpperCase()}-${hashHex.slice(0, 24)}`;
};

/**
 * تشفير البيانات باستخدام AES-GCM 256
 */
export const encryptData = async (text: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  
  // توليد مفتاح من الملح (Salt)
  const keyMaterial = await crypto.subtle.importKey(
    "raw", 
    encoder.encode(SYSTEM_SALT), 
    { name: "PBKDF2" }, 
    false, 
    ["deriveKey"]
  );
  
  const key = await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode("STATIC_IV_SALT"),
      iterations: 100000,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  
  // دمج الـ IV مع البيانات المشفرة بصيغة Base64
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);
  
  return btoa(String.fromCharCode(...combined));
};

/**
 * فك تشفير البيانات
 */
export const decryptData = async (encryptedBase64: string): Promise<string> => {
  try {
    const combined = new Uint8Array(atob(encryptedBase64).split("").map(c => c.charCodeAt(0)));
    const iv = combined.slice(0, 12);
    const data = combined.slice(12);
    
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      "raw", 
      encoder.encode(SYSTEM_SALT), 
      { name: "PBKDF2" }, 
      false, 
      ["deriveKey"]
    );
    
    const key = await crypto.subtle.deriveKey(
      {
        name: "PBKDF2",
        salt: encoder.encode("STATIC_IV_SALT"),
        iterations: 100000,
        hash: "SHA-256"
      },
      keyMaterial,
      { name: "AES-GCM", length: 256 },
      false,
      ["encrypt", "decrypt"]
    );

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
    return new TextDecoder().decode(decrypted);
  } catch (e) {
    return "";
  }
};

/**
 * استدعاء الخادم للتفعيل (محاكاة API)
 */
export const callActivationAPI = async (licenseKey: string, hwid: string, platform: string) => {
  // محاكاة التأخير في الشبكة
  await new Promise(resolve => setTimeout(resolve, 1500));

  // محاكاة قاعدة بيانات الخادم المركزية (على الإنترنت)
  const cloudRegistryRaw = localStorage.getItem('SAM_CLOUD_CENTRAL_REGISTRY') || '{}';
  const cloudRegistry = JSON.parse(cloudRegistryRaw);

  // الحالة 2: المفتاح مرتبط بجهاز آخر
  if (cloudRegistry[licenseKey] && cloudRegistry[licenseKey] !== hwid) {
    return {
      success: false,
      message: "❌ هذا المفتاح مستخدم مسبقًا على جهاز آخر ولا يمكن استخدامه مرتين."
    };
  }

  // الحالة 1 و 3: تفعيل جديد أو إعادة تفعيل لنفس الجهاز
  cloudRegistry[licenseKey] = hwid;
  localStorage.setItem('SAM_CLOUD_CENTRAL_REGISTRY', JSON.stringify(cloudRegistry));

  return {
    success: true,
    message: "تم التفعيل والربط بالجهاز بنجاح."
  };
};

/**
 * فحص حالة التفعيل المحلية
 */
export const checkActivationStatus = async () => {
  const encryptedPayload = localStorage.getItem('SAM_SECURE_LIC_DATA');
  if (!encryptedPayload) return { status: 'unactivated' };

  const decrypted = await decryptData(encryptedPayload);
  if (!decrypted) return { status: 'unactivated' };

  try {
    const { key, hwid, active } = JSON.parse(decrypted);
    const currentHwid = await generateHardwareID();

    if (active && hwid === currentHwid) {
      return { status: 'activated', key };
    } else {
      return { status: 'error', message: '⚠️ تنبيه أمني: تم اكتشاف محاولة تشغيل النسخة على جهاز غير مرخص أو تم تغيير مكونات الجهاز.' };
    }
  } catch (e) {
    return { status: 'unactivated' };
  }
};
