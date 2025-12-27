
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
import { Printer, Search, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText, UserCheck, LayoutList, Plus, ArchiveRestore } from 'lucide-react';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  
  // Shared States
  const [showVoucher, setShowVoucher] = useState<FinancialEntry | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers' | 'signatures'>('table');
  const [loanSearch, setLoanSearch] = useState('');
  const [loanEmpId, setLoanEmpId] = useState('');
  const [loanShowArchive, setLoanShowArchive] = useState(false);

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
    if (user) setCurrentUser(user); else alert('خطأ دخول: يرجى التأكد من البيانات');
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

  // وظيفة إغلاق الشهر والأرشفة
  const archiveCurrentMonth = () => {
    if (window.confirm('هل تريد إغلاق الدورة المالية الحالية وأرشفة الرواتب؟ سيتم نقل السجلات إلى الأرشيف التاريخي.')) {
      setDb(prev => ({
        ...prev,
        payrollHistory: [...prev.payrollHistory, ...currentPayrolls],
        attendance: prev.attendance.filter(a => {
            const d = new Date(a.date);
            return d.getMonth() + 1 !== currentMonth || d.getFullYear() !== currentYear;
        }),
        financials: prev.financials.filter(f => {
            const d = new Date(f.date);
            return d.getMonth() + 1 !== currentMonth || d.getFullYear() !== currentYear;
        })
      }));
      alert('تمت أرشفة الشهر بنجاح وتجهيز النظام للشهر الجديد.');
    }
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) {
      result.push(array.slice(i, i + size));
    }
    return result;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-['Cairo'] relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600 rounded-full blur-[120px]"></div>
           <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600 rounded-full blur-[120px]"></div>
        </div>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col border dark:border-slate-800 animate-in fade-in zoom-in-95 duration-700">
          <div className="bg-gradient-to-br from-indigo-600 to-indigo-900 p-12 text-white text-center">
            <div className="w-24 h-24 bg-white/20 backdrop-blur-2xl rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl border border-white/30">
              <span className="text-6xl font-black">S</span>
            </div>
            <h1 className="text-3xl font-black tracking-widest">SAM HRMS PRO</h1>
            <p className="text-[10px] font-bold opacity-70 mt-2 uppercase">Personnel Management Solution</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">Username</label>
               <input className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-600 dark:border-slate-700 rounded-2xl font-black outline-none transition-all" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            </div>
            <div className="space-y-2">
               <label className="text-[10px] font-black text-slate-500 uppercase px-2 tracking-widest">Password</label>
               <input type="password" className="w-full py-4 px-6 bg-slate-100 dark:bg-slate-800/50 border-2 border-transparent focus:border-indigo-600 dark:border-slate-700 rounded-2xl font-black outline-none transition-all" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg transition-all shadow-xl shadow-indigo-500/30">دخول النظام</button>
            <p className="text-[10px] text-center text-slate-400 font-bold pt-4">© 2025 SAM HRMS - All Rights Reserved</p>
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
        const cycleText = db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري';
        if (payrollPrintMode === 'table') {
          return (
            <div className="space-y-6">
              <div className="print-only print-header">
                  <div><h1 className="text-3xl font-black text-indigo-700">{db.settings.name}</h1><p className="text-sm font-bold">{db.settings.address}</p></div>
                  <div className="text-right"><h2 className="text-2xl font-black">مسير الرواتب {cycleText}</h2><p className="text-sm font-bold">{currentMonth}/{currentYear}</p></div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
                 <div>
                   <h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText}</h3>
                   <p className="text-xs font-bold text-slate-500">فترة: {currentMonth} / {currentYear}</p>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={archiveCurrentMonth} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg hover:bg-amber-700"><ArchiveRestore size={18}/> أرشفة الشهر وإغلاق الدورة</button>
                    <button onClick={() => { setPayrollPrintMode('vouchers'); setTimeout(() => window.print(), 500); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><ReceiptText size={18}/> طباعة الإيصالات (6 بالصفحة)</button>
                    <button onClick={() => { setPayrollPrintMode('signatures'); setTimeout(() => window.print(), 500); }} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg hover:scale-105 transition-transform"><UserCheck size={18}/> كشف توقيعات المحاسب</button>
                    <button className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg" onClick={() => window.print()}><Printer size={18}/> طباعة الجدول</button>
                 </div>
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
                     {currentPayrolls.map(p => {
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
                      <tr><td className="px-6 py-6" colSpan={9}>إجمالي الرواتب الصافية</td><td className="text-center text-xl text-indigo-900">{currentPayrolls.reduce((a,c)=>a+c.netSalary, 0).toLocaleString()} {db.settings.currency}</td></tr>
                   </tfoot>
                 </table>
              </div>
            </div>
          );
        }

        if (payrollPrintMode === 'vouchers') {
          const payrollChunks = chunkArray(currentPayrolls, 6);
          return (
            <div className="space-y-4">
              <button onClick={() => setPayrollPrintMode('table')} className="no-print bg-slate-950 text-white px-8 py-3 rounded-2xl mb-8 flex items-center gap-2 shadow-lg"><LayoutList size={20}/> العودة إلى النظام</button>
              {payrollChunks.map((chunk, pageIdx) => (
                <div key={pageIdx} className="vouchers-grid page-break">
                  {chunk.map((p: any) => {
                    const emp = db.employees.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="voucher-container">
                        <div className="voucher-header">
                           <div className="text-right">
                              <h2 className="text-xs font-black text-indigo-700">{db.settings.name}</h2>
                              <p className="text-[8px] font-bold">قسيمة راتب {cycleText}</p>
                           </div>
                           <div className="text-left text-[8px] font-bold">
                              <p>الفترة: {currentMonth}/{currentYear}</p>
                              <p>{new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-[10px] mb-2 font-black border-b border-slate-200 pb-1">
                           {emp?.name} <span className="font-normal opacity-70 text-[8px]">({emp?.position})</span>
                        </div>
                        <table>
                           <thead>
                              <tr className="bg-slate-50">
                                 <th className="text-[8px]">البند</th>
                                 <th className="text-[8px]">مستحق (+)</th>
                                 <th className="text-[8px]">خصم (-)</th>
                              </tr>
                           </thead>
                           <tbody className="text-[9px]">
                              <tr><td>أساسي + مواصلات</td><td>{(p.baseSalary + p.transport).toLocaleString()}</td><td>-</td></tr>
                              <tr><td>إنتاج + إضافي</td><td>{(p.production + p.overtimePay).toLocaleString()}</td><td>-</td></tr>
                              <tr><td>مكافآت</td><td>{p.bonuses.toLocaleString()}</td><td>-</td></tr>
                              <tr><td>سلفة + خصومات</td><td>-</td><td>{(p.loanInstallment + p.deductions).toLocaleString()}</td></tr>
                              <tr className="bg-slate-100 font-black">
                                 <td className="text-indigo-700">الصافي المستلم</td>
                                 <td colSpan={2} className="text-sm underline">{p.netSalary.toLocaleString()} {db.settings.currency}</td>
                              </tr>
                           </tbody>
                        </table>
                        <div className="grid grid-cols-2 gap-4 mt-2 text-center text-[8px]">
                           <div><p className="mb-4 opacity-70">المحاسب</p><div className="h-px bg-slate-300"></div></div>
                           <div><p className="mb-4 opacity-70">توقيع المستلم</p><div className="h-px bg-slate-300"></div></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        }

        if (payrollPrintMode === 'signatures') {
          return (
            <div className="p-8 font-black bg-white">
               <button onClick={() => setPayrollPrintMode('table')} className="no-print bg-slate-900 text-white px-8 py-3 rounded-2xl mb-10 flex items-center gap-2 shadow-xl"><LayoutList size={20}/> العودة للنظام</button>
               <div className="text-center mb-10 border-b-8 border-indigo-700 pb-8">
                  <h1 className="text-4xl font-black mb-4">{db.settings.name}</h1>
                  <h2 className="text-2xl font-bold uppercase tracking-widest text-slate-700">كشف توقيعات صرف الرواتب {cycleText} - شهر {currentMonth} / {currentYear}</h2>
               </div>
               <table className="w-full text-center border-4 border-black">
                  <thead className="bg-slate-200">
                     <tr className="text-lg">
                        <th className="p-4 border-2 border-black w-12">#</th>
                        <th className="p-4 border-2 border-black">اسم الموظف الرباعي</th>
                        <th className="p-4 border-2 border-black">القسم</th>
                        <th className="p-4 border-2 border-black">صافي المستحق</th>
                        <th className="p-4 border-2 border-black w-1/4">توقيع الاستلام النقدي</th>
                        <th className="p-4 border-2 border-black">ملاحظات</th>
                     </tr>
                  </thead>
                  <tbody>
                     {currentPayrolls.map((p, i) => (
                        <tr key={p.id} className="h-20 text-xl">
                           <td className="border-2 border-black">{i+1}</td>
                           <td className="border-2 border-black text-right pr-6">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                           <td className="border-2 border-black">{db.employees.find(e => e.id === p.employeeId)?.department}</td>
                           <td className="border-2 border-black font-black text-2xl">{p.netSalary.toLocaleString()}</td>
                           <td className="border-2 border-black"></td>
                           <td className="border-2 border-black"></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               <div className="mt-20 flex justify-between px-16 text-xl">
                  <div className="text-center"><p className="mb-16 underline">توقيع المحاسب</p><div className="w-64 h-0.5 bg-black"></div></div>
                  <div className="text-center"><p className="mb-16 underline">توقيع المدير المالي</p><div className="w-64 h-0.5 bg-black"></div></div>
                  <div className="text-center"><p className="mb-16 underline">المصادقة العامة</p><div className="w-64 h-0.5 bg-black"></div></div>
               </div>
            </div>
          );
        }
        return null;

      case 'loans':
        const filteredLoans = (loanShowArchive ? db.loans.filter(l => l.remainingAmount <= 0) : db.loans.filter(l => l.remainingAmount > 0))
          .filter(l => {
             const emp = db.employees.find(e => e.id === l.employeeId);
             const nameMatch = emp?.name.toLowerCase().includes(loanSearch.toLowerCase());
             const empMatch = !loanEmpId || l.employeeId === loanEmpId;
             return nameMatch && empMatch;
          });

        return (
          <GenericModule<Loan> 
            title={loanShowArchive ? 'أرشيف السلف المسددة' : 'إدارة السلف القائمة'}
            lang={db.settings.language} 
            employees={db.employees} 
            items={filteredLoans} 
            onSave={i => updateList('loans', i)} 
            onDelete={id => deleteFromList('loans', id)} 
            initialData={{ amount: 0, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} 
            tableHeaders={['الموظف', 'البداية', 'المبلغ', 'القسط', 'المتبقي', 'التحصيل']}
            renderForm={(data, set) => (
               <div className="grid grid-cols-2 gap-6">
                  <div><label className="text-xs font-black uppercase mb-1 block">مبلغ السلفة</label><input type="number" className="w-full p-4 border rounded-2xl font-black dark:bg-slate-800" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} /></div>
                  <div><label className="text-xs font-black uppercase mb-1 block">القسط الدوري</label><input type="number" className="w-full p-4 border rounded-2xl font-black dark:bg-slate-800" value={data.monthlyInstallment} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} /></div>
                  <div><label className="text-xs font-black uppercase mb-1 block">تاريخ البدء</label><input type="date" className="w-full p-4 border rounded-2xl font-black dark:bg-slate-800" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
                  <div><label className="text-xs font-black uppercase mb-1 block">تاريخ التحصيل النهائي</label><input type="date" className="w-full p-4 border rounded-2xl font-black dark:bg-slate-800" value={data.collectionDate || ''} onChange={e => set({...data, collectionDate: e.target.value})} /></div>
                  <div className="col-span-2 bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl text-center"><p className="text-xs font-black text-indigo-700">المبلغ المتبقي حالياً: <span className="text-xl">{(data.remainingAmount || 0).toLocaleString()}</span></p></div>
               </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4 text-slate-500">{i.date}</td>
                <td className="px-6 py-4 font-black text-indigo-600">{i.amount.toLocaleString()}</td>
                <td className="px-6 py-4 font-bold">{i.monthlyInstallment.toLocaleString()}</td>
                <td className="px-6 py-4 font-black text-rose-600">{i.remainingAmount.toLocaleString()}</td>
                <td className="px-6 py-4 text-emerald-600 font-bold">{i.collectionDate || '-'}</td>
              </>
            )}
          />
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
                  <div className="col-span-2"><label className="text-xs font-black uppercase">النوع</label><select className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option><option value="emergency">اضطرارية</option><option value="marriage">زواج</option><option value="death">وفاة</option></select></div>
                  <div><label className="text-xs font-black uppercase">من تاريخ</label><input type="date" className="w-full p-3 border rounded-xl dark:bg-slate-800" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>
                  <div><label className="text-xs font-black uppercase">إلى تاريخ</label><input type="date" className="w-full p-3 border rounded-xl dark:bg-slate-800" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>
                  <div className="col-span-2 flex items-center gap-3 bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border-2 border-dashed"><input type="checkbox" id="paid" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} className="w-6 h-6" /><label htmlFor="paid" className="font-black text-indigo-700">إجازة مدفوعة الأجر (بدون خصم راتب)</label></div>
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
                  <div className="col-span-2"><label className="text-xs font-black uppercase">نوع المعاملة</label><select className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">صرف مالي / عهدة</option></select></div>
                  <div><label className="text-xs font-black uppercase">المبلغ</label><input type="number" className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                  <div><label className="text-xs font-black uppercase">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
                  <div className="col-span-2"><label className="text-xs font-black uppercase">البيان / السبب</label><textarea className="w-full p-3 border rounded-xl font-bold dark:bg-slate-800" rows={2} value={data.reason} onChange={e => set({...data, reason: e.target.value})} /></div>
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
              <div className="flex justify-between items-center border-b-2 pb-6 mb-8 border-slate-900">
                 <div><h2 className="text-3xl font-black text-indigo-700">{db.settings.name}</h2><p className="font-bold text-slate-500">سند قبض / صرف مالي منفرد</p></div>
                 <div className="text-right"><p className="font-black">رقم السند: {showVoucher.id.substr(0,6).toUpperCase()}</p><p className="font-bold">التاريخ: {showVoucher.date}</p></div>
              </div>
              <div className="space-y-6 text-xl">
                 <p className="flex justify-between border-b pb-2"><span>يصرف للسيد/ة:</span> <span className="font-black">{db.employees.find(e => e.id === showVoucher.employeeId)?.name}</span></p>
                 <p className="flex justify-between border-b pb-2"><span>مبلغ وقدره:</span> <span className="font-black text-2xl">{showVoucher.amount.toLocaleString()} {db.settings.currency}</span></p>
                 <p className="flex justify-between border-b pb-2"><span>وذلك عن:</span> <span className="font-bold">{showVoucher.reason}</span></p>
              </div>
              <div className="grid grid-cols-2 gap-20 mt-16 text-center">
                 <div><p className="font-black underline mb-12 text-xs">توقيع المحاسب</p> <div className="h-0.5 bg-slate-400"></div></div>
                 <div><p className="font-black underline mb-12 text-xs">توقيع المستلم</p> <div className="h-0.5 bg-slate-400"></div></div>
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
