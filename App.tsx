
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import Departments from './views/Departments';
import Attendance from './views/Attendance';
import SettingsView from './views/Settings';
import ReportsView from './views/Reports';
import Production from './views/Production';
import PrintForms from './views/PrintForms';
import { GenericModule } from './views/GenericModule';
import { loadDB, saveDB, DB } from './db/store';
import { Employee, PayrollRecord, Language, Theme, FinancialEntry, Loan, LeaveRequest, ProductionEntry, ArchiveLog } from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { useTranslation } from './utils/translations';
import { Printer, X, Monitor, LayoutList, ReceiptText, History, CheckCircle, Save, Calendar, Archive } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintChoice, setShowPrintChoice] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers'>('table');
  const [payrollViewMode, setPayrollViewMode] = useState<'current' | 'history'>('current');
  const [historyFilter, setHistoryFilter] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('خطأ في بيانات الدخول، يرجى التأكد من اسم المستخدم وكلمة المرور');
    }
  };

  const executePrint = (orientation: 'portrait' | 'landscape') => {
    setPrintOrientation(orientation);
    document.body.className = `${db.settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 print-${orientation}`;
    setShowPrintChoice(false);
    setTimeout(() => { window.print(); }, 300);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();
  
  const currentPayrolls = useMemo(() => generateMonthlyPayroll(
    currentMonth, currentYear, db.employees, db.attendance.filter(a => !a.isArchived), db.loans.filter(l => !l.isArchived), db.financials.filter(f => !f.isArchived), db.production.filter(p => !p.isArchived), db.settings
  ), [currentMonth, currentYear, db]);

  const displayedPayroll = useMemo(() => {
    if (payrollViewMode === 'current') return currentPayrolls;
    return db.payrollHistory.filter(p => p.month === historyFilter.month && p.year === historyFilter.year);
  }, [payrollViewMode, currentPayrolls, db.payrollHistory, historyFilter]);

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

  const finalizePayroll = () => {
    if (!confirm(`هل تريد إغلاق شهر ${currentMonth}/${currentYear} وأرشفته نهائياً؟`)) return;
    const finalizedRecords = currentPayrolls.map(p => ({ ...p, archivedAt: new Date().toISOString() }));
    setDb(prev => ({
      ...prev,
      payrollHistory: [...prev.payrollHistory.filter(h => h.month !== currentMonth || h.year !== currentYear), ...finalizedRecords]
    }));
    alert('تم أرشفة رواتب الشهر بنجاح');
  };

  const runGlobalArchive = () => {
    const days = db.settings.archiveRetentionDays || 90;
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - days);
    const thresholdStr = threshold.toISOString().split('T')[0];

    setDb(prev => {
      let count = 0;
      const archiveItem = (item: any) => {
        if ((item.date || item.startDate) < thresholdStr && !item.isArchived) {
          count++;
          return { ...item, isArchived: true };
        }
        return item;
      };

      const newLog: ArchiveLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        type: 'أرشفة شاملة',
        recordsCount: count,
        performedBy: currentUser?.name || 'النظام'
      };

      return {
        ...prev,
        attendance: prev.attendance.map(archiveItem),
        production: prev.production.map(archiveItem),
        financials: prev.financials.map(archiveItem),
        settings: { ...prev.settings, archiveLogs: [newLog, ...(prev.settings.archiveLogs || [])] }
      };
    });
    alert('اكتملت عملية الأرشفة بنجاح');
  };

  const leaveTypeTranslations: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة'
  };

  const statusTranslations: Record<string, string> = {
    'pending': 'قيد الانتظار', 'approved': 'مقبول', 'rejected': 'مرفوض'
  };

  const financialTypeTranslations: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم مالي', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">نظام إدارة الموارد البشرية</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول للنظام</button>
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:underline transition">مساعدة الدخول؟</button>
              {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm font-bold">تلميح: {db.settings.passwordHint || 'تواصل مع الإدارة'}</div>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (reportTitle: string) => (
    <div className="print-only mb-6 border-b-4 border-black pb-4 text-slate-900">
        <div className="flex justify-between items-center">
            <div className="text-right flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase">System Doc Ref</p>
                <p className="text-sm font-black">{new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <div className="text-center flex-[2]">
                <h1 className="text-2xl font-black text-indigo-700">{db.settings.name}</h1>
                <p className="text-sm font-bold text-slate-600 border-y-2 border-slate-200 py-1 px-4 inline-block mt-2 uppercase tracking-widest">{reportTitle}</p>
            </div>
            <div className="flex-1 flex justify-end">
                {db.settings.logo ? <img src={db.settings.logo} className="h-16 w-auto object-contain" /> : <div className="h-16 w-16 bg-slate-100 rounded-full flex items-center justify-center font-black text-[10px]">LOGO</div>}
            </div>
        </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments': return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance': return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'leaves': return <GenericModule<LeaveRequest> title="سجلات الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})} initialData={{ type: 'annual', status: 'pending', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى']} renderPrintHeader={() => renderPrintHeader("كشف الإجازات")} renderForm={(data, set) => (<div className="grid grid-cols-2 gap-4"><select className="p-3 border rounded-xl font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option></select><input type="date" className="p-3 border rounded-xl font-bold" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>)} renderRow={(i, name) => (<><td>{name}</td><td>{leaveTypeTranslations[i.type]}</td><td>{statusTranslations[i.status]}</td><td>{i.startDate}</td><td>{i.endDate}</td></>)} />;
      case 'financials': return <GenericModule<FinancialEntry> title="السندات والماليات" lang={db.settings.language} employees={db.employees} items={db.financials} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onPrintIndividual={i => setIndividualPrintItem({title: "سند مالي", type: 'financial', data: i})} initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ']} renderPrintHeader={() => renderPrintHeader("كشف الماليات")} renderForm={(data, set) => (<div className="grid grid-cols-2 gap-4"><select className="p-3 border rounded-xl font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option></select><input type="number" className="p-3 border rounded-xl font-bold" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>)} renderRow={(i, name) => (<><td>{name}</td><td>{financialTypeTranslations[i.type]}</td><td>{i.amount.toLocaleString()}</td><td>{i.date}</td></>)} />;
      case 'loans': return <GenericModule<Loan> title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة", type: 'loan', data: i})} initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'القسط', 'المتبقي']} renderPrintHeader={() => renderPrintHeader("كشف السلف")} renderForm={(data, set) => (<div className="grid grid-cols-2 gap-4"><input type="number" className="p-3 border rounded-xl font-bold" placeholder="المبلغ" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /><input type="number" className="p-3 border rounded-xl font-bold" placeholder="أقساط" value={data.installmentsCount} onChange={e => set({...data, installmentsCount: Number(e.target.value)})} /></div>)} renderRow={(i, name) => (<><td>{name}</td><td>{i.amount.toLocaleString()}</td><td>{i.installmentsCount}</td><td>{i.monthlyInstallment.toLocaleString()}</td><td>{i.remainingAmount.toLocaleString()}</td></>)} />;
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={false} onToggleArchive={() => {}} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} renderPrintHeader={() => renderPrintHeader("تقرير الإنتاجية")} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={doc => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'payroll':
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
               <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button onClick={() => setPayrollViewMode('current')} className={`px-6 py-2 rounded-xl font-black transition-all ${payrollViewMode === 'current' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}>الشهر الجاري</button>
                  <button onClick={() => setPayrollViewMode('history')} className={`px-6 py-2 rounded-xl font-black transition-all ${payrollViewMode === 'history' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}>الأرشيف التاريخي</button>
               </div>
               {payrollViewMode === 'history' && (
                 <div className="flex gap-2">
                    <select className="p-2 border rounded-xl font-bold dark:bg-slate-800" value={historyFilter.month} onChange={e => setHistoryFilter({...historyFilter, month: Number(e.target.value)})}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>شهر {i+1}</option>)}</select>
                    <input type="number" className="w-24 p-2 border rounded-xl font-bold dark:bg-slate-800" value={historyFilter.year} onChange={e => setHistoryFilter({...historyFilter, year: Number(e.target.value)})} />
                 </div>
               )}
               <div className="flex gap-2">
                  {payrollViewMode === 'current' && <button onClick={finalizePayroll} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Save size={18}/> إغلاق الشهر</button>}
                  <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة</button>
               </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-indigo-800 text-white font-black text-xs">
                   <tr><th className="px-6 py-5">الموظف</th><th className="text-center">الأيام</th><th className="text-center">الأساسي</th><th className="text-center">المواصلات</th><th className="text-center">الإضافي</th><th className="text-center font-black bg-indigo-950">الصافي</th></tr>
                 </thead>
                 <tbody className="divide-y">
                   {displayedPayroll.map(p => (
                     <tr key={p.id} className="hover:bg-slate-50 transition">
                       <td className="px-6 py-5">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                       <td className="text-center">{p.workingDays}</td>
                       <td className="text-center">{p.baseSalary.toLocaleString()}</td>
                       <td className="text-center">{p.transport.toLocaleString()}</td>
                       <td className="text-center text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                       <td className="text-center font-black text-indigo-900 bg-indigo-50">{p.netSalary.toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        );
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={runGlobalArchive} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      {showPrintChoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
           <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl border">
              <div className="flex justify-between items-center mb-6 font-black uppercase">توجيه الطباعة</div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => executePrint('portrait')} className="p-8 border-2 rounded-[2rem] hover:bg-indigo-50 flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300"/><span className="font-black text-sm uppercase">طولي</span></button>
                 <button onClick={() => executePrint('landscape')} className="p-8 border-2 rounded-[2rem] hover:bg-indigo-50 flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300 rotate-90"/><span className="font-black text-sm uppercase">عرضي</span></button>
              </div>
           </div>
        </div>
      )}
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
          <div className="bg-white print-constrained-voucher text-slate-900 relative shadow-2xl animate-in zoom-in duration-300 w-full max-w-4xl">
             <button onClick={() => setIndividualPrintItem(null)} className="absolute top-4 left-4 text-slate-400 no-print"><X size={32}/></button>
             <div className="p-10">
                {renderPrintHeader(individualPrintItem.title)}
                <div className="py-10 text-right space-y-8">
                   <div className="flex justify-between border-b pb-4"><span className="text-slate-500 font-bold uppercase">الموظف المعني:</span><span className="text-2xl font-black">{db.employees.find(e => e.id === individualPrintItem.data.employeeId)?.name || individualPrintItem.data.employeeName}</span></div>
                   <div className="bg-slate-50 p-10 border-2 border-black">
                      <p className="text-xl font-bold leading-relaxed">{individualPrintItem.data.notes || individualPrintItem.data.reason || 'تم اعتماد هذا السند بناءً على معطيات القسم المذكور.'}</p>
                   </div>
                   <div className="grid grid-cols-3 gap-10 mt-20 pt-10 border-t-2 border-slate-100 text-center">
                      <div><p className="text-[10px] font-black text-slate-400 mb-20 uppercase">توقيع الموظف</p><div className="border-t-2 border-black w-full"></div></div>
                      <div><p className="text-[10px] font-black text-slate-400 mb-20 uppercase">المحاسبة</p><div className="border-t-2 border-black w-full"></div></div>
                      <div><p className="text-[10px] font-black text-slate-400 mb-20 uppercase">الإدارة العامة</p><div className="border-t-2 border-black w-full"></div></div>
                   </div>
                </div>
             </div>
          </div>
          <div className="fixed bottom-10 flex gap-4 no-print"><button onClick={() => executePrint('portrait')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black flex items-center gap-3 shadow-2xl"><Printer size={28}/> أمر الطباعة</button><button onClick={() => setIndividualPrintItem(null)} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black shadow-2xl border">إلغاء</button></div>
        </div>
      )}
    </Layout>
  );
};

export default App;
