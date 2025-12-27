
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
import { Printer, Save, Search, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText } from 'lucide-react';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  const [showVoucher, setShowVoucher] = useState<FinancialEntry | null>(null);

  useEffect(() => saveDB(db), [db]);

  const t = useTranslation(db.settings.language);
  const isRtl = db.settings.language === 'ar';

  const toggleTheme = () => {
    const newTheme = db.settings.theme === 'light' ? 'dark' : 'light';
    setDb(prev => ({ ...prev, settings: { ...prev.settings, theme: newTheme } }));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) setCurrentUser(user); else alert('خطأ دخول');
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
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => i.id !== id) }));
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 font-['Cairo']" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl w-full max-md overflow-hidden flex flex-col border dark:border-slate-800">
          <div className="bg-gradient-to-br from-indigo-700 to-indigo-950 p-16 text-white text-center">
            <div className="w-28 h-28 bg-white/10 backdrop-blur-3xl rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-2xl border border-white/20">
              <span className="text-7xl font-black">S</span>
            </div>
            <h1 className="text-4xl font-black uppercase tracking-widest">SAM HRMS</h1>
          </div>
          <form onSubmit={handleLogin} className="p-14 space-y-8">
            <input className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] font-black outline-none" placeholder={t('username')} value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-5 px-8 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-[2rem] font-black outline-none" placeholder={t('password')} value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
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
        return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments':
        return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance':
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} />;
      case 'production':
        return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} />;
      case 'payroll':
        const dataToDisplay = currentPayrolls;
        const totals = dataToDisplay.reduce((acc, p) => ({ base: acc.base + p.baseSalary, net: acc.net + p.netSalary }), { base: 0, net: 0 });
        const cycleText = db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري';
        return (
          <div className="space-y-6">
            <div className="print-only print-header">
                <div><h1 className="text-3xl font-black text-indigo-700">{db.settings.name}</h1><p className="text-sm font-bold">{db.settings.address}</p></div>
                <div className="text-right"><h2 className="text-2xl font-black">مسير الرواتب {cycleText}</h2><p className="text-sm font-bold">{currentMonth}/{currentYear}</p></div>
            </div>
            <div className="flex justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl">
               <h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText} الجاري</h3>
               <button className="bg-indigo-700 text-white px-8 py-3 rounded-xl font-black" onClick={() => window.print()}><Printer size={20}/> طباعة الكشف</button>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border overflow-hidden overflow-x-auto">
               <table className="w-full text-right text-sm">
                 <thead className="bg-indigo-600 text-white font-black">
                   <tr>
                     <th className="px-6 py-5 min-w-[150px]">الموظف / القسم</th>
                     <th className="text-center">الأيام</th>
                     <th className="text-center">الأساسي</th>
                     <th className="text-center">الإنتاج</th>
                     <th className="text-center">مكافآت</th>
                     <th className="text-center">مواصلات</th>
                     <th className="text-center">إضافي</th>
                     <th className="text-center">سلفة</th>
                     <th className="text-center">خصم</th>
                     <th className="text-center font-black bg-indigo-800">الصافي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y">
                   {dataToDisplay.map(p => {
                     const emp = db.employees.find(e => e.id === p.employeeId);
                     return (
                       <tr key={p.id} className="font-bold hover:bg-slate-50 transition">
                         <td className="px-6 py-5"><div><p>{emp?.name}</p><p className="text-[10px] text-slate-500 uppercase">{emp?.department}</p></div></td>
                         <td className="text-center"><span className="bg-indigo-50 px-2 py-1 rounded text-indigo-700">{p.workingDays}</span></td>
                         <td className="text-center">{p.baseSalary.toLocaleString()}</td>
                         <td className="text-center text-indigo-600">+{p.production.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                         <td className="text-center text-slate-500">+{p.transport.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                         <td className="text-center text-orange-600">-{p.loanInstallment.toLocaleString()}</td>
                         <td className="text-center text-rose-600">-{p.deductions.toLocaleString()}</td>
                         <td className="text-center font-black text-indigo-900 bg-indigo-50">{p.netSalary.toLocaleString()}</td>
                       </tr>
                     );
                   })}
                 </tbody>
                 <tfoot className="bg-slate-100 font-black">
                    <tr><td className="px-6 py-6" colSpan={9}>إجمالي الرواتب الصافية المستحقة للتحويل</td><td className="text-center text-xl text-indigo-900">{totals.net.toLocaleString()} {db.settings.currency}</td></tr>
                 </tfoot>
               </table>
            </div>
          </div>
        );
      case 'leaves':
        return (
          <GenericModule<LeaveRequest> 
            title="نظام الإجازات" 
            lang={db.settings.language} 
            employees={db.employees} 
            items={db.leaves} 
            onSave={i => updateList('leaves', i)} 
            onDelete={id => deleteFromList('leaves', id)} 
            initialData={{ type: 'annual', status: 'pending', isPaid: true }} 
            tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى', 'الأجر']}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-xs font-black uppercase">النوع</label><select className="w-full p-4 border rounded-xl font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option><option value="emergency">اضطرارية</option><option value="marriage">زواج</option><option value="death">وفاة</option></select></div>
                  <div><label className="text-xs font-black uppercase">من تاريخ</label><input type="date" className="w-full p-3 border rounded-xl" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>
                  <div><label className="text-xs font-black uppercase">إلى تاريخ</label><input type="date" className="w-full p-3 border rounded-xl" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>
                  <div className="col-span-2 flex items-center gap-3 bg-slate-50 p-4 rounded-xl border-2 border-dashed"><input type="checkbox" id="paid" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} className="w-6 h-6" /><label htmlFor="paid" className="font-black text-indigo-700">إجازة مدفوعة الأجر (بدون خصم راتب)</label></div>
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4 font-bold uppercase">{i.type}</td>
                <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-black ${i.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.status}</span></td>
                <td className="px-6 py-4 text-xs font-bold">{i.startDate}</td>
                <td className="px-6 py-4 text-xs font-bold">{i.endDate}</td>
                <td className="px-6 py-4 text-center">{i.isPaid ? <CheckCircle2 className="text-emerald-600 inline"/> : <XCircle className="text-rose-600 inline"/>}</td>
              </>
            )}
          />
        );
      case 'loans':
        return (
          <GenericModule<Loan> 
            title="سجلات السلف" 
            lang={db.settings.language} 
            employees={db.employees} 
            items={db.loans} 
            onSave={i => updateList('loans', i)} 
            onDelete={id => deleteFromList('loans', id)} 
            initialData={{ amount: 0, monthlyInstallment: 0, remainingAmount: 0 }} 
            tableHeaders={['الموظف', 'المبلغ', 'القسط', 'المتبقي', 'الحالة']}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-4">
                  <div><label className="text-xs font-black uppercase">مبلغ السلفة</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} /></div>
                  <div><label className="text-xs font-black uppercase">القسط الشهري</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={data.monthlyInstallment} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} /></div>
                  <div className="col-span-2"><label className="text-xs font-black uppercase">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-bold" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4 font-black">{(i.amount || 0).toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-slate-500">{(i.monthlyInstallment || 0).toLocaleString()}</td>
                <td className="px-6 py-4 font-black text-rose-600">{(i.remainingAmount || 0).toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  {(i.remainingAmount || 0) <= 0 ? (
                    <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 justify-center"><CheckCircle2 size={12}/> مستوفاة</span>
                  ) : (
                    <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-black flex items-center gap-1 justify-center">قيد التسديد</span>
                  )}
                </td>
              </>
            )}
          />
        );
      case 'financials':
        return (
          <GenericModule<FinancialEntry> 
            title="الماليات والإيصالات" 
            lang={db.settings.language} 
            employees={db.employees} 
            items={db.financials} 
            onSave={i => updateList('financials', i)} 
            onDelete={id => deleteFromList('financials', id)} 
            initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0] }} 
            tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'إيصال']}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="text-xs font-black uppercase">نوع المعاملة</label><select className="w-full p-4 border rounded-xl font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">صرف مالي / عهدة</option></select></div>
                  <div><label className="text-xs font-black uppercase">المبلغ</label><input type="number" className="w-full p-3 border rounded-xl font-bold" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                  {/* Fixed missing 'e' and incorrect invocation in onChange handler below */}
                  <div><label className="text-xs font-black uppercase">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-bold" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
                  <div className="col-span-2"><label className="text-xs font-black uppercase">البيان / السبب</label><textarea className="w-full p-3 border rounded-xl font-bold" rows={2} value={data.reason} onChange={e => set({...data, reason: e.target.value})} /></div>
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className={`px-6 py-4 font-bold ${i.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'}`}>{i.type === 'bonus' ? 'مكافأة' : i.type === 'deduction' ? 'خصم' : 'صرف مالي'}</td>
                <td className="px-6 py-4 font-black">{(i.amount || 0).toLocaleString()}</td>
                <td className="px-6 py-4 font-bold text-slate-500">{i.date}</td>
                <td className="px-6 py-4 text-center no-print">
                   <button onClick={() => setShowVoucher(i)} className="bg-indigo-50 text-indigo-700 p-2 rounded-xl hover:bg-indigo-100 transition"><ReceiptText size={20}/></button>
                </td>
              </>
            )}
          />
        );
      case 'reports':
        return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={toggleTheme} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      <div className="pb-20 transition-colors duration-500">
        {renderContent()}
      </div>

      {showVoucher && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6 no-print">
           <div className="bg-white rounded-[2rem] p-12 w-full max-w-2xl text-slate-900 border-4 border-double border-slate-300">
              <div className="flex justify-between items-center border-b-2 pb-6 mb-8">
                 <div><h2 className="text-3xl font-black text-indigo-700">{db.settings.name}</h2><p className="font-bold text-slate-500">سند قبض / صرف مالي</p></div>
                 <div className="text-right"><p className="font-black">رقم السند: {showVoucher.id.substr(0,6).toUpperCase()}</p><p className="font-bold">التاريخ: {showVoucher.date}</p></div>
              </div>
              <div className="space-y-6 text-xl">
                 <p className="flex justify-between border-b pb-2"><span>يصرف للسيد/ة:</span> <span className="font-black">{db.employees.find(e => e.id === showVoucher.employeeId)?.name}</span></p>
                 <p className="flex justify-between border-b pb-2"><span>مبلغ وقدره:</span> <span className="font-black text-2xl">{showVoucher.amount.toLocaleString()} {db.settings.currency}</span></p>
                 <p className="flex justify-between border-b pb-2"><span>وذلك عن:</span> <span className="font-bold">{showVoucher.reason}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-20 mt-16 text-center">
                 <div><p className="font-black underline mb-10 text-xs">توقيع المحاسب</p> <div className="h-1 bg-slate-200"></div></div>
                 <div><p className="font-black underline mb-10 text-xs">توقيع المستلم</p> <div className="h-1 bg-slate-200"></div></div>
              </div>
              <div className="mt-12 flex gap-4 no-print">
                 <button onClick={() => window.print()} className="flex-1 bg-indigo-700 text-white py-4 rounded-xl font-black text-lg">طباعة الإيصال</button>
                 <button onClick={() => setShowVoucher(null)} className="flex-1 bg-slate-100 py-4 rounded-xl font-black">إغلاق</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
