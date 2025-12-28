
import React, { useState } from 'react';
import { CompanySettings, User } from '../types';
import { DB } from '../db/store';
import { Shield, Coins, Upload, Download, Database, Key, Layout, CalendarRange, Trash2, AlertTriangle, Clock, HelpCircle, Image as ImageIcon } from 'lucide-react';

interface Props {
  settings: CompanySettings;
  admin: User;
  db: DB;
  onUpdateSettings: (s: Partial<CompanySettings>) => void;
  onUpdateAdmin: (u: Partial<User>) => void;
  onImport: (db: DB) => void;
}

const SettingsView: React.FC<Props> = ({ settings, admin, db, onUpdateSettings, onUpdateAdmin, onImport }) => {
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

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Layout size={24} /> هوية الشركة</h3>
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
           <div>
             <label className="text-sm font-bold block mb-1">عنوان المركز الرئيسي</label>
             <input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={settings.address} onChange={e => onUpdateSettings({address: e.target.value})} />
           </div>
           <div>
             <label className="text-sm font-bold block mb-1 flex items-center gap-2"><HelpCircle size={14}/> تلميح الدخول</label>
             <input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={settings.passwordHint || ''} onChange={e => onUpdateSettings({passwordHint: e.target.value})} />
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2"><CalendarRange size={24} /> نظام الرواتب</h3>
        <div className="space-y-4">
           <div>
             <label className="text-sm font-bold block mb-1">دورة الاحتساب</label>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                <button onClick={() => onUpdateSettings({ salaryCycle: 'monthly' })} className={`flex-1 py-3 rounded-xl font-black ${settings.salaryCycle === 'monthly' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>شهري</button>
                <button onClick={() => onUpdateSettings({ salaryCycle: 'weekly' })} className={`flex-1 py-3 rounded-xl font-black ${settings.salaryCycle === 'weekly' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>أسبوعي</button>
             </div>
           </div>
           <div>
             <label className="text-sm font-bold block mb-1">وضع الموقع</label>
             <select className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={settings.theme} onChange={e => onUpdateSettings({theme: e.target.value as any})}>
                <option value="light">مضيء</option>
                <option value="dark">مظلم</option>
             </select>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Shield size={24} /> حساب المسؤول</h3>
        <div className="space-y-4">
           <div><label className="text-sm font-bold block mb-1">اسم المستخدم</label><input className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} /></div>
           <div><label className="text-sm font-bold block mb-1">كلمة المرور</label><input type="password" className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} /></div>
           <button onClick={() => onUpdateAdmin(adminForm)} className="w-full bg-slate-950 text-white py-3 rounded-xl font-bold">تحديث البيانات</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-rose-600 flex items-center gap-2"><Database size={24} /> صيانة البيانات</h3>
        <div className="space-y-3">
          <button onClick={handleExport} className="w-full bg-indigo-50 text-indigo-700 py-3 rounded-xl font-black flex items-center justify-center gap-2 border-2 border-dashed">
            <Download size={18}/> تصدير نسخة احتياطية
          </button>
          <button onClick={() => setConfirmWipe(true)} className="w-full bg-rose-50 text-rose-600 py-4 rounded-xl font-black border-2 border-dashed">
            <Trash2 size={20}/> مسح كافة البيانات
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
