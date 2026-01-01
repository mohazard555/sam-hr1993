
import React, { useState } from 'react';
import { CompanySettings, User, ArchiveLog } from '../types';
import { DB } from '../db/store';
import { Shield, Upload, Download, Database, Trash2, Image as ImageIcon, History, Archive, FileJson, CalendarDays, Clock, Banknote, HelpCircle } from 'lucide-react';

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
        if (json.settings && json.employees) {
          if (confirm('تحذير: استيراد البيانات سيقوم بمسح كافة السجلات الحالية واستبدالها بالكامل. هل تريد المتابعة؟')) {
            onImport(json);
            alert('تم استيراد قاعدة البيانات بنجاح!');
          }
        } else {
          alert('الملف المختار غير متوافق.');
        }
      } catch (err) {
        alert('حدث خطأ أثناء قراءة الملف.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-20 text-right">
      
      {/* Identity & Policy */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Upload size={24} /> إعدادات النظام الأساسية</h3>
        <div className="space-y-4">
           <div className="flex flex-col items-center p-6 border-2 border-dashed rounded-3xl bg-slate-50 dark:bg-slate-800/50">
              {settings.logo ? (
                <img src={settings.logo} className="h-20 w-auto mb-4 rounded-xl shadow-md object-contain" alt="Logo" />
              ) : (
                <div className="w-20 h-20 bg-slate-200 dark:bg-slate-700 rounded-xl mb-4 flex items-center justify-center text-slate-400"><ImageIcon size={32}/></div>
              )}
              <label className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-black text-xs cursor-pointer hover:bg-indigo-700 transition">
                تغيير الشعار
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
           </div>
           
           <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="text-xs font-black text-slate-400 mb-1 block uppercase">اسم المؤسسة</label>
                <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition" value={settings.name} onChange={e => onUpdateSettings({name: e.target.value})} />
              </div>

              <div>
                <label className="text-xs font-black text-slate-400 mb-1 block uppercase flex items-center gap-2">
                  <HelpCircle size={14} className="text-indigo-500"/> تلميح كلمة المرور (للمساعدة عند النسيان)
                </label>
                <input 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition" 
                  placeholder="مثال: رقم هاتفك أو اسمك المفضل"
                  value={settings.passwordHint || ''} 
                  onChange={e => onUpdateSettings({passwordHint: e.target.value})} 
                />
              </div>
              
              <div>
                <label className="text-xs font-black text-indigo-600 mb-1 block uppercase">دورة الرواتب</label>
                <select className="w-full p-4 bg-indigo-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition cursor-pointer" value={settings.salaryCycle} onChange={e => onUpdateSettings({salaryCycle: e.target.value as any})}>
                   <option value="monthly">نظام رواتب شهري (30 يوم)</option>
                   <option value="weekly">نظام رواتب أسبوعي (7 أيام)</option>
                </select>
                <p className="text-[10px] font-bold text-slate-400 mt-1 mr-2">* يؤثر هذا الخيار على طريقة حساب سعر ساعة الموظف.</p>
              </div>
           </div>
        </div>
      </div>

      {/* Official Times */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2"><Clock size={24} /> أوقات الدوام الرسمية</h3>
        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="text-xs font-black text-slate-400 mb-1 block">الحضور الرسمي</label>
             <input type="time" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-black" value={settings.officialCheckIn} onChange={e => onUpdateSettings({officialCheckIn: e.target.value})} />
           </div>
           <div>
             <label className="text-xs font-black text-slate-400 mb-1 block">الانصراف الرسمي</label>
             <input type="time" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-black" value={settings.officialCheckOut} onChange={e => onUpdateSettings({officialCheckOut: e.target.value})} />
           </div>
           <div className="col-span-2">
             <label className="text-xs font-black text-slate-400 mb-1 block">فترة السماح (بالدقائق)</label>
             <input type="number" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-emerald-600 rounded-2xl font-black" value={settings.gracePeriodMinutes} onChange={e => onUpdateSettings({gracePeriodMinutes: Number(e.target.value)})} />
           </div>
        </div>
        <div className="pt-4 border-t">
           <h4 className="text-sm font-black text-amber-600 flex items-center gap-2 mb-4"><Archive size={20}/> الأرشفة التلقائية</h4>
           <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 block mb-1">الاحتفاظ بـ (يوم)</label>
                <input type="number" className="w-full p-3 bg-slate-50 border rounded-xl font-black" value={settings.archiveRetentionDays} onChange={e => onUpdateSettings({archiveRetentionDays: Number(e.target.value)})} />
              </div>
              <button onClick={onRunArchive} className="bg-amber-100 text-amber-700 px-6 py-3 rounded-xl font-black text-sm hover:bg-amber-200 transition">أرشفة الآن</button>
           </div>
        </div>
      </div>

      {/* Admin Credentials */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2"><Shield size={24} /> حساب المسؤول</h3>
        <div className="space-y-4">
           <div><label className="text-xs font-black text-slate-400 block mb-1">اسم المستخدم</label><input className="w-full p-4 border rounded-2xl font-bold dark:bg-slate-800" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} /></div>
           <div><label className="text-xs font-black text-slate-400 block mb-1">كلمة المرور</label><input type="password" className="w-full p-4 border rounded-2xl font-bold dark:bg-slate-800" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} /></div>
           <button onClick={() => onUpdateAdmin(adminForm)} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black shadow-lg">تحديث بيانات الدخول</button>
        </div>
      </div>

      {/* Database Maintenance */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-rose-600 flex items-center gap-2"><Database size={24} /> إدارة البيانات</h3>
        <div className="grid grid-cols-1 gap-3">
          <button onClick={handleExport} className="w-full bg-indigo-50 text-indigo-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 hover:bg-indigo-100 transition">
            <Download size={20}/> تصدير نسخة (JSON)
          </button>
          
          <label className="w-full bg-emerald-50 text-emerald-700 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-emerald-200 hover:bg-emerald-100 transition cursor-pointer">
            <FileJson size={20}/> استيراد نسخة احتياطية
            <input type="file" className="hidden" accept=".json" onChange={handleImport} />
          </label>

          <button onClick={() => {if(confirm('سيتم حذف كل شيء! هل أنت متأكد؟')) alert('تم المسح');}} className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-black border-2 border-dashed border-rose-200 hover:bg-rose-100 transition">
            <Trash2 size={20}/> مسح شامل للبيانات
          </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
