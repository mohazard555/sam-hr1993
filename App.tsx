
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
import { Printer, Search, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText, UserCheck, LayoutList, Plus, ArchiveRestore, HelpCircle, Info, Monitor, Smartphone, RefreshCw, X } from 'lucide-react';
import { exportToExcel } from './utils/export';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintModal, setShowPrintModal] = useState(false);
  
  // Shared States for Archives
  const [showVoucher, setShowVoucher] = useState<FinancialEntry | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers' | 'signatures'>('table');
  const [loanShowArchive, setLoanShowArchive] = useState(false);
  const [leavesArchiveMode, setLeavesArchiveMode] = useState(false);
  const [financialsArchiveMode, setFinancialsArchiveMode] = useState(false);
  const [productionArchiveMode, setProductionArchiveMode] = useState(false);

  useEffect(() => {
    saveDB(db);
    document.body.className = `${db.settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 print-${printOrientation}`;
  }, [db, printOrientation]);

  const t = useTranslation(db.settings.language);
  const isRtl = db.settings.language === 'ar';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) setCurrentUser(user); else alert('خطأ دخول: يرجى التأكد من البيانات');
  };

  const handlePrintRequest = (orientation: 'portrait' | 'landscape') => {
    setPrintOrientation(orientation);
    setShowPrintModal(false);
    setTimeout(() => window.print(), 300);
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
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => id !== i.id) }));
  };

  const chunkArray = (array: any[], size: number) => {
    const result = [];
    for (let i = 0; i < array.length; i += size) { result.push(array.slice(i, i + size)); }
    return result;
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 relative overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800">
          <div className="bg-indigo-600 p-12 text-white text-center rounded-t-[3rem]">
            <h1 className="text-3xl font-black">SAM HRMS PRO</h1>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-100 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black">دخول</button>
            {showForgotHint && <p className="text-center text-xs font-bold text-slate-500 mt-2">{db.settings.passwordHint}</p>}
            <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="w-full text-xs text-indigo-500 font-bold">نسيت كلمة السر؟</button>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    const cycleText = db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري';
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
      
      case 'loans':
        return (
          <GenericModule<Loan> 
            title={loanShowArchive ? 'أرشيف السلف المسددة' : 'السلف والقروض القائمة'}
            lang={db.settings.language} employees={db.employees} 
            items={loanShowArchive ? db.loans.filter(l => l.remainingAmount <= 0) : db.loans.filter(l => l.remainingAmount > 0)}
            onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} 
            initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} 
            tableHeaders={['الموظف', 'البداية', 'المبلغ', 'الأقساط', 'القسط', 'المتبقي']}
            renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><label className="text-xs font-black">إجمالي السلفة</label><input type="number" className="w-full p-3 border rounded-xl font-black" value={data.amount} onChange={e => { const v = Number(e.target.value); set({...data, amount: v, remainingAmount: v, monthlyInstallment: Math.round(v / (data.installmentsCount || 1))}); }} /></div>
                 <div><label className="text-xs font-black">عدد الأقساط</label><input type="number" className="w-full p-3 border rounded-xl font-black" value={data.installmentsCount} onChange={e => { const v = Math.max(1, Number(e.target.value)); set({...data, installmentsCount: v, monthlyInstallment: Math.round((data.amount || 0) / v)}); }} /></div>
                 <div><label className="text-xs font-black">قيمة القسط</label><input type="number" className="w-full p-3 border bg-slate-50 rounded-xl font-black" value={data.monthlyInstallment} readOnly /></div>
                 <div className="col-span-2"><label className="text-xs font-black">تاريخ البدء</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
              </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4">{i.date}</td>
                <td className="px-6 py-4 text-indigo-600 font-black">{i.amount.toLocaleString()}</td>
                <td className="px-6 py-4 text-center">{i.installmentsCount}</td>
                <td className="px-6 py-4 font-bold">{i.monthlyInstallment.toLocaleString()}</td>
                <td className="px-6 py-4 text-rose-600 font-black">{i.remainingAmount.toLocaleString()}</td>
              </>
            )}
          />
        );

      case 'leaves':
        return (
          <GenericModule<LeaveRequest> 
            title="نظام الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} 
            onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} 
            initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
            tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى', 'مدفوعة']}
            renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><label className="text-xs font-black">نوع الإجازة</label><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option><option value="emergency">اضطرارية</option></select></div>
                 <div><label className="text-xs font-black">من تاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>
                 <div><label className="text-xs font-black">إلى تاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>
                 <div className="col-span-2 flex items-center gap-2"><input type="checkbox" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} /><label className="text-xs font-black">إجازة مأجورة</label></div>
              </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4 uppercase font-bold">{i.type}</td>
                <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-[10px] font-black ${i.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{i.status}</span></td>
                <td className="px-6 py-4">{i.startDate}</td>
                <td className="px-6 py-4">{i.endDate}</td>
                <td className="px-6 py-4 text-center">{i.isPaid ? <CheckCircle2 size={16} className="text-emerald-500 inline"/> : <XCircle size={16} className="text-rose-500 inline"/>}</td>
              </>
            )}
          />
        );

      case 'financials':
        return (
          <GenericModule<FinancialEntry> 
            title="الماليات والسندات" lang={db.settings.language} employees={db.employees} items={db.financials} 
            onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} 
            initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
            tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'السبب']}
            renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><label className="text-xs font-black">نوع السند</label><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">عهدة / صرف</option></select></div>
                 <div><label className="text-xs font-black">المبلغ</label><input type="number" className="w-full p-3 border rounded-xl font-black" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                 <div><label className="text-xs font-black">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
                 <div className="col-span-2"><label className="text-xs font-black">ملاحظات / السبب</label><input className="w-full p-3 border rounded-xl font-black" value={data.reason} onChange={e => set({...data, reason: e.target.value})} /></div>
              </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className={`px-6 py-4 font-bold ${i.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'}`}>{i.type}</td>
                <td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td>
                <td className="px-6 py-4">{i.date}</td>
                <td className="px-6 py-4 text-xs font-bold truncate max-w-[150px]">{i.reason}</td>
              </>
            )}
          />
        );

      case 'payroll':
        if (payrollPrintMode === 'table') {
          return (
            <div className="space-y-6">
              <div className="print-only flex justify-between items-center border-b-4 border-black pb-4 mb-8">
                  <div className="flex items-center gap-4">
                     {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" />}
                     <div><h1 className="text-2xl font-black">{db.settings.name}</h1><p className="text-xs font-bold">{db.settings.address}</p></div>
                  </div>
                  <div className="text-right"><h2 className="text-xl font-black">مسير الرواتب - {currentMonth}/{currentYear}</h2></div>
              </div>
              <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
                 <div><h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText}</h3><p className="text-xs font-bold text-slate-500">فترة: {currentMonth} / {currentYear}</p></div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPayrollPrintMode('vouchers')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={18}/> طباعة القسائم</button>
                    <button onClick={() => setPayrollPrintMode('signatures')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><UserCheck size={18}/> كشف التوقيعات</button>
                    <button onClick={() => setShowPrintModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة الجدول</button>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-x-auto">
                 <table className="w-full text-right text-sm">
                   <thead className="bg-indigo-600 text-white font-black">
                     <tr>
                       <th className="px-6 py-5">الموظف</th>
                       <th className="text-center">الأيام</th>
                       <th className="text-center">الأساسي</th>
                       <th className="text-center">الإضافي</th>
                       <th className="text-center">الإنتاج</th>
                       <th className="text-center">مكافآت</th>
                       <th className="text-center">سلفة</th>
                       <th className="text-center">تأخير</th>
                       <th className="text-center font-black bg-indigo-800">الصافي</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y">
                     {currentPayrolls.map(p => (
                       <tr key={p.id} className="font-bold hover:bg-slate-50 transition">
                         <td className="px-6 py-5">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                         <td className="text-center">{p.workingDays}</td>
                         <td className="text-center">{p.baseSalary.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                         <td className="text-center text-indigo-600">+{p.production.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                         <td className="text-center text-orange-600">-{p.loanInstallment.toLocaleString()}</td>
                         <td className="text-center text-rose-600">-{p.lateDeduction.toLocaleString()}</td>
                         <td className="text-center font-black text-indigo-900 bg-indigo-50">{p.netSalary.toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          );
        }

        if (payrollPrintMode === 'vouchers') {
          const payrollChunks = chunkArray(currentPayrolls, 6);
          return (
            <div className="space-y-4">
              <div className="no-print flex justify-between items-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg">
                  <button onClick={() => setPayrollPrintMode('table')} className="bg-slate-950 text-white px-8 py-3 rounded-2xl flex items-center gap-2"><LayoutList size={20}/> العودة للجدول</button>
                  <button onClick={() => setShowPrintModal(true)} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl"><Printer size={20}/> طباعة كافة القسائم</button>
              </div>
              {payrollChunks.map((chunk, pageIdx) => (
                <div key={pageIdx} className="vouchers-grid page-break">
                  {chunk.map((p: any) => {
                    const emp = db.employees.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="voucher-container">
                        <div className="flex justify-between items-center border-b border-black pb-2 mb-2">
                           <div className="flex items-center gap-2">
                              {db.settings.logo && <img src={db.settings.logo} className="h-10 w-auto" />}
                              <div><h2 className="text-[10px] font-black">{db.settings.name}</h2><p className="text-[7px] font-bold">قسيمة راتب {cycleText}</p></div>
                           </div>
                           <div className="text-left text-[7px] font-bold">
                              <p>الفترة: {currentMonth}/{currentYear}</p>
                              <p>تاريخ: {new Date().toLocaleDateString()}</p>
                           </div>
                        </div>
                        <div className="text-[9px] mb-1 font-black flex justify-between uppercase">
                           <span>{emp?.name}</span>
                           <span>ID: {emp?.nationalId}</span>
                        </div>
                        <table className="mb-2">
                           <thead className="bg-slate-50">
                              <tr>
                                 <th className="text-[7px]">مفردات الاستحقاق</th><th className="text-[7px]">(+)</th>
                                 <th className="text-[7px]">مفردات الخصم</th><th className="text-[7px]">(-)</th>
                              </tr>
                           </thead>
                           <tbody className="text-[7px]">
                              <tr>
                                 <td className="text-right">الأساسي + المواصلات</td><td>{(p.baseSalary + p.transport).toLocaleString()}</td>
                                 <td className="text-right">قسط السلفة</td><td>{p.loanInstallment > 0 ? p.loanInstallment.toLocaleString() : '-'}</td>
                              </tr>
                              <tr>
                                 <td className="text-right">الإضافي ({Math.round(p.overtimeMinutes/60)} س)</td><td>{p.overtimePay.toLocaleString()}</td>
                                 <td className="text-right">تأخير ({p.lateMinutes} د)</td><td>{p.lateDeduction > 0 ? p.lateDeduction.toLocaleString() : '-'}</td>
                              </tr>
                              <tr>
                                 <td className="text-right">حوافز الإنتاج</td><td>{p.production.toLocaleString()}</td>
                                 <td className="text-right">خصومات أخرى</td><td>{p.manualDeductions > 0 ? p.manualDeductions.toLocaleString() : '-'}</td>
                              </tr>
                              <tr>
                                 <td className="text-right">المكافآت</td><td>{p.bonuses.toLocaleString()}</td>
                                 <td colSpan={2} className="bg-slate-100 font-black">
                                    <div className="text-[8px] text-indigo-700">الصافي</div>
                                    <div className="text-xs">{p.netSalary.toLocaleString()}</div>
                                 </td>
                              </tr>
                           </tbody>
                        </table>
                        <div className="grid grid-cols-2 gap-4 text-center text-[7px]">
                           <div><p className="mb-2">المحاسب</p><div className="h-px bg-black"></div></div>
                           <div><p className="mb-2">المستلم</p><div className="h-px bg-black"></div></div>
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
            <div className="p-8 bg-white text-black min-h-screen">
              <button onClick={() => setPayrollPrintMode('table')} className="no-print bg-slate-900 text-white px-8 py-3 rounded-2xl mb-8 flex items-center gap-2"><LayoutList size={20}/> العودة</button>
              <div className="flex justify-between items-center border-b-4 border-black pb-4 mb-8">
                <div className="flex items-center gap-4">
                  {db.settings.logo && <img src={db.settings.logo} className="h-20 w-auto" />}
                  <div><h1 className="text-3xl font-black">{db.settings.name}</h1><p className="font-bold">{db.settings.address}</p></div>
                </div>
                <div className="text-right"><h2 className="text-2xl font-black">كشف توقيعات صرف الرواتب</h2><p className="font-bold">شهر {currentMonth} / {currentYear}</p></div>
              </div>
              <table className="w-full border-4 border-black text-center text-lg">
                <thead className="bg-slate-200">
                  <tr><th className="border-2 border-black p-4 w-12">#</th><th className="border-2 border-black p-4">اسم الموظف</th><th className="border-2 border-black p-4">الصافي</th><th className="border-2 border-black p-4 w-1/3">التوقيع</th></tr>
                </thead>
                <tbody>
                  {currentPayrolls.map((p, i) => (
                    <tr key={p.id} className="h-16">
                      <td className="border-2 border-black">{i+1}</td>
                      <td className="border-2 border-black text-right pr-6 font-black">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                      <td className="border-2 border-black font-black">{p.netSalary.toLocaleString()}</td>
                      <td className="border-2 border-black"></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        }
        return null;

      case 'reports':
        return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintModal(true)} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}

      {showPrintModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
           <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-indigo-700">تأكيد الطباعة</h3>
                <button onClick={() => setShowPrintModal(false)}><X size={24}/></button>
              </div>
              <p className="text-sm font-bold text-slate-500 mb-8 text-center">اختر اتجاه الورقة المفضل للطباعة</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => handlePrintRequest('portrait')} className="p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 flex flex-col items-center gap-2">
                    <Monitor size={40} className="text-slate-300"/> <span className="font-black">طولي</span>
                 </button>
                 <button onClick={() => handlePrintRequest('landscape')} className="p-6 border-2 border-slate-100 rounded-3xl hover:border-indigo-600 flex flex-col items-center gap-2">
                    <Monitor size={40} className="text-slate-300 rotate-90"/> <span className="font-black">عرضي</span>
                 </button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
