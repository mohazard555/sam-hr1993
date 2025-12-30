
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

  const handleFinalPrint = () => {
    window.print();
  };

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم إداري', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

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
      <div className="bg-white p-10 print-card border rounded-2xl">
        <PrintableHeader title={title} />
        <div className="space-y-6 text-right">
           <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl">
             <div><span className="text-[10px] text-slate-400 block uppercase">الموظف:</span><span className="text-xl font-black">{emp.name}</span></div>
             <div><span className="text-[10px] text-slate-400 block uppercase">القسم:</span><span className="font-bold">{emp.department}</span></div>
           </div>
           <div className="p-6 border-2 border-dashed border-indigo-200 rounded-2xl text-center">
              <p className="text-3xl font-black text-indigo-900">
                 {type === 'leave' ? leaveTypesAr[data.type] : 
                  type === 'financial' ? financialTypesAr[data.type] : 
                  type === 'loan' ? 'سند سلفة' : 
                  type === 'production' ? 'إنتاجية' : 'مستند إداري'}
              </p>
              {data.amount && <div className="mt-4 font-bold text-xl">{data.amount.toLocaleString()} {db.settings.currency}</div>}
           </div>
           {data.reason || data.notes && <div className="p-4 bg-slate-50 rounded-xl italic font-bold leading-relaxed">{data.reason || data.notes}</div>}
        </div>
        <div className="grid grid-cols-2 gap-10 mt-12 text-center text-xs font-black opacity-60">
           <div>توقيع المستلم: .................</div>
           <div>اعتماد الإدارة: .................</div>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border p-6 rounded-2xl bg-white">
            <div className="flex justify-between border-b pb-2 mb-4">
               <span className="font-black">{emp?.name}</span>
               <span className="opacity-50 text-[10px]">{p.month}/{p.year}</span>
            </div>
            <div className="space-y-1 text-xs">
               <div className="flex justify-between"><span>الراتب:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-indigo-600"><span>المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600"><span>إضافي:</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600"><span>خصم/سلف:</span> <span>-{(p.lateDeduction + p.loanInstallment + p.manualDeductions).toLocaleString()}</span></div>
               <div className="flex justify-between text-base font-black pt-2 mt-2 border-t-2 border-indigo-900">
                 <span>الصافي:</span> <span>{p.netSalary.toLocaleString()}</span>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden relative">
          <div className="bg-[#4f46e5] p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM HRMS</h1>
            <p className="text-xs font-bold mt-2 opacity-80 uppercase tracking-widest">إدارة الموارد البشرية المتطورة</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-[#4f46e5] text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            <div className="text-center">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500">نسيت كلمة السر؟</button>
               {showForgotHint && <div className="mt-4 p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700">تلميح المسؤول: {db.settings.passwordHint}</div>}
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
          initialData={{ type: 'annual', status: 'pending', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'النوع', 'مأجورة', 'من', 'إلى']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full p-4 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                {Object.entries(leaveTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <div className="flex items-center gap-2 px-4 border rounded-xl font-bold"><input type="checkbox" checked={data.isPaid} onChange={e => set({...data, isPaid: e.target.checked})} /> مأجورة</div>
              <input type="date" className="w-full p-4 border rounded-xl font-bold" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} />
              <input type="date" className="w-full p-4 border rounded-xl font-bold" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{leaveTypesAr[i.type]}</td><td className="px-6 py-4">{i.isPaid ? 'نعم' : 'لا'}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} 
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
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block mr-1">مبلغ السلفة الإجمالي</label>
                   <input type="number" className="w-full p-4 border-2 rounded-2xl font-black outline-none focus:border-indigo-600 transition" value={data.amount || ''} onChange={e => {
                     const amt = Number(e.target.value);
                     set({...data, amount: amt, remainingAmount: amt, monthlyInstallment: Math.round(amt / (data.installmentsCount || 1))});
                   }} />
                 </div>
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block mr-1">عدد الأقساط</label>
                   <input type="number" className="w-full p-4 border-2 rounded-2xl font-black outline-none focus:border-indigo-600 transition" value={data.installmentsCount || ''} onChange={e => {
                     const inst = Number(e.target.value);
                     set({...data, installmentsCount: inst, monthlyInstallment: Math.round((data.amount || 0) / (inst || 1))});
                   }} />
                 </div>
               </div>
               
               <div className="bg-indigo-50/50 border-2 border-dashed border-indigo-200 rounded-[2rem] p-8 grid grid-cols-2 gap-10 items-center">
                  <div className="text-center order-2">
                    <label className="text-[10pt] font-black text-indigo-700 uppercase mb-1 block">القسط الشهري</label>
                    <p className="text-6xl font-black text-indigo-900">{data.monthlyInstallment || 0}</p>
                  </div>
                  <div className="border-l-2 border-indigo-100 pl-8 order-1 text-right">
                    <label className="text-[10pt] font-black text-indigo-700 uppercase mb-2 block flex items-center gap-1 justify-center"><CalendarDays size={18}/> تاريخ التحصيل</label>
                    <input type="date" className="w-full p-3 bg-white border-2 border-indigo-100 rounded-xl font-bold text-center outline-none focus:border-indigo-600 transition" value={data.collectionDate || ''} onChange={e => set({...data, collectionDate: e.target.value})} />
                  </div>
               </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4 text-rose-600 font-black">{i.remainingAmount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'financials': return (
        <GenericModule<FinancialEntry> 
          title="السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} 
          archiveMode={archiveModes.financials} onToggleArchive={() => setArchiveModes(p => ({...p, financials: !p.financials}))} 
          onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} 
          initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
          tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full p-4 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                {Object.entries(financialTypesAr).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <input type="number" placeholder="المبلغ" className="p-4 border rounded-xl font-black" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{financialTypesAr[i.type || 'bonus']}</td><td className="px-6 py-4 font-black">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} />;
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={() => {}} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      case 'payroll': return (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border flex flex-col md:flex-row justify-between items-center gap-4 no-print">
             <h2 className="text-3xl font-black text-indigo-700">مسير الرواتب - شهر {currentMonth} / {currentYear}</h2>
             <div className="flex gap-2">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2"><Printer size={20}/> طباعة المسير</button>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-x-auto">
             <table className="w-full text-center text-[10px]">
               <thead className="bg-[#1e1b4b] text-white">
                 <tr>
                   <th className="px-4 py-6 text-right font-black sticky right-0 bg-[#1e1b4b] z-20">الموظف</th>
                   <th className="px-2 py-6 font-black border-r border-white/10">الأساسي</th>
                   <th className="px-2 py-6 font-black border-r border-white/10">مواصلات</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 bg-emerald-900/40 text-emerald-200">إضافي($)</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 bg-rose-900/40 text-rose-200">خصم($)</th>
                   <th className="px-2 py-6 font-black border-r border-white/10 text-rose-400">سلف</th>
                   <th className="px-4 py-6 font-black bg-[#0f0e2b] text-sm">صافي الراتب</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {currentPayrolls.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-bold text-xs">
                     <td className="px-4 py-6 text-right sticky right-0 bg-white z-10">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-2 py-6">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-2 py-6 text-indigo-500">{p.transport.toLocaleString()}</td>
                     <td className="px-2 py-6 text-emerald-600 bg-emerald-50/20">{p.overtimePay.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-500 bg-rose-50/20">{p.lateDeduction.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-700">-{p.loanInstallment.toLocaleString()}</td>
                     <td className="px-4 py-6 font-black text-indigo-900 bg-indigo-50/30 text-base">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      );
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      
      {/* معاينة الطباعة (ليست بورتال، بل مجرد تراكب) */}
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/95 z-[300] flex items-center justify-center p-6 no-print overflow-y-auto">
          <div className="bg-white p-8 w-full max-w-4xl shadow-2xl rounded-[3rem] border">
             <div className="flex justify-between items-center mb-10 border-b pb-4">
                <h3 className="font-black text-indigo-700 text-3xl">معاينة واعتـماد المسـتند</h3>
                <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition"><X size={40}/></button>
             </div>
             {/* هذا الجزء سيظهر في الطباعة لأننا لم نخفِ id="print-root" */}
             <div id="print-root" className="bg-white">
                {individualPrintItem.type === 'vouchers' 
                  ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                  : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
             </div>
             <div className="flex gap-6 mt-12 no-print">
                <button onClick={handleFinalPrint} className="flex-1 bg-indigo-600 text-white py-6 rounded-3xl font-black text-2xl shadow-xl hover:bg-indigo-700 transition flex items-center justify-center gap-4"><Printer size={32}/> تنفيذ أمر الطباعة الآن</button>
                <button onClick={() => setIndividualPrintItem(null)} className="px-12 bg-slate-100 rounded-3xl font-black text-xl">إلغاء المعاينة</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
