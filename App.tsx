import React, { useState, useEffect, useMemo } from 'react';
import ReactDOM from 'react-dom/client';
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
    currentMonth, currentYear, db.employees, 
    db.attendance.filter(a => !a.isArchived), 
    db.loans.filter(l => !l.isArchived), 
    db.financials.filter(f => !f.isArchived), 
    db.production.filter(p => !p.isArchived), 
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

  const executePrintAction = (content: React.ReactNode) => {
    const printRoot = document.getElementById('print-root');
    if (printRoot) {
      // Use createRoot for React 18 compatibility instead of deprecated ReactDOM.render
      const root = ReactDOM.createRoot(printRoot);
      root.render(<div className="p-8 dir-rtl text-right font-cairo bg-white">{content}</div>);
      window.print();
      // Clean up the root after printing to avoid React internal state issues
      root.unmount();
    }
  };

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  // --- مكونات قوالب الطباعة الفنية ---

  const PrintableHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-center border-b-4 border-indigo-900 pb-4 mb-8">
      <div className="text-right">
        <h1 className="text-3xl font-black text-indigo-700">{db.settings.name}</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">{title}</p>
      </div>
      {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" />}
      <div className="text-left text-[10px] font-black text-slate-300">
        <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>
    </div>
  );

  const PrintableSignatures = () => (
    <div className="grid grid-cols-3 gap-10 mt-20 pt-10 border-t-2 border-slate-100 text-center">
      <div className="space-y-6">
        <p className="text-xs font-black text-slate-400 uppercase">توقيع الموظف</p>
        <div className="border-b-2 border-slate-900 mx-10"></div>
      </div>
      <div className="space-y-6">
        <p className="text-xs font-black text-slate-400 uppercase">قسم الحسابات</p>
        <div className="border-b-2 border-slate-900 mx-10"></div>
      </div>
      <div className="space-y-6">
        <p className="text-xs font-black text-slate-400 uppercase">إدارة المؤسسة / الاعتماد</p>
        <div className="border-b-2 border-slate-900 mx-10"></div>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......' };
    return (
      <div className="bg-white p-10 print-card max-w-4xl mx-auto rounded-[3rem] border border-slate-100 shadow-sm">
        <PrintableHeader title={title} />
        
        <div className="space-y-12">
           <div className="flex justify-between items-center border-b-2 border-slate-50 pb-6">
             <span className="text-xl font-black text-indigo-900">الاسم الكامل للموظف:</span>
             <span className="text-4xl font-black text-slate-900 bg-indigo-50/50 px-8 py-2 rounded-2xl">{emp.name}</span>
           </div>

           <div className="relative border-2 border-dashed border-indigo-200 rounded-[3rem] p-10 bg-white">
              <span className="absolute -top-4 right-12 bg-white px-6 text-[10px] font-black text-indigo-700 uppercase border rounded-full">بيانات الوثيقة المعتمدة</span>
              
              <div className="flex flex-col md:flex-row items-center gap-10">
                 <div className="bg-[#4f46e5] text-white p-10 rounded-[2.5rem] shadow-2xl text-center min-w-[220px]">
                    <p className="text-[10px] opacity-70 mb-2 font-black uppercase tracking-widest">نوع الإجراء</p>
                    <p className="text-4xl font-black">
                       {type === 'leave' ? leaveTypesAr[data.type] : 
                        type === 'financial' ? financialTypesAr[data.type] : 
                        type === 'loan' ? 'سند سلفة' : 
                        type === 'production' ? 'إنتاجية' : 'مستند'}
                    </p>
                    <div className="mt-4 pt-4 border-t border-white/20 font-bold text-lg">
                       {type === 'leave' && (data.isPaid ? 'إجازة مأجورة' : 'بدون راتب')}
                       {type === 'financial' && `${data.amount?.toLocaleString()} ${db.settings.currency}`}
                    </div>
                 </div>

                 <div className="flex-1 space-y-6 text-right">
                    {type === 'leave' && (
                      <div className="space-y-4">
                         <p className="text-2xl font-bold flex justify-between border-r-4 border-indigo-600 pr-4"><span>من تاريخ:</span> <span className="font-black text-indigo-900">{data.startDate}</span></p>
                         <p className="text-2xl font-bold flex justify-between border-r-4 border-indigo-600 pr-4"><span>إلى تاريخ:</span> <span className="font-black text-indigo-900">{data.endDate}</span></p>
                      </div>
                    )}
                    {type === 'loan' && (
                      <div className="space-y-3">
                         <p className="text-2xl font-black text-indigo-900">إجمالي السلفة: {data.amount?.toLocaleString()}</p>
                         <p className="text-xl font-bold">القسط الشهري: {data.monthlyInstallment?.toLocaleString()}</p>
                      </div>
                    )}
                    {type === 'document' && <p className="text-2xl font-bold italic leading-relaxed text-slate-700">{data.notes}</p>}
                 </div>
              </div>
           </div>

           {(data.reason || data.notes) && type !== 'document' && (
              <div className="p-8 bg-slate-50 rounded-[2rem] border-r-8 border-indigo-600 shadow-inner">
                 <p className="text-xs font-black text-indigo-400 mb-2 uppercase tracking-widest">ملاحظات إضافية:</p>
                 <p className="text-xl font-bold leading-relaxed text-slate-800 italic">{data.reason || data.notes}</p>
              </div>
           )}
        </div>

        <PrintableSignatures />
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-6 rounded-[2rem] bg-white relative overflow-hidden">
            <div className="flex justify-between items-center border-b pb-3 mb-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-600">إيصال استلام راتب</p>
                  <h3 className="text-lg font-black">{emp?.name}</h3>
               </div>
               <div className="text-left text-[8px] font-bold text-slate-400">
                  <p>{p.month}/{p.year}</p>
                  <p>ID: {p.id.split('-')[0]}</p>
               </div>
            </div>
            <div className="space-y-2 text-[10px] font-bold">
               <div className="flex justify-between"><span>الراتب الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-indigo-600"><span>بدل مواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600"><span>إضافي + إنتاج + مكافأة:</span> <span>+{(p.overtimePay + p.production + p.bonuses).toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600 border-b pb-2"><span>إجمالي الخصومات والسلف:</span> <span>-{p.deductions.toLocaleString()}</span></div>
               <div className="flex justify-between text-lg font-black text-indigo-900 pt-2">
                 <span>الصافي المستلم:</span> 
                 <span>{p.netSalary.toLocaleString()} {db.settings.currency}</span>
               </div>
            </div>
            <div className="mt-8 flex justify-between text-[8px] opacity-60">
              <span>توقيع الموظف: .................</span>
              <span>{db.settings.name}</span>
            </div>
          </div>
        );
      })}
    </div>
  );

  // --- نهاية قوالب الطباعة ---

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden">
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
               {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 border border-amber-100">تلميح: {db.settings.passwordHint}</div>}
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
      case 'departments': return <Departments departments={db.departments} employees={db.employees} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
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
                <h2 className="text-4xl font-black text-indigo-700 tracking-tighter flex items-center gap-3">مسير الرواتب <span className="text-lg bg-slate-100 px-4 py-1 rounded-full text-slate-500 font-bold">شهر {currentMonth} عام {currentYear}</span></h2>
             </div>
             <div className="flex flex-wrap gap-4">
                <button 
                  onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })}
                  className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-indigo-700 transition"
                >
                  <ReceiptText size={20}/> القسائم (Cards)
                </button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center gap-2 shadow-xl hover:bg-slate-950 transition">
                  <Printer size={20}/> طباعة الكشف
                </button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
             <table className="w-full text-center text-sm">
               <thead className="bg-[#1e1b4b] text-white">
                 <tr>
                   <th className="px-6 py-6 text-right font-black">الموظف</th>
                   <th className="px-3 py-6 font-black border-r border-white/10">الأيام</th>
                   <th className="px-4 py-6 font-black border-r border-white/10">ساعات العمل</th>
                   <th className="px-4 py-6 font-black border-r border-white/10">الأساسي</th>
                   <th className="px-4 py-6 font-black border-r border-white/10">الإضافي</th>
                   <th className="px-4 py-6 font-black border-r border-white/10">مكافآت</th>
                   <th className="px-4 py-6 font-black border-r border-white/10">خصم/سلفة</th>
                   <th className="px-10 py-6 font-black bg-[#0f0e2b] text-white shadow-inner">الصافي</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {currentPayrolls.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-black">
                     <td className="px-6 py-6 text-right font-black text-slate-900 dark:text-white text-lg">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-3 py-6 text-slate-700 dark:text-slate-300">{p.workingDays}</td>
                     <td className="px-4 py-6 text-slate-700 dark:text-slate-300">{p.workingHours} س</td>
                     <td className="px-4 py-6">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-4 py-6 text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                     <td className="px-4 py-6 text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                     <td className="px-4 py-6 text-rose-600">-{p.deductions.toLocaleString()}</td>
                     <td className="px-10 py-6 font-black text-indigo-900 bg-indigo-50/30 text-xl">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
          <div className="flex justify-center pt-8">
             <button className="no-print w-full max-w-4xl bg-[#059669] text-white py-7 rounded-full font-black text-2xl shadow-2xl flex items-center justify-center gap-4"><CheckCircle size={36}/> إغلاق وأرشفة المسير الحالي</button>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
          <div className="bg-white p-6 w-full max-w-5xl shadow-2xl rounded-[3rem] border border-slate-200">
             <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h3 className="font-black text-indigo-700 text-3xl">المعاينة والاعتماد</h3>
                <button onClick={() => setIndividualPrintItem(null)} className="bg-rose-50 text-rose-500 p-2 rounded-full hover:rotate-90 transition-transform"><X size={40}/></button>
             </div>
             
             {/* منطقة عرض المعاينة */}
             <div className="border-4 border-dashed border-slate-100 rounded-[3rem] p-10 bg-white">
                {individualPrintItem.type === 'vouchers' 
                  ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                  : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
             </div>

             <div className="flex gap-6 mt-10">
                <button 
                  onClick={() => executePrintAction(
                    individualPrintItem.type === 'vouchers' 
                    ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                    : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />
                  )}
                  className="flex-1 bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-4 hover:scale-105 transition"
                >
                  <Printer size={36}/> تنفيذ أمر الطباعة الآن
                </button>
                <button onClick={() => setIndividualPrintItem(null)} className="px-12 bg-slate-100 font-black rounded-[2rem] text-xl">إغلاق المعاينة</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;