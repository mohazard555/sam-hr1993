
import React, { useState } from 'react';
import { CompanySettings, User } from '../types';
// DB is exported from store, not types
import { DB } from '../db/store';
import { Shield, Coins, Upload, Download, Database, Key, Layout } from 'lucide-react';

interface Props {
  settings: CompanySettings;
  admin: User;
  db: DB;
  onUpdateSettings: (s: Partial<CompanySettings>) => void;
  onUpdateAdmin: (u: Partial<User>) => void;
  onImport: (db: DB) => void;
}

const SettingsView: React.FC<Props> = ({ settings, admin, db, onUpdateSettings, onUpdateAdmin, onImport }) => {
  const [newCurrency, setNewCurrency] = useState('');
  const [adminForm, setAdminForm] = useState({ username: admin.username, password: admin.password || '' });
  const isRtl = settings.language === 'ar';

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { onUpdateSettings({ logo: reader.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "sam_hrms_backup.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Layout size={24} /> المظهر والإعدادات</h3>
        <div className="space-y-4">
           <div>
             <label className="text-sm font-bold block mb-1 text-slate-700 dark:text-slate-300">وضع الموقع</label>
             <select className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={settings.theme} onChange={e => onUpdateSettings({theme: e.target.value as any})}>
                <option value="light">وضع مضيء (Light)</option>
                <option value="dark">وضع مظلم (Dark)</option>
             </select>
           </div>
           <div>
             <label className="text-sm font-bold block mb-1 text-slate-700 dark:text-slate-300">اسم البرنامج</label>
             <input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={settings.name} onChange={e => onUpdateSettings({name: e.target.value})} />
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Shield size={24} /> الصلاحيات والأمان</h3>
        <div className="space-y-4">
           <div><label className="text-sm font-bold block mb-1">اسم المستخدم</label><input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} /></div>
           <div><label className="text-sm font-bold block mb-1">كلمة المرور</label><input type="password" className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} /></div>
           <button onClick={() => onUpdateAdmin(adminForm)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold">تحديث الحساب</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Coins size={24} /> المالية</h3>
        <div className="grid grid-cols-2 gap-4">
           <div><label className="text-xs font-bold block mb-1">العملة</label><select className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={settings.currency} onChange={e => onUpdateSettings({currency: e.target.value})}>{settings.availableCurrencies.map(c => <option key={c} value={c}>{c}</option>)}</select></div>
           <div><label className="text-xs font-bold block mb-1">إضافي جديد</label><input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={newCurrency} onChange={e => setNewCurrency(e.target.value)} onBlur={() => { if(newCurrency) onUpdateSettings({availableCurrencies: [...settings.availableCurrencies, newCurrency]}); setNewCurrency(''); }} /></div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Database size={24} /> النسخ الاحتياطي</h3>
        <button onClick={handleExport} className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200 dark:border-indigo-800">تصدير قاعدة البيانات (JSON)</button>
        <label className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 cursor-pointer">استيراد قاعدة البيانات<input type="file" className="hidden" accept=".json" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = ev => onImport(JSON.parse(ev.target?.result as string)); r.readAsText(f); } }} /></label>
      </div>
    </div>
  );
};

export default SettingsView;
