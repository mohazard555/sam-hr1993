
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import Attendance from './views/Attendance';
import SettingsView from './views/Settings';
import ReportsView from './views/Reports';
import { GenericModule } from './views/GenericModule';
import { loadDB, saveDB, DB } from './db/store';
import { 
  Employee, AttendanceRecord, Loan, FinancialEntry, 
  LeaveRequest, Warning, CompanySettings, User, Language, Theme 
} from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { useTranslation } from './utils/translations';
import { LogIn, Key, Shield, Printer } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [loginError, setLoginError] = useState('');
  const [isSlipsMode, setIsSlipsMode] = useState(false);

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

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
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

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const list = prev[key] as any[];
      const exists = list.find(i => i.id === item.id);
      const newList = exists ? list.map(i => i.id === item.id ? item : i) : [...list, item];
      return { ...prev, [key]: newList };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter(i => i.id !== id) }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 font-['Cairo']" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col transform transition-all">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-white text-center relative">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <span className="text-5xl font-black">S</span>
            </div>
            <h1 className="text-4xl font-black">SAM</h1>
            <p className="opacity-80 mt-2 font-bold">{isRtl ? 'نظام إدارة شؤون الموظفين' : 'Personnel Management System'}</p>
          </div>
          <form onSubmit={handleLogin} className="p-12 space-y-6">
            {loginError && <div className="p-4 bg-red-50 text-red-600 text-sm rounded-2xl border border-red-100 text-center font-bold animate-bounce">{loginError}</div>}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('username')}</label>
              <input 
                className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 transition font-bold"
                value={loginForm.username}
                onChange={e => setLoginForm({...loginForm, username: e.target.value})}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-widest">{t('password')}</label>
              <input 
                type="password"
                className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl outline-none focus:border-indigo-500 transition font-bold"
                value={loginForm.password}
                onChange={e => setLoginForm({...loginForm, password: e.target.value})}
                required
              />
            </div>
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none transition-all">
              {t('login')}
            </button>
          </form>
          <div className="p-6 text-center border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-400">
            SAM HRMS v4.0 • Developed by Mohannad Ahmad
          </div>
        </div>
      </div>
    );
  }

  // Horizontal Slips View (Print Mode)
  if (isSlipsMode) {
     return (
        <div className="bg-white min-h-screen p-8" dir="rtl">
           <div className="no-print flex justify-between items-center mb-8 bg-slate-100 p-4 rounded-xl">
              <h1 className="text-xl font-black">إيصالات استلام الرواتب (SAM Slips)</h1>
              <div className="flex gap-4">
                 <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold">طباعة</button>
                 <button onClick={() => setIsSlipsMode(false)} className="bg-slate-300 px-6 py-2 rounded-lg font-bold">رجوع</button>
              </div>
           </div>
           <div className="space-y-4">
              {payrolls.map((p, idx) => {
                 const emp = db.employees.find(e => e.id === p.employeeId);
                 return (
                    <div key={p.id} className="receipt-slip border-2 border-slate-900 p-6 flex flex-col gap-4 text-sm font-bold">
                       <div className="flex justify-between items-center border-b pb-2">
                          <div className="text-lg font-black">إيصال راتب موظف - {db.settings.name}</div>
                          <div>الشهر: {p.month} / {p.year}</div>
                       </div>
                       <div className="grid grid-cols-4 gap-4">
                          <div className="col-span-1 border p-2">الموظف: {emp?.name}</div>
                          <div className="col-span-1 border p-2">القسم: {emp?.department}</div>
                          <div className="col-span-1 border p-2">الراتب الأساسي: {p.baseSalary}</div>
                          <div className="col-span-1 border p-2 bg-indigo-50">الصافي المقبوض: {p.netSalary} {db.settings.currency}</div>
                       </div>
                       <div className="flex justify-between items-end mt-4">
                          <div>توقيع المحاسب: .........................</div>
                          <div className="text-[9px] opacity-50">Generated by SAM HRMS • Mohannad Ahmad</div>
                          <div>توقيع الموظف بالاستلام: .........................</div>
                       </div>
                    </div>
                 );
              })}
           </div>
        </div>
     );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + l.remainingAmount, 0)} totalSalaryBudget={payrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees':
        return <Employees employees={db.employees} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'attendance':
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} />;
      case 'leaves':
        return (
          <GenericModule<LeaveRequest> title={t('leaves')} lang={db.settings.language} employees={db.employees} items={db.leaves} onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} initialData={{ status: 'pending', type: 'annual' }} tableHeaders={[isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'من' : 'From', isRtl ? 'إلى' : 'To', isRtl ? 'الحالة' : 'Status']} renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-xs font-bold block mb-1">{isRtl ? 'النوع' : 'Type'}</label><select className="w-full p-2 border rounded-lg font-bold" value={data.type || 'annual'} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option></select></div>
                <div><label className="text-xs font-bold block mb-1">{isRtl ? 'الحالة' : 'Status'}</label><select className="w-full p-2 border rounded-lg font-bold" value={data.status || 'pending'} onChange={e => set({...data, status: e.target.value as any})}><option value="pending">انتظار</option><option value="approved">موافقة</option></select></div>
                <div><label className="text-xs font-bold block mb-1">{isRtl ? 'من' : 'From'}</label><input type="date" className="w-full p-2 border rounded-lg font-bold" value={data.startDate || ''} onChange={e => set({...data, startDate: e.target.value})} /></div>
                <div><label className="text-xs font-bold block mb-1">{isRtl ? 'إلى' : 'To'}</label><input type="date" className="w-full p-2 border rounded-lg font-bold" value={data.endDate || ''} onChange={e => set({...data, endDate: e.target.value})} /></div>
              </div>
          )} renderRow={(i, name) => (<><td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{name}</td><td className="px-6 py-4">{i.type}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${i.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.status}</span></td></>)} />
        );
      case 'loans':
        return <GenericModule<Loan> title={isRtl ? 'السلف والقروض' : 'Loans'} lang={db.settings.language} employees={db.employees} items={db.loans} onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} initialData={{ amount: 0, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} tableHeaders={[isRtl ? 'الموظف' : 'Employee', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'القسط' : 'Installment', isRtl ? 'المتبقي' : 'Remaining']} renderForm={(data, set) => (
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="text-xs font-bold block mb-1">المبلغ</label><input type="number" className="w-full p-2 border rounded-lg font-bold" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} /></div>
            <div><label className="text-xs font-bold block mb-1">القسط</label><input type="number" className="w-full p-2 border rounded-lg font-bold" value={data.monthlyInstallment || 0} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} /></div>
            <div><label className="text-xs font-bold block mb-1">المتبقي</label><input type="number" className="w-full p-2 border rounded-lg font-bold" value={data.remainingAmount || 0} onChange={e => set({...data, remainingAmount: Number(e.target.value)})} /></div>
          </div>
        )} renderRow={(i, name) => (<><td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{name}</td><td className="px-6 py-4 font-bold text-indigo-600">{i.amount}</td><td className="px-6 py-4">{i.monthlyInstallment}</td><td className="px-6 py-4 text-rose-600 font-bold">{i.remainingAmount}</td></>)} />;
      case 'payroll':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-xl">
              <h3 className="text-2xl font-black text-indigo-600">جدول الرواتب - {currentMonth}/{currentYear}</h3>
              <div className="flex gap-4">
                <button onClick={() => setIsSlipsMode(true)} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 shadow-lg">
                  <Printer size={18} />
                  إيصالات الاستلام (Slips)
                </button>
                <button className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-black shadow-lg hover:bg-indigo-700" onClick={() => window.print()}>طباعة الجدول</button>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
               <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b-2 border-slate-100 dark:border-slate-700 text-slate-800 dark:text-slate-200">
                    <tr>
                      <th className="px-6 py-5 font-black">الموظف</th>
                      <th className="px-6 py-5 font-black">الأساسي</th>
                      <th className="px-6 py-5 font-black">الإضافي</th>
                      <th className="px-6 py-5 font-black">الحوافز</th>
                      <th className="px-6 py-5 font-black">الخصم</th>
                      <th className="px-6 py-5 font-black">الصافي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                    {payrolls.map(p => {
                      const emp = db.employees.find(e => e.id === p.employeeId);
                      return (
                        <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition font-bold">
                          <td className="px-6 py-5 font-black text-indigo-900 dark:text-indigo-400">{emp?.name}</td>
                          <td className="px-6 py-5">{p.baseSalary}</td>
                          <td className="px-6 py-5 text-emerald-600">+{p.overtimePay}</td>
                          <td className="px-6 py-5 text-emerald-600">+{p.bonuses + p.production}</td>
                          <td className="px-6 py-5 text-rose-600">-{p.deductions}</td>
                          <td className="px-6 py-5 font-black text-white bg-indigo-600 shadow-inner">{p.netSalary} {db.settings.currency}</td>
                        </tr>
                      );
                    })}
                  </tbody>
               </table>
            </div>
          </div>
        );
      case 'reports':
        return <ReportsView db={db} payrolls={payrolls} lang={db.settings.language} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      case 'financials':
      case 'production':
        return <GenericModule<FinancialEntry> title={activeTab === 'financials' ? t('financials') : t('production')} lang={db.settings.language} employees={db.employees} items={db.financials.filter(f => activeTab === 'production' ? f.type === 'production_incentive' : (f.type === 'bonus' || f.type === 'deduction'))} onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} initialData={{ type: activeTab === 'production' ? 'production_incentive' : 'bonus', amount: 0, date: new Date().toISOString().split('T')[0] }} tableHeaders={[isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'المبلغ' : 'Amount', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason']} renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                {activeTab === 'financials' && (
                  <div className="col-span-2"><label className="text-xs font-bold block mb-1">النوع</label><select className="w-full p-2 border rounded-lg font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option></select></div>
                )}
                <div><label className="text-xs font-bold block mb-1">المبلغ</label><input type="number" className="w-full p-2 border rounded-lg font-bold" value={data.amount || 0} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                <div><label className="text-xs font-bold block mb-1">التاريخ</label><input type="date" className="w-full p-2 border rounded-lg font-bold" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                <div className="col-span-2"><label className="text-xs font-bold block mb-1">السبب</label><textarea className="w-full p-2 border rounded-lg font-bold" value={data.reason || ''} onChange={e => set({...data, reason: e.target.value})} /></div>
              </div>
            )} renderRow={(i, name) => (<><td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{name}</td><td className="px-6 py-4">{i.type}</td><td className={`px-6 py-4 font-black ${i.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'}`}>{i.amount}</td><td className="px-6 py-4">{i.date}</td><td className="px-6 py-4 truncate max-w-xs">{i.reason}</td></>)} />;
      case 'warnings':
          return <GenericModule<Warning> title={t('warnings')} lang={db.settings.language} employees={db.employees} items={db.warnings} onSave={i => updateList('warnings', i)} onDelete={id => deleteFromList('warnings', id)} initialData={{ type: 'verbal', date: new Date().toISOString().split('T')[0] }} tableHeaders={[isRtl ? 'الموظف' : 'Employee', isRtl ? 'النوع' : 'Type', isRtl ? 'التاريخ' : 'Date', isRtl ? 'السبب' : 'Reason']} renderForm={(data, set) => (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-bold block mb-1">النوع</label><select className="w-full p-2 border rounded-lg font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="verbal">شفهي</option><option value="written">كتابي</option><option value="final">نهائي</option></select></div>
                  <div><label className="text-xs font-bold block mb-1">التاريخ</label><input type="date" className="w-full p-2 border rounded-lg font-bold" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} /></div>
                  <div className="col-span-2"><label className="text-xs font-bold block mb-1">السبب</label><textarea className="w-full p-2 border rounded-lg font-bold" value={data.reason || ''} onChange={e => set({...data, reason: e.target.value})} /></div>
                </div>
              )} renderRow={(i, name) => (<><td className="px-6 py-4 font-bold text-slate-900 dark:text-slate-100">{name}</td><td className="px-6 py-4">{i.type}</td><td className="px-6 py-4">{i.date}</td><td className="px-6 py-4 max-w-xs truncate">{i.reason}</td></>)} />;
      default:
        return null;
    }
  };

  return (
    <Layout 
      activeTab={activeTab} 
      setActiveTab={setActiveTab} 
      lang={db.settings.language} 
      theme={db.settings.theme}
      toggleTheme={toggleTheme}
      currentUser={currentUser}
      onLogout={handleLogout}
    >
      <div className="pb-10 transition-colors duration-300">
        {renderContent()}
      </div>
    </Layout>
  );
};

export default App;
