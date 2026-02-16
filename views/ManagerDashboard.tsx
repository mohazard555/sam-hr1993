
import React, { useState } from 'react';
import { Search, Shield, History, Users, Database, Lock, Eye, Key, AlertTriangle } from 'lucide-react';
import { apiClient } from '../utils/api';

const ManagerDashboard: React.FC = () => {
  const [masterKey, setMasterKey] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loginError, setLoginError] = useState(false);
  const [targetKey, setTargetKey] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // تسجيل الدخول للوحة الإدارة العليا
  const handleMasterLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(false);
    // التحقق من المفتاح السري الماستر المحدد حصراً
    if (masterKey === 'SAM-PRO-MASTER-1993') {
      setIsAuthorized(true);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 5000);
    }
  };

  const fetchTargetData = async () => {
    if (!targetKey) return;
    setLoading(true);
    setData(null); // مسح البيانات السابقة
    
    try {
      /**
       * تنفيذ الطلب للسيرفر:
       * نرسل 'x-admin-secret' للتحقق من هوية المدير
       * السيرفر سيقوم بإرجاع البيانات بناءً على targetKey فقط إذا كان فعالاً
       */
      const res = await apiClient(`/api/manager/view/${targetKey.trim().toUpperCase()}`, {
        headers: { 
          'x-admin-secret': masterKey 
          // ملاحظة: لا نرسل x-hwid هنا لأننا في وضع المراقبة (By-pass HWID)
        }
      });
      setData(res);
    } catch (err: any) {
      alert('⚠️ فشل جلب البيانات: ' + (err.message || 'المفتاح غير موجود أو غير مفعل'));
      if (err.message?.includes('Unauthorized')) setIsAuthorized(false);
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-right" dir="rtl">
        <div className="bg-white dark:bg-slate-900 p-12 rounded-[3rem] shadow-2xl border-4 border-indigo-600 max-w-md w-full animate-in zoom-in duration-300">
          <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center text-white mx-auto mb-6 shadow-xl">
            <Lock size={40} />
          </div>
          <h2 className="text-2xl font-black text-center mb-2 dark:text-white">منطقة المدير العام</h2>
          <p className="text-slate-400 text-center text-xs mb-8">يرجى إدخال المفتاح السري الماستر للوصول للسحابة</p>
          
          {loginError && (
            <div className="mb-6 p-4 bg-rose-600 text-white rounded-2xl font-black text-center animate-pulse border-4 border-rose-400 shadow-lg">
               ❌ الوصول مرفوض: مفتاح الماستر غير صحيح!
            </div>
          )}

          <form onSubmit={handleMasterLogin} className="space-y-4">
            <input 
              type="password"
              className={`w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 rounded-2xl font-black text-center outline-none transition dark:text-white ${loginError ? 'border-rose-500 animate-bounce' : 'border-transparent focus:border-indigo-600'}`}
              placeholder="••••••••••••"
              value={masterKey}
              onChange={e => {
                setMasterKey(e.target.value);
                if(loginError) setLoginError(false);
              }}
            />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black shadow-lg hover:bg-indigo-700 transition">
              تحقق من الصلاحية
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 text-right animate-in fade-in duration-500" dir="rtl">
      {/* شريط البحث عن رخصة */}
      <div className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
          <Database size={200} className="absolute -bottom-10 -left-10" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-3xl font-black flex items-center gap-3">
              <Shield className="text-indigo-400" size={36} /> رادار التحكم السحابي
            </h2>
            <p className="text-indigo-300 font-bold mt-2">أدخل مفتاح الترخيص لأي عميل لمراقبة بياناته وسجلاته مباشرة</p>
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <input 
                className="w-full p-4 bg-white/10 border-2 border-white/20 rounded-2xl font-black text-white placeholder-white/40 outline-none focus:border-white transition uppercase"
                placeholder="SAM-PRO-XXXX-XXXX"
                value={targetKey}
                onChange={e => setTargetKey(e.target.value)}
              />
              <Key className="absolute left-4 top-4 opacity-40" size={20} />
            </div>
            <button 
              onClick={fetchTargetData}
              disabled={loading}
              className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black hover:bg-indigo-50 transition flex items-center gap-2 shadow-xl"
            >
              {loading ? 'جاري الاتصال بالسحابة...' : <Eye size={20}/>} بدء المراقبة
            </button>
          </div>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
          {/* معلومات الرخصة */}
          <div className="lg:col-span-3 bg-indigo-50 dark:bg-slate-800 p-6 rounded-3xl border-2 border-indigo-100 dark:border-slate-700 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center font-black">ID</div>
                <div>
                   <p className="text-[10px] font-black text-indigo-400 uppercase">معرف قاعدة البيانات</p>
                   <p className="font-black text-indigo-900 dark:text-white">{data.info.id}</p>
                </div>
             </div>
             <div className="text-left flex gap-8">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase">اسم الجهاز الأصلي</p>
                  <p className="font-black text-indigo-900 dark:text-white">{data.info.device_name || 'غير معروف'}</p>
                </div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase">تاريخ التفعيل</p>
                  <p className="font-black text-indigo-900 dark:text-white">{new Date(data.info.activated_at).toLocaleDateString('ar-EG')}</p>
                </div>
             </div>
          </div>

          {/* قائمة الموظفين */}
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-600"><Users /> قاعدة موظفي العميل</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {data.employees.map((emp: any) => (
                <div key={emp.id} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl flex justify-between items-center border border-transparent hover:border-indigo-200 transition">
                  <div className="text-right">
                    <p className="font-black text-slate-900 dark:text-white">{emp.name}</p>
                    <p className="text-[10px] text-slate-400">{emp.department} - {emp.position}</p>
                  </div>
                  <div className="text-left">
                     <p className="text-xs font-black text-indigo-600">{Number(emp.base_salary).toLocaleString()}</p>
                  </div>
                </div>
              ))}
              {data.employees.length === 0 && <p className="text-center py-10 text-slate-400 italic">لا يوجد موظفين مسجلين</p>}
            </div>
          </div>

          {/* سجل العمليات التفصيلي */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-rose-600"><History /> تتبع النشاط الحي (Audit Logs)</h3>
            <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
              {data.logs.map((log: any) => (
                <div key={log.id} className="p-5 border-r-8 border-rose-500 bg-rose-50/30 dark:bg-rose-900/10 rounded-2xl">
                  <div className="flex justify-between items-start mb-3">
                     <span className={`px-3 py-1 rounded-full text-[10px] font-black ${
                       log.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' : 
                       log.action === 'DELETE' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                     }`}>
                       {log.action}
                     </span>
                     <span className="text-[10px] font-bold text-slate-400">{new Date(log.timestamp).toLocaleString('ar-EG')}</span>
                  </div>
                  <p className="font-black text-sm text-slate-800 dark:text-slate-200 mb-2">تعديل على جدول: <span className="text-indigo-600 dark:text-indigo-400">{log.target_table}</span></p>
                  <div className="bg-white/60 dark:bg-slate-800 p-4 rounded-xl text-[11px] font-mono overflow-x-auto dark:text-white">
                    <pre className="whitespace-pre-wrap">{JSON.stringify(log.new_data || log.old_data, null, 2)}</pre>
                  </div>
                </div>
              ))}
              {data.logs.length === 0 && <p className="text-center py-20 text-slate-400 italic">لم يتم تسجيل أي عمليات لهذه النسخة بعد</p>}
            </div>
          </div>
        </div>
      )}

      {/* تنبيه أمني */}
      <div className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border-2 border-amber-100 dark:border-amber-900/40 flex items-center gap-4 text-amber-800 dark:text-amber-400 no-print">
         <AlertTriangle className="shrink-0" size={32} />
         <p className="text-xs font-bold leading-relaxed">
           <strong>تنبيه أمني:</strong> أنت الآن في وضع "المراقب السحابي". يتم جلب البيانات من السيرفر مباشرة دون قيود البصمة (HWID Bypass). أي بيانات تراها هنا هي بيانات حية من العميل. يرجى الحذر عند التعامل مع معلومات الخصوصية.
         </p>
         <button onClick={() => setIsAuthorized(false)} className="mr-auto bg-amber-200 dark:bg-amber-800 px-6 py-2 rounded-xl font-black text-xs hover:bg-amber-300 transition dark:text-white">خروج آمن</button>
      </div>
    </div>
  );
};

export default ManagerDashboard;
