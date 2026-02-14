
import React, { useState, useEffect } from 'react';
import { getHashedFingerprint, VALID_LICENSES, checkActivationStatus, verifyLicenseWithServer } from '../utils/licenseManager';
import { ShieldCheck, ShieldAlert, Key, Loader2, Cpu, AlertCircle, Lock, Server } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [activationState, setActivationState] = useState<{status: string, message?: string}>({ status: 'checking' });
  const [inputKey, setInputKey] = useState('');
  const [hwid, setHwid] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const state = await checkActivationStatus();
      const currentHwid = await getHashedFingerprint();
      setHwid(currentHwid);
      setActivationState(state);
    };
    init();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const key = inputKey.trim().toUpperCase();
    const currentFp = await getHashedFingerprint();

    // 1. فحص الصلاحية الأساسية للمفتاح
    if (!VALID_LICENSES.includes(key)) {
      setError('مفتاح الترخيص المدخل غير موجود في سجلاتنا.');
      setLoading(false);
      return;
    }

    // 2. محاكاة التحقق من الخادم لربط الجهاز (Hardware Binding)
    try {
      // يتطلب إنترنت في هذه الخطوة فقط (محاكاة)
      if (!navigator.onLine) {
        setError('يجب توفر اتصال إنترنت عند التفعيل لأول مرة لربط المفتاح بجهازك.');
        setLoading(false);
        return;
      }

      const serverResponse = await verifyLicenseWithServer(key, currentFp);
      
      if (!serverResponse.success) {
        setError(serverResponse.message);
        setLoading(false);
        return;
      }
      
      // نجاح التفعيل والربط
      localStorage.setItem('SAM_LIC_KEY', key);
      localStorage.setItem('SAM_LIC_FP', currentFp);
      localStorage.setItem('SAM_LIC_ACTIVE', 'true');
      
      setActivationState({ status: 'activated' });
    } catch (err) {
      setError('فشل الاتصال بخادم التراخيص. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (activationState.status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-cairo" dir="rtl">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-white font-black animate-pulse">جاري التحقق من أمان النظام...</p>
      </div>
    );
  }

  if (activationState.status === 'activated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden border-4 border-white/5 animate-in zoom-in duration-500">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-50 rounded-bl-[10rem] opacity-50 -z-0"></div>
        
        <div className="relative z-10 text-center mb-10">
          <div className={`w-24 h-24 rounded-[2.2rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl transition-colors duration-500 ${activationState.status === 'error' || error ? 'bg-rose-600 shadow-rose-500/40' : 'bg-indigo-600 shadow-indigo-500/40'}`}>
            {activationState.status === 'error' || error ? <ShieldAlert size={48} /> : <Lock size={48} />}
          </div>
          <h2 className="text-3xl font-black text-slate-900 mb-2">تأمين SAM Pro</h2>
          <p className="text-slate-400 font-bold px-4 leading-relaxed">
            {activationState.status === 'error' 
              ? activationState.message 
              : 'هذا النظام محمي. يرجى إدخال مفتاح الترخيص الذي حصلت عليه من المطور لربطه بهذا الجهاز.'}
          </p>
        </div>

        {activationState.status !== 'error' && (
          <form onSubmit={handleActivate} className="relative z-10 space-y-6">
            <div className="relative">
              <input 
                type="text" 
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.2rem] font-black text-center text-xl uppercase tracking-widest outline-none focus:border-indigo-600 transition-all placeholder:text-slate-300 shadow-inner"
                placeholder="LIC-XXXX-XXXX-XXXX"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                disabled={loading}
              />
              <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-5 bg-rose-50 text-rose-700 rounded-[1.5rem] border-2 border-rose-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="shrink-0 mt-1" size={20} />
                <p className="text-xs font-black leading-relaxed">{error}</p>
              </div>
            )}

            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-center gap-3 no-print">
               <Server size={20} className="text-amber-600 shrink-0"/>
               <p className="text-[10px] font-black text-amber-700 leading-tight">سيتم ربط هذا المفتاح ببصمة جهازك الحالية (HWID) ولن يعمل على أي جهاز آخر بعد التفعيل.</p>
            </div>

            <button 
              type="submit" 
              disabled={loading || !inputKey}
              className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] font-black text-xl shadow-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-3 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : <><ShieldCheck size={24}/> تفعيل وربط الجهاز</>}
            </button>
          </form>
        )}

        <div className="relative z-10 mt-12 pt-8 border-t border-slate-100 flex flex-col items-center gap-2">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase bg-slate-50 px-4 py-2 rounded-full border">
              <Cpu size={14} className="text-indigo-500"/>
              Hardware ID: <span className="text-indigo-600">{hwid}</span>
           </div>
           <p className="text-[9px] font-bold text-slate-300 italic">Developed by Mohannad Ahmad • +963 998 171 954</p>
        </div>
      </div>
    </div>
  );
};

export default LicenseGuard;
