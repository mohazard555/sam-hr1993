
import React, { useState, useEffect } from 'react';
import { 
  generateHardwareID, 
  callActivationAPI, 
  checkActivationStatus, 
  saveActivation,
  VALID_LICENSES 
} from '../utils/licenseManager';
import { ShieldCheck, ShieldAlert, Key, Loader2, Cpu, AlertCircle, Lock, Globe, WifiOff, RefreshCw } from 'lucide-react';

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
      const currentHwid = await generateHardwareID();
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

    if (!VALID_LICENSES.includes(key)) {
      setError('❌ مفتاح الترخيص غير موجود في القائمة المعتمدة.');
      setLoading(false);
      return;
    }

    if (!navigator.onLine) {
      setError('❌ مطلوب اتصال بالإنترنت للتحقق من المفتاح لأول مرة.');
      setLoading(false);
      return;
    }

    try {
      const response = await callActivationAPI(key, hwid);
      if (!response.success) {
        setError(response.message || 'فشل التفعيل');
        setLoading(false);
        return;
      }
      await saveActivation(key, hwid);
      setActivationState({ status: 'activated' });
    } catch (err) {
      setError('فشل الاتصال بخادم الأمان. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  if (activationState.status === 'checking') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 font-cairo" dir="rtl">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={50} />
        <p className="text-white font-black animate-pulse uppercase text-xs">جاري فحص ترخيص النسخة...</p>
      </div>
    );
  }

  if (activationState.status === 'activated') return <>{children}</>;

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
      <div className="w-full max-w-lg bg-white rounded-[3rem] p-10 shadow-2xl relative border-4 border-white/5 overflow-hidden">
        <div className="text-center mb-8">
          <div className={`w-20 h-20 rounded-3xl mx-auto flex items-center justify-center text-white mb-6 shadow-xl ${error ? 'bg-rose-600' : 'bg-indigo-600'}`}>
            {error ? <ShieldAlert size={40} /> : <ShieldCheck size={40} />}
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">تفعيل نظام SAM Pro</h2>
          <p className="text-slate-400 font-bold text-xs">أدخل المفتاح لربط هذه النسخة بجهازك سحابياً</p>
        </div>

        <form onSubmit={handleActivate} className="space-y-6">
          <div className="relative">
            <input 
              type="text" 
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-lg uppercase tracking-widest outline-none focus:border-indigo-600 transition-all"
              placeholder="SAM-PRO-XXXX-XXXX"
              value={inputKey}
              onChange={e => setInputKey(e.target.value)}
              disabled={loading}
            />
            <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border-2 border-rose-100 flex items-start gap-3">
              <AlertCircle className="shrink-0" size={18} />
              <p className="text-[11px] font-black">{error}</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading || !inputKey}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-black transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" size={20}/> : <ShieldCheck size={20}/>}
            {loading ? 'جاري التحقق سحابياً...' : 'تفعيل النسخة الآن'}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-2">
           <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 bg-slate-50 px-4 py-2 rounded-full border">
              <Cpu size={12} className="text-indigo-500"/>
              <span>بصمة الجهاز: {hwid.slice(0, 16)}...</span>
           </div>
           {!navigator.onLine && (
             <span className="text-rose-600 text-[10px] font-black animate-pulse flex items-center gap-1">
               <WifiOff size={12}/> تنبيه: أنت غير متصل بالإنترنت
             </span>
           )}
        </div>
      </div>
    </div>
  );
};

export default LicenseGuard;
