
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
import { Printer, X, ReceiptText, CheckCircle, CalendarDays, User as UserIcon, CheckCircle2 } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document' | 'vouchers';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showForgotHint, setShowForgotHint] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  
  const [archiveModes, setArchiveModes] = useState<Record<string, boolean>>({
    leaves: false,
    financials: false,
    loans: false,
    production: false
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

  // محرك الطباعة الجديد: يعتمد على حاوية الطباعة داخل React
  const handleFinalPrint = () => {
    window.print();
  };

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم إداري', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  // --- مكونات قوالب الطباعة الفنية ---

  const PrintableHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-center border-b-8 border-indigo-900 pb-6 mb-10">
      <div className="text-right">
        <h1 className="text-4xl font-black text-indigo-800">{db.settings.name}</h1>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{title}</p>
      </div>
      {db.settings.logo && <img src={db.settings.logo} className="h-20 w-auto object-contain" />}
      <div className="text-left text-[10px] font-black text-slate-300">
        <p>الرقم المرجعي: {Math.random().toString(36).substr(2, 6).toUpperCase()}</p>
        <p>تاريخ الإصدار: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد' };
    return (
      <div className="bg-white p-12 print-card max-w-5xl mx-auto rounded-[3rem] border border-slate-200">
        <PrintableHeader title={title} />
        
        <div className="space-y-12">
           <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
             <div className="space-y-2 text-right">
                <span className="text-xs font-black text-indigo-400 block uppercase">الاسم الكامل للموظف:</span>
                <span className="text-4xl font-black text-slate-900">{emp.name}</span>
             </div>
             <div className="text-left space-y-2">
                <span className="text-xs font-black text-slate-400 block uppercase">القسم الإداري:</span>
                <span className="text-xl font-bold text-indigo-700">{emp.department}</span>
             </div>
           </div>

           <div className="relative border-4 border-dashed border-indigo-200 rounded-[3rem] p-12 bg-white shadow-inner">
              <span className="absolute -top-5 right-12 bg-indigo-600 px-8 py-2 text-xs font-black text-white uppercase rounded-full shadow-lg">بيانات الوثيقة المعتمدة</span>
              
              <div className="flex flex-col md:flex-row items-center gap-12">
                 <div className="bg-indigo-900 text-white p-14 rounded-[3rem] shadow-2xl text-center min-w-[280px]">
                    <p className="text-[10px] opacity-70 mb-2 font-black uppercase tracking-widest">نوع الإجراء</p>
                    <p className="text-5xl font-black">
                       {type === 'leave' ? leaveTypesAr[data.type] : 
                        type === 'financial' ? financialTypesAr[data.type] : 
                        type === 'loan' ? 'سند سلفة' : 
                        type === 'production' ? 'إنتاجية' : 'مستند إداري'}
                    </p>
                    <div className="mt-8 pt-8 border-t border-white/20 font-bold text-2xl">
                       {data.isPaid === true && 'إجازة مأجورة بالكامل'}
                       {data.isPaid === false && 'إجازة بدون راتب'}
                       {data.amount && `${data.amount.toLocaleString()} ${db.settings.currency}`}
                    </div>
                 </div>

                 <div className="flex-1 space-y-8 text-right">
                    {type === 'leave' && (
                      <div className="space-y-6">
                         <div className="flex justify-between items-center border-r-8 border-indigo-600 pr-6">
                            <span className="text-xl font-bold text-slate-500">من تاريخ:</span>
                            <span className="text-3xl font-black text-indigo-900">{data.startDate}</span>
                         </div>
                         <div className="flex justify-between items-center border-r-8 border-indigo-600 pr-6">
                            <span className="text-xl font-bold text-slate-500">إلى تاريخ:</span>
                            <span className="text-3xl font-black text-indigo-900">{data.endDate}</span>
                         </div>
                      </div>
                    )}
                    {(data.reason || data.notes) && (
                       <div className="p-6 bg-slate-50 rounded-2xl border-2 border-indigo-100 italic text-slate-700 font-bold text-xl leading-relaxed">
                          "{data.reason || data.notes}"
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-3 gap-12 mt-24 text-center border-t pt-12">
           <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase">توقيع الموظف</p><div className="border-b-2 border-slate-900 w-2/3 mx-auto mt-8"></div></div>
           <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase">قسم الحسابات</p><div className="border-b-2 border-slate-900 w-2/3 mx-auto mt-8"></div></div>
           <div className="space-y-4"><p className="text-[10px] font-black text-slate-400 uppercase">اعتماد الإدارة</p><div className="border-b-2 border-slate-900 w-2/3 mx-auto mt-8"></div></div>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-8 rounded-[2rem] bg-white relative">
            <div className="flex justify-between items-start border-b-2 border-indigo-100 pb-4 mb-6">
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">إيصال صرف راتب</p>
                  <h3 className="text-xl font-black text-slate-900">{emp?.name}</h3>
               </div>
               <div className="text-left text-[9px] font-bold text-slate-400">
                  <p>الفترة: {p.month}/{p.year}</p>
                  <p>صافي: {p.netSalary.toLocaleString()}</p>
               </div>
            </div>
            <div className="space-y-2 text-[11px] font-bold">
               <div className="flex justify-between"><span>الراتب الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-indigo-600"><span>بدل المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600"><span>إضافي ساعات:</span> <span>+{p.overtimePay.toLocaleString()} ({ (p.overtimeMinutes / 60).toFixed(1) } س)</span></div>
               <div className="flex justify-between text-rose-600"><span>تأخير ساعات:</span> <span>-{p.lateDeduction.toLocaleString()} ({ (p.lateMinutes / 60).toFixed(1) } س)</span></div>
               <div className="flex justify-between text-rose-600"><span>سداد سلف:</span> <span>-{p.loanInstallment.toLocaleString()}</span></div>
               <div className="flex justify-between text-xl font-black text-indigo-900 pt-4 mt-4 border-t-4 border-indigo-900">
                 <span>المبلغ الصافي:</span> <span>{p.netSalary.toLocaleString()} {db.settings.currency}</span>
               </div>
            </div>
            <div className="mt-8 flex justify-between text-[9px] opacity-60"><span>توقيع الموظف: .................</span> <span>توقيع الحسابات: .................</span></div>
          </div>
        );
      })}
    </div>
  );

  // --- نهاية قوالب الطباعة ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">إدارة الموارد البشرية المتطورة</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            <div className="text-center">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500">نسيت كلمة السر؟</button>
               {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 border border-amber-100 animate-in fade-in slide-in-from-top-2">تلميح المسؤول: {db.settings.passwordHint}</div>}
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
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block">مبلغ السلفة الإجمالي</label>
                   <input type="number" className="w-full p-4 border-2 rounded-2xl font-black" value={data.amount || ''} onChange={e => {
                     const amt = Number(e.target.value);
                     set({...data, amount: amt, remainingAmount: amt, monthlyInstallment: Math.round(amt / (data.installmentsCount || 1))});
                   }} />
                 </div>
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block">عدد الأقساط</label>
                   <input type="number" className="w-full p-4 border-2 rounded-2xl font-black" value={data.installmentsCount || ''} onChange={e => {
                     const inst = Number(e.target.value);
                     set({...data, installmentsCount: inst, monthlyInstallment: Math.round((data.amount || 0) / (inst || 1))});
                   }} />
                 </div>
               </div>
               <div className="bg-indigo-50 border-2 border-dashed border-indigo-200 rounded-3xl p-6 grid grid-cols-2 gap-8 items-center">
                  <div className="text-center">
                    <label className="text-[9pt] font-black text-indigo-700 uppercase mb-1 block">القسط الشهري</label>
                    <p className="text-4xl font-black text-indigo-900">{data.monthlyInstallment || 0}</p>
                  </div>
                  <div className="border-r-2 border-indigo-100 pr-8">
                    <label className="text-[9pt] font-black text-indigo-700 uppercase mb-1 block flex items-center gap-1 justify-center"><CalendarDays size={14}/> تاريخ التحصيل</label>
                    <input type="date" className="w-full p-2 bg-white border rounded-xl font-bold text-center" value={data.collectionDate || ''} onChange={e => set({...data, collectionDate: e.target.value})} />
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
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-6 no-print">
             <div className="text-right flex-1">
                <h2 className="text-4xl font-black text-indigo-700 tracking-tighter flex items-center gap-3">مسير الرواتب المعتمد <span className="text-lg bg-slate-100 px-4 py-1 rounded-full text-slate-500 font-bold">شهر {currentMonth} / {currentYear}</span></h2>
             </div>
             <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition"
                >
                  <ReceiptText size={20}/> القسائم (Cards)
                </button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-slate-950 transition">
                  <Printer size={20}/> طباعة الكشف الكامل
                </button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
             <table className="w-full text-center text-[11px]">
               <thead className="bg-[#1e1b4b] text-white">
                 <tr>
                   <th className="px-4 py-6 text-right font-black sticky right-0 bg-[#1e1b4b]">الموظف</th>
                   <th className="px-2 py-6 font-black border-r border-white/10">الأساسي</th>
                   <th className="px-2 py-6 font-black border-r border-white/10">مواصلات</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 bg-emerald-900/40">ساعات إضافي</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 bg-emerald-900/40 text-emerald-200">قيمة إضافي</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 bg-rose-900/40">ساعات تأخير</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 bg-rose-900/40 text-rose-200">قيمة تأخير</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 text-emerald-300">مكافآت</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 text-rose-400">السلف</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 text-rose-300">خصومات</th>
                   <th className="px-6 py-6 font-black bg-[#0f0e2b] text-white shadow-inner text-sm">صافي الراتب</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {currentPayrolls.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-black">
                     <td className="px-4 py-6 text-right text-slate-900 dark:text-white text-sm sticky right-0 bg-white dark:bg-slate-900 z-10">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-2 py-6">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-2 py-6 text-indigo-500">{p.transport.toLocaleString()}</td>
                     <td className="px-2 py-6 text-emerald-600 bg-emerald-50/20">{ (p.overtimeMinutes / 60).toFixed(1) } س</td>
                     <td className="px-2 py-6 text-emerald-600 bg-emerald-50/20 font-bold">{p.overtimePay.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-500 bg-rose-50/20">{ (p.lateMinutes / 60).toFixed(1) } س</td>
                     <td className="px-2 py-6 text-rose-500 bg-rose-50/20 font-bold">{p.lateDeduction.toLocaleString()}</td>
                     <td className="px-2 py-6 text-emerald-600">+{ (p.bonuses + p.production).toLocaleString() }</td>
                     <td className="px-2 py-6 text-rose-700 font-black">-{p.loanInstallment.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-600">-{p.manualDeductions.toLocaleString()}</td>
                     <td className="px-6 py-6 font-black text-indigo-900 bg-indigo-50/30 text-lg shadow-inner">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="flex justify-center pt-8">
             <button className="no-print w-full max-w-4xl bg-[#059669] text-white py-7 rounded-full font-black text-2xl shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition-transform"><CheckCircle size={36}/> إغلاق وأرشفة المسير الحالي</button>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      
      {/* Container للطباعة والمعاينة - يظهر فقط عند الحاجة */}
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
          <div className="bg-white p-6 w-full max-w-5xl shadow-2xl rounded-[3rem] border border-slate-200">
             <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h3 className="font-black text-indigo-700 text-3xl">المعايـنة والاعـتـماد</h3>
                <button onClick={() => setIndividualPrintItem(null)} className="bg-rose-50 text-rose-500 p-2 rounded-full hover:rotate-90 transition-transform"><X size={40}/></button>
             </div>
             
             {/* منطقة عرض المعاينة الحقيقية */}
             <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-10 bg-white" id="printable-area-preview">
                {individualPrintItem.type === 'vouchers' 
                  ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                  : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
             </div>

             <div className="flex gap-6 mt-10">
                <button 
                  onClick={handleFinalPrint}
                  className="flex-1 bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition"
                >
                  <Printer size={36}/> تنفيذ أمر الطباعة الآن
                </button>
                <button onClick={() => setIndividualPrintItem(null)} className="px-12 bg-slate-100 font-black rounded-[2rem] text-xl">إلغاء المعاينة</button>
             </div>
          </div>
        </div>
      )}

      {/* منطقة الطباعة المخفية التي يراها المتصفح فقط عند استدعاء window.print() */}
      <div id="print-root" className="hidden print:block absolute top-0 left-0 w-full bg-white p-8">
        {individualPrintItem && (
          individualPrintItem.type === 'vouchers' 
            ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
            : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />
        )}
      </div>
    </Layout>
  );
};

export default App;
