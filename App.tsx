
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
  const [isSlipsMode, setIsSlipsMode] = useState(false);
  
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
      ? "هل أنت متأكد من أرشفة رواتب هذا الشهر؟ سيتم حفظ نسخة دائمة في السجل التاريخي."
      : "Archive current payroll? This saves a permanent historical record.";
    
    if (window.confirm(confirmMsg)) {
      setDb(prev => ({
        ...prev,
        payrollHistory: [...prev.payrollHistory, ...currentPayrolls]
      }));
      alert(isRtl ? "تم الحفظ بنجاح في الأرشيف" : "Archived successfully");
    }
  };

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const list = prev[key] as any[];
      const exists = list.find(i => i.id === item.id);
      const newList = exists ? list.map(i => i.id === item.id ? item : i) : [...list, item];
      return { ...prev, [key]: newList };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => i.id !== id) }));
  };

  // Logic to handle production entries separately for GenericModule
  const productionEntries = useMemo(() => 
    db.financials.filter(f => f.type === 'production_incentive')
  , [db.financials]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo']" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border dark:border-slate-800">
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-950 p-16 text-white text-center">
            <div className="w-28 h-28 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
              <span className="text-7xl font-black">S</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-widest">SAM HRMS</h1>
            <p className="mt-3 text-indigo-200 font-bold opacity-80">{isRtl ? 'نظام إدارة شؤون الموظفين' : 'Personnel System'}</p>
          </div>
          <form onSubmit={handleLogin} className="p-14 space-y-8">
            {loginError && <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl border-2 border-rose-100 text-center font-black animate-pulse">{loginError}</div>}
            <div className="space-y-4">
                <input className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" placeholder={t('username')} value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
                <input type="password" className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" placeholder={t('password')} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-700 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-800 shadow-2xl shadow-indigo-100 dark:shadow-none transition-all hover:scale-[1.02]">دخول النظام</button>
          </form>
          <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            v6.0 Pro Edition • Built by Mohannad Ahmad
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + l.remainingAmount, 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees':
        return <Employees employees={db.employees} departments={db.departments} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments':
        return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance':
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} />;
      case 'payroll':
        const filteredHistory = db.payrollHistory.filter(p => !historySearchDate || `${p.year}-${String(p.month).padStart(2, '0')}` === historySearchDate);
        const dataToDisplay = showHistory ? filteredHistory : currentPayrolls;
        
        return (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-10 rounded-[3rem] border dark:border-slate-800 shadow-2xl gap-6">
              <div>
                <h3 className="text-3xl font-black text-indigo-700 dark:text-indigo-400 flex items-center gap-3">
                   {showHistory ? <Archive size={32}/> : <Calendar size={32}/>}
                   {showHistory ? (isRtl ? 'أرشيف الرواتب المحفوظة' : 'Archived Payrolls') : (isRtl ? 'مسير الرواتب الجاري' : 'Current Payroll')}
                </h3>
                <p className="text-xs font-black text-slate-500 uppercase mt-2 tracking-widest">{showHistory ? (isRtl ? 'استعراض البيانات التاريخية الموثقة' : 'Historical verified records') : (isRtl ? 'حسابات حية مبنية على حضور الشهر' : 'Live calculations based on current month')}</p>
              </div>
              <div className="flex flex-wrap gap-3 justify-center">
                <button onClick={() => setShowHistory(!showHistory)} className={`${showHistory ? 'bg-indigo-600' : 'bg-slate-800'} text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 hover:opacity-90 shadow-xl transition-all`}>
                  <History size={20} /> {showHistory ? (isRtl ? 'العودة للرواتب الحالية' : 'Current Payroll') : (isRtl ? 'عرض الأرشيف التاريخي' : 'View Archives')}
                </button>
                {!showHistory && (
                  <button onClick={archivePayroll} className="bg-amber-600 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 hover:bg-amber-700 shadow-xl transition-all">
                    <Save size={20} /> {isRtl ? 'أرشفة الشهر الجاري' : 'Archive Month'}
                  </button>
                )}
                <button onClick={() => exportToExcel(dataToDisplay, "SAM_Payroll")} className="bg-emerald-600 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 hover:bg-emerald-700 shadow-xl transition-all">
                  <FileDown size={20} /> Excel
                </button>
                <button className="bg-indigo-700 text-white px-8 py-4 rounded-[1.5rem] font-black flex items-center gap-2 hover:bg-indigo-800 shadow-xl transition-all" onClick={() => window.print()}><Printer size={20}/> {isRtl ? 'طباعة الكشف' : 'Print'}</button>
              </div>
            </div>

            {showHistory && (
              <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-xl no-print flex flex-col md:flex-row gap-6 items-center">
                <div className="flex items-center gap-3 font-black text-indigo-700">
                    <Search size={24} />
                    <span>{isRtl ? 'بحث في تاريخ الأرشيف:' : 'Search History Date:'}</span>
                </div>
                <input type="month" className="flex-1 max-w-sm p-4 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black outline-none focus:border-indigo-600" value={historySearchDate} onChange={e => setHistorySearchDate(e.target.value)} />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 dark:border-slate-700 text-slate-950 dark:text-slate-100">
                      <tr className="font-black text-xs uppercase tracking-widest">
                        <th className="px-8 py-6">{isRtl ? 'اسم الموظف / القسم' : 'Employee / Dept'}</th>
                        <th className="px-8 py-6 text-center">{isRtl ? 'الأساسي' : 'Base'}</th>
                        <th className="px-8 py-6 text-center">{isRtl ? 'المواصلات' : 'Transp'}</th>
                        <th className="px-8 py-6 text-center">{isRtl ? 'إضافي' : 'OT'}</th>
                        <th className="px-8 py-6 text-center">{isRtl ? 'خصومات' : 'Deduct'}</th>
                        <th className="px-8 py-6 text-center">{isRtl ? 'صافي الراتب' : 'Net Salary'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {dataToDisplay.map(p => {
                        const emp = db.employees.find(e => e.id === p.employeeId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition font-black text-slate-950 dark:text-slate-100">
                            <td className="px-8 py-6">
                              <p className="font-black text-indigo-800 dark:text-indigo-400 text-lg">{emp?.name || 'Unknown'}</p>
                              <p className="text-[10px] text-slate-500 font-black uppercase mt-1">{emp?.department || 'N/A'} • {p.month}/{p.year}</p>
                            </td>
                            <td className="px-8 py-6 text-center">{p.baseSalary.toLocaleString()}</td>
                            <td className="px-8 py-6 text-center text-emerald-700">+{p.transport.toLocaleString()}</td>
                            <td className="px-8 py-6 text-center text-emerald-700">+{p.overtimePay.toLocaleString()}</td>
                            <td className="px-8 py-6 text-center text-rose-700">-{p.deductions.toLocaleString()}</td>
                            <td className="px-8 py-6 text-center">
                                <div className="bg-indigo-700 text-white py-3 px-6 rounded-2xl font-black shadow-lg inline-block min-w-[120px]">
                                    {p.netSalary.toLocaleString()} <span className="text-[10px] opacity-70">{db.settings.currency}</span>
                                </div>
                            </td>
                          </tr>
                        );
                      })}
                      {dataToDisplay.length === 0 && (
                          <tr>
                              <td colSpan={6} className="py-24 text-center text-slate-400 italic font-black">
                                  {isRtl ? 'لا توجد رواتب مسجلة في هذا التاريخ.' : 'No salaries recorded for this date.'}
                              </td>
                          </tr>
                      )}
                    </tbody>
                 </table>
               </div>
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
          loans: { list: 'loans', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'مبلغ السلفة' : 'Loan', isRtl ? 'القسط' : 'Installment', isRtl ? 'المتبقي' : 'Remains'] },
          financials: { list: 'financials', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] },
          production: { list: 'production', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'قيمة الإنتاج' : 'Amount', isRtl ? 'تاريخ الإنجاز' : 'Date', isRtl ? 'البيان' : 'Details'] },
          warnings: { list: 'warnings', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] }
        };
        const active = moduleMapping[activeTab];
        const moduleItems = activeTab === 'production' ? productionEntries : db[active.list as keyof DB] as any[];

        return (
          <GenericModule<any> 
            title={activeTab === 'production' ? (isRtl ? 'سجلات الإنتاج' : 'Production Records') : (t(activeTab as any) || activeTab)} 
            lang={db.settings.language} 
            employees={db.employees} 
            items={moduleItems} 
            onSave={i => {
                // Ensure production items are saved as financial entries with specific type
                if (activeTab === 'production') {
                    updateList('financials', { ...i, type: 'production_incentive' });
                } else {
                    updateList(active.list as keyof DB, i);
                }
            }} 
            onDelete={id => deleteFromList(activeTab === 'production' ? 'financials' : active.list as keyof DB, id)} 
            initialData={{}} 
            tableHeaders={active.headers}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-6">
                  {activeTab === 'leaves' && (
                    <>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'النوع' : 'Type'}</label><select className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.type || 'annual'} onChange={e => set({...data, type: e.target.value})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option></select></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'الحالة' : 'Status'}</label><select className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.status || 'pending'} onChange={e => set({...data, status: e.target.value})}><option value="pending">انتظار</option><option value="approved">موافقة</option><option value="rejected">مرفوض</option></select></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'من' : 'From'}</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.startDate || ''} onChange={e => set({...data, startDate: e.target.value})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'إلى' : 'To'}</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.endDate || ''} onChange={e => set({...data, endDate: e.target.value})} /></div>
                    </>
                  )}
                  {activeTab === 'loans' && (
                    <>
                      <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'مبلغ السلفة' : 'Loan Amount'}</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'القسط الشهري' : 'Installment'}</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.monthlyInstallment || 0} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'المتبقي حالياً' : 'Remaining'}</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.remainingAmount || 0} onChange={e => set({...data, remainingAmount: Number(e.target.value)})} /></div>
                      <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'تاريخ السلفة' : 'Date'}</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                    </>
                  )}
                  {(activeTab === 'financials' || activeTab === 'production') && (
                    <>
                      {activeTab === 'financials' && <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'النوع' : 'Type'}</label><select className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.type || 'bonus'} onChange={e => set({...data, type: e.target.value})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option></select></div>}
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'المبلغ' : 'Amount'}</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'التاريخ' : 'Date'}</label><input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                      <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">{isRtl ? 'السبب / البيان' : 'Reason'}</label><textarea rows={3} className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black" value={data.reason || ''} onChange={e => set({...data, reason: e.target.value})} /></div>
                    </>
                  )}
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-8 py-5 font-black text-slate-950 dark:text-slate-100">{name}</td>
                {activeTab === 'leaves' && <><td className="px-8 py-5 font-bold text-indigo-700 dark:text-indigo-400">{i.type}</td><td className="px-8 py-5 font-bold">{i.startDate}</td><td className="px-8 py-5 font-bold">{i.endDate}</td><td className="px-8 py-5 text-center font-black"><span className={`px-4 py-1 rounded-xl uppercase text-[10px] ${i.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{i.status}</span></td></>}
                {activeTab === 'loans' && <><td className="px-8 py-5 font-black text-indigo-700">{i.amount.toLocaleString()}</td><td className="px-8 py-5 font-bold">{i.monthlyInstallment.toLocaleString()}</td><td className="px-8 py-5 text-rose-700 font-black">{i.remainingAmount.toLocaleString()}</td></>}
                {(activeTab === 'financials' || activeTab === 'production') && <><td className="px-8 py-5 font-bold uppercase">{i.type === 'production_incentive' ? (isRtl ? 'إنتاج' : 'Prod') : (i.type)}</td><td className={`px-8 py-5 font-black ${i.type === 'deduction' ? 'text-rose-700' : 'text-emerald-700'}`}>{i.amount.toLocaleString()}</td><td className="px-8 py-5 font-bold">{i.date}</td><td className="px-8 py-5 truncate max-w-xs opacity-80 text-xs font-bold">{i.reason}</td></>}
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
