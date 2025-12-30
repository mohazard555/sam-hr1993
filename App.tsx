
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
import { Printer, X, ReceiptText, CheckCircle, CalendarDays, Wallet, User as UserIcon } from 'lucide-react';

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

  // إضافة كلاس للجسم عند فتح المعاينة للتحكم في الطباعة
  useEffect(() => {
    if (individualPrintItem) {
      document.body.classList.add('is-printing-preview');
    } else {
      document.body.classList.remove('is-printing-preview');
    }
  }, [individualPrintItem]);

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

  const leaveTypesAr: Record<string, string> = {
    'annual': 'سنوية', 'sick': 'مرضية', 'unpaid': 'بلا راتب', 'emergency': 'طارئة', 'marriage': 'زواج', 'death': 'وفاة', 'maternity': 'أمومة', 'hajj': 'حج'
  };

  const financialTypesAr: Record<string, string> = {
    'bonus': 'مكافأة', 'deduction': 'خصم إداري', 'production_incentive': 'حافز إنتاج', 'payment': 'سند صرف'
  };

  // --- ترويسة الطباعة الرسمية ---
  const PrintableHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-center border-b-8 border-indigo-900 pb-6 mb-8">
      <div className="text-right">
        <h1 className="text-3xl font-black text-indigo-800">{db.settings.name}</h1>
        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">{title}</p>
      </div>
      {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" />}
      <div className="text-left text-[9px] font-black text-slate-300">
        <p>تاريخ الصدور: {new Date().toLocaleDateString('ar-EG')}</p>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد' };
    return (
      <div className="bg-white p-12 print-card w-full max-w-4xl mx-auto rounded-[3rem] border border-slate-200">
        <PrintableHeader title={title} />
        <div className="space-y-10">
           <div className="flex justify-between items-center bg-slate-50 p-6 rounded-3xl border border-slate-100">
             <div className="text-right">
                <span className="text-[10px] font-black text-indigo-400 block uppercase mb-1">اسم الموظف:</span>
                <span className="text-3xl font-black text-slate-900">{emp.name}</span>
             </div>
             <div className="text-left">
                <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">القسم:</span>
                <span className="text-lg font-bold text-indigo-700">{emp.department}</span>
             </div>
           </div>

           <div className="border-4 border-dashed border-indigo-200 rounded-[2.5rem] p-10 bg-white relative">
              <span className="absolute -top-4 right-10 bg-indigo-600 px-6 py-1 text-[10px] font-black text-white uppercase rounded-full">بيانات معتمدة</span>
              <div className="flex items-center gap-10">
                 <div className="bg-indigo-900 text-white p-10 rounded-[2rem] shadow-xl text-center min-w-[200px]">
                    <p className="text-[9px] opacity-70 mb-2 font-black uppercase">النوع</p>
                    <p className="text-3xl font-black">
                       {type === 'leave' ? leaveTypesAr[data.type] : 
                        type === 'financial' ? financialTypesAr[data.type] : 
                        type === 'loan' ? 'سند سلفة' : 
                        type === 'production' ? 'إنتاجية' : 'مستند إداري'}
                    </p>
                    {data.amount && <div className="mt-4 pt-4 border-t border-white/20 font-bold text-xl">{data.amount.toLocaleString()} {db.settings.currency}</div>}
                 </div>
                 <div className="flex-1 text-right space-y-4">
                    {data.startDate && <p className="text-xl font-bold">الفترة: من {data.startDate} إلى {data.endDate}</p>}
                    <div className="p-4 bg-slate-50 rounded-xl italic font-bold text-lg text-slate-700 leading-relaxed">
                       {data.reason || data.notes || "لا يوجد ملاحظات إضافية."}
                    </div>
                 </div>
              </div>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-20 mt-20 text-center border-t pt-10 text-[10px] font-black opacity-50">
           <div>توقيع المستلم: .....................</div>
           <div>توقيع الإدارة: .....................</div>
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
            <div className="flex justify-between items-start border-b-2 border-indigo-100 pb-4 mb-4">
               <div className="text-right">
                  <p className="text-[9px] font-black text-indigo-600 uppercase">قسيمة راتب</p>
                  <h3 className="text-lg font-black text-slate-900">{emp?.name}</h3>
               </div>
               <div className="text-left text-[9px] font-bold text-slate-400">
                  <p>{p.month}/{p.year}</p>
               </div>
            </div>
            <div className="space-y-1.5 text-[10px] font-bold">
               <div className="flex justify-between"><span>الراتب الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-indigo-600"><span>بدل المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600"><span>إضافي ساعات:</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600"><span>سداد سلف:</span> <span>-{p.loanInstallment.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600 font-black"><span>خصم تأخير:</span> <span>-{p.lateDeduction.toLocaleString()}</span></div>
               <div className="flex justify-between text-lg font-black text-indigo-900 pt-3 mt-3 border-t-4 border-indigo-900">
                 <span>الصافي:</span> <span>{p.netSalary.toLocaleString()} {db.settings.currency}</span>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  // واجهة الدخول
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-cairo" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM PRO</h1>
            <p className="text-[10px] font-bold mt-2 opacity-80 uppercase tracking-widest">إدارة الموارد البشرية</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            
            <div className="text-center mt-2">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 underline decoration-indigo-200">هل نسيت بيانات الدخول؟</button>
            </div>
            
            {showForgotHint && (
               <div className="p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 mt-2 border border-amber-100 animate-in fade-in slide-in-from-top-2">
                 تلميح المسؤول: {db.settings.passwordHint}
               </div>
            )}
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
            <div className="space-y-10">
               <div className="grid grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block mr-2 text-right">مبلغ السلفة الإجمالي</label>
                   <input type="number" className="w-full p-4 border-2 rounded-[1.5rem] font-black outline-none focus:border-indigo-600 transition" value={data.amount || ''} onChange={e => {
                     const amt = Number(e.target.value);
                     set({...data, amount: amt, remainingAmount: amt, monthlyInstallment: Math.round(amt / (data.installmentsCount || 1))});
                   }} />
                 </div>
                 <div>
                   <label className="text-[10pt] font-black text-slate-400 mb-1 block mr-2 text-right">عدد الأقساط</label>
                   <input type="number" className="w-full p-4 border-2 rounded-[1.5rem] font-black outline-none focus:border-indigo-600 transition" value={data.installmentsCount || ''} onChange={e => {
                     const inst = Number(e.target.value);
                     set({...data, installmentsCount: inst, monthlyInstallment: Math.round((data.amount || 0) / (inst || 1))});
                   }} />
                 </div>
               </div>
               
               <div className="bg-[#f0f4ff] border-4 border-dashed border-indigo-200 rounded-[3rem] p-10 grid grid-cols-2 gap-10 items-center">
                  <div className="text-center order-2">
                    <label className="text-[10pt] font-black text-indigo-700 uppercase mb-1 block">القسط الشهري</label>
                    <p className="text-7xl font-black text-indigo-900">{data.monthlyInstallment || 0}</p>
                  </div>
                  <div className="border-l-2 border-indigo-100 pl-10 order-1 text-right">
                    <label className="text-[10pt] font-black text-indigo-700 uppercase mb-2 block flex items-center gap-1 justify-center"><CalendarDays size={20}/> تاريخ التحصيل</label>
                    <input type="date" className="w-full p-4 bg-white border-2 border-indigo-100 rounded-2xl font-black text-center outline-none focus:border-indigo-600 transition" value={data.collectionDate || ''} onChange={e => set({...data, collectionDate: e.target.value})} />
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
          onPrintIndividual={i => setIndividualPrintItem({title: "سند مالي معتمد", type: 'financial', data: i})} 
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
      case 'production': return <Production employees={db.employees} items={db.production || []} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية", type: 'production', data: i})} />;
      case 'payroll': return (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 flex justify-between items-center no-print">
             <h2 className="text-3xl font-black text-indigo-700">مسير الرواتب - {currentMonth}/{currentYear}</h2>
             <div className="flex gap-3">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2"><Printer size={20}/> طباعة المسير الكامل</button>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border overflow-x-auto">
             <table className="w-full text-center text-[10px]">
               <thead className="bg-[#1e1b4b] text-white font-black">
                 <tr>
                   <th className="px-4 py-6 text-right sticky right-0 bg-[#1e1b4b]">الموظف</th>
                   <th className="px-2 py-6 border-r border-white/10">الأساسي</th>
                   <th className="px-2 py-6 border-r border-white/10">مواصلات</th>
                   <th className="px-2 py-6 bg-emerald-900/40 text-emerald-200">إضافي($)</th>
                   <th className="px-2 py-6 bg-rose-900/40 text-rose-200">تأخير($)</th>
                   <th className="px-2 py-6 text-rose-400">سلف</th>
                   <th className="px-4 py-6 bg-[#0f0e2b] text-sm">صافي الراتب</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100">
                 {currentPayrolls.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-bold text-xs">
                     <td className="px-4 py-6 text-right sticky right-0 bg-white">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-2 py-6">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-2 py-6 text-indigo-500">{p.transport.toLocaleString()}</td>
                     <td className="px-2 py-6 text-emerald-600 bg-emerald-50/20 font-black">{p.overtimePay.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-500 bg-rose-50/20 font-black">{p.lateDeduction.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-700 font-black">-{p.loanInstallment.toLocaleString()}</td>
                     <td className="px-4 py-6 font-black text-indigo-900 bg-indigo-50/30 text-base">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>
      );
      case 'documents': return <PrintForms employees={db.employees} settings={db.settings} onPrint={(doc) => setIndividualPrintItem({...doc, type: 'document'})} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={() => {}} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      default: return null;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderContent()}
      
      {/* المعاينة (Overlay) */}
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 no-print overflow-y-auto">
          <div className="bg-white p-8 w-full max-w-5xl shadow-2xl rounded-[3.5rem] border print-overlay">
             <div className="flex justify-between items-center mb-8 border-b pb-4">
                <h3 className="font-black text-indigo-700 text-3xl">مـعايـنة قـبـل الـطبـاعة</h3>
                <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition"><X size={40}/></button>
             </div>
             
             {/* هذا الجزء سيظهر في الطباعة كما هو */}
             <div id="print-area-target" className="bg-white">
                {individualPrintItem.type === 'vouchers' 
                  ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                  : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
             </div>

             <div className="flex gap-6 mt-10 no-print">
                <button onClick={() => window.print()} className="flex-1 bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-2xl shadow-xl flex items-center justify-center gap-4 hover:scale-105 transition"><Printer size={32}/> تـنـفـيذ الـطـباعـة</button>
                <button onClick={() => setIndividualPrintItem(null)} className="px-12 bg-slate-100 rounded-[2rem] font-black text-xl">إلغاء</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
