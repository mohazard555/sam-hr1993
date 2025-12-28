
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
import { Printer, Search, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText, UserCheck, LayoutList, Plus, ArchiveRestore, HelpCircle, Info, Monitor, Smartphone, RefreshCw, X, Box, BarChartHorizontal, Save } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintChoice, setShowPrintChoice] = useState(false);
  
  // States
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers' | 'signatures' | 'history'>('table');
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
      alert('اسم المستخدم أو كلمة المرور غير صحيحة');
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
    if (!confirm(`هل تريد إغلاق شهر ${currentMonth}/${currentYear} وأرشفة الرواتب في السجل التاريخي؟ لن يتأثر المسير الجاري بالتغييرات المستقبلية بعد الأرشفة.`)) return;
    
    const finalizedRecords = currentPayrolls.map(p => ({
      ...p,
      finalizedAt: new Date().toISOString()
    }));

    setDb(prev => ({
      ...prev,
      payrollHistory: [
        ...prev.payrollHistory.filter(p => !(p.month === currentMonth && p.year === currentYear)),
        ...finalizedRecords
      ]
    }));
    alert('تم أرشفة رواتب الشهر الحالي بنجاح.');
  };

  const runGlobalArchive = () => {
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - (db.settings.archiveRetentionDays || 90));
    const thresholdStr = thresholdDate.toISOString().split('T')[0];

    setDb(prev => {
      let count = 0;
      const archivedAttendance = prev.attendance.map(a => {
        if (!a.isArchived && a.date < thresholdStr) { count++; return { ...a, isArchived: true }; }
        return a;
      });
      const archivedProduction = prev.production.map(p => {
        if (!p.isArchived && p.date < thresholdStr) { count++; return { ...p, isArchived: true }; }
        return p;
      });
      const archivedFinancials = prev.financials.map(f => {
        if (!f.isArchived && f.date < thresholdStr) { count++; return { ...f, isArchived: true }; }
        return f;
      });

      const newLog: ArchiveLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString(),
        type: 'أرشفة شاملة تلقائية',
        recordsCount: count,
        performedBy: currentUser?.name || 'System'
      };

      return {
        ...prev,
        attendance: archivedAttendance,
        production: archivedProduction,
        financials: archivedFinancials,
        settings: {
          ...prev.settings,
          archiveLogs: [newLog, ...(prev.settings.archiveLogs || [])]
        }
      };
    });
    alert('تمت عملية الأرشفة الشاملة بنجاح.');
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">Smart Personnel Management</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-50 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white border-2 border-transparent focus:border-indigo-600 transition" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white border-2 border-transparent focus:border-indigo-600 transition" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">دخول النظام</button>
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:text-indigo-700 transition">هل نسيت كلمة السر؟</button>
              {showForgotHint && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border-2 border-dashed border-amber-200 text-sm font-bold">تلميح: {db.settings.passwordHint || 'لا يوجد تلميح مسجل.'}</div>
              )}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (reportTitle: string) => (
    <div className="print-only mb-6 border-b-4 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
            <div className="text-right flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REF: SAM-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                <p className="text-sm font-black">{new Date().toLocaleDateString('ar-EG')}</p>
            </div>
            <div className="text-center flex-[2] px-4">
                <h1 className="text-2xl font-black text-indigo-700">{db.settings.name}</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em] py-1">{reportTitle}</p>
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
      case 'leaves': return <GenericModule<LeaveRequest> title="طلبات الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إجازة إداري", type: 'leave', data: i})} initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى']} renderForm={(data, set) => (<div className="grid grid-cols-2 gap-4"><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option></select><input type="date" className="p-3 border rounded-xl font-black" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /><input type="date" className="p-3 border rounded-xl font-black" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>)} renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{i.type}</td><td className="px-6 py-4">{i.status}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} />;
      case 'financials': return <GenericModule<FinancialEntry> title="السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onPrintIndividual={(i) => setIndividualPrintItem({title: "سند مالي رسمي", type: 'financial', data: i})} initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ']} renderForm={(data, set) => (<div className="grid grid-cols-2 gap-4"><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option></select><input type="number" className="p-3 border rounded-xl font-black" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>)} renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{i.type}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} />;
      case 'loans': return <GenericModule<Loan> title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onPrintIndividual={(i) => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})} initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'المتبقي']} renderForm={(data, set) => (<div className="grid grid-cols-2 gap-4"><input type="number" className="p-3 border rounded-xl font-black" placeholder="المبلغ" value={data.amount} onChange={e => { const v = Number(e.target.value); set({...data, amount: v, remainingAmount: v, monthlyInstallment: Math.round(v/(data.installmentsCount || 1))}); }} /><input type="number" className="p-3 border rounded-xl font-black" placeholder="أقساط" value={data.installmentsCount} onChange={e => { const v = Number(e.target.value); set({...data, installmentsCount: v, monthlyInstallment: Math.round((data.amount || 0)/v)}); }} /></div>)} renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.installmentsCount}</td><td className="px-6 py-4 font-black text-rose-600">{i.remainingAmount.toLocaleString()}</td></>)} />;
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={false} onToggleArchive={() => {}} onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'payroll':
        return (
          <div className="space-y-6">
            {renderPrintHeader(`مسير الرواتب - ${payrollViewMode === 'current' ? `${currentMonth}/${currentYear}` : `${historyFilter.month}/${historyFilter.year}`}`)}
            <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
               <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
                  <button onClick={() => setPayrollViewMode('current')} className={`px-6 py-2 rounded-xl font-black transition-all ${payrollViewMode === 'current' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}>الشهر الحالي</button>
                  <button onClick={() => setPayrollViewMode('history')} className={`px-6 py-2 rounded-xl font-black transition-all ${payrollViewMode === 'history' ? 'bg-white text-indigo-700 shadow' : 'text-slate-500'}`}>السجل المؤرشف</button>
               </div>
               
               {payrollViewMode === 'history' && (
                 <div className="flex gap-2">
                    <select className="p-2 border rounded-xl font-bold dark:bg-slate-800" value={historyFilter.month} onChange={e => setHistoryFilter({...historyFilter, month: Number(e.target.value)})}>
                       {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>شهر {i+1}</option>)}
                    </select>
                    <input type="number" className="w-24 p-2 border rounded-xl font-bold dark:bg-slate-800" value={historyFilter.year} onChange={e => setHistoryFilter({...historyFilter, year: Number(e.target.value)})} />
                 </div>
               )}

               <div className="flex gap-2">
                  {payrollViewMode === 'current' && (
                    <button onClick={finalizePayroll} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Save size={18}/> أرشفة الشهر</button>
                  )}
                  <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة</button>
               </div>
            </div>
            
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-indigo-800 text-white font-black text-xs uppercase">
                   <tr>
                     <th className="px-6 py-5">الموظف</th>
                     <th className="text-center">الأيام</th>
                     <th className="text-center">الأساسي</th>
                     <th className="text-center">الإضافي</th>
                     <th className="text-center">مكافآت</th>
                     <th className="text-center">خصم/سلفة</th>
                     <th className="text-center font-black bg-indigo-950">الصافي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {displayedPayroll.map(p => (
                     <tr key={p.id} className="font-bold hover:bg-slate-50 transition">
                       <td className="px-6 py-5">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                       <td className="text-center">{p.workingDays}</td>
                       <td className="text-center">{p.baseSalary.toLocaleString()}</td>
                       <td className="text-center text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                       <td className="text-center text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                       <td className="text-center text-rose-600">-{p.deductions.toLocaleString()}</td>
                       <td className="text-center font-black text-indigo-900 bg-indigo-50">{p.netSalary.toLocaleString()}</td>
                     </tr>
                   ))}
                   {displayedPayroll.length === 0 && (
                     <tr><td colSpan={7} className="py-20 text-center font-black text-slate-400">لا توجد بيانات مؤرشفة لهذه الفترة</td></tr>
                   )}
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

  const renderIndividualPrintTemplate = () => {
    if (!individualPrintItem) return null;
    const { title, type, data } = individualPrintItem;
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '........' };

    return (
      <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
        <div className="bg-white p-12 w-full max-w-4xl text-slate-900 relative shadow-2xl border-[10px] border-double border-slate-900">
           <button onClick={() => setIndividualPrintItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-rose-600 transition-all z-[10]"><X size={32}/></button>
           
           <div className="flex justify-between items-start border-b-8 border-slate-900 pb-8 mb-12">
              <div className="text-right flex-1">
                 <p className="text-xs font-black text-slate-400 uppercase tracking-widest">DOC-ID: {data.id?.toUpperCase()}</p>
                 <p className="text-xl font-black text-slate-800">{data.date || data.startDate || new Date().toLocaleDateString('ar-EG')}</p>
              </div>
              <div className="text-center flex-[2] px-4">
                 <h2 className="text-4xl font-black text-indigo-800 mb-2">{db.settings.name}</h2>
                 <p className="text-sm font-bold text-slate-500 border-y-2 border-slate-300 py-2 inline-block px-10 uppercase tracking-widest">{title}</p>
              </div>
              <div className="flex-1 flex justify-end">
                 {db.settings.logo && <img src={db.settings.logo} className="h-24 w-auto object-contain" />}
              </div>
           </div>

           <div className="space-y-12 py-6">
              <div className="flex justify-between items-baseline border-b-2 border-dotted border-slate-300 pb-2">
                 <span className="text-slate-500 font-black text-xl uppercase">اسم الموظف المعني:</span>
                 <span className="text-3xl font-black text-indigo-900">{emp.name}</span>
              </div>

              <div className="bg-slate-50 p-10 border-2 border-black min-h-[140px] relative">
                 <span className="absolute -top-4 right-10 bg-white px-4 text-[10px] font-black text-slate-500 uppercase">بيان السند المعتمد</span>
                 
                 {type === 'production' && (
                   <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">عدد القطع</p><p className="text-3xl font-black">{data.piecesCount}</p></div>
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">سعر القطعة</p><p className="text-3xl font-black">{data.valuePerPiece?.toLocaleString()}</p></div>
                      <div className="bg-indigo-800 text-white p-4 rounded-lg"><p className="text-[10px] opacity-70 mb-1">الإجمالي المستحق</p><p className="text-3xl font-black">{data.totalValue?.toLocaleString()}</p></div>
                   </div>
                 )}

                 {type === 'loan' && (
                   <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">إجمالي السلفة</p><p className="text-3xl font-black text-indigo-700">{data.amount?.toLocaleString()}</p></div>
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">عدد الأقساط</p><p className="text-3xl font-black">{data.installmentsCount}</p></div>
                      <div className="bg-rose-800 text-white p-4 rounded-lg"><p className="text-[10px] opacity-70 mb-1">القسط الشهري</p><p className="text-3xl font-black">{data.monthlyInstallment?.toLocaleString()}</p></div>
                   </div>
                 )}

                 {type === 'leave' && (
                   <div className="flex justify-between items-center py-4">
                      <div className="space-y-2">
                         <p className="font-bold text-xl uppercase"><span>من تاريخ:</span> <span className="text-indigo-700">{data.startDate}</span></p>
                         <p className="font-bold text-xl uppercase"><span>إلى تاريخ:</span> <span className="text-indigo-700">{data.endDate}</span></p>
                      </div>
                      <div className="text-center border-r-2 border-slate-200 pr-10">
                         <p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">نوع الإجازة</p>
                         <p className="text-3xl font-black text-indigo-700">{data.type}</p>
                      </div>
                   </div>
                 )}

                 {type === 'financial' && (
                   <div className="flex justify-between items-center py-4">
                      <div className="text-center border-l border-slate-200 flex-1">
                         <p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">نوع الحركة</p>
                         <p className="text-3xl font-black text-indigo-700">{data.type}</p>
                      </div>
                      <div className="text-center flex-1">
                         <p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">المبلغ المعتمد</p>
                         <p className="text-5xl font-black">{data.amount?.toLocaleString()} <span className="text-lg">{db.settings.currency}</span></p>
                      </div>
                   </div>
                 )}

                 {type === 'document' && (
                   <div className="pt-4">
                      <p className="text-xl font-bold leading-relaxed whitespace-pre-line text-slate-700">{data.notes}</p>
                   </div>
                 )}
              </div>

              {(type !== 'document' && (data.reason || data.notes)) && (
                <div className="border-t border-slate-200 pt-4">
                  <span className="text-slate-400 font-black text-[10px] block mb-2 uppercase">ملاحظات إضافية:</span>
                  <p className="font-bold text-xl text-slate-800 leading-relaxed border-r-4 border-indigo-600 pr-4">{data.reason || data.notes}</p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-3 gap-10 mt-20 pt-10 border-t-2 border-slate-100">
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 mb-20 uppercase tracking-widest">توقيع الموظف المستلم</p>
                 <div className="border-t-2 border-black w-full"></div>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 mb-20 uppercase tracking-widest">قسم المحاسبة والتدقيق</p>
                 <div className="border-t-2 border-black w-full"></div>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 mb-20 uppercase tracking-widest">اعتماد الإدارة العامة</p>
                 <div className="border-t-2 border-black w-full"></div>
              </div>
           </div>
        </div>

        <div className="fixed bottom-10 flex gap-4 no-print z-[400]">
            <button onClick={() => executePrint('portrait')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition flex items-center gap-3"><Printer size={28}/> أمر الطباعة</button>
            <button onClick={() => setIndividualPrintItem(null)} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl border hover:bg-slate-50 transition">إلغاء المعاينة</button>
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
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-indigo-700">توجيه الطباعة</h3><button onClick={() => setShowPrintChoice(false)}><X size={24}/></button></div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => executePrint('portrait')} className="p-8 border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300"/><span className="font-black text-sm">طولي</span></button>
                 <button onClick={() => executePrint('landscape')} className="p-8 border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300 rotate-90"/><span className="font-black text-sm">عرضي</span></button>
              </div>
           </div>
        </div>
      )}

      {individualPrintItem && renderIndividualPrintTemplate()}
    </Layout>
  );
};

export default App;
