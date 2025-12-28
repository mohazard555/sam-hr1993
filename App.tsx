
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">Smart Personnel Management</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Username</label>
              <input className="w-full py-4 px-6 bg-slate-50 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white border-2 border-transparent focus:border-indigo-600 transition" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 mb-1 block uppercase">Password</label>
              <input type="password" className="w-full py-4 px-6 bg-slate-50 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white border-2 border-transparent focus:border-indigo-600 transition" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">دخول النظام</button>
            
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:text-indigo-700 transition">هل نسيت كلمة السر؟</button>
              {showForgotHint && (
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-2xl border-2 border-dashed border-amber-200 text-sm font-bold animate-in fade-in slide-in-from-top-2">
                  تلميح: {db.settings.passwordHint || 'لا يوجد تلميح مسجل.'}
                </div>
              )}
            </div>
          </form>
          <div className="p-6 border-t dark:border-slate-800 text-[10px] text-center text-slate-400 font-bold uppercase tracking-widest">تطوير مهند أحمد +963998171954</div>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (reportTitle: string) => (
    <div className="print-only mb-6 border-b-4 border-slate-900 pb-4">
        <div className="flex justify-between items-start">
            <div className="text-right flex-1">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">REF: SAM-{Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
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
    const cycleText = db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري';
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees':
        return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments':
        return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance':
        return (
          <div className="space-y-6">
            {renderPrintHeader("كشف الحضور والانصراف")}
            <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />
          </div>
        );
      case 'leaves':
        return (
          <div className="space-y-6">
            {renderPrintHeader("سجل الإجازات الرسمي")}
            <GenericModule<LeaveRequest> 
              title={leaveArchiveMode ? "أرشيف الإجازات" : "طلبات الإجازات الجارية"} lang={db.settings.language} employees={db.employees} 
              items={db.leaves} archiveMode={leaveArchiveMode} onToggleArchive={() => setLeaveArchiveMode(!leaveArchiveMode)}
              onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onPrint={() => setShowPrintChoice(true)}
              onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إجازة إداري", data: i})}
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
                  <td className="px-6 py-4 text-center">{i.isPaid ? 'نعم' : 'لا'}</td>
                </>
              )}
            />
          </div>
        );
      case 'financials':
        return (
          <div className="space-y-6">
            {renderPrintHeader("السندات والقيود المالية")}
            <GenericModule<FinancialEntry> 
              title={financialArchiveMode ? "أرشيف السندات المالية" : "السندات المالية الجارية"} lang={db.settings.language} employees={db.employees} 
              items={db.financials} archiveMode={financialArchiveMode} onToggleArchive={() => setFinancialArchiveMode(!financialArchiveMode)}
              onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onPrint={() => setShowPrintChoice(true)}
              onPrintIndividual={(i) => setIndividualPrintItem({title: "سند قبض / صرف مالي", data: i})}
              initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
              tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'التفاصيل']}
              renderForm={(data, set) => (
                <div className="grid grid-cols-2 gap-4">
                   <div className="col-span-2"><label className="text-xs font-black">نوع السند</label><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">صرف</option></select></div>
                   <div><label className="text-xs font-black">المبلغ</label><input type="number" className="w-full p-3 border rounded-xl font-black" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /></div>
                   <div><label className="text-xs font-black">التاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.date} onChange={e => set({...data, date: e.target.value})} /></div>
                   <div className="col-span-2"><label className="text-xs font-black">السبب / البيان</label><input className="w-full p-3 border rounded-xl font-black" value={data.reason} onChange={e => set({...data, reason: e.target.value})} /></div>
                </div>
              )}
              renderRow={(i, name) => (
                <>
                  <td className="px-6 py-4 font-black">{name}</td>
                  <td className={`px-6 py-4 font-bold ${i.type === 'deduction' ? 'text-rose-600' : 'text-emerald-600'}`}>{i.type}</td>
                  <td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">{i.date}</td>
                  <td className="px-6 py-4 text-xs font-bold text-slate-500">{i.reason || '-'}</td>
                </>
              )}
            />
          </div>
        );
      case 'loans':
        return (
          <div className="space-y-6">
            {renderPrintHeader("كشف السلف والقروض الجماعي")}
            <GenericModule<Loan> 
              title={loanArchiveMode ? "أرشيف السلف المحصلة" : "كشف السلف والقروض الجارية"} lang={db.settings.language} employees={db.employees} 
              items={db.loans} archiveMode={loanArchiveMode} onToggleArchive={() => setLoanArchiveMode(!loanArchiveMode)}
              onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onPrint={() => setShowPrintChoice(true)}
              onPrintIndividual={(i) => setIndividualPrintItem({title: "سند سلفة موظف", data: i})}
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
                  <td className="px-6 py-4 text-indigo-600 font-black">{(i.amount || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">{i.installmentsCount}</td>
                  <td className="px-6 py-4 font-bold">{(i.monthlyInstallment || 0).toLocaleString()}</td>
                  <td className="px-6 py-4 text-rose-600 font-black">{(i.remainingAmount || 0).toLocaleString()}</td>
                </>
              )}
            />
          </div>
        );
      case 'production':
        return (
          <div className="space-y-6">
             {renderPrintHeader(productionArchiveMode ? "أرشيف الإنتاج التاريخي" : "سجل الإنتاج والإنتاجية")}
             <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={productionArchiveMode} onToggleArchive={() => setProductionArchiveMode(!productionArchiveMode)} onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إنتاجية", data: i})} />
          </div>
        );
      case 'documents':
        return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem(doc)} />;
      case 'payroll':
        if (payrollPrintMode === 'vouchers') {
          const payrollChunks = chunkArray(currentPayrolls, 6);
          return (
            <div className="space-y-4">
              <div className="no-print flex justify-between items-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border">
                  <button onClick={() => setPayrollPrintMode('table')} className="bg-slate-950 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black"><LayoutList size={20}/> العودة للمسير</button>
                  <button onClick={() => setShowPrintChoice(true)} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl"><Printer size={20}/> طباعة كافة القسائم (6 في صفحة)</button>
              </div>
              {payrollChunks.map((chunk, pageIdx) => (
                <div key={pageIdx} className="vouchers-grid">
                  {chunk.map((p: any) => {
                    const emp = db.employees.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="voucher-card">
                        <div className="flex justify-between items-center border-b border-black pb-1 mb-1">
                           <div className="flex items-center gap-1">
                              {db.settings.logo && <img src={db.settings.logo} className="h-6 w-auto object-contain" />}
                              <div><h2 className="text-[9px] font-black">{db.settings.name}</h2><p className="text-[6px] font-bold">قسيمة راتب معتمدة</p></div>
                           </div>
                           <div className="text-left text-[6px] font-bold">
                              <p>الفترة: {currentMonth}/{currentYear}</p>
                           </div>
                        </div>
                        <div className="flex justify-between items-center mb-1 px-1">
                           <span className="font-black text-[10px]">{emp?.name}</span>
                           <span className="text-[6px] font-bold uppercase text-slate-500">{emp?.department}</span>
                        </div>
                        <div className="space-y-[2px] px-1 text-[7px]">
                            <div className="flex justify-between border-b border-slate-100"><span className="font-bold">الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-slate-100"><span className="font-bold">المواصلات:</span> <span>{p.transport.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-slate-100 text-emerald-700 font-bold"><span className="font-bold">الإضافي ({(p.overtimeMinutes/60).toFixed(1)} س):</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-slate-100 text-indigo-700 font-bold"><span className="font-bold">إنتاج ومكافآت:</span> <span>+{(p.production + p.bonuses).toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-slate-100 text-rose-700 font-bold"><span className="font-bold">التأخير ({p.lateMinutes} د):</span> <span>-{p.lateDeduction.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b border-slate-100 text-rose-700 font-bold"><span className="font-bold">سلف وخصومات:</span> <span>-{(p.loanInstallment + p.manualDeductions).toLocaleString()}</span></div>
                        </div>
                        <div className="bg-slate-100 p-1.5 mt-2 flex justify-between items-center border-t border-black">
                           <span className="font-black text-[8px]">الصافي:</span>
                           <span className="font-black text-xs text-indigo-700">{p.netSalary.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        }
        // Default Payroll Table View
        return (
            <div className="space-y-6">
              {renderPrintHeader(`مسير الرواتب - ${currentMonth}/${currentYear}`)}
              <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl gap-4">
                 <div><h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText}</h3><p className="text-xs font-bold text-slate-500">فترة: {currentMonth} / {currentYear}</p></div>
                 <div className="flex flex-wrap gap-2">
                    <button onClick={() => setPayrollPrintMode('vouchers')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={18}/> القسائم (6 في صفحة)</button>
                    <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة الكشف</button>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-x-auto">
                 <table className="w-full text-right text-sm">
                   <thead className="bg-indigo-800 text-white font-black uppercase text-xs">
                     <tr>
                       <th className="px-6 py-5">الموظف</th>
                       <th className="text-center">الأيام</th>
                       <th className="text-center">الأساسي</th>
                       <th className="text-center">الإضافي</th>
                       <th className="text-center">الإنتاج</th>
                       <th className="text-center">مكافآت</th>
                       <th className="text-center">خصم/سلفة</th>
                       <th className="text-center font-black bg-indigo-950">الصافي</th>
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
                         <td className="text-center text-rose-600">-{p.loanInstallment + p.manualDeductions + p.lateDeduction}</td>
                         <td className="text-center font-black text-indigo-900 bg-indigo-50">{p.netSalary.toLocaleString()}</td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
              </div>
            </div>
          );
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
           <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-indigo-700">توجيه الطباعة</h3>
                <button onClick={() => setShowPrintChoice(false)}><X size={24}/></button>
              </div>
              <p className="text-xs font-bold text-slate-500 mb-8 text-center uppercase tracking-widest">اختر وضع الورقة المناسب للتقرير</p>
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
           <div className="bg-white p-12 w-full max-w-3xl text-slate-900 relative shadow-2xl border-[10px] border-double border-slate-900">
              <button onClick={() => setIndividualPrintItem(null)} className="absolute top-4 left-4 text-slate-400 hover:text-rose-600 transition-all"><X size={32}/></button>
              
              <div className="flex justify-between items-start border-b-8 border-slate-900 pb-8 mb-12">
                 <div className="text-right flex-1">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">ID-REF: {individualPrintItem.data.id?.substr(0,10).toUpperCase()}</p>
                    <p className="text-xl font-black text-slate-800">{individualPrintItem.data.date || individualPrintItem.data.startDate || new Date().toISOString().split('T')[0]}</p>
                 </div>
                 <div className="text-center flex-[2] px-4">
                    <h2 className="text-5xl font-black text-indigo-800 mb-3">{db.settings.name}</h2>
                    <p className="text-base font-bold text-slate-500 uppercase tracking-[0.4em] border-y-2 border-slate-300 py-3 inline-block px-12">{individualPrintItem.title}</p>
                 </div>
                 <div className="flex-1 flex justify-end">
                    {db.settings.logo && <img src={db.settings.logo} className="h-24 w-auto object-contain" />}
                 </div>
              </div>

              <div className="space-y-16 py-8">
                 <div className="flex justify-between items-baseline border-b-4 border-dotted border-slate-400 pb-4">
                    <span className="text-slate-500 font-black text-2xl uppercase tracking-widest">يصرف للسيد/ة:</span>
                    <span className="text-5xl font-black text-slate-900">{db.employees.find(e => e.id === individualPrintItem.data.employeeId)?.name || individualPrintItem.data.employeeName || '................................'}</span>
                 </div>

                 <div className="flex justify-between items-baseline border-b-4 border-dotted border-slate-400 pb-4">
                    <span className="text-slate-500 font-black text-2xl uppercase tracking-widest">المبلغ المستحق:</span>
                    <span className="text-6xl font-black text-indigo-700">
                      {individualPrintItem.data.amount ? `${db.settings.currency} ${individualPrintItem.data.amount.toLocaleString()}` : (individualPrintItem.data.totalValue ? `${db.settings.currency} ${individualPrintItem.data.totalValue.toLocaleString()}` : '................................')}
                    </span>
                 </div>

                 <div className="bg-slate-50 p-12 border-4 border-dashed border-slate-300 min-h-[180px] relative">
                    <span className="absolute -top-5 right-10 bg-white px-5 text-sm font-black text-slate-500 uppercase tracking-[0.3em]">بيان السند والتفاصيل:</span>
                    <p className="font-bold text-slate-800 text-3xl leading-relaxed">
                      {individualPrintItem.data.reason || individualPrintItem.data.notes || individualPrintItem.data.type || "تحريراً في تاريخه، تم قيد هذا المستند رسمياً في سجلات شؤون الموظفين."}
                    </p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-24 mt-24 pt-10 border-t-2 border-slate-100">
                 <div className="text-center">
                    <p className="text-lg font-black text-slate-400 uppercase mb-20 tracking-widest">توقيع الموظف المستلم</p>
                    <div className="border-t-4 border-slate-900 w-64 mx-auto"></div>
                 </div>
                 <div className="text-center">
                    <p className="text-lg font-black text-slate-400 uppercase mb-20 tracking-widest">توقيع المحاسب / الإدارة</p>
                    <div className="border-t-4 border-slate-900 w-64 mx-auto"></div>
                 </div>
              </div>

              <div className="flex gap-4 mt-16 no-print">
                 <button onClick={() => executePrint('portrait')} className="flex-1 bg-indigo-700 text-white py-6 rounded-2xl font-black text-2xl shadow-2xl hover:bg-indigo-800 transition-all flex items-center justify-center gap-4">
                    <Printer size={32}/> طباعة السند الرسمي
                 </button>
                 <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 text-slate-500 py-6 rounded-2xl font-black text-2xl hover:bg-slate-200 transition-all flex items-center justify-center gap-4">
                    <X size={32}/> إغلاق المعاينة
                 </button>
              </div>
           </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
