
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
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
import { Employee, PayrollRecord, FinancialEntry, Loan, LeaveRequest, ProductionEntry, AttendanceRecord, Warning } from './types';
import { generateMonthlyPayroll } from './utils/calculations';
import { Printer, X, ReceiptText, CalendarDays, Loader2, FileText, CheckCircle, Info, ShieldAlert, Package, Layers, Clock, TrendingUp, Lock, HelpCircle, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document' | 'vouchers' | 'report_attendance' | 'report_financial' | 'warning';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showHint, setShowHint] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  
  const [archiveModes, setArchiveModes] = useState<Record<string, boolean>>({
    leaves: false, financials: false, loans: false, production: false
  });

  useEffect(() => {
    if (individualPrintItem) {
      document.body.classList.add('printing-individual');
      if (individualPrintItem.type === 'vouchers' || individualPrintItem.type === 'document') {
        document.body.classList.add('print-portrait');
        document.body.classList.remove('print-landscape');
      } else {
        document.body.classList.add('print-landscape');
        document.body.classList.remove('print-portrait');
      }
    } else {
      document.body.classList.remove('printing-individual', 'print-landscape', 'print-portrait');
    }
  }, [individualPrintItem]);

  useEffect(() => {
    if (activeTab === 'payroll' || activeTab === 'reports' || activeTab === 'attendance') {
        document.body.classList.add('print-landscape');
        document.body.classList.remove('print-portrait');
    } else {
        document.body.classList.add('print-portrait');
        document.body.classList.remove('print-landscape');
    }
  }, [activeTab]);

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

  const handleClearData = () => {
    if (confirm('هل أنت متأكد تماماً؟ سيتم حذف كافة البيانات نهائياً!')) {
      const resetDB: DB = { ...db, employees: [], attendance: [], loans: [], leaves: [], financials: [], production: [], warnings: [], payrolls: [], payrollHistory: [] };
      setDb(resetDB);
      saveDB(resetDB);
      alert('تم مسح البيانات.');
    }
  };

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const currentPayrolls = useMemo(() => generateMonthlyPayroll(
    currentMonth, currentYear, db.employees || [], 
    db.attendance || [], 
    db.loans || [], 
    db.financials || [], 
    db.production || [], 
    db.settings
  ), [currentMonth, currentYear, db]);

  const payrollTotals = useMemo(() => {
    return currentPayrolls.reduce((acc, p) => ({
      base: acc.base + (p.baseSalary || 0),
      transport: acc.transport + (p.transport || 0),
      bonuses: acc.bonuses + (p.bonuses || 0),
      production: acc.production + (p.production || 0),
      overtime: acc.overtime + (p.overtimePay || 0),
      late: acc.late + (p.lateDeduction || 0),
      early: acc.early + (p.earlyDepartureDeduction || 0),
      loans: acc.loans + (p.loanInstallment || 0),
      manual: acc.manual + (p.manualDeductions || 0),
      net: acc.net + (p.netSalary || 0),
      workingDays: acc.workingDays + (p.workingDays || 0),
      absenceDays: acc.absenceDays + (p.absenceDays || 0)
    }), { base: 0, transport: 0, bonuses: 0, production: 0, overtime: 0, late: 0, early: 0, loans: 0, manual: 0, net: 0, workingDays: 0, absenceDays: 0 });
  }, [currentPayrolls]);

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const currentVal = prev[key];
      if (Array.isArray(currentVal)) {
        const list = [...currentVal];
        const index = list.findIndex((i: any) => i.id === item.id);
        const newList = index !== -1 ? list.map((i: any) => i.id === item.id ? { ...i, ...item } : i) : [...list, item];
        return { ...prev, [key]: newList };
      }
      return { ...prev, [key]: item };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    if(!confirm('هل أنت متأكد؟')) return;
    setDb(prev => {
      const currentVal = prev[key];
      if (Array.isArray(currentVal)) {
        return { ...prev, [key]: (currentVal as any[]).filter((i:any) => id !== i.id) };
      }
      return prev;
    });
  };

  const archiveItem = <K extends keyof DB>(key: K, item: any) => {
    if (confirm('نقل للأرشيف؟')) updateList(key, { ...item, isArchived: true });
  };

  const PrintableHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="hidden print:flex justify-between items-center border-b-[4px] border-indigo-950 pb-4 mb-6 w-full text-indigo-950">
      <div className="text-right flex-1">
        <h1 className="text-3xl font-black leading-none mb-1">{db.settings.name}</h1>
        <div className="flex flex-col">
            <span className="text-lg font-black text-indigo-700">{title}</span>
            {subtitle && <span className="text-[10px] font-bold text-slate-500">{subtitle}</span>}
        </div>
      </div>
      <div className="flex-none px-6">
        {db.settings.logo && <img src={db.settings.logo} className="h-14 w-auto object-contain" alt="Logo" />}
      </div>
      <div className="text-left flex-1 font-bold text-[8px] space-y-0.5">
        <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
        <p>الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد', position: 'غير محدد' };
    return (
      <div className="bg-white print-card w-full max-w-4xl mx-auto text-right">
        <PrintableHeader title={title} />
        <div className="p-8 border-2 border-slate-200 rounded-2xl space-y-6">
           <div className="flex justify-between border-b pb-4">
              <div><span className="block text-xs font-bold text-slate-400">الموظف</span><span className="text-xl font-black">{emp.name}</span></div>
              <div className="text-left"><span className="block text-xs font-bold text-slate-400">القسم</span><span className="text-lg font-bold">{emp.department}</span></div>
           </div>
           <p className="text-lg font-bold leading-relaxed">{data.notes || 'بيان رسمي معتمد بناء على سجلات النظام.'}</p>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print w-full flex flex-col gap-10 p-4">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card w-full bg-white relative p-10 border-[1px] border-slate-200 rounded-lg shadow-none break-inside-avoid min-h-[500px] flex flex-col">
            {/* الجزء العلوي - كما في الصورة */}
            <div className="flex justify-between items-start mb-8">
               <div className="text-right">
                  <p className="text-indigo-600 font-bold text-lg mb-1">قسيمة راتب معتمدة</p>
                  <h3 className="text-4xl font-black text-slate-900 leading-tight mb-2">{emp?.name}</h3>
                  <p className="text-lg font-bold text-slate-500">{emp?.position} - {emp?.department}</p>
               </div>
               <div className="text-left text-indigo-400 font-black text-sm space-y-1">
                  <p>الفترة: {p.month} / {p.year}</p>
                  <p>تاريخ: {new Date().toLocaleDateString('en-US')}</p>
                  <p>ساعات العمل: {p.workingHours} س</p>
               </div>
            </div>
            
            <div className="w-full border-t border-slate-100 pt-8 flex-1">
               <div className="grid grid-cols-2 gap-x-20">
                  {/* المستحقات */}
                  <div className="space-y-4">
                     <h4 className="text-indigo-600 font-black text-lg border-b-2 border-indigo-100 pb-1 mb-4">المستحقات (+)</h4>
                     <div className="flex justify-between text-slate-900 font-bold"><span>الراتب الأساسي:</span> <span className="text-slate-600">{p.baseSalary.toLocaleString()}</span></div>
                     <div className="flex justify-between text-emerald-600 font-bold"><span>المواصلات:</span> <span>{p.transport.toLocaleString()}+</span></div>
                     <div className="flex justify-between text-emerald-600 font-bold"><span>العمل الإضافي:</span> <span>{p.overtimePay.toLocaleString()}+</span></div>
                     <div className="flex justify-between text-emerald-600 font-bold"><span>المكافآت:</span> <span>{p.bonuses.toLocaleString()}+</span></div>
                     <div className="flex justify-between text-emerald-600 font-bold"><span>الإنتاج:</span> <span>{p.production.toLocaleString()}+</span></div>
                  </div>
                  {/* الاستقطاعات */}
                  <div className="space-y-4">
                     <h4 className="text-rose-600 font-black text-lg border-b-2 border-rose-100 pb-1 mb-4">الاستقطاعات (-)</h4>
                     <div className="flex justify-between text-slate-900 font-bold"><span>تأخير:</span> <span className="text-rose-500">{p.lateDeduction.toLocaleString()}-</span></div>
                     <div className="flex justify-between text-slate-900 font-bold"><span>انصراف مبكر:</span> <span className="text-rose-500">{p.earlyDepartureDeduction.toLocaleString()}-</span></div>
                     <div className="flex justify-between text-slate-900 font-bold"><span>أيام غياب:</span> <span className="text-rose-500">({p.absenceDays} ي) {p.absenceDeduction.toLocaleString()}-</span></div>
                     <div className="flex justify-between text-slate-900 font-bold"><span>أقساط سلف:</span> <span className="text-rose-500">{p.loanInstallment.toLocaleString()}-</span></div>
                     <div className="flex justify-between text-slate-900 font-bold"><span>خصومات أخرى:</span> <span className="text-rose-500">{p.manualDeductions.toLocaleString()}-</span></div>
                  </div>
               </div>
            </div>

            {/* الصافي - كبير وواضح كما في الصورة */}
            <div className="mt-12 pt-6 border-t-2 border-indigo-500 flex justify-between items-center">
               <span className="text-3xl font-black text-slate-900">صافي الراتب:</span>
               <div className="flex items-baseline gap-2">
                  <span className="text-5xl font-black text-slate-900">{p.netSalary.toLocaleString()}</span>
                  <span className="text-lg font-black text-slate-400">SYP</span>
               </div>
            </div>

            <div className="mt-10 flex justify-between text-slate-400 font-black text-sm">
               <span>توقيع المحاسب</span>
               <span>توقيع الموظف</span>
            </div>

            {/* اسم المطور بالأسفل */}
            <div className="absolute bottom-4 left-0 right-0 text-center text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                Developed by Mohannad Ahmad - +963 998 171 954
            </div>
          </div>
        );
      })}
    </div>
  );

  const executePrintAction = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 800);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments': return <Departments departments={db.departments || []} employees={db.employees || []} onUpdate={depts => setDb({...db, departments: depts})} onUpdateEmployee={emp => updateList('employees', emp)} />;
      case 'attendance': return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => window.print()} />;
      case 'leaves': return (
        <GenericModule<LeaveRequest> 
          title="سجل طلبات الإجازات" lang={db.settings.language} employees={db.employees} items={db.leaves} 
          companyName={db.settings.name} logo={db.settings.logo}
          archiveMode={archiveModes.leaves} onToggleArchive={() => setArchiveModes(p => ({...p, leaves: !p.leaves}))} 
          onSave={i => updateList('leaves', i)} onDelete={id => deleteFromList('leaves', id)} onArchive={i => archiveItem('leaves', i)}
          onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إجازة رسمي", type: 'leave', data: i})} 
          initialData={{ type: 'annual', status: 'approved', isPaid: true, startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'النوع', 'مأجورة', 'من', 'إلى']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                   <label className="text-xs font-black mb-1 block">نوع الإجازة</label>
                   <select className="w-full p-4 border rounded-xl font-bold bg-slate-50" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                      <option value="annual">سنوية</option><option value="sick">مرضية</option><option value="emergency">طارئة</option><option value="unpaid">بدون راتب</option>
                   </select>
                </div>
                <div className="flex items-center justify-between bg-slate-100 p-4 rounded-2xl col-span-2">
                   <span className="font-black text-slate-800 text-sm">إجازة مأجورة الراتب؟</span>
                   <button type="button" onClick={() => set({...data, isPaid: !data.isPaid})}>{data.isPaid ? <ToggleRight size={40} className="text-emerald-600" /> : <ToggleLeft size={40} className="text-slate-400" />}</button>
                </div>
                <div><label className="text-xs font-black block">البدء</label><input type="date" className="w-full p-4 border rounded-xl font-bold" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} /></div>
                <div><label className="text-xs font-black block">الانتهاء</label><input type="date" className="w-full p-4 border rounded-xl font-bold" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} /></div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4">{i.type}</td><td className={`px-6 py-4 font-black ${i.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>{i.isPaid ? 'نعم' : 'لا'}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} 
        />
      );
      case 'loans': return (
        <GenericModule<Loan> 
          title="سجل السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} 
          companyName={db.settings.name} logo={db.settings.logo}
          archiveMode={archiveModes.loans} onToggleArchive={() => setArchiveModes(p => ({...p, loans: !p.loans}))} 
          onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onArchive={i => archiveItem('loans', i)}
          onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})} 
          initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0], collectionDate: new Date().toISOString().split('T')[0] }} 
          tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'قيمة القسط', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="المبلغ" className="p-4 border rounded-xl font-black" value={data.amount || ''} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} />
              <input type="number" placeholder="الأقساط" className="p-4 border rounded-xl font-black" value={data.installmentsCount || ''} onChange={e => set({...data, installmentsCount: Number(e.target.value), monthlyInstallment: Number(data.amount || 0) / Number(e.target.value || 1)})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4 font-bold">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.installmentsCount}</td><td className="px-6 py-4 font-black">{Math.round(i.monthlyInstallment).toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'financials': return (
        <GenericModule<FinancialEntry> 
          title="سجل السندات المالية" lang={db.settings.language} employees={db.employees} items={db.financials} 
          companyName={db.settings.name} logo={db.settings.logo}
          archiveMode={archiveModes.financials} onToggleArchive={() => setArchiveModes(p => ({...p, financials: !p.financials}))} 
          onSave={i => updateList('financials', i)} onDelete={id => deleteFromList('financials', id)} onArchive={i => archiveItem('financials', i)}
          onPrintIndividual={i => setIndividualPrintItem({title: "سند مالي معتمد", type: 'financial', data: i})} 
          initialData={{ type: 'bonus', amount: 0, date: new Date().toISOString().split('T')[0], reason: '' }} 
          tableHeaders={['الموظف', 'النوع', 'المبلغ', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="space-y-4">
                <select className="w-full p-4 border rounded-xl font-black" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                   <option value="bonus">مكافأة (+)</option><option value="deduction">خصم (-)</option>
                </select>
                <input type="number" placeholder="المبلغ" className="w-full p-4 border rounded-xl font-black text-xl" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
                <textarea className="w-full p-4 border rounded-xl font-bold h-24" value={data.reason} onChange={e => set({...data, reason: e.target.value})} placeholder="السبب..."></textarea>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td className="px-6 py-4">{i.type}</td><td className={`px-6 py-4 font-black ${i.type==='deduction'?'text-rose-600':'text-indigo-700'}`}>{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} settings={db.settings} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
      case 'payroll': return (
        <div className="space-y-8 animate-in fade-in duration-700">
          <PrintableHeader title={`مسير رواتب الموظفين لشهر ${currentMonth} / ${currentYear}`} />
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center no-print text-right gap-4">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg"><TrendingUp size={32}/></div>
                <div><h2 className="text-3xl font-black text-indigo-700">مسير رواتب الموظفين</h2></div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-100 text-indigo-700 px-8 py-3 rounded-2xl font-black flex items-center gap-2 transition"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer size={20}/> طباعة المسير</button>
             </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-visible relative">
             <div className="overflow-x-auto print:overflow-visible">
               <table className="w-full text-center text-sm font-bold print:table-auto">
                 <thead className="bg-indigo-950 text-white font-black uppercase">
                   <tr>
                     <th className="px-4 py-5 text-right sticky right-0 bg-indigo-950 z-10 print:bg-slate-50 print:text-black">الموظف</th>
                     <th className="px-1 py-5">الأساسي</th>
                     <th className="px-1 py-5">حضور</th>
                     <th className="px-1 py-5">غياب</th>
                     <th className="px-1 py-5">مكافأة</th>
                     <th className="px-1 py-5">إنتاج</th>
                     <th className="px-1 py-5">إضافي</th>
                     <th className="px-1 py-5">تأخير</th>
                     <th className="px-1 py-5">سلف</th>
                     <th className="px-4 py-5 text-center bg-indigo-900">الصافي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {currentPayrolls.map(p => (
                     <tr key={p.id} className="hover:bg-slate-50 transition border-b print:border-slate-100">
                       <td className="px-4 py-4 text-right font-black sticky right-0 bg-white dark:bg-slate-900 z-10 print:bg-white">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                       <td className="px-1 py-4">{p.baseSalary.toLocaleString()}</td>
                       <td className="px-1 py-4">{p.workingDays} ي</td>
                       <td className="px-1 py-4 text-rose-600">{p.absenceDays} ي</td>
                       <td className="px-1 py-4 text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                       <td className="px-1 py-4 text-emerald-600">+{p.production.toLocaleString()}</td>
                       <td className="px-1 py-4 text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                       <td className="px-1 py-4 text-rose-600">-{p.lateDeduction.toLocaleString()}</td>
                       <td className="px-1 py-4 text-rose-600">-{p.loanInstallment.toLocaleString()}</td>
                       <td className="px-4 py-4 font-black bg-indigo-50/80 text-[18px] text-indigo-900">{p.netSalary.toLocaleString()}</td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-indigo-950 text-white font-black border-t-4 border-indigo-900">
                    <tr>
                       <td className="px-4 py-6 text-right">الإجمالي:</td>
                       <td className="px-1 py-6">{payrollTotals.base.toLocaleString()}</td>
                       <td colSpan={2}></td>
                       <td className="px-1 py-6 text-emerald-400">+{payrollTotals.bonuses.toLocaleString()}</td>
                       <td className="px-1 py-6 text-emerald-400">+{payrollTotals.production.toLocaleString()}</td>
                       <td className="px-1 py-6 text-emerald-400">+{payrollTotals.overtime.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.late.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.loans.toLocaleString()}</td>
                       <td className="px-4 py-6 text-[22px] bg-indigo-900">{payrollTotals.net.toLocaleString()}</td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
          <div className="hidden print:block mt-12 p-8 border-t border-slate-300 grid grid-cols-3 gap-10 text-center font-black text-xs uppercase">
             <div>توقيع المحاسب</div><div>الموارد البشرية</div><div>المدير العام</div>
          </div>
        </div>
      );
      case 'documents': return <PrintForms employees={db.employees || []} attendance={db.attendance || []} financials={db.financials || []} warnings={db.warnings || []} leaves={db.leaves || []} settings={db.settings} onPrint={(doc) => setIndividualPrintItem(doc as any)} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={() => {}} onClearData={handleClearData} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      default: return null;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-cairo text-right" dir="rtl">
         <div className="w-full max-w-lg bg-white rounded-[3rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-12 relative z-10">
               <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-white text-4xl font-black mb-6">S</div>
               <h2 className="text-3xl font-black text-slate-900">نظام SAM Pro</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
               <div><label className="text-xs font-black text-slate-500 block mb-2 mr-3 uppercase tracking-widest">اسم المستخدم</label><input type="text" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black outline-none text-xl shadow-inner" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} /></div>
               <div><label className="text-xs font-black text-slate-500 block mb-2 mr-3 uppercase tracking-widest">كلمة المرور</label><input type="password" className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black outline-none text-xl shadow-inner" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} /></div>
               <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-indigo-700 transition-all">دخـول للـنـظام</button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <div className={db.settings.theme === 'dark' ? 'dark' : ''}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
        {renderActiveTab()}
        {individualPrintItem && (
          <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 no-print overflow-y-auto">
            <div className="bg-white p-8 w-full max-w-5xl shadow-2xl rounded-[3rem] border-2 border-white/20 text-right">
               <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="font-black text-indigo-800 text-xl">معاينة المستند للطباعة</h3>
                  <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition transform hover:rotate-90"><X size={32}/></button>
               </div>
               <div className="bg-white rounded-2xl overflow-visible border border-slate-100 p-4 min-h-[400px]">
                  {individualPrintItem.type === 'vouchers' 
                    ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                    : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
               </div>
               <div className="flex gap-4 mt-8">
                  <button onClick={executePrintAction} disabled={isPrinting} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 hover:bg-indigo-700 shadow-xl">
                    {isPrinting ? <Loader2 className="animate-spin" size={24}/> : <Printer size={24}/>}
                    {isPrinting ? 'جاري التحضير...' : 'تـنـفـيذ الـطـباعـة'}
                  </button>
                  <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 py-5 rounded-[2rem] font-black text-lg text-slate-500 hover:bg-slate-200 transition">إغلاق</button>
               </div>
            </div>
          </div>
        )}
        {createPortal(<div id="sam-print-portal" className="text-right overflow-visible" dir="rtl">{individualPrintItem && (individualPrintItem.type === 'vouchers' ? <VouchersPrintGrid payrolls={individualPrintItem.data} /> : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />)}</div>, document.getElementById('sam-print-portal')!)}
      </Layout>
    </div>
  );
};

export default App;
