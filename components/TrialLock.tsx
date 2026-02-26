import React, { useState, useEffect } from 'react';
import { Lock, Key, AlertCircle, ShieldAlert } from 'lucide-react';

interface TrialLockProps {
  children: React.ReactNode;
}

const TrialLock: React.FC<TrialLockProps> = ({ children }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const unlocked = localStorage.getItem('sam_trial_unlocked');
    if (unlocked === 'true') {
      setIsUnlocked(true);
    }
  }, []);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (code === 'sam1993') {
      localStorage.setItem('sam_trial_unlocked', 'true');
      setIsUnlocked(true);
    } else {
      setError('الرمز غير صحيح. يرجى التأكد من الرمز والمحاولة مرة أخرى.');
    }
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[3rem] p-10 shadow-2xl relative border-4 border-white/5 overflow-hidden text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-3xl mx-auto flex items-center justify-center text-rose-600 mb-6 shadow-inner">
          <ShieldAlert size={40} />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tighter">انتهت الفترة التجريبية</h2>
        <p className="text-slate-500 font-bold text-sm mb-8 leading-relaxed">
          لقد انتهت الفترة التجريبية المخصصة لك لاستخدام النظام. يرجى إدخال رمز الدخول للمتابعة أو التواصل مع المطور لشراء النسخة الكاملة.
        </p>

        <form onSubmit={handleUnlock} className="space-y-6">
          <div className="relative">
            <input
              type="password"
              className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-center text-xl tracking-widest outline-none focus:border-rose-500 transition-all"
              placeholder="أدخل رمز الدخول"
              value={code}
              onChange={(e) => setCode(e.target.value)}
            />
            <Key className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
          </div>

          {error && (
            <div className="p-4 bg-rose-50 text-rose-700 rounded-2xl border-2 border-rose-100 flex items-start gap-3 text-right">
              <AlertCircle className="shrink-0 mt-0.5" size={18} />
              <p className="text-xs font-black">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={!code}
            className="w-full bg-rose-600 text-white py-4 rounded-2xl font-black text-lg shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
          >
            <Lock size={20} />
            فك القفل
          </button>
        </form>
        
        <div className="mt-8 pt-6 border-t border-slate-100">
          <p className="text-[10px] font-black text-slate-400">
            SAM HRMS PRO - تطوير مهند أحمد
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrialLock;
