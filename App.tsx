
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
import { Printer, History, Trash2, FileDown, Calendar, Archive, Building, Briefcase, CheckCircle2, XCircle, DollarSign, ReceiptText, UserCheck, LayoutList, Plus, ArchiveRestore, Info, Monitor, Smartphone, RefreshCw, X, Box, BarChartHorizontal, FileText } from 'lucide-react';

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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">Enterprise Edition</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-50 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 rounded-2xl font-black outline-none dark:bg-slate-800 dark:text-white" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl font-black">دخول</button>
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:text-indigo-700">نسيت كلمة السر؟</button>
              {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm font-bold">تلميح: {db.settings.passwordHint || 'لا يوجد تلميح.'}</div>}
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
                <p className="text-[10px] font-black text-slate-400">REF: {Math.random().toString(36).substr(2, 8).toUpperCase()}</p>
                <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center flex-[2] px-4">
                <h1 className="text-2xl font-black text-indigo-700">{db.settings.name}</h1>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{reportTitle}</p>
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
        return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'leaves':
        return (
          <GenericModule<LeaveRequest> 
            title={leaveArchiveMode ? "أرشيف الإجازات" : "طلبات الإجازات الجارية"} lang={db.settings.language} employees={db.employees} 
            items={db.leaves} archiveMode={leaveArchiveMode} onToggleArchive={() => setLeaveArchiveMode(!leaveArchiveMode)}
            onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})}
            initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
            tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى', 'مدفوعة']}
            renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><label className="text-xs font-black">نوع الإجازة</label><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option></select></div>
                 <div><label className="text-xs font-black">من تاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>
                 <div><label className="text-xs font-black">إلى تاريخ</label><input type="date" className="w-full p-3 border rounded-xl font-black" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>
              </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4 uppercase font-bold">{i.type}</td>
                <td className="px-6 py-4 font-black">{i.status}</td>
                <td className="px-6 py-4">{i.startDate}</td>
                <td className="px-6 py-4">{i.endDate}</td>
                <td className="px-6 py-4 text-center">{i.isPaid ? 'نعم' : 'لا'}</td>
              </>
            )}
          />
        );
      case 'financials':
        return (
          <GenericModule<FinancialEntry> 
            title={financialArchiveMode ? "أرشيف السندات المالية" : "السندات المالية الجارية"} lang={db.settings.language} employees={db.employees} 
            items={db.financials} archiveMode={financialArchiveMode} onToggleArchive={() => setFinancialArchiveMode(!financialArchiveMode)}
            onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onPrintIndividual={(i) => setIndividualPrintItem({title: "سند مالي رسمي", type: 'financial', data: i})}
            initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
            tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'السبب']}
            renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                 <div className="col-span-2"><select className="w-full p-3 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">صرف</option></select></div>
                 <input type="number" className="w-full p-3 border rounded-xl font-black" placeholder="المبلغ" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
                 <input type="date" className="w-full p-3 border rounded-xl font-black" value={data.date} onChange={e => set({...data, date: e.target.value})} />
                 <input className="col-span-2 w-full p-3 border rounded-xl font-black" placeholder="السبب" value={data.reason} onChange={e => set({...data, reason: e.target.value})} />
              </div>
            )}
            renderRow={(i, name) => (
              <>
                <td className="px-6 py-4 font-black">{name}</td>
                <td className="px-6 py-4 font-bold">{i.type}</td>
                <td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td>
                <td className="px-6 py-4">{i.date}</td>
                <td className="px-6 py-4 text-xs font-bold text-slate-500">{i.reason}</td>
              </>
            )}
          />
        );
      case 'loans':
        return (
          <GenericModule<Loan> 
            title={loanArchiveMode ? "أرشيف السلف المحصلة" : "كشف السلف والقروض الجارية"} lang={db.settings.language} employees={db.employees} 
            items={db.loans} archiveMode={loanArchiveMode} onToggleArchive={() => setLoanArchiveMode(!loanArchiveMode)}
            onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onPrintIndividual={(i) => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})}
            initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} 
            tableHeaders={['الموظف', 'البداية', 'المبلغ', 'الأقساط', 'القسط', 'المتبقي']}
            renderForm={(data, set) => (
              <div className="grid grid-cols-2 gap-4">
                 <input type="number" className="w-full p-3 border rounded-xl font-black" placeholder="إجمالي السلفة" value={data.amount} onChange={e => { const v = Number(e.target.value); set({...data, amount: v, remainingAmount: v, monthlyInstallment: Math.round(v / (data.installmentsCount || 1))}); }} />
                 <input type="number" className="w-full p-3 border rounded-xl font-black" placeholder="الأقساط" value={data.installmentsCount} onChange={e => { const v = Math.max(1, Number(e.target.value)); set({...data, installmentsCount: v, monthlyInstallment: Math.round((data.amount || 0) / v)}); }} />
                 <input type="date" className="col-span-2 w-full p-3 border rounded-xl font-black" value={data.date} onChange={e => set({...data, date: e.target.value})} />
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
      case 'production':
        return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={productionArchiveMode} onToggleArchive={() => setProductionArchiveMode(!productionArchiveMode)} onPrintIndividual={(i) => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
      case 'documents':
        return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'payroll':
        if (payrollPrintMode === 'vouchers') {
          const payrollChunks = chunkArray(currentPayrolls, 6);
          return (
            <div className="space-y-4">
              <div className="no-print flex justify-between items-center p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-lg border">
                  <button onClick={() => setPayrollPrintMode('table')} className="bg-slate-950 text-white px-8 py-3 rounded-2xl flex items-center gap-2 font-black"><LayoutList size={20}/> العودة</button>
                  <button onClick={() => setShowPrintChoice(true)} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black shadow-xl"><Printer size={20}/> طباعة القسائم</button>
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
                              <div><h2 className="text-[9px] font-black">{db.settings.name}</h2><p className="text-[6px] font-bold uppercase">Pay Slip</p></div>
                           </div>
                           <p className="text-[6px] font-bold">{currentMonth}/{currentYear}</p>
                        </div>
                        <div className="font-black text-[10px] mb-1">{emp?.name}</div>
                        <div className="space-y-[2px] text-[7px]">
                            <div className="flex justify-between border-b"><span>الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b text-emerald-700 font-bold"><span>الإضافي:</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
                            <div className="flex justify-between border-b text-rose-700 font-bold"><span>سلف/تأخير:</span> <span>-{(p.loanInstallment + p.lateDeduction + p.manualDeductions).toLocaleString()}</span></div>
                            <div className="flex justify-between bg-slate-100 p-1 mt-1 font-black"><span>الصافي:</span> <span>{p.netSalary.toLocaleString()}</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          );
        }
        return (
            <div className="space-y-6">
              {renderPrintHeader(`مسير الرواتب - ${currentMonth}/${currentYear}`)}
              <div className="flex justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border shadow-xl">
                 <h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {cycleText}</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setPayrollPrintMode('vouchers')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={18}/> قسائم (6/ص)</button>
                    <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة الكشف</button>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-hidden">
                 <table className="w-full text-right text-sm">
                   <thead className="bg-indigo-800 text-white font-black text-xs">
                     <tr><th className="px-6 py-5">الموظف</th><th className="text-center">الأيام</th><th className="text-center">الأساسي</th><th className="text-center">الإضافي</th><th className="text-center font-black bg-indigo-950">الصافي</th></tr>
                   </thead>
                   <tbody className="divide-y">
                     {currentPayrolls.map(p => (
                       <tr key={p.id} className="font-bold">
                         <td className="px-6 py-5">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                         <td className="text-center">{p.workingDays}</td>
                         <td className="text-center">{p.baseSalary.toLocaleString()}</td>
                         <td className="text-center text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
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

  const renderIndividualTemplate = () => {
    if (!individualPrintItem) return null;
    const { title, type, data } = individualPrintItem;
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '................', department: '........', position: '........' };

    // القالب الموحد للسند مع محتوى متغير حسب النوع
    return (
      <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
        <div className="bg-white print-constrained-voucher text-slate-900 relative shadow-2xl animate-in zoom-in duration-300">
           <button onClick={() => setIndividualPrintItem(null)} className="absolute -top-10 -left-10 text-white hover:text-rose-400 no-print transition-all"><X size={40}/></button>
           
           {/* ترويسة رسمية جداً */}
           <div className="flex justify-between items-start border-b-4 border-slate-900 pb-8 mb-10">
              <div className="text-right flex-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase">DOC-ID: {data.id?.toUpperCase()}</p>
                 <p className="text-lg font-black">{data.date || data.startDate || new Date().toISOString().split('T')[0]}</p>
              </div>
              <div className="text-center flex-[2]">
                 <h2 className="text-4xl font-black text-indigo-800 mb-2">{db.settings.name}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-[0.4em] border-y-2 border-slate-200 py-2 inline-block px-10">{title}</p>
              </div>
              <div className="flex-1 flex justify-end">
                 {db.settings.logo && <img src={db.settings.logo} className="h-20 w-auto object-contain" />}
              </div>
           </div>

           {/* محتوى السند بناءً على النوع */}
           <div className="py-6 space-y-12">
              <div className="grid grid-cols-2 gap-x-10 gap-y-8">
                 <div className="col-span-2 flex items-baseline border-b border-dashed border-slate-300 pb-2">
                    <span className="text-slate-400 font-black text-lg min-w-[150px]">الاسم الكامل:</span>
                    <span className="text-3xl font-black text-slate-900">{emp.name}</span>
                 </div>
                 <div className="flex items-baseline border-b border-dashed border-slate-300 pb-2">
                    <span className="text-slate-400 font-black text-sm min-w-[100px]">القسم:</span>
                    <span className="text-xl font-black">{emp.department}</span>
                 </div>
                 <div className="flex items-baseline border-b border-dashed border-slate-300 pb-2">
                    <span className="text-slate-400 font-black text-sm min-w-[100px]">التاريخ:</span>
                    <span className="text-xl font-black">{data.date || data.startDate}</span>
                 </div>
              </div>

              {/* تفاصيل القسم الخاصة */}
              <div className="bg-slate-50 p-10 border-2 border-slate-900 min-h-[140px] relative">
                 <span className="absolute -top-4 right-10 bg-white px-4 text-xs font-black text-slate-500 uppercase tracking-widest">بيانات السند التفصيلية</span>
                 
                 {type === 'production' && (
                   <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-slate-400 font-bold text-sm mb-1 uppercase">عدد القطع</p><p className="text-3xl font-black">{data.piecesCount} قطعة</p></div>
                      <div><p className="text-slate-400 font-bold text-sm mb-1 uppercase">سعر القطعة</p><p className="text-3xl font-black">{data.valuePerPiece.toLocaleString()}</p></div>
                      <div className="bg-indigo-800 text-white p-4 rounded"><p className="text-[10px] font-bold mb-1 uppercase opacity-70">الإجمالي</p><p className="text-3xl font-black">{data.totalValue.toLocaleString()}</p></div>
                   </div>
                 )}

                 {type === 'loan' && (
                   <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-slate-400 font-bold text-sm mb-1 uppercase">إجمالي السلفة</p><p className="text-3xl font-black text-indigo-700">{data.amount.toLocaleString()}</p></div>
                      <div><p className="text-slate-400 font-bold text-sm mb-1 uppercase">عدد الأقساط</p><p className="text-3xl font-black">{data.installmentsCount}</p></div>
                      <div className="bg-rose-800 text-white p-4 rounded"><p className="text-[10px] font-bold mb-1 uppercase opacity-70">القسط الشهري</p><p className="text-3xl font-black">{data.monthlyInstallment.toLocaleString()}</p></div>
                   </div>
                 )}

                 {type === 'leave' && (
                   <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-4">
                         <p className="flex justify-between font-bold"><span>من تاريخ:</span> <span>{data.startDate}</span></p>
                         <p className="flex justify-between font-bold"><span>إلى تاريخ:</span> <span>{data.endDate}</span></p>
                      </div>
                      <div className="border-r-2 border-slate-200 pr-6 space-y-4">
                         <p className="flex justify-between font-bold"><span>النوع:</span> <span className="uppercase text-indigo-700">{data.type}</span></p>
                         <p className="flex justify-between font-bold"><span>الاستحقاق:</span> <span>{data.isPaid ? 'مأجورة' : 'بدون أجر'}</span></p>
                      </div>
                   </div>
                 )}

                 {type === 'financial' && (
                   <div className="flex justify-between items-center py-4">
                      <div className="flex-1 text-center border-l border-slate-200"><p className="text-slate-400 font-bold text-xs uppercase mb-1">نوع العملية</p><p className="text-3xl font-black text-indigo-700 uppercase">{data.type}</p></div>
                      <div className="flex-1 text-center"><p className="text-slate-400 font-bold text-xs uppercase mb-1">المبلغ المعتمد</p><p className="text-4xl font-black">{data.amount.toLocaleString()} {db.settings.currency}</p></div>
                   </div>
                 )}

                 {type === 'document' && (
                   <div className="text-right space-y-4 pt-4">
                      <p className="text-2xl font-bold leading-relaxed text-slate-700">{data.notes || "لا توجد ملاحظات إضافية مسجلة في هذا المستند."}</p>
                   </div>
                 )}
              </div>

              {/* الملاحظات العامة لجميع السندات */}
              {(type !== 'document' && (data.reason || data.notes)) && (
                <div className="border-t border-slate-200 pt-4">
                  <span className="text-slate-400 font-black text-xs uppercase block mb-1">البيان والملاحظات:</span>
                  <p className="font-bold text-xl text-slate-800">{data.reason || data.notes}</p>
                </div>
              )}
           </div>

           {/* منطقة التواقيع */}
           <div className="grid grid-cols-3 gap-10 mt-20 pt-10 border-t-2 border-slate-100">
              <div className="text-center">
                 <p className="text-sm font-black text-slate-400 mb-20">توقيع الموظف</p>
                 <div className="border-t-2 border-slate-950 w-full"></div>
              </div>
              <div className="text-center">
                 <p className="text-sm font-black text-slate-400 mb-20">المحاسب / المشرف</p>
                 <div className="border-t-2 border-slate-950 w-full"></div>
              </div>
              <div className="text-center">
                 <p className="text-sm font-black text-slate-400 mb-20">المدير العام</p>
                 <div className="border-t-2 border-slate-950 w-full"></div>
              </div>
           </div>

           <div className="mt-12 text-center text-[10px] font-black text-slate-300 uppercase tracking-widest border-t pt-4">SAM HRMS PRO - Official Corporate Document - {new Date().getFullYear()}</div>
        </div>

        <div className="fixed bottom-10 flex gap-4 no-print">
            <button onClick={() => executePrint('portrait')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition flex items-center gap-3"><Printer size={28}/> تأكيد الطباعة</button>
            <button onClick={() => setIndividualPrintItem(null)} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl border hover:bg-slate-50 transition">إغلاق</button>
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
                 <button onClick={() => executePrint('portrait')} className="p-8 border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300"/><span className="font-black text-sm">طولي</span></button>
                 <button onClick={() => executePrint('landscape')} className="p-8 border-2 border-slate-100 rounded-[2rem] hover:border-indigo-600 hover:bg-indigo-50 transition-all flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300 rotate-90"/><span className="font-black text-sm">عرضي</span></button>
              </div>
           </div>
        </div>
      )}

      {individualPrintItem && renderIndividualTemplate()}
    </Layout>
  );
};

export default App;
