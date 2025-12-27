
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import Departments from './views/Departments';
import Attendance from './views/Attendance';
import SettingsView from './views/Settings';
import ReportsView from './views/Reports';
import Production from './views/Production';
import { GenericModule } from './views/GenericModule';
import { loadDB, saveDB, DB } from './db/store';
import { Employee, PayrollRecord, Language, Theme, FinancialEntry, Loan, LeaveRequest, ProductionEntry } from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { useTranslation } from './utils/translations';
import { Printer, Search, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText, UserCheck, LayoutList, Plus, ArchiveRestore, HelpCircle, Info, Monitor, Smartphone, RefreshCw, X } from 'lucide-react';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Shared States for Archives
  const [showVoucher, setShowVoucher] = useState<FinancialEntry | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers' | 'signatures'>('table');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanEmpId, setLoanEmpId] = useState('');
  const [loanShowArchive, setLoanShowArchive] = useState(false);
  
  // Archive View Toggles
  const [leavesArchiveMode, setLeavesArchiveMode] = useState(false);
  const [financialsArchiveMode, setFinancialsArchiveMode] = useState(false);
  const [productionArchiveMode, setProductionArchiveMode] = useState(false);

  useEffect(() => {
    saveDB(db);
    document.body.className = `${db.settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 print-${printOrientation}`;
  }, [db, printOrientation]);

  const t = useTranslation(db.settings.language);
  const isRtl = db.settings.language === 'ar';

  const toggleTheme = () => {
    const newTheme = db.settings.theme === 'light' ? 'dark' : 'light';
    setDb(prev => ({ ...prev, settings: { ...prev.settings, theme: newTheme } }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) setCurrentUser(user); else alert('خطأ دخول: يرجى التأكد من البيانات');
  };

  const handlePrintRequest = (orientation: 'portrait' | 'landscape') => {
    setPrintOrientation(orientation);
    setShowPrintModal(false);
    setTimeout(() => window.print(), 300);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentPayrolls = useMemo(() => generateMonthlyPayroll(
    currentMonth, currentYear, db.employees, db.attendance, db.loans, db.financials, db.production || [], db.settings
  ), [currentMonth, currentYear, db]);

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const list = (prev[key] || []) as any[];
      const exists = list.find(i => i.id === item.id);
      return { ...prev, [key]: exists ? list.map(i => i.id === item.id ? item : i) : [...list, item] };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => id !== i.id) }));
  };

  const archiveCurrentMonth = () => {
    if (window.confirm('أرشفة الشهر؟')) {
      setDb(prev => ({
        ...prev,
        payrollHistory: [...prev.payrollHistory, ...currentPayrolls],
        attendance: prev.attendance.filter(a => new Date(a.date).getMonth() + 1 !== currentMonth),
        financials: prev.financials.filter(f => new Date(f.date).getMonth() + 1 !== currentMonth)
      }));
      alert('تم الأرشفة بنجاح');
    }
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border dark:border-slate-800 animate-in fade-in zoom-in-95">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-white text-center">
            <h1 className="text-3xl font-black tracking-widest uppercase">SAM HRMS PRO</h1>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800/50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800/50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl">دخول النظام</button>
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-[10px] font-black text-indigo-500 hover:underline uppercase tracking-tighter">نسيت كلمة السر؟</button>
              {showForgotHint && <p className="mt-2 text-xs font-bold text-slate-500">{db.settings.passwordHint || "لا يوجد تلميح"}</p>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees':
        return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments':
        return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance':
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} />;
      case 'production':
        return <div className="space-y-6">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
            <h2 className="text-2xl font-black text-indigo-700">{productionArchiveMode ? 'أرشيف الإنتاج' : 'تتبع الإنتاج'}</h2>
            <div className="flex gap-2">
               <button onClick={() => setShowPrintModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Printer size={18}/> طباعة</button>
               <button onClick={() => setProductionArchiveMode(!productionArchiveMode)} className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all ${productionArchiveMode ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white'}`}>{productionArchiveMode ? <Calendar size={18}/> : <Archive size={18}/>} {productionArchiveMode ? 'العودة' : 'الأرشيف'}</button>
            </div>
          </div>
          <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} />
        </div>;
      case 'payroll':
        const cycleText = db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري';
        if (payrollPrintMode === 'table') {
          return (
            <div className="space-y-6">
              <div className="print-only flex justify-between items-center border-b-4 border-black pb-4 mb-8">
                  <div className="flex items-center gap-4">
                     {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" />}
                     <div><h1 className="text-2xl font-black">{db.settings.name}</h1><p className="text-xs font-bold">{db.settings.address}</p></div>
                  </div>
                  <div className="text-right"><h2 className="text-xl font-black">مسير الرواتب - {currentMonth}/{currentYear}</h2></div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
                 <div><h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText}</h3><p className="text-xs font-bold text-slate-500">فترة: {currentMonth} / {currentYear}</p></div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={archiveCurrentMonth} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ArchiveRestore size={18}/> أرشفة</button>
                    <button onClick={() => setPayrollPrintMode('vouchers')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={18}/> طباعة القسائم</button>
                    <button onClick={() => setPayrollPrintMode('signatures')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><UserCheck size={18}/> كشف التوقيعات</button>
                    <button onClick={() => setShowPrintModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة الجدول</button>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-x-auto">
                 <table className="w-full text-right text-sm">
                   <thead className="bg-indigo-600 text-white font-black">
                     <tr>
                       <th className="px-6 py-5">الموظف</th>
                       <th className="text-center">الأيام</th>
                       <th className="text-center">الأساسي</th>
                       <th className="text-center">الإضافي</th>
                       <th className="text-center">الإنتاج</th>
                       <th className="text-center">مكافآت</th>
                       <th className="text-center">سلفة</th>
                       <th className="text-center">تأخير</th>
                       <th className="text-center font-black bg-indigo-800">الصافي</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {currentPayrolls.map(p => (
                       <tr key={p.id} className="font-bold hover:bg-slate-50 transition">
                         <td className="px-6 py-5">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                         <td className="text-center">{p.workingDays}</td>
                         <td className="text-center">{p.baseSalary.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                         <td className="text-center text-indigo-600">+{p.production.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                         <td className="text-center text-orange-600">-{p.loanInstallment.toLocaleString()}</td>
                         <td className="text-center text-rose-600">-{p.lateDeduction.toLocaleString()}</td>
                         <td className="text-center font-black text-indigo-900 bg-indigo-50">{p.netSalary.toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          );
        }

        if (payrollPrintMode === 'vouchers') {
          const payrollChunks = chunkArray(currentPayrolls, 6);
          return (
            <div className="space-y-4">
              <div className="no-print flex justify-between items-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
                  <button onClick={() => setPayrollPrintMode('table')} className="bg-slate-950 text-white px-8 py-3 rounded-2xl flex items-center gap-2"><LayoutList size={20}/> العودة للجدول</button>
                  <button onClick={() => setShowPrintModal(true)} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl"><Printer size={20}/> طباعة كافة القسائم (6 بالصفحة)</button>
              </div>
              {payrollChunks.map((chunk, pageIdx) => (
                <div key={pageIdx} className="vouchers-grid page-break">
                  {chunk.map((p: any) => {
                    const emp = db.employees.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="voucher-container">
                        <div className="voucher-header items-center">
                           <div className="flex items-center gap-2">
                              {db.settings.logo && <img src={db.settings.logo} className="h-10 w-auto" />}
                              <div><h2 className="text-[10px] font-black">{db.settings.name}</h2><p className="text-[7px] font-bold">قسيمة راتب {cycleText}</p></div>
                           </div>
                           <div className="text-left text-[7px] font-bold opacity-70">
                              <p>الفترة: {currentMonth}/{currentYear}</p>
                              <p>تاريخ: {new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-[9px] mb-1 font-black border-b border-black pb-0.5 flex justify-between uppercase">
                           <span>{emp?.name}</span>
                           <span>ID: {emp?.nationalId}</span>
                        </div>
                        <table>
                           <thead>
                              <tr className="bg-slate-50">
                                 <th className="text-[7px]">مفردات الاستحقاق</th><th className="text-[7px]">(+)</th>
                                 <th className="text-[7px]">مفردات الخصم</th><th className="text-[7px]">(-)</th>
                              </tr>
                           </thead>
                           <tbody className="text-[7px]">
                              <tr>
                                 <td className="text-right">الأساسي + المواصلات</td><td>{(p.baseSalary + p.transport).toLocaleString()}</td>
                                 <td className="text-right">قسط السلفة</td><td>{p.loanInstallment > 0 ? p.loanInstallment.toLocaleString() : '-'}</td>
                              </tr>
                              <tr>
                                 <td className="text-right">الإضافي ({Math.round(p.overtimeMinutes/60)} س)</td><td>{p.overtimePay.toLocaleString()}</td>
                                 <td className="text-right">تأخير ({p.lateMinutes} د)</td><td>{p.lateDeduction > 0 ? p.lateDeduction.toLocaleString() : '-'}</td>
                              </tr>
                              <tr>
                                 <td className="text-right">حوافز الإنتاج</td><td>{p.production.toLocaleString()}</td>
                                 <td className="text-right">خصومات أخرى</td><td>{p.manualDeductions > 0 ? p.manualDeductions.toLocaleString() : '-'}</td>
                              </tr>
                              <tr>
                                 <td className="text-right">المكافآت</td><td>{p.bonuses.toLocaleString()}</td>
                                 <td colSpan={2} className="bg-slate-100 font-black">
                                    <div className="text-[8px] text-indigo-700">الصافي المستلم</div>
                                    <div className="text-xs">{p.netSalary.toLocaleString()} {db.settings.currency}</div>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-center text-[7px]">
                           <div><p className="mb-2">توقيع المحاسب</p><div className="h-px bg-black"></div></div>
                           <div><p className="mb-2">توقيع المستلم</p><div className="h-px bg-black"></div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        }
        return null;

      case 'reports':
        return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintModal(true)} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={toggleTheme} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}

      {/* Print Options Modal */}
      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
           <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border border-slate-200">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl font-black text-indigo-700">خيارات الطباعة</h3>
                <button onClick={() => setShowPrintModal(false)} className="text-slate-400 hover:text-rose-600 transition"><X size={24}/></button>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-6">يرجى اختيار اتجاه الصفحة المفضل للطباعة:</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                 <button onClick={() => handlePrintRequest('portrait')} className="group p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 transition-all flex flex-col items-center gap-4">
                    <Monitor size={48} className="text-slate-300 group-hover:text-indigo-600"/>
                    <span className="font-black text-slate-700">طولي (A4 Portrait)</span>
                 </button>
                 <button onClick={() => handlePrintRequest('landscape')} className="group p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 transition-all flex flex-col items-center gap-4">
                    <Monitor size={48} className="text-slate-300 group-hover:text-indigo-600 rotate-90"/>
                    <span className="font-black text-slate-700">عرضي (A4 Landscape)</span>
                 </button>
              </div>
              <button onClick={() => setShowPrintModal(false)} className="w-full bg-slate-100 py-4 rounded-2xl font-black text-slate-500">إلغاء</button>
           </div>
        </div>
      )}

      {showVoucher && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6 no-print">
           <div className="bg-white rounded-[2rem] p-12 w-full max-w-2xl text-slate-900 border-4 border-double border-slate-300">
              <div className="flex justify-between items-center border-b-2 pb-6 mb-8 border-slate-900">
                 <div className="flex items-center gap-4">
                    {db.settings.logo && <img src={db.settings.logo} className="h-12 w-auto" />}
                    <div><h2 className="text-2xl font-black text-indigo-700">{db.settings.name}</h2><p className="font-bold text-slate-500 text-xs">سند مالي</p></div>
                 </div>
                 <div className="text-right"><p className="font-black text-xs">ID: {showVoucher.id.substr(0,8).toUpperCase()}</p><p className="font-bold text-xs">{showVoucher.date}</p></div>
              </div>
              <div className="space-y-6 text-xl">
                 <p className="flex justify-between border-b pb-2"><span>يصرف للسيد/ة:</span> <span className="font-black">{db.employees.find(e => e.id === showVoucher.employeeId)?.name}</span></p>
                 <p className="flex justify-between border-b pb-2"><span>مبلغ وقدره:</span> <span className="font-black text-2xl">{showVoucher.amount.toLocaleString()} {db.settings.currency}</span></p>
                 <p className="flex justify-between border-b pb-2"><span>وذلك عن:</span> <span className="font-bold text-lg">{showVoucher.reason}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-20 mt-16 text-center">
                 <div><p className="font-black underline mb-12 text-xs">توقيع المحاسب</p> <div className="h-0.5 bg-slate-400"></div></div>
                 <div><p className="font-black underline mb-12 text-xs">توقيع المستلم</p> <div className="h-0.5 bg-slate-400"></div></div>
              </div>
              <div className="mt-12 flex gap-4 no-print">
                 <button onClick={() => setShowPrintModal(true)} className="flex-1 bg-indigo-700 text-white py-4 rounded-xl font-black text-lg shadow-xl">بدء الطباعة</button>
                 <button onClick={() => setShowVoucher(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-black">إغلاق</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
