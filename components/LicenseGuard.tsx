
import React, { useState, useEffect } from 'react';
import { getDeviceFingerprint, VALID_LICENSES, checkActivationStatus } from '../utils/licenseManager';
import { ShieldCheck, ShieldAlert, Key, Loader2, MonitorSmartphone, AlertCircle, Cpu } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [activationState, setActivationState] = useState(checkActivationStatus());
  const [inputKey, setInputKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const key = inputKey.trim().toUpperCase();
    const currentFp = getDeviceFingerprint();
    const storedKey = localStorage.getItem('SAM_LIC_KEY');

    // 1. منع تغيير المفتاح إذا كان الجهاز مفعلاً مسبقاً
    if (storedKey && storedKey !== key) {
        setError('الجهاز مفعّل مسبقًا ولا يمكن تغيير الترخيص.');
        setLoading(false);
        return;
    }

    // 2. فحص صلاحية المفتاح محلياً
    if (!VALID_LICENSES.includes(key)) {
      setError('مفتاح الترخيص غير صحيح.');
      setLoading(false);
      return;
    }

    // 3. محاكاة الاتصال بالخادم لربط المفتاح (مرة واحدة)
    try {
      // هنا يتم الاتصال بـ HTTPS API حقيقي في الواقع
      // لمحاكاة الطلب:
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // لنفترض أن الخادم رد بالنجاح
      localStorage.setItem('SAM_LIC_KEY', key);
      localStorage.setItem('SAM_LIC_FP', currentFp);
      localStorage.setItem('SAM_LIC_ACTIVE', 'true');
      
      setActivationState({ status: 'activated' });
    } catch (err) {
      setError('خطأ في الاتصال بالخادم. يرجى التحقق من الإنترنت.');
    } finally {
      setLoading(false);
    }
  };

  if (activationState.status === 'activated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden border-4 border-white/5">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-bl-[10rem] opacity-50 -z-0"></div>
        
        <div className="relative z-10 text-center mb-10">
          <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl shadow-indigo-500/40">
            {activationState.status === 'error' ? <ShieldAlert size={48} /> : <ShieldCheck size={48} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">تأمين نسخة SAM Pro</h2>
          <p className="text-slate-400 font-bold px-4 leading-relaxed">
            {activationState.status === 'error' 
              ? activationState.message 
              : 'يرجى إدخال مفتاح الترخيص المعتمد لمرة واحدة فقط.'}
          </p>
        </div>

        {activationState.status !== 'error' && (
          <form onSubmit={handleActivate} className="relative z-10 space-y-6">
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] font-black text-center text-2xl uppercase tracking-[0.2em] outline-none focus:border-indigo-600 transition-all"
                placeholder="LIC-XXXX-XXXX"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                disabled={loading}
              />
              <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-5 bg-rose-50 text-rose-700 rounded-3xl border-2 border-rose-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="shrink-0 mt-1" size={20} />
                <p className="text-xs font-black leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !inputKey}
              className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24}/> تفعيل النظام الآن</>}
            </button>
          </form>
        )}

        <div className="relative z-10 mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-2">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-4 py-2 rounded-full border">
              <Cpu size={14} className="text-indigo-500"/>
              Hardware ID: {getDeviceFingerprint()}
           </div>
           <p className="text-[9px] font-bold text-slate-300 italic">* نظام حماية SAM المطور: لا يمكن نقل الترخيص لجهاز آخر.</p>
        </div>
      </div>
    </div>
  );
};

export default LicenseGuard;
