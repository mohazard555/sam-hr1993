import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;

  // استخراج العناوين (Headers) من المفاتيح
  const headers = Object.keys(data[0]);

  // إنشاء مصفوفة ثنائية (Headers + Data)
  const worksheetData = [
    headers,
    ...data.map(item => headers.map(header => item[header]))
  ];

  // إنشاء ورقة العمل
  const ws = XLSX.utils.aoa_to_sheet(worksheetData);

  // تفعيل اتجاه من اليمين لليسار (مهم للعربية)
  ws['!rtl'] = true;

  // ضبط عرض الأعمدة تلقائيًا
  ws['!cols'] = headers.map(header => ({
    wch: Math.max(
      header.length + 2,
      ...data.map(row => String(row[header] ?? '').length + 2)
    )
  }));

  // إنشاء ملف الإكسل
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  // اسم الملف مع التاريخ
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileName}_${date}.xlsx`);
};
