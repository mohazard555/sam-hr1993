
import React, { useState } from 'react';
import { CompanySettings, User, ArchiveLog } from '../types';
import { DB } from '../db/store';
import { Shield, Upload, Download, Database, Trash2, Image as ImageIcon, History, Archive, FileJson } from 'lucide-react';

interface Props {
  settings: CompanySettings;
  admin: User;
  db: DB;
  onUpdateSettings: (s: Partial<CompanySettings>) => void;
  onUpdateAdmin: (u: Partial<User>) => void;
  onImport: (db: DB) => void;
  onRunArchive: () => void;
}

const SettingsView: React.FC<Props> = ({ settings, admin, db, onUpdateSettings, onUpdateAdmin, onImport, onRunArchive }) => {
  const [adminForm, setAdminForm] = useState({ username: admin.username, password: admin.password || '' });
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateSettings({ logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `sam_hrms_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        // التحقق من أن الملف يحتوي على الحقول الأساسية للنظام
        if (json.settings && json.employees) {
          if (confirm('تحذير: استيراد البيانات سيقوم بمسح كافة السجلات الحالية واستبدالها بالكامل ببيانات الملف المختار. هل تريد المتابعة؟')) {
            onImport(json);
            alert('تم استيراد قاعدة البيانات بنجاح!');
          }
        } else {
          alert('الملف المختار غير متوافق مع نظام SAM. يرجى اختيار ملف نسخة احتياطية صحيح.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف. تأكد من أنه ملف JSON صالح.');
      }
    };
    reader.readAsText(file);
    // تصفير القيمة للسماح برفع نفس الملف مرة أخرى إذا لزم الأمر
    e.target.value = '';
  };

  const handleWipeData = () => {
    if (confirm('هل أنت متأكد تماماً؟ سيتم حذف كافة الموظفين، السجلات، والماليات نهائياً!')) {
      const emptyDB: DB = {
        ...db,
        employees: [],
        attendance: [],
        loans: [],
        leaves: [],
        financials: [],
        production: [],
        warnings: [],
        payrolls: [],
        payrollHistory: [],
      };
      onImport(emptyDB);
      setConfirmWipe(false);
      alert('تم مسح كافة البيانات بنجاح.');
    }
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
      {/* Identity Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Upload size={24} /> هوية الشركة</h3>
        <div className="space-y-4">
           <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-3xl bg-slate-50 dark:bg-slate-800/50">
              {settings.logo ? (
                <img src={settings.logo} className="h-24 w-auto mb-4 rounded-xl shadow-md object-contain" alt="Logo" />
              ) : (
                <div className="w-24 h-24 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4 flex items-center justify-center text-slate-400"><ImageIcon size={40}/></div>
              )}
              <label className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs cursor-pointer hover:bg-indigo-700 transition">
                رفع شعار الشركة
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
           </div>
           <div>
             <label className="text-sm font-bold block mb-1">اسم المؤسسة</label>
             <input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={settings.name} onChange={e => onUpdateSettings({name: e.target.value})} />
           </div>
        </div>
      </div>

      {/* Archiving Card */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-amber-600 flex items-center gap-2"><Archive size={24} /> سياسة الأرشفة والاحتفاظ</h3>
        <div className="space-y-4">
           <div className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 rounded-2xl">
              <p className="text-xs font-bold text-amber-700 leading-relaxed">تسمح لك سياسة الأرشفة بنقل البيانات القديمة تلقائياً إلى سجلات الأرشيف للحفاظ على سرعة النظام.</p>
           </div>
           <div>
             <label className="text-sm font-bold block mb-1">مدة الاحتفاظ بالبيانات الجارية (بالأيام)</label>
             <input type="number" className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={settings.archiveRetentionDays} onChange={e => onUpdateSettings({archiveRetentionDays: Number(e.target.value)})} />
           </div>
           <button onClick={onRunArchive} className="w-full bg-amber-600 text-white py-3 rounded-xl font-black shadow-lg flex items-center justify-center gap-2 hover:bg-amber-700 transition">
              <History size={18}/> تشغيل الأرشفة اليدوية الآن
           </button>
        </div>
      </div>

      {/* Admin Account */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Shield size={24} /> حساب المسؤول</h3>
        <div className="space-y-4">
           <div><label className="text-sm font-bold block mb-1">اسم المستخدم</label><input className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} /></div>
           <div><label className="text-sm font-bold block mb-1">كلمة المرور</label><input type="password" className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} /></div>
           <button onClick={() => onUpdateAdmin(adminForm)} className="w-full bg-slate-950 text-white py-3 rounded-xl font-bold">تحديث البيانات</button>
        </div>
      </div>

      {/* Data Maintenance */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6 md:col-span-2">
        <h3 className="text-xl font-black text-rose-600 flex items-center gap-2"><Database size={24} /> صيانة واستيراد البيانات</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button onClick={handleExport} className="bg-indigo-50 text-indigo-700 py-6 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 hover:bg-indigo-100 transition">
            <Download size={22}/> تصدير نسخة احتياطية
          </button>
          
          <label className="bg-emerald-50 text-emerald-700 py-6 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-emerald-200 hover:bg-emerald-100 transition cursor-pointer text-center">
            <FileJson size={22}/> استيراد بيانات (JSON)
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>

          <button onClick={handleWipeData} className="bg-rose-50 text-rose-600 py-6 rounded-2xl font-black border-2 border-dashed border-rose-200 hover:bg-rose-100 transition">
            <Trash2 size={22}/> مسح كافة البيانات
          </button>
        </div>
      </div>

      {/* Archive Logs */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6 md:col-span-2">
        <h3 className="text-xl font-black text-slate-700 dark:text-slate-300 flex items-center gap-2"><History size={24} /> سجل عمليات الأرشفة</h3>
        <div className="overflow-x-auto">
           <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800">
                 <tr>
                    <th className="p-4 font-black">التاريخ</th>
                    <th className="p-4 font-black">النوع</th>
                    <th className="p-4 font-black">عدد السجلات</th>
                    <th className="p-4 font-black">بواسطة</th>
                 </tr>
              </thead>
              <tbody className="divide-y">
                 {settings.archiveLogs.map((log: ArchiveLog) => (
                   <tr key={log.id} className="hover:bg-slate-50 transition font-bold">
                      <td className="p-4">{new Date(log.date).toLocaleString('ar-EG')}</td>
                      <td className="p-4 text-indigo-600">{log.type}</td>
                      <td className="p-4"><span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full font-black">{log.recordsCount} سجل</span></td>
                      <td className="p-4">{log.performedBy}</td>
                   </tr>
                 ))}
                 {settings.archiveLogs.length === 0 && (
                   <tr><td colSpan={4} className="p-10 text-center text-slate-400 font-bold italic">لا توجد عمليات أرشفة مسجلة بعد.</td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
