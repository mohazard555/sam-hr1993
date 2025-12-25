
import React, { useState, useEffect } from 'react';
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
  Employee, PayrollRecord, Language, Theme 
} from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { useTranslation } from './utils/translations';
import { Printer, Save, Search, History, Trash2, FileDown } from 'lucide-react';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isSlipsMode, setIsSlipsMode] = useState(false);
  
  // Payroll History State
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

  const payrolls = generateMonthlyPayroll(
    currentMonth,
    currentYear,
    db.employees,
    db.attendance,
    db.loans,
    db.financials,
    db.settings
  );

  const archivePayroll = () => {
    if (window.confirm("هل أنت متأكد من حفظ رواتب هذا الشهر في الأرشيف؟")) {
      setDb(prev => ({
        ...prev,
        payrollHistory: [...prev.payrollHistory, ...payrolls]
      }));
      alert("تمت الأرشفة بنجاح");
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

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border dark:border-slate-800">
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-950 p-14 text-white text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/10">
              <span className="text-6xl font-black">S</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-widest">SAM HR</h1>
          </div>
          <form onSubmit={handleLogin} className="p-14 space-y-6">
            {loginError && <div className="p-4 bg-rose-50 text-rose-700 text-xs rounded-2xl border border-rose-100 text-center font-black">{loginError}</div>}
            <input className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-[2rem] font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" placeholder={t('username')} value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-[2rem] font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" placeholder={t('password')} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-700 text-white py-6 rounded-[2rem] font-black text-xl hover:bg-indigo-800 shadow-2xl shadow-indigo-100 dark:shadow-none transition-all">دخول النظام</button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + l.remainingAmount, 0)} totalSalaryBudget={payrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
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
            <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl gap-4">
              <h3 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{showHistory ? 'أرشيف الرواتب المحفوظة' : 'جدول رواتب الشهر الجاري'}</h3>
              <div className="flex flex-wrap gap-2 justify-center">
                <button onClick={() => setShowHistory(!showHistory)} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-black transition shadow-lg">
                  <History size={18} /> {showHistory ? 'الرواتب الحالية' : 'الأرشيف'}
                </button>
                {!showHistory && (
                  <button onClick={archivePayroll} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-amber-700 transition shadow-lg">
                    <Save size={18} /> أرشفة الشهر
                  </button>
                )}
                <button onClick={() => exportToExcel(showHistory ? filteredHistory : payrolls, "Payroll")} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg">
                  <FileDown size={18} /> Excel
                </button>
                <button className="bg-indigo-700 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-800 transition shadow-lg" onClick={() => window.print()}><Printer size={18}/> طباعة</button>
              </div>
            </div>

            {showHistory && (
              <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-lg no-print flex gap-4 items-center">
                <Search size={20} className="text-indigo-600" />
                <input type="month" className="p-3 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black outline-none" value={historySearchDate} onChange={e => setHistorySearchDate(e.target.value)} />
              </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
               <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 dark:border-slate-700 text-slate-900 dark:text-slate-100">
                      <tr>
                        <th className="px-6 py-5 font-black text-xs uppercase">الموظف / التاريخ</th>
                        <th className="px-6 py-5 font-black text-xs uppercase text-center">الأساسي</th>
                        <th className="px-6 py-5 font-black text-xs uppercase text-center">إضافي</th>
                        <th className="px-6 py-5 font-black text-xs uppercase text-center">خصم</th>
                        <th className="px-6 py-5 font-black text-xs uppercase text-center">الصافي</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {(showHistory ? filteredHistory : payrolls).map(p => {
                        const emp = db.employees.find(e => e.id === p.employeeId);
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition font-black text-slate-950 dark:text-slate-100">
                            <td className="px-6 py-5">
                              <p className="font-black text-indigo-900 dark:text-indigo-400">{emp?.name}</p>
                              <p className="text-[10px] text-slate-500 font-bold">{p.month}/{p.year}</p>
                            </td>
                            <td className="px-6 py-5 text-center">{p.baseSalary}</td>
                            <td className="px-6 py-5 text-center text-emerald-700">+{p.overtimePay}</td>
                            <td className="px-6 py-5 text-center text-rose-700">-{p.deductions}</td>
                            <td className="px-6 py-5 text-center font-black text-white bg-indigo-700 shadow-xl">{p.netSalary} {db.settings.currency}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                 </table>
               </div>
            </div>
          </div>
        );
      case 'reports':
        return <ReportsView db={db} payrolls={payrolls} lang={db.settings.language} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      case 'leaves':
      case 'loans':
      case 'financials':
      case 'production':
      case 'warnings':
        const moduleMapping: any = {
          leaves: { list: 'leaves', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'من' : 'From', isRtl ? 'إلى' : 'To', isRtl ? 'الحالة' : 'Status'] },
          loans: { list: 'loans', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'القسط' : 'Installment', isRtl ? 'المتبقي' : 'Remaining'] },
          financials: { list: 'financials', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] },
          production: { list: 'financials', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] },
          warnings: { list: 'warnings', headers: [isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason'] }
        };
        const active = moduleMapping[activeTab];
        return (
          <GenericModule<any> 
            title={activeTab === 'production' ? 'سجلات الإنتاج' : (t(activeTab as any) || activeTab)} 
            lang={db.settings.language} 
            employees={db.employees} 
            items={activeTab === 'production' ? db.financials.filter(f => f.type === 'production_incentive') : db[active.list as keyof DB] as any[]} 
            onSave={i => updateList(active.list as keyof DB, i)} 
            onDelete={id => deleteFromList(active.list as keyof DB, id)} 
            initialData={{}} 
            tableHeaders={active.headers}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-4">
                  {activeTab === 'leaves' && (
                    <>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">النوع</label><select className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.type || 'annual'} onChange={e => set({...data, type: e.target.value})}><option value="annual">سنوية</option><option value="sick">مرضية</option></select></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">الحالة</label><select className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.status || 'pending'} onChange={e => set({...data, status: e.target.value})}><option value="pending">انتظار</option><option value="approved">موافقة</option></select></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">من</label><input type="date" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.startDate || ''} onChange={e => set({...data, startDate: e.target.value})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">إلى</label><input type="date" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.endDate || ''} onChange={e => set({...data, endDate: e.target.value})} /></div>
                    </>
                  )}
                  {activeTab === 'loans' && (
                    <>
                      <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">المبلغ</label><input type="number" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">القسط</label><input type="number" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.monthlyInstallment || 0} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">المتبقي</label><input type="number" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.remainingAmount || 0} onChange={e => set({...data, remainingAmount: Number(e.target.value)})} /></div>
                    </>
                  )}
                  {(activeTab === 'financials' || activeTab === 'production') && (
                    <>
                      {activeTab === 'financials' && <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">النوع</label><select className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.type || 'bonus'} onChange={e => set({...data, type: e.target.value})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option></select></div>}
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">المبلغ</label><input type="number" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                      <div className="col-span-1"><label className="text-xs font-black text-slate-500 uppercase">التاريخ</label><input type="date" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                      <div className="col-span-2"><label className="text-xs font-black text-slate-500 uppercase">السبب</label><textarea className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black" value={data.reason || ''} onChange={e => set({...data, reason: e.target.value})} /></div>
                      {activeTab === 'production' && <input type="hidden" value="production_incentive" onChange={() => {}} />}
                    </>
                  )}
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black text-slate-950 dark:text-slate-100">{name}</td>
                {activeTab === 'leaves' && <><td className="px-6 py-4 font-bold">{i.type}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td><td className="px-6 py-4 text-center font-black"><span className={i.status === 'approved' ? 'text-emerald-700' : 'text-rose-700'}>{i.status}</span></td></>}
                {activeTab === 'loans' && <><td className="px-6 py-4 font-black text-indigo-700">{i.amount.toLocaleString()}</td><td className="px-6 py-4 font-bold">{i.monthlyInstallment.toLocaleString()}</td><td className="px-6 py-4 text-rose-700 font-black">{i.remainingAmount.toLocaleString()}</td></>}
                {(activeTab === 'financials' || activeTab === 'production') && <><td className="px-6 py-4 font-bold uppercase">{i.type}</td><td className={`px-6 py-4 font-black ${i.type === 'deduction' ? 'text-rose-700' : 'text-emerald-700'}`}>{i.amount.toLocaleString()}</td><td className="px-6 py-4 font-bold">{i.date}</td><td className="px-6 py-4 truncate max-w-xs opacity-70">{i.reason}</td></>}
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
      <div className="pb-10 transition-colors duration-300">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
