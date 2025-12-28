
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
import { Printer, X, Monitor, LayoutList, ReceiptText } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [showPrintChoice, setShowPrintChoice] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  const [payrollPrintMode, setPayrollPrintMode] = useState<'table' | 'vouchers'>('table');

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) setCurrentUser(user); else alert('خطأ في بيانات الدخول');
  };

  const executePrint = (orientation: 'portrait' | 'landscape') => {
    setPrintOrientation(orientation);
    document.body.className = `${db.settings.theme === 'dark' ? 'dark' : ''} bg-slate-50 dark:bg-slate-950 print-${orientation}`;
    setShowPrintChoice(false);
    setTimeout(() => { window.print(); }, 300);
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

  const leaveTypeTranslations: Record<string, string> = {
    'annual': 'سنوية',
    'sick': 'مرضية',
    'unpaid': 'بلا راتب',
    'emergency': 'طارئة',
    'marriage': 'زواج',
    'death': 'وفاة'
  };

  const statusTranslations: Record<string, string> = {
    'pending': 'قيد الانتظار',
    'approved': 'مقبول',
    'rejected': 'مرفوض'
  };

  const financialTypeTranslations: Record<string, string> = {
    'bonus': 'مكافأة',
    'deduction': 'خصم مالي',
    'production_incentive': 'حافز إنتاج',
    'payment': 'سند صرف'
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">Employee Management</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6">
            <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="اسم المستخدم" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black outline-none border-2 border-transparent focus:border-indigo-600 transition" placeholder="كلمة المرور" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول</button>
            <div className="text-center">
              <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 hover:underline transition">هل نسيت كلمة السر؟</button>
              {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-sm font-bold">تلميح: {db.settings.passwordHint || 'تواصل مع الإدارة'}</div>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderPrintHeader = (reportTitle: string) => (
    <div className="print-only mb-6 border-b-4 border-black pb-4">
        <div className="flex justify-between items-center">
            <div className="text-right flex-1">
                <p className="text-[10px] font-black text-slate-400">DOC-ID: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
                <p className="text-sm font-black">{new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center flex-[2]">
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
    switch (activeTab) {
      case 'dashboard': return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments': return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance': return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'leaves': return <GenericModule<LeaveRequest> title="إدارة الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})} initialData={{ type: 'annual', status: 'pending', startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} tableHeaders={['الموظف', 'النوع', 'الحالة', 'من', 'إلى']} renderForm={(data, set) => ( <div className="grid grid-cols-2 gap-4"><select className="w-full p-3 border rounded-xl font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بلا راتب</option><option value="emergency">طارئة</option><option value="marriage">زواج</option><option value="death">وفاة</option></select><input type="date" className="w-full p-3 border rounded-xl font-bold" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div> )} renderRow={(i, name) => ( <><td>{name}</td><td className="font-bold">{leaveTypeTranslations[i.type] || i.type}</td><td><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${i.status === 'approved' ? 'bg-emerald-100 text-emerald-700' : i.status === 'rejected' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>{statusTranslations[i.status] || i.status}</span></td><td>{i.startDate}</td><td>{i.endDate}</td></> )} />;
      case 'financials': return <GenericModule<FinancialEntry> title="الماليات والسندات" lang={db.settings.language} employees={db.employees} items={db.financials} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onPrintIndividual={i => setIndividualPrintItem({title: "سند صرف مالي", type: 'financial', data: i})} initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ', 'التفاصيل']} renderForm={(data, set) => ( <div className="grid grid-cols-2 gap-4"><select className="w-full p-3 border rounded-xl font-bold" value={data.type} onChange={e => set({...data, type: e.target.value as any})}><option value="bonus">مكافأة</option><option value="deduction">خصم</option><option value="payment">سند صرف</option></select><input type="number" className="p-3 border rounded-xl font-bold" placeholder="المبلغ" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} /><input type="text" className="col-span-2 p-3 border rounded-xl font-bold" placeholder="التفاصيل / السبب" value={data.reason} onChange={e => set({...data, reason: e.target.value})} /></div> )} renderRow={(i, name) => ( <><td>{name}</td><td className="font-bold">{financialTypeTranslations[i.type] || i.type}</td><td className="font-black text-indigo-700">{i.amount.toLocaleString()}</td><td>{i.date}</td><td className="text-xs text-slate-500 max-w-[150px] truncate">{i.reason || '-'}</td></> )} />;
      case 'loans': return <GenericModule<Loan> title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} archiveMode={false} onToggleArchive={() => {}} onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة مالية", type: 'loan', data: i})} initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0] }} tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'القسط', 'المتبقي']} renderForm={(data, set) => ( <div className="grid grid-cols-2 gap-4"><input type="number" className="p-3 border rounded-xl font-bold" placeholder="إجمالي المبلغ" value={data.amount} onChange={e => { const v = Number(e.target.value); set({...data, amount: v, remainingAmount: v, monthlyInstallment: Math.round(v/(data.installmentsCount || 1))}); }} /><input type="number" className="p-3 border rounded-xl font-bold" placeholder="عدد الأقساط" value={data.installmentsCount} onChange={e => { const v = Number(e.target.value); set({...data, installmentsCount: v, monthlyInstallment: Math.round((data.amount || 0)/v)}); }} /></div> )} renderRow={(i, name) => ( <><td>{name}</td><td className="font-black text-indigo-700">{i.amount.toLocaleString()}</td><td className="text-center font-bold">{i.installmentsCount}</td><td>{i.monthlyInstallment.toLocaleString()}</td><td className="font-black text-rose-600">{i.remainingAmount.toLocaleString()}</td></> )} />;
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={false} onToggleArchive={() => {}} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={doc => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'payroll':
        if (payrollPrintMode === 'vouchers') {
          const chunks = chunkArray(currentPayrolls, 6);
          return (
            <div className="space-y-4">
              <div className="no-print flex justify-between p-6 bg-white dark:bg-slate-900 rounded-2xl shadow border">
                  <button onClick={() => setPayrollPrintMode('table')} className="bg-slate-900 text-white px-8 py-3 rounded-xl font-black"><LayoutList size={20}/> العودة</button>
                  <button onClick={() => setShowPrintChoice(true)} className="bg-indigo-600 text-white px-10 py-3 rounded-xl font-black shadow-lg flex items-center gap-2"><Printer size={20}/> طباعة كافة القسائم (6/ص)</button>
              </div>
              {chunks.map((chunk, idx) => (
                <div key={idx} className="vouchers-grid">
                  {chunk.map(p => {
                    const emp = db.employees.find(e => e.id === p.employeeId);
                    return (
                      <div key={p.id} className="voucher-card flex flex-col justify-between h-full bg-white p-3 border border-black rounded-lg">
                        <div>
                           <div className="flex justify-between border-b border-black mb-1 pb-1">
                              <span className="font-black text-[9px]">{db.settings.name}</span>
                              <span className="text-[7px]">{currentMonth}/{currentYear}</span>
                           </div>
                           <div className="font-black text-[11px] mb-2">{emp?.name}</div>
                           <div className="space-y-0.5 text-[8px]">
                               <div className="flex justify-between border-b border-slate-200"><span>الأساسي:</span> <span className="font-bold">{p.baseSalary.toLocaleString()}</span></div>
                               <div className="flex justify-between border-b border-slate-200"><span>المواصلات:</span> <span className="font-bold">{p.transport.toLocaleString()}</span></div>
                               <div className="flex justify-between border-b border-slate-200 text-emerald-600"><span>الإضافي:</span> <span className="font-bold">+{p.overtimePay.toLocaleString()}</span></div>
                               <div className="flex justify-between border-b border-slate-200 text-rose-600"><span>خصومات:</span> <span className="font-bold">-{(p.loanInstallment + p.manualDeductions + p.lateDeduction).toLocaleString()}</span></div>
                               <div className="flex justify-between font-black text-indigo-700 bg-slate-100 p-1 mt-1"><span>الصافي المستلم:</span> <span>{p.netSalary.toLocaleString()}</span></div>
                           </div>
                        </div>
                        <div className="mt-3 border-t border-black pt-1 flex justify-between items-center px-1">
                           <span className="text-[6px] font-black uppercase">توقيع المستلم</span>
                           <div className="w-12 border-b border-dotted border-black"></div>
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
                 <h3 className="text-2xl font-black text-indigo-700">مسير الرواتب {db.settings.salaryCycle === 'weekly' ? 'الأسبوعي' : 'الشهري'}</h3>
                 <div className="flex gap-2">
                    <button onClick={() => setPayrollPrintMode('vouchers')} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={18}/> القسائم</button>
                    <button onClick={() => setShowPrintChoice(true)} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg"><Printer size={18}/> طباعة الكشف</button>
                 </div>
              </div>
              <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-x-auto">
                 <table className="w-full text-right text-sm">
                   <thead className="bg-indigo-800 text-white font-black text-xs">
                     <tr>
                       <th className="px-6 py-5">الموظف</th>
                       <th className="text-center">الأيام</th>
                       <th className="text-center">الأساسي</th>
                       <th className="text-center">المواصلات</th>
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
                         <td className="text-center text-indigo-600">{p.transport.toLocaleString()}</td>
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
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => setShowPrintChoice(true)} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} />;
      default: return null;
    }
  };

  const renderIndividualPrintTemplate = () => {
    if (!individualPrintItem) return null;
    const { title, type, data } = individualPrintItem;
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '........', department: '........', position: '........' };

    return (
      <div className="fixed inset-0 bg-slate-950/90 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
        <div className="bg-white print-constrained-voucher text-slate-900 relative shadow-2xl animate-in zoom-in duration-300">
           <button onClick={() => setIndividualPrintItem(null)} className="absolute -top-10 -left-10 text-white hover:text-rose-400 no-print transition-all"><X size={40}/></button>
           
           <div className="flex justify-between items-start border-b-4 border-black pb-8 mb-10">
              <div className="text-right flex-1">
                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Doc Reference: {data.id?.toUpperCase()}</p>
                 <p className="text-lg font-black">{data.date || data.startDate || new Date().toLocaleDateString()}</p>
              </div>
              <div className="text-center flex-[2]">
                 <h2 className="text-4xl font-black text-indigo-800 mb-2">{db.settings.name}</h2>
                 <p className="text-sm font-bold text-slate-500 uppercase tracking-widest border-y-2 border-slate-200 py-2 inline-block px-10">{title}</p>
              </div>
              <div className="flex-1 flex justify-end">
                 {db.settings.logo && <img src={db.settings.logo} className="h-24 w-auto object-contain" />}
              </div>
           </div>

           <div className="py-6 space-y-12">
              <div className="flex justify-between items-baseline border-b-2 border-dotted border-slate-300 pb-2">
                 <span className="text-slate-500 font-black text-xl uppercase">اسم الموظف المعني:</span>
                 <span className="text-3xl font-black">{emp.name}</span>
              </div>

              <div className="bg-slate-50 p-10 border-2 border-black min-h-[140px] relative">
                 <span className="absolute -top-4 right-10 bg-white px-4 text-[10px] font-black text-slate-500 uppercase">البيانات المالية والتفصيلية للسند</span>
                 
                 {type === 'production' && (
                   <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">عدد القطع</p><p className="text-3xl font-black">{data.piecesCount}</p></div>
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">سعر القطعة</p><p className="text-3xl font-black">{data.valuePerPiece?.toLocaleString()}</p></div>
                      <div className="bg-indigo-800 text-white p-4"><p className="text-[10px] opacity-70 mb-1 uppercase">الإجمالي المستحق</p><p className="text-3xl font-black">{data.totalValue?.toLocaleString()}</p></div>
                   </div>
                 )}

                 {type === 'loan' && (
                   <div className="grid grid-cols-3 gap-6 text-center">
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">إجمالي السلفة</p><p className="text-3xl font-black text-indigo-700">{data.amount?.toLocaleString()}</p></div>
                      <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">عدد الأقساط</p><p className="text-3xl font-black">{data.installmentsCount}</p></div>
                      <div className="bg-rose-800 text-white p-4"><p className="text-[10px] opacity-70 mb-1 uppercase">قيمة القسط الشهري</p><p className="text-3xl font-black">{data.monthlyInstallment?.toLocaleString()}</p></div>
                   </div>
                 )}

                 {type === 'leave' && (
                   <div className="grid grid-cols-2 gap-6 items-center">
                      <div className="space-y-4">
                         <p className="flex justify-between font-bold text-xl uppercase"><span>من تاريخ:</span> <span className="text-indigo-700">{data.startDate}</span></p>
                         <p className="flex justify-between font-bold text-xl uppercase"><span>إلى تاريخ:</span> <span className="text-indigo-700">{data.endDate}</span></p>
                      </div>
                      <div className="text-center border-r-2 border-slate-200">
                         <p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">نوع الإجازة المعتمدة</p>
                         <p className="text-3xl font-black text-indigo-700 uppercase">{leaveTypeTranslations[data.type] || data.type}</p>
                      </div>
                   </div>
                 )}

                 {type === 'financial' && (
                   <div className="flex justify-between items-center py-6">
                      <div className="flex-1 text-center border-l border-slate-200">
                         <p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">نوع الحركة المالية</p>
                         <p className="text-3xl font-black text-indigo-700 uppercase">{financialTypeTranslations[data.type] || data.type}</p>
                      </div>
                      <div className="flex-1 text-center">
                         <p className="text-slate-400 font-bold mb-1 uppercase text-[10px]">المبلغ المعتمد</p>
                         <p className="text-5xl font-black">{data.amount?.toLocaleString()} <span className="text-xl">{db.settings.currency}</span></p>
                      </div>
                   </div>
                 )}

                 {type === 'document' && (
                   <div className="pt-4">
                      <p className="text-2xl font-bold leading-relaxed whitespace-pre-line text-slate-700">{data.notes}</p>
                   </div>
                 )}
              </div>

              {(type !== 'document' && (data.reason || data.notes)) && (
                <div className="border-t border-slate-200 pt-4">
                  <span className="text-slate-400 font-black text-[10px] block mb-2 uppercase tracking-widest">البيان والملاحظات الإدارية:</span>
                  <p className="font-bold text-xl text-slate-800 leading-relaxed">{data.reason || data.notes}</p>
                </div>
              )}
           </div>

           <div className="grid grid-cols-3 gap-10 mt-20 pt-10 border-t-2 border-slate-100">
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 mb-16 uppercase tracking-widest">توقيع الموظف المستلم</p>
                 <div className="border-t-2 border-black w-full"></div>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 mb-16 uppercase tracking-widest">قسم المحاسبة والتدقيق</p>
                 <div className="border-t-2 border-black w-full"></div>
              </div>
              <div className="text-center">
                 <p className="text-[10px] font-black text-slate-400 mb-16 uppercase tracking-widest">اعتماد الإدارة العامة</p>
                 <div className="border-t-2 border-black w-full"></div>
              </div>
           </div>
        </div>

        <div className="fixed bottom-10 flex gap-4 no-print">
            <button onClick={() => executePrint('portrait')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-black text-xl shadow-2xl hover:scale-105 transition flex items-center gap-3"><Printer size={28}/> أمر الطباعة</button>
            <button onClick={() => setIndividualPrintItem(null)} className="bg-white text-slate-900 px-10 py-5 rounded-2xl font-black text-xl shadow-2xl border">إلغاء المعاينة</button>
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
              <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black text-indigo-700 uppercase">توجيه الطباعة</h3><button onClick={() => setShowPrintChoice(false)}><X size={24}/></button></div>
              <div className="grid grid-cols-2 gap-4">
                 <button onClick={() => executePrint('portrait')} className="p-8 border-2 rounded-[2rem] hover:bg-indigo-50 transition-all flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300"/><span className="font-black text-sm uppercase">وضع طولي (Portrait)</span></button>
                 <button onClick={() => executePrint('landscape')} className="p-8 border-2 rounded-[2rem] hover:bg-indigo-50 transition-all flex flex-col items-center gap-3"><Monitor size={48} className="text-slate-300 rotate-90"/><span className="font-black text-sm uppercase">وضع عرضي (Landscape)</span></button>
              </div>
           </div>
        </div>
      )}

      {individualPrintItem && renderIndividualPrintTemplate()}
    </Layout>
  );
};

export default App;
