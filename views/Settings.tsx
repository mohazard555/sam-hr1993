import React, { useState } from 'react';
import { CompanySettings, User, ArchiveLog } from '../types';
import { DB } from '../db/store';
import { Shield, Upload, Download, Database, Trash2, Image as ImageIcon, History, Archive, FileJson, CalendarDays, Clock, Banknote, HelpCircle, Settings2 } from 'lucide-react';

interface Props {
  settings: CompanySettings;
  admin: User;
  db: DB;
  onUpdateSettings: (s: Partial<CompanySettings>) => void;
  onUpdateAdmin: (u: Partial<User>) => void;
  onImport: (db: DB) => void;
  onRunArchive: () => void;
  onClearData: () => void;
  onSaveUser: (u: User) => void;
  onRemoveUser: (id: string) => void;
  onManualSync: () => void;
  isSyncing: boolean;
}

const SettingsView: React.FC<Props> = ({ settings, admin, db, onUpdateSettings, onUpdateAdmin, onImport, onRunArchive, onClearData, onSaveUser, onRemoveUser, onManualSync, isSyncing }) => {
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [adminForm, setAdminForm] = useState({ username: admin.username, password: admin.password || '' });

  (window as any).onRemoveUser = onRemoveUser;

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
                  <HelpCircle size={14} className="text-indigo-500"/> تلميح كلمة المرور
                </label>
                <input 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition" 
                  placeholder="مثال: رقم هاتفك أو اسمك المفضل"
                  value={settings.passwordHint || ''} 
                  onChange={e => onUpdateSettings({passwordHint: e.target.value})} 
                />
              </div>
              
              <div className="p-6 bg-indigo-50/50 dark:bg-slate-800 rounded-3xl border-2 border-indigo-100 dark:border-slate-700 space-y-4">
                <h4 className="text-sm font-black text-indigo-700 flex items-center gap-2"><Settings2 size={18}/> تخصيص دورة الرواتب</h4>
                <div>
                  <label className="text-xs font-black text-slate-500 mb-1 block uppercase">نظام الدورة</label>
                  <select className="w-full p-3 bg-white dark:bg-slate-900 border rounded-xl font-black outline-none" value={settings.salaryCycle} onChange={e => onUpdateSettings({salaryCycle: e.target.value as any})}>
                    <option value="monthly">نظام رواتب شهري</option>
                    <option value="weekly">نظام رواتب أسبوعي</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                     <label className="text-[10px] font-black text-slate-400 block mb-1">أيام الشهر المالي</label>
                     <input type="number" className="w-full p-3 border rounded-xl font-black" value={settings.monthlyCycleDays || 30} onChange={e => onUpdateSettings({monthlyCycleDays: Number(e.target.value)})} />
                   </div>
                   <div>
                     <label className="text-[10px] font-black text-slate-400 block mb-1">أيام الأسبوع المالي</label>
                     <input type="number" className="w-full p-3 border rounded-xl font-black" value={settings.weeklyCycleDays || 7} onChange={e => onUpdateSettings({weeklyCycleDays: Number(e.target.value)})} />
                   </div>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border">
                 <input 
                   type="checkbox" 
                   id="fridayWork"
                   className="w-5 h-5 accent-indigo-600"
                   checked={settings.fridayIsWorkDay} 
                   onChange={e => onUpdateSettings({fridayIsWorkDay: e.target.checked})} 
                 />
                 <label htmlFor="fridayWork" className="text-sm font-black text-slate-700 dark:text-slate-200 cursor-pointer">
                    اعتبار يوم الجمعة يوم دوام رسمي
                 </label>
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
      </div>

      {/* Admin Credentials */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-slate-800 dark:text-slate-200 flex items-center gap-2"><Shield size={24} /> إدارة المستخدمين</h3>
        <div className="space-y-4">
           {db.users.map(user => (
             <div key={user.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center">
                <div>
                  <p className="font-black text-slate-800 dark:text-white">{user.name}</p>
                  <p className="text-[10px] font-bold text-slate-500">{user.role === 'admin' ? 'مسؤول' : 'مدخل بيانات'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => {
                    setEditingUserId(user.id);
                    (document.getElementById('new-user-name') as HTMLInputElement).value = user.name;
                    (document.getElementById('new-user-username') as HTMLInputElement).value = user.username;
                    (document.getElementById('new-user-password') as HTMLInputElement).value = user.password;
                    (document.getElementById('new-user-role') as HTMLSelectElement).value = user.role;
                    document.querySelectorAll('.user-permission-checkbox').forEach((cb: any) => {
                      cb.checked = user.permissions.includes(cb.value);
                    });
                  }} className="text-xs bg-white dark:bg-slate-700 px-3 py-1 rounded-lg">تعديل</button>
                  {user.id !== db.users[0].id && (
                    <button onClick={() => {
                      if(confirm('حذف المستخدم نهائياً؟')) {
                        // We need onRemoveUser prop or similar. Let's use a trick or add it.
                        (window as any).onRemoveUser(user.id);
                      }
                    }} className="text-xs bg-rose-50 text-rose-600 px-3 py-1 rounded-lg"><Trash2 size={14}/></button>
                  )}
                </div>
             </div>
           ))}
           <div className="pt-4 border-t">
              <input className="w-full p-3 mb-2 bg-slate-50 border rounded-xl font-bold" placeholder="اسم المستخدم" id="new-user-name" />
              <input className="w-full p-3 mb-2 bg-slate-50 border rounded-xl font-bold" placeholder="اسم الدخول" id="new-user-username" />
              <input className="w-full p-3 mb-2 bg-slate-50 border rounded-xl font-bold" placeholder="كلمة المرور" id="new-user-password" type="password" />
              <div className="mb-4">
                  <label className="text-xs font-black text-slate-400 mb-2 block uppercase">الأقسام المسموح بها</label>
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                    {[
                      {id: 'dashboard', label: 'لوحة التحكم'},
                      {id: 'employees', label: 'الموظفون'},
                      {id: 'departments', label: 'الأقسام'},
                      {id: 'attendance', label: 'الحضور والانصراف'},
                      {id: 'leaves', label: 'الإجازات'},
                      {id: 'financials', label: 'المالية'},
                      {id: 'loans', label: 'السلف'},
                      {id: 'production', label: 'الإنتاج'},
                      {id: 'payroll', label: 'الرواتب'},
                      {id: 'documents', label: 'المستندات'},
                      {id: 'reports', label: 'التقارير'}
                    ].map(tab => (
                      <label key={tab.id} className="flex items-center gap-2">
                        <input type="checkbox" className="user-permission-checkbox" value={tab.id}/> {tab.label}
                      </label>
                    ))}
                  </div>
              </div>
              <select className="w-full p-3 mb-2 bg-slate-50 border rounded-xl font-bold" id="new-user-role">
                <option value="data_entry">مدخل بيانات</option>
                <option value="admin">مسؤول</option>
              </select>
              <button 
                onClick={() => {
                   const name = (document.getElementById('new-user-name') as HTMLInputElement).value;
                   const username = (document.getElementById('new-user-username') as HTMLInputElement).value;
                   const password = (document.getElementById('new-user-password') as HTMLInputElement).value;
                   const checkboxes = document.querySelectorAll('.user-permission-checkbox:checked');
                   const permissions = Array.from(checkboxes).map((cb: any) => cb.value);
                   const role = (document.getElementById('new-user-role') as HTMLSelectElement).value as any;
                   
                   onSaveUser({ 
                      id: editingUserId || Date.now().toString(), 
                      name, 
                      username, 
                      password, 
                      role,
                      permissions 
                   });
                   setEditingUserId(null);
                   (document.getElementById('new-user-name') as HTMLInputElement).value = '';
                   (document.getElementById('new-user-username') as HTMLInputElement).value = '';
                   (document.getElementById('new-user-password') as HTMLInputElement).value = '';
                   document.querySelectorAll('.user-permission-checkbox').forEach((cb: any) => (cb.checked = false));
                }}
                className="w-full bg-indigo-600 text-white py-3 rounded-xl font-black"
              >
                {editingUserId ? 'حفظ التعديلات' : 'إضافة مستخدم'}
              </button>
           </div>
        </div>
      </div>

      {/* Sync Management */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6">
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Database size={24} /> مزامنة البيانات (Gist)</h3>
        <div>
          <label className="text-xs font-black text-slate-400 mb-1 block uppercase">رقم تعريف Gist (ID)</label>
          <input className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl" placeholder="66e2253..." value={settings.gistID || ''} onChange={e => onUpdateSettings({gistID: e.target.value})} />
        </div>
        <div>
          <label className="text-xs font-black text-slate-400 mb-1 block uppercase">Token</label>
          <input type="password" className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl" placeholder="ghp_..." value={settings.gistToken || ''} onChange={e => onUpdateSettings({gistToken: e.target.value})} />
        </div>
        <div className="flex gap-2">
          <button onClick={() => alert('تم حفظ الإعدادات')} className="flex-1 bg-slate-800 text-white py-4 rounded-2xl font-black">حفظ الإعدادات</button>
          <button 
            disabled={isSyncing}
            onClick={onManualSync} 
            className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSyncing ? 'جاري الرفع...' : 'مزامنة الآن'}
            <Database size={18}/>
          </button>
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

          <button onClick={onClearData} className="w-full bg-rose-50 text-rose-600 py-4 rounded-2xl font-black border-2 border-dashed border-rose-200 hover:bg-rose-100 transition">
            <Trash2 size={20}/> مسح شامل للبيانات
          </button>
        </div>
      </div>

    </div>
  );
};

export default SettingsView;
