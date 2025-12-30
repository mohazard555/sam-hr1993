
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
import { Printer, X, ReceiptText, CalendarDays } from 'lucide-react';

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

  const payrollTotals = useMemo(() => {
    return currentPayrolls.reduce((acc, curr) => ({
      base: acc.base + (curr.baseSalary || 0),
      transport: acc.transport + (curr.transport || 0),
      actualHours: acc.actualHours + (curr.workingHours || 0),
      dueHours: acc.dueHours + ((curr.workingDays || 0) * 8),
      overtime: acc.overtime + (curr.overtimePay || 0),
      late: acc.late + (curr.lateDeduction || 0),
      loans: acc.loans + (curr.loanInstallment || 0),
      net: acc.net + (curr.netSalary || 0)
    }), { base: 0, transport: 0, actualHours: 0, dueHours: 0, overtime: 0, late: 0, loans: 0, net: 0 });
  }, [currentPayrolls]);

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

  const PrintableHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-start border-b-4 border-indigo-900 pb-6 mb-8 w-full text-indigo-950">
      <div className="text-right">
        <h1 className="text-3xl font-black leading-none">{db.settings.name}</h1>
        <p className="text-sm font-black text-indigo-700 mt-2">{title}</p>
      </div>
      <div className="flex flex-col items-center">
        {db.settings.logo && <img src={db.settings.logo} className="h-20 w-auto object-contain mb-2" />}
      </div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-400">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
        <p className="text-[10px] font-black text-slate-400">توقيت التقرير: {new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد' };
    return (
      <div className="bg-white p-12 print-card w-full max-w-4xl mx-auto rounded-[3.5rem] border-2 border-slate-100 shadow-sm relative overflow-hidden">
        <PrintableHeader title={title} />
        <div className="space-y-12">
           <div className="flex justify-between items-center bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 text-right">
             <div className="text-right flex-1">
                <span className="text-[11px] font-black text-indigo-400 block uppercase mb-1">اسم الموظف:</span>
                <span className="text-4xl font-black text-slate-900 leading-tight">{emp.name}</span>
             </div>
             <div className="text-left flex-1">
                <span className="text-[11px] font-black text-slate-400 block uppercase mb-1">القسم / الوحدة:</span>
                <span className="text-2xl font-bold text-indigo-700">{emp.department}</span>
             </div>
           </div>
           <div className="border-4 border-dashed border-indigo-200 rounded-[3rem] p-10 bg-white relative">
              <span className="absolute -top-5 right-14 bg-indigo-600 px-8 py-1.5 text-[11px] font-black text-white uppercase rounded-full shadow-lg no-print">بيانات معتمدة من الإدارة</span>
              <div className="flex items-center gap-10">
                 <div className="bg-indigo-950 text-white p-10 rounded-[2.5rem] shadow-xl text-center min-w-[220px]">
                    <p className="text-[11px] opacity-70 mb-3 font-black uppercase tracking-widest">نوع السند</p>
                    <p className="text-3xl font-black mb-4">
                       {type === 'leave' ? leaveTypesAr[data.type] : 
                        type === 'financial' ? financialTypesAr[data.type] : 
                        type === 'loan' ? 'سند سلفة' : 
                        type === 'production' ? 'إنتاجية' : 'مستند إداري'}
                    </p>
                    {data.amount && <div className="mt-6 pt-6 border-t border-white/20 font-black text-2xl">{data.amount.toLocaleString()} <span className="text-lg opacity-60">{db.settings.currency}</span></div>}
                 </div>
                 <div className="flex-1 text-right space-y-6">
                    {data.startDate && <p className="text-2xl font-black text-slate-800">الفترة الزمنية: من {data.startDate} إلى {data.endDate}</p>}
                    <div className="p-8 bg-slate-50 rounded-[2rem] italic font-bold text-xl text-slate-600 leading-relaxed min-h-[120px] flex items-center border border-slate-100">
                       {data.reason || data.notes || "لا توجد ملاحظات إضافية مسجلة لهذا المستند."}
                    </div>
                 </div>
              </div>
           </div>
        </div>
        <div className="grid grid-cols-2 gap-32 mt-20 text-center border-t-2 pt-10 text-[14px] font-black opacity-60">
           <div className="flex flex-col gap-6">
              <span>توقيع الموظف المستلم</span>
              <span className="text-slate-300">.............................</span>
           </div>
           <div className="flex flex-col gap-6">
              <span>توقيع وختم الإدارة</span>
              <span className="text-slate-300">.............................</span>
           </div>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-8 rounded-[2.5rem] bg-white relative">
            <div className="flex justify-between items-start border-b border-indigo-100 pb-4 mb-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-400 uppercase mb-0.5">قسيمة راتب الموظف</p>
                  <h3 className="text-xl font-black text-slate-900 leading-none">{emp?.name}</h3>
               </div>
               <div className="text-left text-[10px] font-black text-slate-400">
                  <p>الفترة: {p.month} / {p.year}</p>
               </div>
            </div>
            <div className="space-y-2 text-[11px] font-bold">
               <div className="flex justify-between text-slate-600"><span>الراتب الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-indigo-600"><span>بدل المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600 font-black"><span>إضافي ساعات:</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600"><span>أقساط سلف:</span> <span>-{p.loanInstallment.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-700 font-black"><span>خصم تأخير:</span> <span>-{p.lateDeduction.toLocaleString()}</span></div>
               
               <div className="flex justify-between text-lg font-black text-indigo-950 pt-4 mt-4 border-t-2 border-indigo-900 items-baseline">
                 <span>صافي الراتب:</span>
                 <div className="text-right">
                    <span className="text-[10px] mr-1 opacity-60 font-black">{db.settings.currency}</span>
                    <span className="text-2xl">{p.netSalary.toLocaleString()}</span>
                 </div>
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
        <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-md border dark:border-slate-800 overflow-hidden">
          <div className="bg-indigo-600 p-12 text-white text-center">
            <h1 className="text-4xl font-black tracking-tighter">SAM PRO</h1>
            <p className="text-[10px] font-bold mt-2 opacity-80 uppercase tracking-widest">نظام إدارة الموارد البشرية</p>
          </div>
          <form onSubmit={handleLogin} className="p-10 space-y-6 text-right">
            <input className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Username" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} required />
            <input type="password" className="w-full py-4 px-6 bg-slate-50 dark:bg-slate-800 rounded-2xl font-black border-2 border-transparent focus:border-indigo-600 outline-none" placeholder="Password" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} required />
            <button className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">دخول النظام</button>
            <div className="text-center mt-2">
               <button type="button" onClick={() => setShowForgotHint(!showForgotHint)} className="text-xs font-black text-indigo-500 underline decoration-indigo-200">هل نسيت بيانات الدخول؟</button>
            </div>
            {showForgotHint && <div className="p-4 bg-amber-50 rounded-2xl text-xs font-bold text-amber-700 mt-2 border border-amber-100 animate-in fade-in slide-in-from-top-2">تلميح المسؤول: {db.settings.passwordHint}</div>}
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
          companyName={db.settings.name} logo={db.settings.logo}
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
          renderFooter={(list) => (
             <tr>
               <td className="px-6 py-4">إجمالي طلبات الإجازة</td>
               <td className="px-6 py-4 text-center text-lg">{list.length} طلب</td>
               <td colSpan={3}></td>
               <td className="no-print"></td>
             </tr>
          )}
        />
      );
      case 'loans': return (
        <GenericModule<Loan> 
          title="السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} 
          companyName={db.settings.name} logo={db.settings.logo}
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
          renderFooter={(list) => (
             <tr>
               <td className="px-6 py-4">إجمالي السلف</td>
               <td className="px-6 py-4 text-center font-black">{list.reduce((acc,curr)=>acc+(curr.amount||0),0).toLocaleString()}</td>
               <td className="px-6 py-4 text-center font-black text-emerald-300">{list.reduce((acc,curr)=>acc+(curr.remainingAmount||0),0).toLocaleString()}</td>
               <td className="px-6 py-4"></td>
               <td className="no-print"></td>
             </tr>
          )}
        />
      );
      case 'financials': return (
        <GenericModule<FinancialEntry> 
          title="السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} 
          companyName={db.settings.name} logo={db.settings.logo}
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
          renderFooter={(list) => (
             <tr>
               <td className="px-6 py-4">إجمالي السندات</td>
               <td className="px-6 py-4 text-center">-</td>
               <td className="px-6 py-4 text-center font-black text-indigo-300">{list.reduce((acc,curr)=>acc+(curr.amount||0),0).toLocaleString()}</td>
               <td className="px-6 py-4"></td>
               <td className="no-print"></td>
             </tr>
          )}
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} settings={db.settings} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
      case 'payroll': return (
        <div className="space-y-8">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 flex justify-between items-center no-print">
             <h2 className="text-3xl font-black text-indigo-700">مسير الرواتب - {currentMonth}/{currentYear}</h2>
             <div className="flex gap-3">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين المعتمدة', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-950 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer size={20}/> طباعة المسير الكامل</button>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border overflow-x-auto relative no-print-wrapper">
             <div className="print-only">
               <PrintableHeader title={`مسير الرواتب الكامل لشهر ${currentMonth} / ${currentYear}`} />
             </div>
             <table className="w-full text-center text-[10px] border-collapse">
               <thead className="text-white font-black uppercase">
                 <tr>
                   <th className="px-4 py-6 text-right sticky right-0 bg-indigo-950 z-20">الموظف</th>
                   <th className="px-2 py-6 bg-indigo-950 border-r border-white/5">الأساسي</th>
                   <th className="px-2 py-6 bg-indigo-950 border-r border-white/5">مواصلات</th>
                   <th className="px-2 py-6 bg-slate-900 text-indigo-300 border-r border-white/5">س. فعلية</th>
                   <th className="px-2 py-6 bg-slate-900 text-indigo-300 border-r border-white/5">س. مستحقة</th>
                   <th className="px-2 py-6 bg-[#064e3b] text-emerald-100 border-r border-white/5">إضافي($)</th>
                   <th className="px-2 py-6 bg-[#7f1d1d] text-rose-100 border-r border-white/5">تأخير($)</th>
                   <th className="px-2 py-6 bg-indigo-950 text-rose-300 border-r border-white/5">سلف</th>
                   <th className="px-4 py-6 bg-[#0f172a] text-sm text-indigo-300">صافي الراتب</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                 {currentPayrolls.map(p => (
                   <tr key={p.id} className="hover:bg-slate-50 transition font-bold text-xs">
                     <td className="px-4 py-6 text-right sticky right-0 bg-white dark:bg-slate-900 border-r">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                     <td className="px-2 py-6">{p.baseSalary.toLocaleString()}</td>
                     <td className="px-2 py-6 text-indigo-500">{p.transport.toLocaleString()}</td>
                     <td className="px-2 py-6 text-slate-500 bg-slate-50/10 font-black">{p.workingHours} س</td>
                     <td className="px-2 py-6 text-slate-500 bg-slate-50/10 font-black">{(p.workingDays || 0) * 8} س</td>
                     <td className="px-2 py-6 text-emerald-600 bg-emerald-50/20 font-black">{p.overtimePay.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-500 bg-rose-50/20 font-black">{p.lateDeduction.toLocaleString()}</td>
                     <td className="px-2 py-6 text-rose-700 font-black">-{p.loanInstallment.toLocaleString()}</td>
                     <td className="px-4 py-6 font-black text-indigo-950 bg-indigo-50/30 text-base">{p.netSalary.toLocaleString()}</td>
                   </tr>
                 ))}
               </tbody>
               <tfoot className="bg-indigo-950 text-white font-black text-xs uppercase border-t-4 border-indigo-900">
                 <tr>
                   <td className="px-4 py-6 text-right sticky right-0 bg-indigo-950 z-20">الإجمالي الكلي</td>
                   <td className="px-2 py-6 bg-indigo-900/50">{payrollTotals.base.toLocaleString()}</td>
                   <td className="px-2 py-6 bg-indigo-900/50">{payrollTotals.transport.toLocaleString()}</td>
                   <td className="px-2 py-6 bg-slate-900/80 text-indigo-300">{payrollTotals.actualHours} س</td>
                   <td className="px-2 py-6 bg-slate-900/80 text-indigo-300">{payrollTotals.dueHours} س</td>
                   <td className="px-2 py-6 bg-emerald-900/60">{payrollTotals.overtime.toLocaleString()}</td>
                   <td className="px-2 py-6 bg-rose-900/60">-{payrollTotals.late.toLocaleString()}</td>
                   <td className="px-2 py-6 bg-indigo-900/50">-{payrollTotals.loans.toLocaleString()}</td>
                   <td className="px-4 py-6 bg-slate-900 text-lg text-indigo-400">{payrollTotals.net.toLocaleString()} {db.settings.currency}</td>
                 </tr>
               </tfoot>
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
      
      {individualPrintItem && (
        <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 no-print overflow-y-auto no-print-wrapper">
          <div className="bg-white p-10 w-full max-w-5xl shadow-2xl rounded-[3.5rem] border-4 border-white/20 transition-all">
             <div className="flex justify-between items-center mb-10 border-b-2 pb-6 no-print">
                <h3 className="font-black text-indigo-800 text-3xl">معاينة قبل الطباعة</h3>
                <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition transform hover:rotate-90"><X size={44}/></button>
             </div>
             
             {/* الهدف الرئيسي للطباعة مع معرّف فريد */}
             <div id="print-area-target" className="bg-white overflow-visible rounded-[2rem]">
                {individualPrintItem.type === 'vouchers' 
                  ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                  : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
             </div>

             <div className="flex gap-6 mt-12 no-print">
                <button onClick={() => window.print()} className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-3xl shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all outline-none"><Printer size={32}/> تـنـفـيذ الـطـباعـة</button>
                <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 py-6 rounded-[2.5rem] font-black text-xl text-slate-500 hover:bg-slate-200 transition">إلغاء وإغلاق</button>
             </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default App;
