
import * as XLSX from 'xlsx';

export const exportToExcel = (data: any[], fileName: string) => {
  if (!data || data.length === 0) return;

  // إنشاء ورقة عمل من البيانات
  // البيانات يجب أن تكون كائنات بمفاتيح عربية بالفعل من المصدر
  const ws = XLSX.utils.json_to_sheet(data);

  // تفعيل اتجاه من اليمين لليسار (مهم جداً لعرض العربية بشكل صحيح في Excel)
  if(!ws['!props']) ws['!props'] = {};
  ws['!rtl'] = true;

  // ضبط عرض الأعمدة تلقائيًا لتناسب المحتوى العربي
  const headers = Object.keys(data[0]);
  ws['!cols'] = headers.map(header => ({
    wch: Math.max(
      header.length + 5,
      ...data.map(row => String(row[header] ?? '').length + 5)
    )
  }));

  // إنشاء كتاب العمل
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'البيانات');

  // اسم الملف مع التاريخ الحالي
  const date = new Date().toISOString().split('T')[0];
  XLSX.writeFile(wb, `${fileName}_${date}.xlsx`, { bookType: 'xlsx', type: 'binary' });
};
