
export const VALID_LICENSES = [
  "LIC-7X2K-9PQM-11A4", "LIC-AP92-XKQ1-447Z", "LIC-LL29-PPQ2-79MQ", "LIC-MQ18-ZZ20-199Q", "LIC-1QQ0-AA29-MZ22",
  "LIC-299X-ZLQ4-MM18", "LIC-20QA-812P-922A", "LIC-PQ17-2XM4-555Z", "LIC-KZ77-PLQ2-19XQ", "LIC-33LM-92QK-ZZPQ",
  "LIC-88PA-19ZQ-100X", "LIC-11ZX-PMQ2-8PQL", "LIC-KQ44-91MX-721Z", "LIC-9QQQ-28PQ-PM29", "LIC-AQP2-199Z-LZL1",
  "LIC-K22M-1ZQ9-PQP4", "LIC-7ZA1-3PQ2-QZ99", "LIC-1X92-8QM2-PAQZ", "LIC-8KZ1-12QM-QMMQ", "LIC-2AMQ-9Z91-277P",
  "LIC-QZ11-MKP2-19LQ", "LIC-92MQ-KQ11-82A4", "LIC-ZZP0-3QK1-229M", "LIC-55KQ-AQ21-Z9P4", "LIC-X2MM-91QZ-P20P",
  "LIC-19ZK-PP81-3QAQ", "LIC-7PQA-2QK2-L19Z", "LIC-P9A2-KMQ1-77ZQ", "LIC-AQZ1-1K11-2MM9", "LIC-009X-PQ29-LZQ2",
  "LIC-LZ22-QM44-19PM", "LIC-PX91-22LA-77QM", "LIC-K2PQ-1Q11-9MZA", "LIC-AP21-Q219-0ZQM", "LIC-ZLP2-8A91-Q4MZ",
  "LIC-719P-KLQ2-MM29", "LIC-MQ33-9KX1-ZZ10", "LIC-PA92-11ZQ-2QK4", "LIC-Q2P1-3KM1-P8Z1", "LIC-X9A4-QML1-21QZ",
  "LIC-21PQ-MQP2-991K", "LIC-KQ88-7LZ2-103P", "LIC-PP37-12MQ-Z0A2", "LIC-Z19Q-Q2M1-77PL", "LIC-19MZ-AQ01-2LZP",
  "LIC-2K21-0MQ2-9PQL", "LIC-MZ10-1Q77-QA92", "LIC-12PA-177Q-99ZQ", "LIC-AZ22-KP10-PQ91", "LIC-LP71-22MZ-QMK4",
  "LIC-3XQ2-0A91-Z7QP", "LIC-1Q92-PLK2-MAQ1", "LIC-7PM4-QZ21-1ZL0", "LIC-NM21-Q772-1LPQ", "LIC-9ZL1-221Q-Q7KP",
  "LIC-ZZ14-9P81-MP22", "LIC-88MZ-KQ12-Z1QA", "LIC-PPQ1-10ZK-9A72", "LIC-L19Q-1MM2-22AP", "LIC-MAA2-QP33-71ZK",
  "LIC-ZQ99-81MZ-P2Q4", "LIC-KM17-19AP-ZZ21", "LIC-Z11A-QM82-0KP2", "LIC-9Q21-P2ZM-2ALM", "LIC-LQ10-7A92-QMP1",
  "LIC-23MZ-MM27-81QP", "LIC-7K92-PQ11-Z1MZ", "LIC-4ML2-PPX1-QQ91", "LIC-PZ22-91A4-MKQM", "LIC-AZ11-K2Q3-PP20",
  "LIC-QM99-PX44-1ZQ2", "LIC-1Z72-ZQ21-0QKP", "LIC-9PA1-M122-QZMQ", "LIC-7Q11-PAQ2-1KLM", "LIC-2MQ1-K92A-PPQ1",
  "LIC-P771-1ZQ2-ALP2", "LIC-XQ92-0MZ2-P12Q", "LIC-QA88-221Z-Z31P", "LIC-MLQ1-12KP-M2Q2", "LIC-23ZQ-19KQ-QP81",
  "LIC-A0Q1-K9L2-MMQP", "LIC-PZ21-17QK-ZZ11", "LIC-ZM22-8K21-1QZ2", "LIC-1KQM-22A1-P92Z", "LIC-NQ92-MZ21-LZQ1",
  "LIC-2PA1-7KQ2-9Q11", "LIC-L0Q2-19ZX-QPQ2", "LIC-9ZM1-AQ91-K277", "LIC-PQ29-1ZQ1-MMP2", "LIC-ZQ17-MX22-91LQ",
  "LIC-Q201-PL22-7QZ2", "LIC-AZ88-129M-PQ10", "LIC-M7Q1-19ZA-QK21", "LIC-P1A2-9MZ1-QL20", "LIC-QZ21-11P2-KQPP",
  "LIC-LQ10-9Q21-AZ91", "LIC-2MP9-ZZP1-Q1K2", "LIC-Z1QM-20A9-PPM1", "LIC-10QZ-MQ22-17KP"
];

/**
 * توليد بصمة جهاز ثابتة تعتمد على الخصائص التقنية للمتصفح والعتاد
 */
export const getDeviceFingerprint = (): string => {
  const n = window.navigator;
  const s = window.screen;
  const parts = [
    n.userAgent,
    n.platform,
    n.hardwareConcurrency || '8',
    // @ts-ignore
    n.deviceMemory || '4',
    s.width,
    s.height,
    Intl.DateTimeFormat().resolvedOptions().timeZone
  ];
  const str = parts.join('|');
  
  // دالة تشفير بسيطة للعمل أوفلاين
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  return `SAM-HWID-${Math.abs(hash).toString(16).toUpperCase()}`;
};

/**
 * التحقق من حالة التفعيل المحفوظة
 */
export const checkActivationStatus = () => {
  const key = localStorage.getItem('SAM_LIC_KEY');
  const fp = localStorage.getItem('SAM_LIC_FP');
  const active = localStorage.getItem('SAM_LIC_ACTIVE') === 'true';
  const currentFp = getDeviceFingerprint();

  if (active && key && fp) {
    if (fp !== currentFp) {
      return { status: 'error', message: 'هذا الترخيص مرتبط بجهاز آخر.' };
    }
    return { status: 'activated' };
  }
  return { status: 'unactivated' };
};
