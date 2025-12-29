
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
import { Printer, X, Monitor, History, Save, Calendar, Archive, FileText, CheckCircle2, LayoutList, ReceiptText, Banknote, CalendarDays, CheckCircle } from 'lucide-react';

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

  const [archiveModes, setArchiveModes] = useState<Record<string, boolean>>({
    leaves: false,
    financials: false,
    loans: false,
    production: false
  });

  const toggleArchiveMode = (section: string) => {
    setArchiveModes(prev => ({ ...prev, [section]: !prev[section] }));
  };

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

  const runGlobalArchive = () => {
    const retentionDays = db.settings.archiveRetentionDays || 90;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];
    let totalArchived = 0;

    const archiveMap = (list: any[]) => list.map(item => {
      const date = item.date || item.endDate || item.startDate;
      if (!item.isArchived && date < cutoffStr) { totalArchived++; return { ...item, isArchived: true }; }
      return item;
    });

    setDb(prev => ({
      ...prev,
      attendance: archiveMap(prev.attendance),
      leaves: archiveMap(prev.leaves),
      financials: archiveMap(prev.financials),
      production: archiveMap(prev.production),
      loans: prev.loans.map(l => (!l.isArchived && l.remainingAmount <= 0 && l.date < cutoffStr) ? (totalArchived++, { ...l, isArchived: true }) : l),
      settings: { ...prev.settings, archiveLogs: [{ id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString(), type: 'أرشفة شاملة', recordsCount: totalArchived, performedBy: currentUser?.name || 'النظام' }, ...(prev.settings.archiveLogs || [])] }
    }));
    alert(`تمت أرشفة ${totalArchived} سجل بنجاح.`);
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

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative animate-in fade-in zoom-in duration-500">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">نظام إدارة الموارد البشرية المتطور</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <div>
              <label className="text-xs font-black text-slate-400 mb-2 block mr-2">اسم المستخدم</label>
              <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none transition" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            </div>
            <div>
              <label className="text-xs font-black text-slate-400 mb-2 block mr-2">كلمة المرور</label>
              <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none transition" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            <div className="text-center">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500">نسيت كلمة السر؟</button>
               {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 border border-amber-100">تلميح: {db.settings.passwordHint}</div>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (title: string) => (
    <div className="print-only mb-10 border-b-4 border-slate-900 pb-6 text-slate-900">
      <div className="flex justify-between items-center">
        <div className="text-right flex-1">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DOC REF: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
          <p className="text-sm font-black mt-1">{new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <div className="text-center flex-[2]">
          <h1 className="text-3xl font-black text-indigo-700">{db.settings.name}</h1>
          <p className="text-[10px] font-bold text-slate-500 border-y border-slate-200 py-1 uppercase tracking-widest mt-2">{title}</p>
        </div>
        <div className="flex-1 flex justify-end">
          {db.settings.logo && <img src={db.settings.logo} className="h-20 w-auto object-contain" />}
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
          title="طلبات الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} 
          archiveMode={archiveModes.leaves} onToggleArchive={() => toggleArchiveMode('leaves')} 
          onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})} 
          initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'النوع', 'مأجورة', 'من', 'إلى']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                {Object.entries(leaveTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="flex items-center gap-2 px-4 border rounded-xl"><input type="checkbox" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} /><span className="font-bold">مأجورة</span></div>
              <input type="date" className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} />
              <input type="date" className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{leaveTypesAr[i.type]}</td><td className="px-6 py-4">{i.isPaid ? 'نعم' : 'لا'}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} 
        />
      );
      case 'financials': return (
        <GenericModule<FinancialEntry> 
          title="السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} 
          archiveMode={archiveModes.financials} onToggleArchive={() => toggleArchiveMode('financials')} 
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
          title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} 
          archiveMode={archiveModes.loans} onToggleArchive={() => toggleArchiveMode('loans')} 
          onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})} 
          initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0], collectionDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'المبلغ', 'المتبقي', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block">مبلغ السلفة الإجمالي</label>
                   <input type="number" placeholder="0" className="w-full p-4 border-2 rounded-2xl font-black" value={data.amount || ''} onChange={e => {
                     const amt = Number(e.target.value);
                     set({...data, amount: amt, remainingAmount: amt, monthlyInstallment: Math.round(amt / (data.installmentsCount || 1))});
                   }} />
                 </div>
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block">عدد الأقساط</label>
                   <input type="number" placeholder="1" className="w-full p-4 border-2 rounded-2xl font-black" value={data.installmentsCount || ''} onChange={e => {
                     const inst = Number(e.target.value);
                     set({...data, installmentsCount: inst, monthlyInstallment: Math.round((data.amount || 0) / (inst || 1))});
                   }} />
                 </div>
               </div>
               <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-6 grid grid-cols-2 gap-8 items-center">
                  <div className="text-center">
                    <label className="text-[9pt] font-black text-indigo-700 uppercase mb-1 block">القسط الشهري</label>
                    <p className="text-4xl font-black text-indigo-900">{data.monthlyInstallment || 0}</p>
                  </div>
                  <div className="border-r-2 border-indigo-100 pr-8">
                    <label className="text-[9pt] font-black text-indigo-700 uppercase mb-1 block flex items-center gap-1 justify-center"><Calendar size={14}/> تاريخ التحصيل</label>
                    <input type="date" className="w-full p-2 bg-white border rounded-xl font-bold text-center" value={data.collectionDate || ''} onChange={e => set({...data, collectionDate: e.target.value})} />
                  </div>
               </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4 text-rose-600 font-black">{i.remainingAmount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => toggleArchiveMode('production')} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'payroll': return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
             <div className="text-right flex-1">
                <h2 className="text-4xl font-black text-indigo-700 tracking-tighter">مسير الرواتب</h2>
                <p className="text-sm font-bold text-slate-500 mt-1">شهر {historyFilter.month} عام {historyFilter.year}</p>
             </div>
             <div className="flex flex-wrap gap-3">
                <button 
                  onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: displayedPayroll })}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition"
                >
                  <ReceiptText size={20}/> القسائم (Cards)
                </button>
                <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-slate-950 transition">
                  <Printer size={20}/> طباعة الكشف
                </button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
             <table className="w-full text-center text-sm">
               <thead className="bg-[#1e1b4b] text-white">
                 <tr>
                   <th className="px-6 py-5 text-right font-black">الموظف</th>
                   <th className="px-2 py-5 font-black border-r border-white/10">الأيام</th>
                   <th className="px-4 py-5 font-black border-r border-white/10">الأساسي</th>
                   <th className="px-4 py-5 font-black border-r border-white/10">الإضافي</th>
                   <th className="px-4 py-5 font-black border-r border-white/10">الإنتاج</th>
                   <th className="px-4 py-5 font-black border-r border-white/10">مكافآت</th>
                   <th className="px-4 py-5 font-black border-r border-white/10">خصم/سلفة</th>
                   <th className="px-4 py-5 font-black border-r border-white/10">المواصلات</th>
                   <th className="px-10 py-5 font-black bg-[#0f0e2b] text-white shadow-inner">الصافي</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {displayedPayroll.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-bold">
                     <td className="px-6 py-5 text-right font-black text-slate-900">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-2 py-5 text-slate-700">{p.workingDays}</td>
                     <td className="px-4 py-5 text-slate-900">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-4 py-5 text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                     <td className="px-4 py-5 text-emerald-600">+{p.production.toLocaleString()}</td>
                     <td className="px-4 py-5 text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                     <td className="px-4 py-5 text-rose-600">-{p.deductions.toLocaleString()}</td>
                     <td className="px-4 py-5 text-indigo-600">{p.transport.toLocaleString()}</td>
                     <td className="px-10 py-5 font-black text-indigo-900 bg-indigo-50/50">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          
          {payrollViewMode === 'current' && displayedPayroll.length > 0 && (
             <div className="flex justify-center pt-4">
                <button 
                  onClick={finalizePayroll} 
                  className="no-print w-full max-w-3xl bg-[#059669] text-white py-6 rounded-full font-black text-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-4 border-b-4 border-emerald-800 active:translate-y-1 active:border-b-0"
                >
                  <CheckCircle size={32}/> إغلاق وأرشفة المسير الحالي
                </button>
             </div>
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
         <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
            <div className="bg-white p-6 w-full max-w-5xl shadow-2xl rounded-3xl">
               <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="font-black text-indigo-700 text-2xl">معاينة قسائم الرواتب (Cards)</h3>
                  <button onClick={() => setIndividualPrintItem(null)} className="bg-rose-50 text-rose-500 p-2 rounded-full"><X size={32}/></button>
               </div>
               <button onClick={() => executePrint('portrait')} className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl mb-6 flex items-center justify-center gap-3"><Printer/> تنفيذ الطباعة الآن</button>
               
               <div className="hidden print-only">
                  {pages.map((page, pIdx) => (
                    <div key={pIdx} className="vouchers-grid">
                       {page.map((p) => {
                          const emp = db.employees.find(e => e.id === p.employeeId);
                          return (
                            <div key={p.id} className="voucher-card">
                               <div className="flex justify-between items-center border-b pb-2 mb-2">
                                  <div className="text-[8pt] font-black">{db.settings.name}</div>
                                  <div className="text-[8pt] font-black text-indigo-700">قسيمة راتب</div>
                                  {db.settings.logo && <img src={db.settings.logo} className="h-8 w-auto" />}
                               </div>
                               <div className="font-black text-[11pt] border-b pb-2 mb-2 text-slate-900">{emp?.name}</div>
                               <div className="space-y-1 text-[8pt] py-2 border-b">
                                  <div className="flex justify-between"><span>الراتب الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
                                  <div className="flex justify-between text-indigo-500"><span>بدل مواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
                                  <div className="flex justify-between text-emerald-600 font-bold"><span>إضافي + إنتاج:</span> <span>+{ (p.overtimePay + p.production).toLocaleString() }</span></div>
                                  <div className="flex justify-between text-rose-600"><span>إجمالي خصومات:</span> <span>-{p.deductions.toLocaleString()}</span></div>
                               </div>
                               <div className="flex justify-between font-black text-[12pt] py-2 bg-slate-50 mt-2 px-2 border-2 border-indigo-100 rounded-lg">
                                  <span>الصافي المستلم:</span> <span className="text-indigo-700">{p.netSalary.toLocaleString()} {db.settings.currency}</span>
                               </div>
                               <div className="mt-4 flex justify-between text-[7pt] italic opacity-70">
                                  <span>توقيع الموظف: .................</span>
                                  <span>الفترة: {p.month}/{p.year}</span>
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
      <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
        <div className="bg-white p-12 w-full max-w-4xl text-slate-900 relative shadow-2xl border-[12px] border-double border-indigo-900/10 rounded-xl print-card-template overflow-hidden">
           <button onClick={() => setIndividualPrintItem(null)} className="absolute top-6 left-6 text-slate-400 hover:text-rose-600 transition-all z-[10]"><X size={40}/></button>
           
           {renderPrintHeader(title)}

           <div className="space-y-12 py-10 text-right">
              <div className="flex justify-between items-center border-b-2 border-slate-100 pb-6">
                 <span className="text-indigo-900 font-black text-2xl">الاسم الكامل للموظف:</span>
                 <span className="text-5xl font-black text-slate-900 bg-indigo-50/40 px-8 py-3 rounded-2xl">{emp.name}</span>
              </div>

              <div className="bg-slate-50 p-12 border-2 border-indigo-900/10 min-h-[300px] relative rounded-[3rem] shadow-inner flex flex-col justify-center">
                 <span className="absolute -top-4 right-12 bg-white px-8 text-[12px] font-black text-indigo-700 uppercase tracking-widest border-2 border-indigo-100 rounded-full">بيانات الوثيقة المعتمدة</span>
                 
                 {type === 'document' ? (
                   <div className="text-center space-y-8">
                      <p className="text-3xl font-bold leading-loose text-slate-800 italic whitespace-pre-line px-6">
                         {data.notes}
                      </p>
                      <div className="text-sm font-black text-slate-400 mt-10">الرقم المرجعي: {data.id}</div>
                   </div>
                 ) : (
                   <>
                     {type === 'leave' && (
                       <div className="grid grid-cols-2 gap-12 text-center items-center">
                          <div className="text-right space-y-8">
                             <div className="flex justify-between items-center border-r-8 border-indigo-600 pr-6">
                               <span className="text-2xl font-bold text-slate-500">من تاريخ:</span>
                               <span className="text-3xl font-black text-indigo-900">{data.startDate}</span>
                             </div>
                             <div className="flex justify-between items-center border-r-8 border-indigo-600 pr-6">
                               <span className="text-2xl font-bold text-slate-500">إلى تاريخ:</span>
                               <span className="text-3xl font-black text-indigo-900">{data.endDate}</span>
                             </div>
                          </div>
                          <div className="bg-indigo-800 text-white p-12 rounded-[3rem] shadow-2xl scale-110">
                             <p className="text-[12px] opacity-70 mb-3 uppercase font-black tracking-widest">نوع الإجازة المطلوبة</p>
                             <p className="text-5xl font-black">{leaveTypesAr[data.type] || 'إجازة'}</p>
                             <div className="mt-6 pt-6 border-t border-white/20 font-black text-xl">
                                {data.isPaid ? 'إجازة مأجورة بالكامل' : 'إجازة بلا راتب'}
                             </div>
                          </div>
                       </div>
                     )}

                     {type === 'financial' && (
                       <div className="flex justify-between items-center py-10 px-6">
                          <div className="text-right">
                             <p className="text-sm font-black text-indigo-400 mb-2">نوع السند المالي</p>
                             <p className="text-6xl font-black text-indigo-900">{financialTypesAr[data.type] || 'سند صرف'}</p>
                          </div>
                          <div className="text-center px-16 border-r-8 border-slate-900/10">
                             <p className="text-sm font-black text-indigo-400 mb-2">القيمة الصافية</p>
                             <p className="text-8xl font-black text-slate-900">{data.amount?.toLocaleString()} <span className="text-3xl opacity-40 font-bold">{db.settings.currency}</span></p>
                          </div>
                       </div>
                     )}

                     {type === 'loan' && (
                       <div className="grid grid-cols-2 gap-12 text-center items-center">
                          <div className="space-y-6">
                             <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">إجمالي مبلغ السلفة</p>
                             <p className="text-7xl font-black text-indigo-900">{data.amount?.toLocaleString()}</p>
                             <p className="text-sm font-bold text-slate-500 mt-4">تاريخ بدء التحصيل: {data.collectionDate || 'غير محدد'}</p>
                          </div>
                          <div className="border-r-4 border-slate-200 space-y-8 pr-8">
                             <div className="bg-indigo-900 text-white p-8 rounded-[2.5rem] shadow-2xl">
                                <p className="text-xs font-black opacity-70 mb-2 uppercase">قيمة القسط المستقطع</p>
                                <p className="text-4xl font-black">{data.monthlyInstallment?.toLocaleString()}</p>
                             </div>
                             <p className="text-xl font-black text-slate-900">على مدار {data.installmentsCount} شهر</p>
                          </div>
                       </div>
                     )}

                     {type === 'production' && (
                        <div className="grid grid-cols-3 gap-10 text-center items-center h-full">
                           <div className="space-y-2">
                              <p className="text-xs font-black text-indigo-400 uppercase">القطع المنجزة</p>
                              <p className="text-6xl font-black text-indigo-900">{data.piecesCount}</p>
                           </div>
                           <div className="border-x-4 border-slate-100 py-6 space-y-2">
                              <p className="text-xs font-black text-indigo-400 uppercase">سعر الوحدة</p>
                              <p className="text-6xl font-black text-indigo-900">{data.valuePerPiece?.toLocaleString()}</p>
                           </div>
                           <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl">
                              <p className="text-xs font-black opacity-70 mb-2 uppercase">صافي الاستحقاق</p>
                              <p className="text-5xl font-black">{(data.totalValue || 0).toLocaleString()}</p>
                           </div>
                        </div>
                     )}
                   </>
                 )}
              </div>

              {(data.reason || data.notes) && type !== 'document' && (
                <div className="border-t-2 border-slate-100 pt-10">
                   <p className="text-[12px] font-black text-indigo-400 mb-6 uppercase tracking-widest">الملاحظات والتفاصيل الإضافية:</p>
                   <p className="text-2xl font-bold border-r-8 border-indigo-700 pr-10 leading-relaxed text-slate-700 bg-indigo-50/20 p-10 rounded-[3rem] shadow-inner">{data.reason || data.notes}</p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-3 gap-16 mt-24 pt-12 border-t-2 border-slate-50 text-center">
              <div className="space-y-8">
                 <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">توقيع الموظف</p>
                 <div className="border-t-2 border-slate-900 w-full pt-2"></div>
                 <p className="text-[9px] font-bold text-slate-300">أوافق على كافة ما ورد أعلاه</p>
              </div>
              <div className="space-y-8">
                 <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">قسم الحسابات</p>
                 <div className="border-t-2 border-slate-900 w-full pt-2"></div>
              </div>
              <div className="space-y-8">
                 <p className="text-[12px] font-black text-slate-400 uppercase tracking-widest">إدارة المؤسسة / الاعتماد</p>
                 <div className="border-t-2 border-slate-900 w-full pt-2"></div>
                 <p className="text-[9px] font-bold text-slate-300">يعتبر السند نافذاً من تاريخه</p>
              </div>
           </div>
        </div>

        <div className="fixed bottom-12 flex gap-8 no-print z-[400] scale-110">
            <button onClick={() => executePrint('portrait')} className="bg-indigo-700 text-white px-16 py-6 rounded-[2.5rem] font-black text-2xl shadow-2xl hover:scale-105 transition flex items-center gap-4"><Printer size={36}/> تنفيذ أمر الطباعة</button>
            <button onClick={() => setIndividualPrintItem(null)} className="bg-white text-slate-900 px-12 py-6 rounded-[2.5rem] font-black text-xl shadow-2xl border-2 border-indigo-50 hover:bg-slate-50">إلغاء المعاينة</button>
        </div>
      </div>
    );
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      {showPrintChoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
           <div className="bg-white rounded-[3rem] p-12 w-full max-lg shadow-2xl border text-center">
              <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-black text-indigo-700 uppercase tracking-widest">إعدادات الطباعة</h3><button onClick={() => setShowPrintChoice(false)} className="text-slate-300"><X size={32}/></button></div>
              <p className="text-sm font-bold text-slate-500 mb-8">اختر اتجاه الورقة المناسب للتقرير الحالي:</p>
              <div className="grid grid-cols-2 gap-6">
                 <button onClick={() => executePrint('portrait')} className="p-10 border-4 rounded-[3rem] hover:bg-indigo-50 transition-all flex flex-col items-center gap-4 border-slate-100 group"><Monitor size={64} className="text-slate-300 group-hover:text-indigo-600 transition-colors"/><span className="font-black text-lg">طولي (Portrait)</span></button>
                 <button onClick={() => executePrint('landscape')} className="p-10 border-4 rounded-[3rem] hover:bg-indigo-50 transition-all flex flex-col items-center gap-4 border-slate-100 group"><Monitor size={64} className="text-slate-300 rotate-90 group-hover:text-indigo-600 transition-colors"/><span className="font-black text-lg">عرضي (Landscape)</span></button>
              </div>
           </div>
        </div>
      )}
      {individualPrintItem && renderPrintTemplate()}
    </Layout>
  );
};

export default App;
