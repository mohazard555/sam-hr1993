import React, { useState } from 'react';
import { CompanySettings, User, ArchiveLog } from '../types';
import { DB } from '../db/store';
import { Shield, Upload, Download, Database, Trash2, Image as ImageIcon, History, Archive, FileJson, CalendarDays, Clock, Banknote, HelpCircle, Settings2, Loader2 } from 'lucide-react';

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
  const [isGistLocked, setIsGistLocked] = useState(true);
  const [gistPasswordInput, setGistPasswordInput] = useState('');
  const [userForm, setUserForm] = useState<Partial<User>>({
    name: '',
    username: '',
    password: '',
    role: 'data_entry',
    permissions: []
  });

  const handleUnlockGist = () => {
    if (gistPasswordInput === 'sam1993') {
      setIsGistLocked(false);
      setGistPasswordInput('');
    } else {
      alert('الرمز السري غير صحيح');
    }
  };

  (window as any).onRemoveUser = onRemoveUser;

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setUserForm({
      name: user.name,
      username: user.username,
      password: user.password,
      role: user.role,
      permissions: user.permissions
    });
  };

  const resetUserForm = () => {
    setEditingUserId(null);
    setUserForm({
      name: '',
      username: '',
      password: '',
      role: 'data_entry',
      permissions: []
    });
  };

  const handleTogglePermission = (permission: string) => {
    setUserForm(prev => {
      const perms = prev.permissions || [];
      if (perms.includes(permission)) {
        return { ...prev, permissions: perms.filter(p => p !== permission) };
      } else {
        return { ...prev, permissions: [...perms, permission] };
      }
    });
  };

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
        <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Shield size={24} /> إدارة المستخدمين</h3>
        <div className="space-y-4">
           {db.users.map(user => (
             <div key={user.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center border border-slate-100 dark:border-slate-700">
                <div>
                  <p className="font-black text-slate-800 dark:text-white leading-none mb-1">{user.name}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{user.role === 'admin' ? 'مدير كامل الصلاحيات' : 'مدخل بيانات'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEditUser(user)} className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl hover:bg-indigo-100 transition"><Settings2 size={16}/></button>
                  {user.id !== db.users[0].id && (
                    <button onClick={() => {
                      if(confirm('حذف المستخدم نهائياً؟')) {
                        onRemoveUser(user.id);
                      }
                    }} className="p-2 bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition"><Trash2 size={16}/></button>
                  )}
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t dark:border-slate-800 space-y-4 animate-in slide-in-from-bottom-2">
              <h4 className="text-sm font-black text-slate-400 uppercase tracking-tight flex items-center gap-2">
                {editingUserId ? <Clock size={16}/> : <Database size={16}/>}
                {editingUserId ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد للنظام'}
              </h4>
              
              <div className="grid grid-cols-2 gap-3">
                <input 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition" 
                  placeholder="الاسم الحقيقي" 
                  value={userForm.name}
                  onChange={e => setUserForm({...userForm, name: e.target.value})}
                />
                <input 
                  className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition" 
                  placeholder="اسم المستخدم" 
                  value={userForm.username}
                  onChange={e => setUserForm({...userForm, username: e.target.value})}
                />
              </div>

              <input 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black outline-none transition" 
                placeholder="كلمة المرور الجديدة" 
                type="password" 
                value={userForm.password}
                onChange={e => setUserForm({...userForm, password: e.target.value})}
              />

              <div className="p-4 bg-slate-100/50 dark:bg-slate-800 rounded-2xl border">
                  <label className="text-[10px] font-black text-slate-400 mb-3 block uppercase flex items-center gap-2"><Shield size={12}/> صلاحيات المديول المتاحة</label>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-[11px] font-bold">
                    {[
                      {id: 'dashboard', label: 'لوحة التحكم'}, {id: 'employees', label: 'الموظفون'},
                      {id: 'departments', label: 'الأقسام'}, {id: 'attendance', label: 'الحضور والانصراف'},
                      {id: 'leaves', label: 'الإجازات'}, {id: 'financials', label: 'المالية'},
                      {id: 'loans', label: 'السلف'}, {id: 'production', label: 'الإنتاج'},
                      {id: 'payroll', label: 'الرواتب'}, {id: 'documents', label: 'المستندات'},
                      {id: 'reports', label: 'التقارير'}, {id: 'settings', label: 'الإعدادات'},
                      {id: 'manager', label: 'الإدارة السحابية'}
                    ].map(tab => (
                      <label key={tab.id} className="flex items-center justify-between cursor-pointer hover:bg-white dark:hover:bg-slate-700 p-2 rounded-xl transition border border-transparent hover:border-slate-200">
                        <span>{tab.label}</span>
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 accent-indigo-600" 
                          checked={userForm.permissions?.includes(tab.id)}
                          onChange={() => handleTogglePermission(tab.id)}
                        />
                      </label>
                    ))}
                  </div>
              </div>

              <div className="flex gap-3">
                <select 
                  className="w-2/5 p-4 bg-slate-200 dark:bg-slate-700 rounded-2xl font-black outline-none"
                  value={userForm.role}
                  onChange={e => setUserForm({...userForm, role: e.target.value as any})}
                >
                  <option value="data_entry">مدخل بيانات</option>
                  <option value="admin">مسؤول نظام</option>
                </select>
                
                <div className="flex gap-2 flex-1">
                  {editingUserId && (
                    <button onClick={resetUserForm} className="bg-slate-100 text-slate-500 px-6 rounded-2xl font-black">إلغاء</button>
                  )}
                  <button 
                    onClick={() => {
                       if (!userForm.name || !userForm.username || !userForm.password) {
                         alert('يرجى إكمال الحقول الأساسية (الاسم، المعرف، الرقم السري)');
                         return;
                       }
                       
                       const newUser: User = { 
                          id: editingUserId || `user-${Date.now()}`, 
                          name: userForm.name!, 
                          username: userForm.username!, 
                          password: userForm.password!, 
                          role: userForm.role || 'data_entry',
                          permissions: userForm.permissions || []
                       };
                       
                       onSaveUser(newUser);
                       alert(editingUserId ? 'تم تحديث بيانات المستخدم بنجاح' : 'تم إضافة المستخدم الجديد بنجاح');
                       resetUserForm();
                    }}
                    className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition"
                  >
                    {editingUserId ? 'حفظ التغييرات' : 'تفعيل وصناعة المستخدم'}
                  </button>
                </div>
              </div>
           </div>
        </div>
      </div>

      {/* Sync Management */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 space-y-6 relative overflow-hidden">
        <div className="flex justify-between items-center">
            <h3 className="text-xl font-black text-indigo-600 flex items-center gap-2"><Database size={24} /> مزامنة Gist السحابية</h3>
            <div className="flex items-center gap-2">
                {isGistLocked ? (
                   <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                      <input 
                        type="password" 
                        className="w-20 bg-transparent text-[10px] font-black outline-none px-2 text-center" 
                        placeholder="رمز القفل"
                        value={gistPasswordInput}
                        onChange={e => setGistPasswordInput(e.target.value)}
                        onKeyPress={e => e.key === 'Enter' && handleUnlockGist()}
                      />
                      <button onClick={handleUnlockGist} className="bg-indigo-600 text-white p-1.5 rounded-lg hover:bg-indigo-700 transition">
                         <Shield size={12}/>
                      </button>
                   </div>
                ) : (
                  <button onClick={() => setIsGistLocked(true)} className="bg-rose-500 text-white px-3 py-1 rounded-lg text-[10px] font-black flex items-center gap-1">
                     <Lock size={10}/> قفل الإعدادات
                  </button>
                )}
                <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${isSyncing ? 'bg-amber-100 text-amber-600 animate-pulse' : 'bg-emerald-100 text-emerald-600'}`}>
                    {isSyncing ? 'جاري المزامنة' : 'متصل سحابياً'}
                </div>
            </div>
        </div>
        
        <div className={`space-y-4 transition-all duration-500 ${isGistLocked ? 'blur-sm pointer-events-none opacity-40' : ''}`}>
            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 rounded-2xl border-2 border-dashed border-indigo-100">
                <label className="text-[10px] font-black text-indigo-400 mb-1 block uppercase">رابط Gist الكامل (أو الرقم التعريفي)</label>
                <input 
                  className="w-full bg-white dark:bg-slate-800 p-3 rounded-xl border font-mono text-xs outline-none focus:border-indigo-600" 
                  placeholder="https://gist.github.com/username/id..." 
                  value={settings.gistURL || settings.gistID || ''} 
                  onChange={e => onUpdateSettings({gistURL: e.target.value, gistID: ''})} 
                />
            </div>
            
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">رقم الـ Token (سري)</label>
              <input 
                type="password" 
                className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-black" 
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" 
                value={settings.gistToken || ''} 
                onChange={e => onUpdateSettings({gistToken: e.target.value})} 
              />
            </div>

            <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl text-[10px] font-bold text-slate-500 leading-relaxed space-y-2">
                <p className="text-rose-600 font-extrabold flex items-center gap-1"><ShieldAlert size={12}/> تجنب حذف بيانات المزامنة أو مشاركتها لضمان استمرارية العمل السحابي.</p>
                <p>⚠️ تأكد من أن الـ Token يملك صلاحية <span className="text-indigo-600 font-black">'gist'</span> للوصول للملفات.</p>
                <p>⚠️ النظام يقوم بالمزامنة تلقائياً كل <span className="text-indigo-600 font-black">20 ثانية</span> من أي تعديل.</p>
            </div>

            <div className="flex flex-col gap-2">
               <button 
                disabled={isSyncing}
                onClick={onManualSync} 
                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all text-xl"
              >
                {isSyncing ? <Loader2 className="animate-spin" size={24}/> : <Database size={24}/>}
                {isSyncing ? 'جاري الرفع...' : 'مزامنة يدوية فورية'}
              </button>

              <button 
                disabled={isSyncing}
                onClick={async () => {
                  if (!confirm('هل تريد فعلاً استيراد البيانات من Gist؟ سيؤدي ذلك لمسح كافة البيانات المحلية واستبدالها بما هو موجود على السحابة.')) return;
                  
                  const gistURL = settings.gistURL || "";
                  const gistID = settings.gistID || "";
                  const token = settings.gistToken?.trim();

                  const extractId = (str: string) => {
                    if (!str) return "";
                    const trimmed = str.trim();
                    if (trimmed.includes('github.com')) {
                      const parts = trimmed.split('/');
                      const idMatch = parts.find(p => /^[a-f0-9]{32}$/i.test(p));
                      if (idMatch) return idMatch;
                    }
                    const idMatch = trimmed.match(/[a-f0-9]{32}/i);
                    return idMatch ? idMatch[0] : trimmed;
                  };

                  const finalID = extractId(gistURL) || extractId(gistID);
                  if (!finalID || !token) {
                    alert('يرجى التأكد من إعدادات Gist والتوكين أولاً.');
                    return;
                  }

                  try {
                    const response = await fetch(`https://api.github.com/gists/${finalID}`, {
                      headers: { 'Authorization': `token ${token}` }
                    });
                    if (response.ok) {
                      const data = await response.json();
                      const fileContent = data.files["Hrjordon.json"]?.content;
                      if (fileContent) {
                        onImport(JSON.parse(fileContent));
                        alert('تم استيراد البيانات من السحابة بنجاح!');
                      } else {
                        alert('لم يتم العثور على ملف Hrjordon.json في الـ Gist المحدد.');
                      }
                    } else {
                      alert('فشل الاتصال بـ GitHub: ' + response.statusText);
                    }
                  } catch (e) {
                    alert('خطأ في الاتصال بالسحابة.');
                  }
                }}
                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-3 rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-slate-200 transition"
              >
                <Download size={18}/> استعادة البيانات من السحابة
              </button>
            </div>
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
