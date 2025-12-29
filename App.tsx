
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
import { Printer, X, Monitor, History, Save, Calendar, Archive, FileText, CheckCircle2, LayoutList, ReceiptText, Banknote, CalendarDays } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document' | 'payroll_sheet' | 'vouchers';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintChoice, setShowPrintChoice] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
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
      setActiveTab('dashboard');
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const executePrint = (orientation: 'portrait' | 'landscape') => {
    setPrintOrientation(orientation);
    document.body.className = `${db.settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 print-${orientation}`;
    setShowPrintChoice(false);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentPayrolls = useMemo(() => generateMonthlyPayroll(
    currentMonth, currentYear, db.employees, 
    db.attendance.filter(a => !a.isArchived), 
    db.loans.filter(l => !l.isArchived), 
    db.financials.filter(f => !f.isArchived), 
    db.production.filter(p => !p.isArchived), 
    db.settings
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
    if (!confirm(`هل تريد أرشفة رواتب شهر ${currentMonth}/${currentYear}؟`)) return;
    const finalizedRecords = currentPayrolls.map(p => ({ ...p, finalizedAt: new Date().toISOString() }));
    setDb(prev => ({
      ...prev,
      payrollHistory: [...prev.payrollHistory.filter(h => !(h.month === currentMonth && h.year === currentYear)), ...finalizedRecords]
    }));
    alert('تمت أرشفة الشهر بنجاح.');
  };

  const runGlobalArchive = () => {
    const threshold = new Date();
    threshold.setDate(threshold.getDate() - (db.settings.archiveRetentionDays || 90));
    const thresholdStr = threshold.toISOString().split('T')[0];

    setDb(prev => {
      let count = 0;
      const archiveMap = (i: any) => { if ((i.date || i.startDate) < thresholdStr && !i.isArchived) { count++; return { ...i, isArchived: true }; } return i; };
      const newLog: ArchiveLog = { id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'أرشفة شاملة تلقائية', recordsCount: count, performedBy: currentUser?.name || 'النظام' };
      return {
        ...prev,
        attendance: prev.attendance.map(archiveMap),
        production: prev.production.map(archiveMap),
        financials: prev.financials.map(archiveMap),
        settings: { ...prev.settings, archiveLogs: [newLog, ...(prev.settings.archiveLogs || [])] }
      };
    });
    alert('تمت عملية الأرشفة الشاملة بنجاح.');
  };

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  // Login Interface
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in duration-500">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 tracking-widest uppercase">نظام إدارة شؤون الموظفين المطور</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <div>
              <label className="text-xs font-black text-slate-400 mb-2 block mr-2">اسم المستخدم</label>
              <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 mb-2 block mr-2">كلمة المرور</label>
              <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:underline">هل نسيت كلمة السر؟</button>
              {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm font-bold text-amber-700">تلميح: {db.settings.passwordHint || 'تواصل مع الإدارة'}</div>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (title: string) => (
    <div className="print-only mb-10 border-b-4 border-slate-900 pb-4 text-slate-900">
      <div className="flex justify-between items-center">
        <div className="text-right flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase">REF: DOC-{Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
          <p className="text-sm font-black">{new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <div className="text-center flex-[2]">
          <h1 className="text-2xl font-black text-indigo-700">{db.settings.name}</h1>
          <p className="text-[10px] font-bold text-slate-500 border-y border-slate-200 py-1 uppercase tracking-widest mt-1">{title}</p>
        </div>
        <div className="flex-1 flex justify-end">
          {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" />}
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
      case 'leaves': return (
        <GenericModule<LeaveRequest> 
          title="طلبات الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} archiveMode={false} onToggleArchive={() => {}} 
          onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})} 
          initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'النوع', 'مأجورة', 'من', 'إلى']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-1">
                <label className="text-[10px] font-black text-slate-400 mb-1 block">نوع الإجازة</label>
                <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                  {Object.entries(leaveTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </div>
              <div className="col-span-1 flex items-end pb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-6 h-6 rounded-lg accent-indigo-600" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} />
                  <span className="font-black text-sm">إجازة مأجورة</span>
                </label>
              </div>
              <div><label className="text-[10px] font-black text-slate-400 mb-1 block">البداية</label><input type="date" className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>
              <div><label className="text-[10px] font-black text-slate-400 mb-1 block">النهاية</label><input type="date" className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{leaveTypesAr[i.type]}</td><td className="px-6 py-4">{i.isPaid ? 'نعم' : 'لا'}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} 
        />
      );
      case 'financials': return (
        <GenericModule<FinancialEntry> 
          title="السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} archiveMode={false} onToggleArchive={() => {}} 
          onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "سند مالي معتمد", type: 'financial', data: i})} 
          initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
          tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                {Object.entries(financialTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="المبلغ" className="p-4 border rounded-xl font-black dark:bg-slate-800" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{financialTypesAr[i.type || 'bonus']}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'loans': return (
        <GenericModule<Loan> 
          title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} archiveMode={false} onToggleArchive={() => {}} 
          onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})} 
          initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0], collectionDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'المبلغ', 'المتبقي', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">مبلغ السلفة الإجمالي</label>
                   <input type="number" className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-black" value={data.amount || ''} onChange={e => {
                     const amt = Number(e.target.value);
                     const count = data.installmentsCount || 1;
                     set({...data, amount: amt, remainingAmount: amt, monthlyInstallment: Math.round(amt / count)});
                   }} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase mb-1 block">عدد الأقساط</label>
                   <input type="number" className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-black" value={data.installmentsCount || ''} onChange={e => {
                     const count = Number(e.target.value);
                     const amt = data.amount || 0;
                     set({...data, installmentsCount: count, monthlyInstallment: Math.round(amt / (count || 1))});
                   }} />
                </div>
              </div>
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-3xl border-2 border-dashed border-indigo-200 grid grid-cols-2 gap-4 text-center items-center">
                 <div>
                    <p className="text-[10px] font-black text-indigo-700 uppercase mb-1">القسط الشهري</p>
                    <p className="text-3xl font-black text-indigo-900 dark:text-white">{(data.monthlyInstallment || 0).toLocaleString()}</p>
                 </div>
                 <div className="border-r-2 border-indigo-100">
                    <p className="text-[10px] font-black text-indigo-700 uppercase mb-1">تاريخ التحصيل</p>
                    <input type="date" className="p-2 border rounded-lg text-sm font-bold" value={data.collectionDate} onChange={e => set({...data, collectionDate: e.target.value})} />
                 </div>
              </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4 text-rose-600 font-black">{i.remainingAmount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={false} onToggleArchive={() => {}} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'payroll': return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
             <div className="text-right flex-1">
                <h2 className="text-4xl font-black text-indigo-700">مسير الرواتب {db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري'}</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">فترة: {historyFilter.month} / {historyFilter.year}</p>
             </div>
             <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: displayedPayroll })}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition"
                >
                  <ReceiptText size={20}/> القسائم (6 في صفحة)
                </button>
                <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-slate-950 transition">
                  <Printer size={20}/> طباعة الكشف
                </button>
             </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
             <table className="w-full text-center text-sm border-collapse">
               <thead className="bg-indigo-800 dark:bg-indigo-950 text-white">
                 <tr>
                   <th className="px-6 py-5 text-right font-black">الموظف</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">الأيام</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">الأساسي</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">الإضافي</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">الإنتاج</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">مكافآت</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">خصم/سلفة</th>
                   <th className="px-4 py-5 font-black border-r border-indigo-700/30">المواصلات</th>
                   <th className="px-6 py-5 font-black bg-indigo-950">الصافي</th>
                   <th className="px-10 py-5 font-black border-r border-slate-200 print-only">التوقيع المستلم</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {displayedPayroll.map(p => (
                   <tr key={p.id} className="hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 font-bold transition">
                     <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-4 py-5">{p.workingDays}</td>
                     <td className="px-4 py-5">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-4 py-5 text-emerald-600 font-black">+{p.overtimePay.toLocaleString()}</td>
                     <td className="px-4 py-5 text-indigo-600 font-black">+{p.production.toLocaleString()}</td>
                     <td className="px-4 py-5 text-emerald-600 font-black">+{p.bonuses.toLocaleString()}</td>
                     <td className="px-4 py-5 text-rose-600 font-black">-{p.deductions.toLocaleString()}</td>
                     <td className="px-4 py-5 text-indigo-500 font-black">{p.transport.toLocaleString()}</td>
                     <td className="px-6 py-5 font-black text-indigo-900 dark:text-indigo-200 bg-indigo-50/50 dark:bg-indigo-900/20">{p.netSalary.toLocaleString()}</td>
                     <td className="px-10 py-5 border-r border-slate-200 print-only opacity-20">........................</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          {payrollViewMode === 'current' && displayedPayroll.length > 0 && (
             <button onClick={finalizePayroll} className="no-print w-full bg-emerald-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl hover:bg-emerald-700 transition flex items-center justify-center gap-3">
               <CheckCircle2 size={24}/> إغلاق وأرشفة المسير الحالي
             </button>
          )}
        </div>
      );
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={runGlobalArchive} />;
      default: return null;
    }
  };

  const renderPrintTemplate = () => {
    if (!individualPrintItem) return null;
    const { title, type, data } = individualPrintItem;

    if (type === 'vouchers') {
       const payrollRecords = data as PayrollRecord[];
       const pages = [];
       for (let i = 0; i < payrollRecords.length; i += 6) { pages.push(payrollRecords.slice(i, i + 6)); }

       return (
         <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
            <div className="bg-white p-4 w-full max-w-5xl shadow-2xl rounded-2xl">
               <div className="flex justify-between items-center mb-4 border-b pb-2">
                  <h3 className="font-black text-indigo-700">معاينة قسائم الرواتب الفردية</h3>
                  <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500"><X size={32}/></button>
               </div>
               <button onClick={() => executePrint('portrait')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl mb-4"><Printer className="inline-block ml-2"/> طباعة القسائم الآن</button>
               
               <div className="hidden print-only">
                  {pages.map((page, pIdx) => (
                    <div key={pIdx} className="vouchers-grid">
                       {page.map((p) => {
                          const emp = db.employees.find(e => e.id === p.employeeId);
                          return (
                            <div key={p.id} className="voucher-card">
                               <div className="flex justify-between items-center border-b pb-1 mb-1">
                                  <div className="text-[7pt] font-black">{db.settings.name}</div>
                                  <div className="text-[7pt] font-black text-indigo-700">قسيمة راتب</div>
                                  {db.settings.logo && <img src={db.settings.logo} className="h-6 w-auto" />}
                               </div>
                               <div className="font-black text-[9pt] border-b pb-1 mb-1">{emp?.name}</div>
                               <div className="grid grid-cols-2 gap-x-2 text-[7pt] border-y py-1">
                                  <div className="flex justify-between"><span>الراتب:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
                                  <div className="flex justify-between text-indigo-500"><span>المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
                                  <div className="flex justify-between text-emerald-600"><span>إضافي/إنتاج:</span> <span>+{ (p.overtimePay + p.production).toLocaleString() }</span></div>
                                  <div className="flex justify-between text-rose-600"><span>الخصومات:</span> <span>-{p.deductions.toLocaleString()}</span></div>
                                  <div className="flex justify-between font-black text-[10pt] border-t mt-1 pt-1 col-span-2 bg-slate-50"><span>الصافي:</span> <span>{p.netSalary.toLocaleString()} {db.settings.currency}</span></div>
                               </div>
                               <div className="mt-2 flex justify-between text-[6pt] italic opacity-40">
                                  <span>توقيع الموظف</span>
                                  <span>تاريخ: {p.month}/{p.year}</span>
                                </div>
                            </div>
                          );
                       })}
                    </div>
                  ))}
               </div>
            </div>
         </div>
       );
    }

    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '........' };

    return (
      <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
        <div className="bg-white p-12 w-full max-w-4xl text-slate-900 relative shadow-2xl border-[12px] border-double border-indigo-900/10 rounded-xl print-card-template overflow-hidden">
           <button onClick={() => setIndividualPrintItem(null)} className="absolute top-4 left-4 text-slate-300 hover:text-rose-600 no-print transition-all z-[10]"><X size={32}/></button>
           
           {renderPrintHeader(title)}

           <div className="space-y-12 py-8 text-right">
              <div className="flex justify-between items-baseline border-b-2 border-slate-100 pb-4">
                 <span className="text-indigo-900 font-black text-2xl uppercase tracking-tighter">اسم الموظف:</span>
                 <span className="text-5xl font-black text-slate-900 bg-indigo-50/30 px-6 py-2 rounded-2xl">{emp.name}</span>
              </div>

              <div className="bg-slate-50 p-12 border-2 border-indigo-900/10 min-h-[220px] relative rounded-[3rem] shadow-inner">
                 <span className="absolute -top-4 right-12 bg-white px-6 text-[11px] font-black text-indigo-700 uppercase tracking-widest border border-indigo-100 rounded-full">البيانات المعتمدة</span>
                 
                 {type === 'leave' && (
                   <div className="grid grid-cols-2 gap-10 text-center items-center">
                      <div className="text-right space-y-6">
                         <div className="flex justify-between items-center border-r-4 border-indigo-600 pr-4">
                           <span className="text-xl font-bold text-slate-500">تاريخ البداية:</span>
                           <span className="text-2xl font-black text-indigo-900">{data.startDate}</span>
                         </div>
                         <div className="flex justify-between items-center border-r-4 border-indigo-600 pr-4">
                           <span className="text-xl font-bold text-slate-500">تاريخ النهاية:</span>
                           <span className="text-2xl font-black text-indigo-900">{data.endDate}</span>
                         </div>
                      </div>
                      <div className="bg-indigo-800 text-white p-10 rounded-[2.5rem] shadow-[0_20px_40px_rgba(67,56,202,0.3)]">
                         <p className="text-[10px] opacity-70 mb-2 uppercase font-black tracking-widest">نوع الإجازة</p>
                         <p className="text-4xl font-black">{leaveTypesAr[data.type]}</p>
                         <div className="mt-4 pt-4 border-t border-white/20 font-black text-lg">
                            {data.isPaid ? 'إجازة مأجورة بالكامل' : 'إجازة غير مأجورة'}
                         </div>
                      </div>
                   </div>
                 )}

                 {type === 'financial' && (
                   <div className="flex justify-between items-center py-6">
                      <div className="text-right">
                         <p className="text-sm font-black text-indigo-400 mb-1 uppercase">طبيعة السند</p>
                         <p className="text-5xl font-black text-indigo-900">{financialTypesAr[data.type] || 'سند مالي'}</p>
                      </div>
                      <div className="text-center px-12 border-r-4 border-slate-900/10">
                         <p className="text-sm font-black text-indigo-400 mb-1 uppercase">المبلغ الصافي</p>
                         <p className="text-7xl font-black text-slate-900">{data.amount?.toLocaleString()} <span className="text-2xl opacity-40 font-bold">{db.settings.currency}</span></p>
                      </div>
                   </div>
                 )}

                 {type === 'loan' && (
                   <div className="grid grid-cols-2 gap-10 text-center items-center">
                      <div className="space-y-4">
                         <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">إجمالي مبلغ السلفة</p>
                         <p className="text-6xl font-black text-indigo-900">{data.amount?.toLocaleString()}</p>
                         <div className="bg-indigo-50 p-3 rounded-2xl border border-indigo-100 mt-4">
                            <p className="text-xs font-bold text-indigo-700">تاريخ بدء التحصيل: {data.collectionDate || 'غير محدد'}</p>
                         </div>
                      </div>
                      <div className="border-r-2 border-slate-100 space-y-6">
                         <div className="bg-slate-100/50 p-6 rounded-[2rem]">
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">عدد الأقساط</p>
                            <p className="text-4xl font-black text-slate-900">{data.installmentsCount}</p>
                         </div>
                         <div className="bg-indigo-900 text-white p-6 rounded-[2rem] shadow-xl">
                            <p className="text-xs font-black opacity-70 uppercase tracking-widest mb-1">قيمة القسط الشهري</p>
                            <p className="text-3xl font-black">{data.monthlyInstallment?.toLocaleString()}</p>
                         </div>
                      </div>
                   </div>
                 )}

                 {type === 'production' && (
                    <div className="grid grid-cols-3 gap-8 text-center items-center h-full">
                       <div className="space-y-1">
                          <p className="text-xs font-black text-indigo-400 uppercase">كمية الإنتاج</p>
                          <p className="text-5xl font-black text-indigo-900">{data.piecesCount}</p>
                       </div>
                       <div className="border-x-2 border-slate-100 space-y-1 py-4">
                          <p className="text-xs font-black text-indigo-400 uppercase">سعر الوحدة</p>
                          <p className="text-5xl font-black text-indigo-900">{data.valuePerPiece?.toLocaleString()}</p>
                       </div>
                       <div className="bg-indigo-900 text-white p-8 rounded-[2rem] shadow-xl">
                          <p className="text-xs font-black opacity-70 uppercase mb-1">صافي القيمة</p>
                          <p className="text-4xl font-black">{data.totalValue?.toLocaleString()}</p>
                       </div>
                    </div>
                 )}

                 {type === 'document' && <div className="p-4 text-center"><p className="text-3xl font-bold leading-relaxed whitespace-pre-line text-slate-800 italic">{data.notes}</p></div>}
              </div>

              {(data.reason || data.notes) && type !== 'document' && (
                <div className="border-t border-slate-100 pt-10">
                   <p className="text-[11px] font-black text-indigo-400 mb-4 uppercase tracking-widest">تفاصيل إضافية / مبررات السند:</p>
                   <p className="text-2xl font-bold border-r-8 border-indigo-700 pr-8 leading-relaxed text-slate-700 bg-indigo-50/20 p-8 rounded-[2rem]">{data.reason || data.notes}</p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-3 gap-16 mt-24 pt-10 border-t-2 border-slate-50 text-center">
              <div className="space-y-6">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">توقيع الموظف</p>
                 <div className="border-t-2 border-slate-900 w-full"></div>
                 <p className="text-[8px] font-bold text-slate-300">يقر الموظف باستلام نسخة من السند</p>
              </div>
              <div className="space-y-6">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">قسم الحسابات</p>
                 <div className="border-t-2 border-slate-900 w-full"></div>
              </div>
              <div className="space-y-6">
                 <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">المدير العام / الاعتماد</p>
                 <div className="border-t-2 border-slate-900 w-full"></div>
              </div>
           </div>
        </div>

        <div className="fixed bottom-10 flex gap-6 no-print z-[400] scale-110">
            <button onClick={() => executePrint('portrait')} className="bg-indigo-700 text-white px-12 py-6 rounded-[2rem] font-black text-2xl shadow-[0_25px_50px_rgba(67,56,202,0.4)] hover:scale-105 transition flex items-center gap-4"><Printer size={32}/> تنفيذ أمر الطباعة</button>
            <button onClick={() => setIndividualPrintItem(null)} className="bg-white text-slate-900 px-10 py-6 rounded-[2rem] font-black text-xl shadow-2xl border-2 border-indigo-50">إلغاء المعاينة</button>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      
      {showPrintChoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
           <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl border">
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-indigo-700 uppercase">توجيه الطباعة</h3><button onClick={() => setShowPrintChoice(false)}><X size={24}/></button></div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => executePrint('portrait')} className="p-8 border-2 rounded-[2rem] hover:bg-indigo-50 transition-all flex flex-col items-center gap-3 border-slate-100 group"><Monitor size={48} className="text-slate-300 group-hover:text-indigo-600"/><span className="font-black text-sm">طولي</span></button>
                 <button onClick={() => executePrint('landscape')} className="p-8 border-2 rounded-[2rem] hover:bg-indigo-50 transition-all flex flex-col items-center gap-3 border-slate-100 group"><Monitor size={48} className="text-slate-300 rotate-90 group-hover:text-indigo-600"/><span className="font-black text-sm">عرضي</span></button>
              </div>
           </div>
        </div>
      )}
      {individualPrintItem && renderPrintTemplate()}
    </Layout>
  );
};

export default App;
