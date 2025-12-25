
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import Departments from './views/Departments';
import Attendance from './views/Attendance';
import SettingsView from './views/Settings';
import ReportsView from './views/Reports';
import { GenericModule } from './views/GenericModule';
import { loadDB, saveDB, DB } from './db/store';
import { 
  Employee, PayrollRecord, Language, Theme, FinancialEntry 
} from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { useTranslation } from './utils/translations';
import { Printer, Save, Search, History, Trash2, FileDown, Calendar, Archive } from 'lucide-react';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  
  // Payroll History States
  const [showHistory, setShowHistory] = useState(false);
  const [historySearchDate, setHistorySearchDate] = useState('');

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const t = useTranslation(db.settings.language);
  const isRtl = db.settings.language === 'ar';

  const toggleTheme = () => {
    const newTheme = db.settings.theme === 'light' ? 'dark' : 'light';
    setDb(prev => ({ ...prev, settings: { ...prev.settings, theme: newTheme } }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setLoginError('');
    } else {
      setLoginError(t('errorLogin'));
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentPayrolls = useMemo(() => generateMonthlyPayroll(
    currentMonth,
    currentYear,
    db.employees,
    db.attendance,
    db.loans,
    db.financials,
    db.settings
  ), [currentMonth, currentYear, db]);

  const archivePayroll = () => {
    const confirmMsg = isRtl 
      ? "هل أنت متأكد من أرشفة رواتب هذا الشهر؟"
      : "Archive current payroll?";
    
    if (window.confirm(confirmMsg)) {
      setDb(prev => ({
        ...prev,
        payrollHistory: [...prev.payrollHistory, ...currentPayrolls]
      }));
      alert(isRtl ? "تمت الأرشفة بنجاح" : "Archived successfully");
    }
  };

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const list = (prev[key] || []) as any[];
      const exists = list.find(i => i.id === item.id);
      const newList = exists ? list.map(i => i.id === item.id ? item : i) : [...list, item];
      return { ...prev, [key]: newList };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => i.id !== id) }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo']" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border dark:border-slate-800">
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-950 p-16 text-white text-center">
            <div className="w-28 h-28 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
              <span className="text-7xl font-black">S</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-widest">SAM HRMS</h1>
          </div>
          <form onSubmit={handleLogin} className="p-14 space-y-8">
            <input className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" placeholder={t('username')} value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" placeholder={t('password')} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-700 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-800 transition-all">دخول النظام</button>
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
        return <Employees employees={db.employees} departments={db.departments} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments':
        return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance':
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} />;
      case 'payroll':
        const filteredHistory = db.payrollHistory.filter(p => !historySearchDate || `${p.year}-${String(p.month).padStart(2, '0')}` === historySearchDate);
        return (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-2xl gap-6">
              <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400">{showHistory ? (isRtl ? 'الأرشيف' : 'Archive') : (isRtl ? 'مسير الرواتب' : 'Payroll')}</h3>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setShowHistory(!showHistory)} className="bg-slate-800 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 transition-all">
                  <History size={20} /> {showHistory ? 'الحالية' : 'الأرشيف'}
                </button>
                {!showHistory && <button onClick={archivePayroll} className="bg-amber-600 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 transition-all"><Save size={20}/> أرشفة</button>}
                <button onClick={() => exportToExcel(showHistory ? filteredHistory : currentPayrolls, "SAM_Payroll")} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 transition-all"><FileDown size={20}/> Excel</button>
                <button className="bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 transition-all" onClick={() => window.print()}><Printer size={20}/> طباعة</button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
               <table className="w-full text-right text-sm">
                 <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 text-slate-950 dark:text-slate-100 font-black">
                   <tr><th className="px-8 py-6">الموظف</th><th className="text-center">الأساسي</th><th className="text-center">إضافي</th><th className="text-center">خصم</th><th className="text-center">الصافي</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {(showHistory ? filteredHistory : currentPayrolls).map(p => {
                     const emp = db.employees.find(e => e.id === p.employeeId);
                     return (
                       <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-black text-slate-950 dark:text-white">
                         <td className="px-8 py-6">{emp?.name}<p className="text-[10px] text-slate-500">{p.month}/{p.year}</p></td>
                         <td className="text-center">{(p.baseSalary || 0).toLocaleString()}</td>
                         <td className="text-center text-emerald-700">+{(p.overtimePay || 0).toLocaleString()}</td>
                         <td className="text-center text-rose-700">-{(p.deductions || 0).toLocaleString()}</td>
                         <td className="text-center"><span className="bg-indigo-700 text-white py-2 px-4 rounded-xl">{(p.netSalary || 0).toLocaleString()}</span></td>
                       </tr>
                     );
                   })}
                 </tbody>
               </table>
            </div>
          </div>
        );
      case 'reports':
        return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      case 'leaves':
      case 'loans':
      case 'financials':
      case 'production':
      case 'warnings':
        const moduleMapping: any = {
          leaves: { list: 'leaves', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'من' : 'From', isRtl ? 'إلى' : 'To', isRtl ? 'الحالة' : 'Status'] },
          loans: { list: 'loans', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'السلفة' : 'Loan', isRtl ? 'تاريخ التحصيل' : 'Collection Date', isRtl ? 'القسط' : 'Installment', isRtl ? 'المتبقي' : 'Remains'] },
          financials: { list: 'financials', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] },
          production: { list: 'financials', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'القيمة' : 'Amount', isRtl ? 'تاريخ الإنتاج' : 'Date', isRtl ? 'البيان' : 'Details'] },
          warnings: { list: 'warnings', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] }
        };
        const active = moduleMapping[activeTab];
        const moduleItems = activeTab === 'production' ? db.financials.filter(f => f.type === 'production_incentive') : db[active.list as keyof DB] as any[];

        return (
          <GenericModule<any> 
            title={activeTab === 'production' ? (isRtl ? 'سجلات الإنتاج' : 'Production') : (t(activeTab as any) || activeTab)} 
            lang={db.settings.language} 
            employees={db.employees} 
            items={moduleItems} 
            onSave={i => updateList(activeTab === 'production' ? 'financials' : active.list as keyof DB, i)} 
            onDelete={id => deleteFromList(activeTab === 'production' ? 'financials' : active.list as keyof DB, id)} 
            initialData={activeTab === 'loans' ? { amount: 0, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] } : {}} 
            tableHeaders={active.headers}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-6">
                  {activeTab === 'leaves' && (
                    <>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">النوع</label><select className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.type || 'annual'} onChange={e => set({...data, type: e.target.value})}><option value="annual">سنوية</option><option value="sick">مرضية</option></select></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">الحالة</label><select className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.status || 'pending'} onChange={e => set({...data, status: e.target.value})}><option value="pending">انتظار</option><option value="approved">موافقة</option></select></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">من</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.startDate || ''} onChange={e => set({...data, startDate: e.target.value})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">إلى</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.endDate || ''} onChange={e => set({...data, endDate: e.target.value})} /></div>
                    </>
                  )}
                  {activeTab === 'loans' && (
                    <>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">مبلغ السلفة</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">تاريخ التحصيل</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">القسط</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.monthlyInstallment || 0} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">المتبقي</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.remainingAmount || 0} onChange={e => set({...data, remainingAmount: Number(e.target.value)})} /></div>
                    </>
                  )}
                  {(activeTab === 'financials' || activeTab === 'production') && (
                    <>
                      {activeTab === 'financials' && <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">النوع</label><select className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.type || 'bonus'} onChange={e => set({...data, type: e.target.value})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option></select></div>}
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">المبلغ</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">التاريخ</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                      <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">السبب</label><textarea rows={3} className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.reason || ''} onChange={e => set({...data, reason: e.target.value})} /></div>
                      {activeTab === 'production' && <input type="hidden" value="production_incentive" />}
                    </>
                  )}
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-8 py-5 font-black text-slate-950 dark:text-white">{name}</td>
                {activeTab === 'leaves' && <><td className="px-8 py-5 font-bold">{i.type}</td><td className="px-8 py-5">{i.startDate}</td><td className="px-8 py-5">{i.endDate}</td><td className="px-8 py-5 text-center font-black">{i.status}</td></>}
                {activeTab === 'loans' && <><td className="px-8 py-5 font-black text-indigo-700">{(i.amount || 0).toLocaleString()}</td><td className="px-8 py-5 font-bold">{i.date || '-'}</td><td className="px-8 py-5 font-bold">{(i.monthlyInstallment || 0).toLocaleString()}</td><td className="px-8 py-5 text-rose-700 font-black">{(i.remainingAmount || 0).toLocaleString()}</td></>}
                {(activeTab === 'financials' || activeTab === 'production') && <><td className="px-8 py-5 font-bold uppercase">{i.type === 'production_incentive' ? 'إنتاج' : i.type}</td><td className={`px-8 py-5 font-black ${i.type === 'deduction' ? 'text-rose-700' : 'text-emerald-700'}`}>{(i.amount || 0).toLocaleString()}</td><td className="px-8 py-5 font-bold">{i.date}</td><td className="px-8 py-5 truncate max-w-xs opacity-80 text-xs font-bold">{i.reason}</td></>}
              </>
            )}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={toggleTheme} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      <div className="pb-20 transition-colors duration-500">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
