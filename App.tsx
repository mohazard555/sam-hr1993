
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
import { Printer, Search, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText, UserCheck, LayoutList, Plus, ArchiveRestore, HelpCircle, Info, Monitor, Smartphone, RefreshCw, X, Box, BarChartHorizontal } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintChoice, setShowPrintChoice] = useState(false);
  
  // States
  const [showVoucher, setShowVoucher] = useState<FinancialEntry | null>(null);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, data: any} | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers' | 'signatures' | 'history'>('table');
  const [loanArchiveMode, setLoanArchiveMode] = useState(false);
  const [leaveArchiveMode, setLeaveArchiveMode] = useState(false);
  const [financialArchiveMode, setFinancialArchiveMode] = useState(false);
  const [productionArchiveMode, setProductionArchiveMode] = useState(false);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) setCurrentUser(user); else alert('خطأ دخول');
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden">
          <div className="bg-indigo-600 p-12 text-white text-center font-black">
            <h1 className="text-3xl">SAM HRMS PRO</h1>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-100 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-100 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl">دخول النظام</button>
            <div className="text-center">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:underline">نسيت كلمة السر؟</button>
               {showForgotHint && <p className="mt-3 p-4 bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-bold border border-amber-100">تلميح: {db.settings.passwordHint || "لم يتم ضبط تلميح"}</p>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (reportTitle: string) => (
    <div className="print-only mb-6 border-b-2 border-black pb-4">
        <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
                {db.settings.logo && <img src={db.settings.logo} className="print-logo-small" />}
                <div>
                   <h1 className="text-lg font-black">{db.settings.name}</h1>
                   <p className="text-[10px] font-bold">{db.settings.address}</p>
                </div>
            </div>
            <div className="text-center">
                <h2 className="text-xl font-black underline">{reportTitle}</h2>
                <p className="text-[10px] font-bold mt-1">تاريخ التقرير: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-left">
                <p className="text-[10px] font-black">Ref: SAM-HR-AUTO</p>
                <p className="text-[10px] font-bold">{new Date().toLocaleTimeString()}</p>
            </div>
        </div>
    </div>
  );

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
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'production':
        return (
          <div className="space-y-6">
             {renderPrintHeader(productionArchiveMode ? "أرشيف الإنتاج" : "سجل الإنتاج الجاري")}
             <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={productionArchiveMode} onToggleArchive={() => setProductionArchiveMode(!productionArchiveMode)} onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إنتاج", data: i})} />
          </div>
        );
      
      case 'loans':
        const loansTotal = db.loans.reduce((acc, l) => acc + (l.amount || 0), 0);
        const loansRemaining = db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0);
        return (
          <div className="space-y-6">
            {renderPrintHeader("كشف السلف والقروض")}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 no-print mb-6">
               <div className="bg-indigo-600 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between">
                  <div><p className="text-[10px] font-black uppercase opacity-70">إجمالي السلف الممنوحة</p><p className="text-3xl font-black">{loansTotal.toLocaleString()} {db.settings.currency}</p></div>
                  <DollarSign size={40} className="opacity-20"/>
               </div>
               <div className="bg-emerald-600 p-6 rounded-[2rem] text-white shadow-xl flex items-center justify-between">
                  <div><p className="text-[10px] font-black uppercase opacity-70">المتبقي للتحصيل</p><p className="text-3xl font-black">{loansRemaining.toLocaleString()} {db.settings.currency}</p></div>
                  <RefreshCw size={40} className="opacity-20"/>
               </div>
            </div>
            <GenericModule<Loan> 
              title={loanArchiveMode ? "أرشيف السلف" : "السلف والقروض"} lang={db.settings.language} employees={db.employees} 
              items={db.loans} archiveMode={loanArchiveMode} onToggleArchive={() => setLoanArchiveMode(!loanArchiveMode)}
              onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onPrint={() => setShowPrintChoice(true)}
              initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} 
              onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار سلفة مالي", data: i})}
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
                  <td className="px-6 py-4 text-indigo-600 font-black">{(i.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">{i.installmentsCount}</td>
                  <td className="px-6 py-4 font-bold">{(i.monthlyInstallment || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-rose-600 font-black">{(i.remainingAmount || 0).toLocaleString()}</td>
                </>
              )}
            />
          </div>
        );

      case 'leaves':
        return (
          <div className="space-y-6">
            {renderPrintHeader("سجل الإجازات")}
            <GenericModule<LeaveRequest> 
              title={leaveArchiveMode ? "أرشيف الإجازات" : "طلبات الإجازات"} lang={db.settings.language} employees={db.employees} 
              items={db.leaves} archiveMode={leaveArchiveMode} onToggleArchive={() => setLeaveArchiveMode(!leaveArchiveMode)}
              onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onPrint={() => setShowPrintChoice(true)}
              onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إجازة", data: i})}
              initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
              tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى', 'مدفوعة']}
              renderForm={(data, set) => (
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2"><label className="text-xs font-black">نوع الإجازة</label><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option></select></div>
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
          </div>
        );

      case 'financials':
        return (
          <div className="space-y-6">
            {renderPrintHeader("السندات المالية والمكافآت")}
            <GenericModule<FinancialEntry> 
              title={financialArchiveMode ? "أرشيف الماليات" : "السندات المالية"} lang={db.settings.language} employees={db.employees} 
              items={db.financials} archiveMode={financialArchiveMode} onToggleArchive={() => setFinancialArchiveMode(!financialArchiveMode)}
              onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onPrint={() => setShowPrintChoice(true)}
              onPrintIndividual={(i) => setIndividualPrintItem({title: "سند مالي فردي", data: i})}
              initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
              tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'سند']}
              renderForm={(data, set) => (
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2"><label className="text-xs font-black">نوع السند</label><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">صرف</option></select></div>
                   <div><label className="text-xs font-black">المبلغ</label><input type="number" className="w-full p-3 border rounded-xl font-black" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                   <div><label className="text-xs font-black">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
                   <div className="col-span-2"><label className="text-xs font-black">السبب</label><input className="w-full p-3 border rounded-xl font-black" value={data.reason} onChange={e => set({...data, reason: e.target.value})} /></div>
                </div>
              )}
              renderRow={(i, name) => (
                <>
                  <td className="px-6 py-4 font-black">{name}</td>
                  <td className={`px-6 py-4 font-bold ${i.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'}`}>{i.type}</td>
                  <td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">{i.date}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => setShowVoucher(i)} className="p-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition"><ReceiptText size={16}/></button>
                  </td>
                </>
              )}
            />
          </div>
        );

      case 'payroll':
        if (payrollPrintMode === 'table') {
          return (
            <div className="space-y-6">
              {renderPrintHeader(`مسير الرواتب - ${currentMonth}/${currentYear}`)}
              <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
                 <div><h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText}</h3><p className="text-xs font-bold text-slate-500">فترة: {currentMonth} / {currentYear}</p></div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPayrollPrintMode('history')} className="bg-amber-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><History size={18}/> السجلات</button>
                    <button onClick={() => setPayrollPrintMode('vouchers')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={18}/> القسائم</button>
                    <button onClick={() => setPayrollPrintMode('signatures')} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><UserCheck size={18}/> كشف التوقيع</button>
                    <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة</button>
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
                  <button onClick={() => setPayrollPrintMode('table')} className="bg-slate-950 text-white px-8 py-3 rounded-2xl flex items-center gap-2"><LayoutList size={20}/> العودة</button>
                  <button onClick={() => setShowPrintChoice(true)} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl"><Printer size={20}/> طباعة كافة القسائم (6 في صفحة)</button>
              </div>
              {payrollChunks.map((chunk, pageIdx) => (
                <div key={pageIdx} className="vouchers-grid">
                  {chunk.map((p: any) => {
                    const emp = db.employees.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="voucher-card">
                        <div className="flex justify-between items-center border-b border-black pb-2 mb-2">
                           <div className="flex items-center gap-2">
                              {db.settings.logo && <img src={db.settings.logo} className="h-8 w-auto object-contain" />}
                              <div><h2 className="text-[10px] font-black">{db.settings.name}</h2><p className="text-[7px] font-bold">قسيمة راتب</p></div>
                           </div>
                           <div className="text-left text-[7px] font-bold">
                              <p>الفترة: {currentMonth}/{currentYear}</p>
                           </div>
                        </div>
                        <div className="flex justify-between items-center mb-2 px-1">
                           <span className="font-black text-[10px]">{emp?.name}</span>
                           <span className="text-[7px] font-bold uppercase">{emp?.department}</span>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between text-[8px]"><span className="font-bold">الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[8px] text-emerald-600"><span className="font-bold">إضافي:</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[8px] text-indigo-600"><span className="font-bold">إنتاج:</span> <span>+{p.production.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[8px] text-emerald-600"><span className="font-bold">مكافآت:</span> <span>+{p.bonuses.toLocaleString()}</span></div>
                            <div className="border-t border-dashed my-1"></div>
                            <div className="flex justify-between text-[8px] text-rose-600"><span className="font-bold">تأخير:</span> <span>-{p.lateDeduction.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[8px] text-rose-600"><span className="font-bold">سلف:</span> <span>-{p.loanInstallment.toLocaleString()}</span></div>
                            <div className="flex justify-between text-[8px] text-rose-600"><span className="font-bold">خصومات:</span> <span>-{p.manualDeductions.toLocaleString()}</span></div>
                        </div>
                        <div className="bg-slate-100 p-2 mt-2 rounded flex justify-between items-center">
                           <span className="font-black text-[9px]">الصافي:</span>
                           <span className="font-black text-lg">{p.netSalary.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        }
        // ... rest of payroll modes (signatures, history) logic similarly
        return <div className="p-20 text-center font-black">جاري تحميل مسير الرواتب...</div>;

      case 'reports':
        return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'settings':
        return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [ {...p.users[0], ...u}, ...p.users.slice(1) ]}))} onImport={json => setDb(json)} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}

      {showPrintChoice && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 no-print">
           <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-indigo-700">خيارات الطباعة</h3>
                <button onClick={() => setShowPrintChoice(false)}><X size={24}/></button>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-8 text-center uppercase">اختر اتجاه الورقة المفضل</p>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => executePrint('portrait')} className="p-8 border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-3">
                    <Monitor size={48} className="text-slate-300"/> 
                    <span className="font-black text-sm">طولي (Portrait)</span>
                 </button>
                 <button onClick={() => executePrint('landscape')} className="p-8 border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50/30 transition-all flex flex-col items-center gap-3">
                    <Monitor size={48} className="text-slate-300 rotate-90"/> 
                    <span className="font-black text-sm">عرضي (Landscape)</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print">
           <div className="bg-white rounded-[2rem] p-12 w-full max-w-2xl text-slate-900 relative">
              <button onClick={() => setIndividualPrintItem(null)} className="absolute top-6 left-6 text-slate-400 hover:text-rose-600"><X size={28}/></button>
              {renderPrintHeader(individualPrintItem.title)}
              <div className="space-y-6 text-lg py-10">
                 <div className="bg-slate-50 p-6 rounded-3xl border-2 border-dashed">
                    <p className="flex justify-between border-b pb-3 mb-3"><span className="text-slate-500 font-bold">الموظف:</span> <span className="font-black uppercase">{db.employees.find(e => e.id === individualPrintItem.data.employeeId)?.name}</span></p>
                    <p className="flex justify-between border-b pb-3 mb-3"><span className="text-slate-500 font-bold">التاريخ:</span> <span className="font-bold">{individualPrintItem.data.date || individualPrintItem.data.startDate}</span></p>
                    {individualPrintItem.data.amount && <p className="flex justify-between border-b pb-3 mb-3"><span className="text-slate-500 font-bold">المبلغ:</span> <span className="font-black text-indigo-700 text-2xl">{individualPrintItem.data.amount.toLocaleString()} {db.settings.currency}</span></p>}
                    {individualPrintItem.data.reason && <p className="flex justify-between"><span className="text-slate-500 font-bold">البيان:</span> <span className="font-bold">{individualPrintItem.data.reason}</span></p>}
                    {individualPrintItem.data.type && <p className="flex justify-between"><span className="text-slate-500 font-bold">النوع:</span> <span className="font-black uppercase">{individualPrintItem.data.type}</span></p>}
                 </div>
              </div>
              <div className="flex gap-4">
                 <button onClick={() => executePrint('portrait')} className="flex-1 bg-indigo-700 text-white py-4 rounded-2xl font-black shadow-xl">تأكيد الطباعة</button>
                 <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-500">إغلاق</button>
              </div>
           </div>
        </div>
      )}

      {showVoucher && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-6 no-print">
           <div className="bg-white rounded-[2rem] p-12 w-full max-w-2xl text-slate-900 border-4 border-double border-slate-300 relative">
              <button onClick={() => setShowVoucher(null)} className="absolute top-6 left-6 text-slate-400 hover:text-rose-600"><X size={28}/></button>
              <div className="flex justify-between items-center border-b-2 pb-6 mb-8 border-slate-900">
                 <div className="flex items-center gap-4">
                    {db.settings.logo && <img src={db.settings.logo} className="h-10 w-auto object-contain" />}
                    <div><h2 className="text-xl font-black text-indigo-700">{db.settings.name}</h2><p className="font-bold text-slate-500 text-[10px]">سند مالي رسمي</p></div>
                 </div>
                 <div className="text-right">
                    <p className="font-black text-[8px] text-slate-400">REF: {showVoucher.id.substr(0,8).toUpperCase()}</p>
                    <p className="font-bold text-xs">{showVoucher.date}</p>
                 </div>
              </div>
              <div className="space-y-8 text-xl">
                 <p className="flex justify-between border-b border-dashed pb-3"><span className="text-slate-500 font-bold">يصرف للسيد/ة:</span> <span className="font-black">{db.employees.find(e => e.id === showVoucher.employeeId)?.name}</span></p>
                 <p className="flex justify-between border-b border-dashed pb-3"><span className="text-slate-500 font-bold">المبلغ:</span> <span className="font-black text-2xl text-indigo-700">{showVoucher.amount.toLocaleString()} {db.settings.currency}</span></p>
                 <div className="bg-slate-50 p-6 rounded-2xl border-2 border-dashed">
                    <span className="text-xs font-black text-slate-400 uppercase block mb-1">بيان الصرف:</span>
                    <span className="font-bold text-lg text-slate-700">{showVoucher.reason || "لا يوجد ملاحظات"}</span>
                 </div>
              </div>
              <div className="mt-12 flex gap-4 no-print">
                 <button onClick={() => setShowPrintChoice(true)} className="flex-1 bg-indigo-700 text-white py-4 rounded-2xl font-black text-lg">طباعة السند</button>
                 <button onClick={() => setShowVoucher(null)} className="flex-1 bg-slate-100 py-4 rounded-2xl font-black text-slate-600">إغلاق</button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;