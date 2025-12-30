
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
import { Employee, PayrollRecord, FinancialEntry, Loan, LeaveRequest, ProductionEntry } from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { Printer, X, ReceiptText, CheckCircle, CalendarDays, Wallet, Zap, Clock, ShieldCheck } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document' | 'vouchers';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  
  const [archiveModes, setArchiveModes] = useState<Record<string, boolean>>({
    leaves: false, financials: false, loans: false, production: false
  });

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentPayrolls = useMemo(() => generateMonthlyPayroll(
    currentMonth, currentYear, db.employees || [], 
    db.attendance?.filter(a => !a.isArchived) || [], 
    db.loans?.filter(l => !l.isArchived) || [], 
    db.financials?.filter(f => !f.isArchived) || [], 
    db.production?.filter(p => !p.isArchived) || [], 
    db.settings
  ), [currentMonth, currentYear, db]);

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const list = (prev[key] || []) as any[];
      const exists = list.find(i => i.id === item.id);
      return { 
        ...prev, 
        [key]: exists ? list.map(i => i.id === item.id ? item : i) : [...list, item] 
      };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => id !== i.id) }));
  };

  const handleFinalPrint = () => {
    window.print();
  };

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم إداري', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  // مكونات قوالب الطباعة المباشرة
  const PrintableHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-center border-b-4 border-indigo-900 pb-4 mb-8">
      <div className="text-right">
        <h1 className="text-2xl font-black text-indigo-800">{db.settings.name}</h1>
        <p className="text-xs font-bold text-slate-500 uppercase">{title}</p>
      </div>
      {db.settings.logo && <img src={db.settings.logo} className="h-12 w-auto object-contain" />}
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد' };
    return (
      <div className="bg-white p-8 print-card">
        <PrintableHeader title={title} />
        <div className="space-y-6">
           <div className="flex justify-between border-b pb-4">
              <div><p className="text-[10px] text-slate-400">الموظف:</p><p className="font-black">{emp.name}</p></div>
              <div className="text-left"><p className="text-[10px] text-slate-400">القسم:</p><p className="font-bold">{emp.department}</p></div>
           </div>
           <div className="p-4 bg-slate-50 rounded-xl border border-indigo-100 text-center">
              <p className="text-xs font-black text-indigo-600 mb-2 uppercase">التفاصيل المعتمدة</p>
              <p className="text-2xl font-black">
                {type === 'leave' ? leaveTypesAr[data.type] : 
                 type === 'financial' ? financialTypesAr[data.type] : 
                 type === 'loan' ? 'سند سلفة' : 
                 type === 'production' ? 'إنتاجية' : 'مستند إداري'}
              </p>
              {data.amount && <p className="text-xl mt-2 font-bold">{data.amount.toLocaleString()} {db.settings.currency}</p>}
           </div>
           <div className="text-sm font-bold leading-relaxed">{data.notes || data.reason}</div>
           {data.startDate && <div className="flex justify-between text-xs font-bold"><span>من: {data.startDate}</span> <span>إلى: {data.endDate}</span></div>}
        </div>
        <div className="mt-16 grid grid-cols-2 gap-10 text-center text-[10px] font-bold opacity-60">
           <div>توقيع الموظف: ......................</div>
           <div>اعتماد الإدارة: ......................</div>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-6 rounded-2xl bg-white text-xs">
            <div className="flex justify-between border-b pb-2 mb-4">
               <span className="font-black">{emp?.name}</span>
               <span className="opacity-50">{p.month}/{p.year}</span>
            </div>
            <div className="space-y-1">
               <div className="flex justify-between"><span>الراتب:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-indigo-600"><span>المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600"><span>إضافي ساعات:</span> <span>+{p.overtimePay.toLocaleString()} ({ (p.overtimeMinutes / 60).toFixed(1) } س)</span></div>
               <div className="flex justify-between text-rose-600"><span>تأخير ساعات:</span> <span>-{p.lateDeduction.toLocaleString()} ({ (p.lateMinutes / 60).toFixed(1) } س)</span></div>
               <div className="flex justify-between text-rose-600 font-bold"><span>سداد سلف:</span> <span>-{p.loanInstallment.toLocaleString()}</span></div>
               <div className="flex justify-between text-lg font-black pt-2 mt-2 border-t border-indigo-900">
                 <span>الصافي:</span> <span>{p.netSalary.toLocaleString()} {db.settings.currency}</span>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // شاشة الدخول
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden">
          <div className="bg-indigo-600 p-10 text-white text-center">
            <ShieldCheck size={48} className="mx-auto mb-4" />
            <h1 className="text-3xl font-black">نظام SAM</h1>
            <p className="text-xs opacity-70 mt-1 uppercase font-bold tracking-widest">Employee Management Pro</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 mr-1 uppercase">اسم المستخدم</label>
              <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none transition" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 mr-1 uppercase">كلمة المرور</label>
              <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none transition" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            </div>
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            <div className="text-center">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500">نسيت بيانات الدخول؟</button>
               {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 border border-amber-100">{db.settings.passwordHint}</div>}
            </div>
          </form>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments': return <Departments departments={db.departments || []} employees={db.employees || []} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance': return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => window.print()} />;
      case 'leaves': return (
        <GenericModule<LeaveRequest> 
          title="طلبات الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} 
          archiveMode={archiveModes.leaves} onToggleArchive={() => setArchiveModes(p => ({...p, leaves: !p.leaves}))} 
          onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})} 
          initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'النوع', 'مأجورة', 'من', 'إلى']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                {Object.entries(leaveTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="flex items-center gap-2 px-4 border rounded-xl"><input type="checkbox" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} /><span className="font-bold">مأجورة</span></div>
              <input type="date" className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} />
              <input type="date" className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{leaveTypesAr[i.type]}</td><td className="px-6 py-4">{i.isPaid ? 'نعم' : 'لا'}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} 
        />
      );
      case 'financials': return (
        <GenericModule<FinancialEntry> 
          title="السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} 
          archiveMode={archiveModes.financials} onToggleArchive={() => setArchiveModes(p => ({...p, financials: !p.financials}))} 
          onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "سند مالي معتمد", type: 'financial', data: i})} 
          initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
          tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                {Object.entries(financialTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="المبلغ" className="p-4 border rounded-xl font-black dark:bg-slate-800" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{financialTypesAr[i.type || 'bonus']}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'loans': return (
        <GenericModule<Loan> 
          title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} 
          archiveMode={archiveModes.loans} onToggleArchive={() => setArchiveModes(p => ({...p, loans: !p.loans}))} 
          onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} 
          onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})} 
          initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0], collectionDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'المبلغ', 'المتبقي', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="space-y-8">
               <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-1">
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block mr-2">مبلغ السلفة الإجمالي</label>
                   <input type="number" className="w-full p-4 border-2 rounded-2xl font-black outline-none focus:border-indigo-600 transition" value={data.amount || ''} onChange={e => {
                     const amt = Number(e.target.value);
                     set({...data, amount: amt, remainingAmount: amt, monthlyInstallment: Math.round(amt / (data.installmentsCount || 1))});
                   }} />
                 </div>
                 <div className="space-y-1">
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block mr-2">عدد الأقساط</label>
                   <input type="number" className="w-full p-4 border-2 rounded-2xl font-black outline-none focus:border-indigo-600 transition" value={data.installmentsCount || ''} onChange={e => {
                     const inst = Number(e.target.value);
                     set({...data, installmentsCount: inst, monthlyInstallment: Math.round((data.amount || 0) / (inst || 1))});
                   }} />
                 </div>
               </div>
               
               <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2.5rem] p-6 grid grid-cols-2 gap-8 items-center">
                  <div className="text-center order-2">
                    <label className="text-[9pt] font-black text-indigo-700 uppercase mb-1 block">القسط الشهري</label>
                    <p className="text-5xl font-black text-indigo-900">{data.monthlyInstallment || 0}</p>
                  </div>
                  <div className="border-l-2 border-indigo-100 pl-8 order-1 text-right">
                    <label className="text-[9pt] font-black text-indigo-700 uppercase mb-1 block flex items-center gap-1 justify-center"><CalendarDays size={14}/> تاريخ التحصيل</label>
                    <input type="date" className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-center outline-none focus:border-indigo-600 transition" value={data.collectionDate || ''} onChange={e => set({...data, collectionDate: e.target.value})} />
                  </div>
               </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4 text-rose-600 font-black">{i.remainingAmount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={() => {}} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      case 'payroll': return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl flex flex-col md:flex-row justify-between items-center gap-4 no-print">
             <h2 className="text-3xl font-black text-indigo-700">مسير الرواتب - شهر {currentMonth} / {currentYear}</h2>
             <div className="flex gap-2">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"><ReceiptText size={20}/> قسائم الرواتب</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2"><Printer size={20}/> طباعة المسير</button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-x-auto">
             <table className="w-full text-center text-[10px]">
               <thead className="bg-[#1e1b4b] text-white">
                 <tr>
                   <th className="px-4 py-5 text-right font-black sticky right-0 bg-[#1e1b4b] z-20">الموظف</th>
                   <th className="px-2 py-5 font-black border-r border-white/10">الأساسي</th>
                   <th className="px-2 py-5 font-black border-r border-white/10">مواصلات</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 bg-emerald-900/40">إضافي (س)</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 bg-emerald-900/40 text-emerald-200">إضافي ($)</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 bg-rose-900/40">تأخير (س)</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 bg-rose-900/40 text-rose-200">خصم تأخير</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 text-emerald-300">مكافآت</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 text-rose-400">سداد سلف</th>
                   <th className="px-2 py-5 font-black border-r border-white/10 text-rose-300">خصومات</th>
                   <th className="px-4 py-5 font-black bg-[#0f0e2b] text-white shadow-inner text-sm">صافي الراتب</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {currentPayrolls.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-bold">
                     <td className="px-4 py-5 text-right text-slate-900 dark:text-white sticky right-0 bg-white dark:bg-slate-900 z-10">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-2 py-5">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-2 py-5 text-indigo-500">{p.transport.toLocaleString()}</td>
                     <td className="px-2 py-5 text-emerald-600 bg-emerald-50/20">{ (p.overtimeMinutes / 60).toFixed(1) } س</td>
                     <td className="px-2 py-5 text-emerald-600 bg-emerald-50/20">{p.overtimePay.toLocaleString()}</td>
                     <td className="px-2 py-5 text-rose-500 bg-rose-50/20">{ (p.lateMinutes / 60).toFixed(1) } س</td>
                     <td className="px-2 py-5 text-rose-500 bg-rose-50/20">{p.lateDeduction.toLocaleString()}</td>
                     <td className="px-2 py-5 text-emerald-600">+{ (p.bonuses + p.production).toLocaleString() }</td>
                     <td className="px-2 py-5 text-rose-700">-{p.loanInstallment.toLocaleString()}</td>
                     <td className="px-2 py-5 text-rose-600">-{p.manualDeductions.toLocaleString()}</td>
                     <td className="px-4 py-5 font-black text-indigo-900 bg-indigo-50/30 text-lg">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="flex justify-center pt-6 no-print">
             <button className="bg-emerald-600 text-white px-10 py-4 rounded-full font-black text-xl shadow-xl hover:scale-105 transition flex items-center gap-3"><CheckCircle size={28}/> اعتماد وإغلاق المسير</button>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      
      {/* معاينة الطباعة قبل التنفيذ */}
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
          <div className="bg-white p-6 w-full max-w-4xl shadow-2xl rounded-3xl border">
             <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="font-black text-indigo-700 text-2xl tracking-tighter">معاينة المستند المطبوع</h3>
                <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500"><X size={32}/></button>
             </div>
             <div className="border p-8 rounded-2xl bg-white shadow-inner" id="print-preview-area">
                {individualPrintItem.type === 'vouchers' 
                  ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                  : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
             </div>
             <div className="flex gap-4 mt-8">
                <button onClick={handleFinalPrint} className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black text-xl flex items-center justify-center gap-2"><Printer size={24}/> تنفيذ الطباعة الآن</button>
                <button onClick={() => setIndividualPrintItem(null)} className="px-10 bg-slate-100 rounded-2xl font-black">إغلاق</button>
             </div>
          </div>
        </div>
      )}

      {/* الحاوية التي يتم طباعتها فعلياً عند استدعاء window.print() */}
      <div id="print-container">
        {individualPrintItem ? (
          individualPrintItem.type === 'vouchers' 
            ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
            : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />
        ) : (
          /* في حالة طباعة الجداول المباشرة من الواجهة */
          <div className="p-8 font-cairo" dir="rtl">
             <h1 className="text-2xl font-black mb-4">{db.settings.name} - تقرير {activeTab === 'payroll' ? 'مسير الرواتب' : 'عام'}</h1>
             <p className="text-xs mb-8 opacity-60">تاريخ: {new Date().toLocaleDateString()}</p>
             <div id="direct-print-content"></div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default App;
