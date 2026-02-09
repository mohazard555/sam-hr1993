
import * as XLSX from 'xlsx';

/**
 * دالة احترافية لتصدير البيانات إلى ملف Excel
 * تدعم العربية، اتجاه RTL، وضبط عرض الأعمدة تلقائياً
 */
export const exportToExcel = (data: any[], fileName: string) => {
  if (!Array.isArray(data) || data.length === 0) {
    console.warn("No data provided for export");
    return;
  }

  // 1. استخراج كافة العناوين الفريدة لضمان عدم ضياع أي عمود
  const allHeaders = Array.from(
    new Set(data.flatMap(row => Object.keys(row || {})))
  );

  // 2. تحويل البيانات إلى مصفوفة صفوف (AOE) لضمان ثبات الترتيب
  const sheetData = [
    allHeaders, // الصف الأول: العناوين
    ...data.map(row =>
      allHeaders.map(header => {
        const value = row?.[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'boolean') return value ? 'نعم' : 'لا';
        return value;
      })
    )
  ];

  // 3. إنشاء ورقة العمل وتفعيل الـ RTL
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  
  // ضبط اتجاه الورقة من اليمين لليسار
  if (!ws['!views']) ws['!views'] = [];
  ws['!margin'] = { left: 0.7, right: 0.7, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 };
  
  // خاصية RTL لمكتبة XLSX
  ws['!rtl'] = true;

  // 4. ضبط عرض الأعمدة تلقائياً بناءً على طول المحتوى
  ws['!cols'] = allHeaders.map((_, colIndex) => {
    const maxLength = sheetData.reduce((max, row) => {
      const cellValue = String(row[colIndex] || '');
      return Math.max(max, cellValue.length);
    }, 10);
    return { wch: maxLength + 5 }; // إضافة هامش بسيط
  });

  // 5. بناء الكتاب وحفظ الملف
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات المصدّرة');

  const timestamp = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileName}_${timestamp}.xlsx`);
};
