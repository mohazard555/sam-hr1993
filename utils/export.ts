import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  if (!Array.isArray(data) || data.length === 0) return;

  // 1️⃣ استخراج جميع المفاتيح من كل الصفوف (حل مشكلة اختلاف الأعمدة)
  const allHeaders = Array.from(
    new Set(data.flatMap(row => Object.keys(row || {})))
  );

  // 2️⃣ تحويل البيانات إلى مصفوفة (Rows + Columns) بشكل صريح
  const sheetData = [
    allHeaders, // الصف الأول = العناوين
    ...data.map(row =>
      allHeaders.map(header => {
        const value = row?.[header];

        // تنظيف القيم
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value);
        return value;
      })
    )
  ];

  // 3️⃣ إنشاء ورقة العمل
  const ws = XLSX.utils.aoa_to_sheet(sheetData);

  // 4️⃣ تفعيل اتجاه RTL
  ws['!rtl'] = true;

  // 5️⃣ ضبط عرض الأعمدة تلقائيًا
  ws['!cols'] = allHeaders.map((_, colIndex) => ({
    wch: Math.max(
      15,
      ...sheetData.map(row => String(row[colIndex] ?? '').length + 2)
    )
  }));

  // 6️⃣ إنشاء ملف Excel
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileName}_${date}.xlsx`);
};
