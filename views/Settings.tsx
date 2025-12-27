
import React, { useState } from 'react';
import { CompanySettings, User } from '../types';
import { DB } from '../db/store';
import { Shield, Coins, Upload, Download, Database, Key, Layout, CalendarRange, Trash2, AlertTriangle, Clock } from 'lucide-react';

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
  const [confirmWipe, setConfirmWipe] = useState(false);

  const handleExport = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `sam_hrms_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const wipeData = () => {
    if (window.confirm('هل أنت متأكد تماماً؟ سيتم مسح كافة الموظفين، الحضور، الرواتب، والسلف. لا يمكن التراجع عن هذه الخطوة!')) {
      const resetDB: DB = {
        ...db,
        employees: [],
        attendance: [],
        loans: [],
        leaves: [],
        financials: [],
        production: [],
        warnings: [],
        payrolls: [],
        payrollHistory: []
      };
      onImport(resetDB);
      setConfirmWipe(false);
      alert('تم مسح كافة البيانات بنجاح');
    }
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
        <h3 className="text-xl font-black text-emerald-600 flex items-center gap-2"><CalendarRange size={24} /> دورة العمل والأرشفة</h3>
        <div className="space-y-4">
           <div>
             <label className="text-sm font-bold block mb-1 text-slate-700 dark:text-slate-300">نظام احتساب الرواتب</label>
             <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl border dark:border-slate-700">
                <button 
                  onClick={() => onUpdateSettings({ salaryCycle: 'monthly' })}
                  className={`flex-1 py-3 rounded-xl font-black transition-all ${settings.salaryCycle === 'monthly' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600' : 'text-slate-500'}`}
                >
                  شهري
                </button>
                <button 
                  onClick={() => onUpdateSettings({ salaryCycle: 'weekly' })}
                  className={`flex-1 py-3 rounded-xl font-black transition-all ${settings.salaryCycle === 'weekly' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-600' : 'text-slate-500'}`}
                >
                  أسبوعي
                </button>
             </div>
           </div>
           <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200">
              <label className="text-xs font-black text-amber-700 block mb-2 flex items-center gap-2"><Clock size={14}/> يوم الأرشفة التلقائية (من 1-30)</label>
              <input type="number" min="1" max="30" className="w-full p-2 rounded-lg border font-black" placeholder="مثلاً: 30" />
              <p className="text-[10px] mt-1 font-bold text-amber-600">سيقوم النظام بتذكيرك بأرشفة السجلات في هذا اليوم من كل شهر.</p>
           </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Shield size={24} /> الصلاحيات والأمان</h3>
        <div className="space-y-4">
           <div><label className="text-sm font-bold block mb-1">اسم المستخدم</label><input className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} /></div>
           <div><label className="text-sm font-bold block mb-1">كلمة المرور</label><input type="password" className="w-full p-3 border dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold" value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} /></div>
           <button onClick={() => onUpdateAdmin(adminForm)} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold shadow-lg hover:bg-black">تحديث الحساب</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-rose-600 flex items-center gap-2"><Database size={24} /> صيانة النظام (خطر)</h3>
        <div className="space-y-3">
          <button onClick={handleExport} className="w-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 py-3 rounded-xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-indigo-200">
            <Download size={18}/> تصدير نسخة احتياطية
          </button>
          
          <label className="w-full bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-slate-200 cursor-pointer">
            <Upload size={18}/> استيراد بيانات
            <input type="file" className="hidden" accept=".json" onChange={e => { const f = e.target.files?.[0]; if(f){ const r = new FileReader(); r.onload = ev => onImport(JSON.parse(ev.target?.result as string)); r.readAsText(f); } }} />
          </label>

          <button 
            onClick={() => setConfirmWipe(true)} 
            className="w-full bg-rose-50 text-rose-600 py-4 rounded-xl font-black flex items-center justify-center gap-2 border-2 border-dashed border-rose-200 hover:bg-rose-600 hover:text-white transition-all"
          >
            <Trash2 size={20}/> مسح كافة بيانات البرنامج
          </button>
          
          {confirmWipe && (
            <div className="p-4 bg-rose-600 text-white rounded-xl space-y-3 animate-in fade-in zoom-in">
              <p className="text-xs font-black flex items-center gap-2"><AlertTriangle size={16}/> هل أنت متأكد؟ سيتم حذف كل شيء!</p>
              <div className="flex gap-2">
                <button onClick={wipeData} className="flex-1 bg-white text-rose-600 py-2 rounded-lg font-black text-xs">نعم، مسح الكل</button>
                <button onClick={() => setConfirmWipe(false)} className="flex-1 bg-rose-800 text-white py-2 rounded-lg font-black text-xs">إلغاء</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;
