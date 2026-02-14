
import React, { useState, useEffect } from 'react';
import { 
  generateHardwareID, 
  getPlatformType, 
  callActivationAPI, 
  checkActivationStatus, 
  encryptData,
  VALID_LICENSES 
} from '../utils/licenseManager';
import { ShieldCheck, ShieldAlert, Key, Loader2, Cpu, AlertCircle, Lock, Server, Globe, Monitor, Smartphone } from 'lucide-react';

interface LicenseGuardProps {
  children: React.ReactNode;
}

const LicenseGuard: React.FC<LicenseGuardProps> = ({ children }) => {
  const [activationState, setActivationState] = useState<{status: string, message?: string}>({ status: 'checking' });
  const [inputKey, setInputKey] = useState('');
  const [hwid, setHwid] = useState('');
  const [platform, setPlatform] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      const state = await checkActivationStatus();
      const currentHwid = await generateHardwareID();
      const currentPlatform = getPlatformType();
      setHwid(currentHwid);
      setPlatform(currentPlatform);
      setActivationState(state);
    };
    init();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const key = inputKey.trim().toUpperCase();

    // 1. فحص الصلاحية الأساسية للمفتاح (Client Side Check)
    if (!VALID_LICENSES.includes(key)) {
      setError('مفتاح الترخيص المدخل غير موجود في سجلات النظام.');
      setLoading(false);
      return;
    }

    // 2. التحقق من الخادم (Server Side Check simulation)
    if (!navigator.onLine) {
      setError('❌ التفعيل لأول مرة يتطلب اتصال إنترنت لربط المفتاح بجهازك.');
      setLoading(false);
      return;
    }

    try {
      const response = await callActivationAPI(key, hwid, platform);
      
      if (!response.success) {
        setError(response.message);
        setLoading(false);
        return;
      }
      
      // 3. تخزين البيانات محلياً مشفرة
      const secureData = JSON.stringify({
        key,
        hwid,
        platform,
        active: true,
        activationDate: new Date().toISOString()
      });

      const encrypted = await encryptData(secureData);
      localStorage.setItem('SAM_SECURE_LIC_DATA', encrypted);
      
      setActivationState({ status: 'activated' });
    } catch (err) {
      setError('حدث خطأ أثناء الاتصال بخادم التراخيص. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  if (activationState.status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="relative">
          <Loader2 className="animate-spin text-indigo-500" size={64} />
          <Lock className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" size={20} />
        </div>
        <p className="text-white font-black mt-6 animate-pulse tracking-widest uppercase text-sm">SAM SECURITY SHIELD ACTIVE</p>
      </div>
    );
  }

  if (activationState.status === 'activated') {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
      <div className="w-full max-w-xl bg-white rounded-[3.5rem] p-10 md:p-14 shadow-2xl relative overflow-hidden border-4 border-white/5 animate-in zoom-in duration-500">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-bl-[12rem] opacity-40 -z-0"></div>
        
        <div className="relative z-10 text-center mb-10">
          <div className={`w-28 h-28 rounded-[2.5rem] mx-auto flex items-center justify-center text-white mb-6 shadow-2xl transition-all duration-500 ${activationState.status === 'error' || error ? 'bg-rose-600 shadow-rose-500/40 rotate-12' : 'bg-indigo-600 shadow-indigo-500/40'}`}>
            {activationState.status === 'error' || error ? <ShieldAlert size={56} /> : <ShieldCheck size={56} />}
          </div>
          <h2 className="text-4xl font-black text-slate-900 mb-2 tracking-tighter">تفعيل SAM Pro</h2>
          <p className="text-slate-400 font-bold px-4 leading-relaxed text-sm">
            {activationState.status === 'error' 
              ? activationState.message 
              : 'نظام إدارة الموارد البشرية محمي. يرجى إدخال مفتاح الترخيص المعتمد لربطه بهذا الجهاز بشكل دائم.'}
          </p>
        </div>

        {activationState.status !== 'error' && (
          <form onSubmit={handleActivate} className="relative z-10 space-y-6">
            <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-3xl border-2 border-slate-100 mb-2 shadow-inner">
               <div className="bg-indigo-600 text-white p-2 rounded-xl">
                  {platform === 'Android' ? <Smartphone size={20}/> : <Monitor size={20}/>}
               </div>
               <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase leading-none">منصة التشغيل المكتشفة</p>
                  <p className="text-sm font-black text-indigo-700 leading-tight">{platform} System</p>
               </div>
               <div className="mr-auto">
                  <span className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full ${navigator.onLine ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                    <Globe size={12}/> {navigator.onLine ? 'متصل' : 'أوفلاين'}
                  </span>
               </div>
            </div>

            <div className="relative">
              <input 
                type="text" 
                className="w-full p-6 bg-slate-50 border-2 border-slate-100 rounded-[2.2rem] font-black text-center text-2xl uppercase tracking-widest outline-none focus:border-indigo-600 transition-all placeholder:text-slate-200 shadow-inner"
                placeholder="LIC-XXXX-XXXX-XXXX"
                value={inputKey}
                onChange={e => setInputKey(e.target.value)}
                disabled={loading}
              />
              <Key className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300" size={24} />
            </div>

            {error && (
              <div className="flex items-start gap-3 p-5 bg-rose-50 text-rose-700 rounded-[1.8rem] border-2 border-rose-100 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="shrink-0 mt-1" size={24} />
                <p className="text-sm font-black leading-relaxed">{error}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading || !inputKey}
              className="w-full bg-slate-900 text-white py-6 rounded-[2.2rem] font-black text-2xl shadow-2xl hover:bg-black transition-all active:scale-[0.98] flex items-center justify-center gap-4 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={28}/>
                  <span className="animate-pulse">جاري ربط الجهاز...</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={28}/>
                  تفعيل والربط النهائي
                </>
              )}
            </button>
          </form>
        )}

        <div className="relative z-10 mt-10 pt-8 border-t border-slate-100 flex flex-col items-center gap-3">
           <div className="flex items-center gap-3 text-[11px] font-black text-slate-400 bg-slate-50 px-6 py-3 rounded-full border shadow-sm max-w-full overflow-hidden">
              <Cpu size={16} className="text-indigo-500 shrink-0"/>
              <span className="shrink-0 uppercase opacity-50">Device HWID:</span>
              <span className="text-indigo-600 font-mono truncate">{hwid}</span>
           </div>
           <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 transition">
              <p className="text-[10px] font-black text-slate-950">SAM Personnel Management System v6.0 Pro</p>
              <p className="text-[9px] font-bold text-slate-400">Security Engine: Mohannad Ahmad • +963 998 171 954</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LicenseGuard;
