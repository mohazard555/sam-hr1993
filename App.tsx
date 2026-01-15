
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
import { Printer, X, ReceiptText, CalendarDays, Loader2, FileText, CheckCircle, Info, ShieldAlert, Package, Layers, Clock, TrendingUp, Lock, HelpCircle, ToggleLeft, ToggleRight } from 'lucide-react';

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
    } else {
      document.body.classList.remove('printing-individual');
    }
  }, [individualPrintItem]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setShowHint(false);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const handleClearData = () => {
    if (confirm('هل أنت متأكد تماماً؟ سيتم حذف كافة الموظفين، السجلات، المالية، والحضور نهائياً ولا يمكن التراجع!')) {
      const resetDB: DB = {
        ...db,
        employees: [],
        attendance: [],
        loans: [],
        leaves: [],
        financials: [],
        production: [],
        warnings: [],
        payrolls: [],
        payrollHistory: [],
        departments: ['الإدارة العامة', 'المحاسبة', 'الموارد البشرية', 'الإنتاج', 'المبيعات']
      };
      setDb(resetDB);
      saveDB(resetDB);
      alert('تم مسح كافة البيانات بنجاح.');
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

  const updateList = <K extends keyof DB>(key: K, item: any) => {
    setDb(prev => {
      const currentVal = prev[key];
      if (Array.isArray(currentVal)) {
        const list = [...currentVal];
        const index = list.findIndex((i: any) => i.id === item.id);
        let newList;
        if (index !== -1) {
          newList = list.map((i: any) => i.id === item.id ? { ...i, ...item } : i);
        } else {
          newList = [...list, item];
        }
        return { ...prev, [key]: newList };
      }
      return { ...prev, [key]: item };
    });
  };

  const deleteFromList = <K extends keyof DB>(key: K, id: string) => {
    if(!confirm('هل أنت متأكد من حذف هذا السجل نهائياً؟')) return;
    setDb(prev => {
      const currentVal = prev[key];
      if (Array.isArray(currentVal)) {
        return { ...prev, [key]: (currentVal as any[]).filter((i:any) => id !== i.id) };
      }
      return prev;
    });
  };

  const archiveItem = <K extends keyof DB>(key: K, item: any) => {
    if (confirm('هل تريد نقل هذا السجل إلى الأرشيف التاريخي؟')) {
      updateList(key, { ...item, isArchived: true });
    }
  };

  const PrintableHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-start border-b-4 border-indigo-900 pb-6 mb-8 w-full text-indigo-950">
      <div className="text-right">
        <h1 className="text-3xl font-black leading-none">{db.settings.name}</h1>
        <p className="text-sm font-black text-indigo-700 mt-2">{title}</p>
      </div>
      <div className="flex flex-col items-center">
        {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain mb-2" alt="Logo" />}
      </div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase">الساعة: {new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد', position: 'غير محدد' };
    return (
      <div className="bg-white print-card w-full max-w-4xl mx-auto shadow-none relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none rotate-12">
            <h1 className="text-[8rem] font-black whitespace-nowrap">{db.settings.name}</h1>
        </div>
        <PrintableHeader title={title} />
        <div className="space-y-8 relative z-10">
           <div className="flex justify-between items-center bg-slate-50 p-8 rounded-[2rem] border border-slate-100 text-right">
             <div className="text-right flex-1">
                <span className="text-[10px] font-black text-indigo-400 block uppercase mb-1">اسم الموظف:</span>
                <span className="text-2xl font-black text-slate-900 leading-tight">{emp.name}</span>
                <p className="text-xs font-bold text-slate-500">{emp.position}</p>
             </div>
             <div className="text-left flex-1">
                <span className="text-[10px] font-black text-slate-400 block uppercase mb-1">القسم / الوحدة:</span>
                <span className="text-lg font-bold text-indigo-700">{emp.department}</span>
             </div>
           </div>
           <div className="p-8 border-4 border-dashed border-slate-200 rounded-[2rem] text-right">
              {type === 'production' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">الكمية المنجزة:</span>
                      <span className="text-xl font-black text-slate-900">{data.piecesCount} قطعة</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">سعر القطعة الواحدة:</span>
                      <span className="text-xl font-black text-slate-900">{data.valuePerPiece?.toLocaleString()} {db.settings.currency}</span>
                    </div>
                  </div>
                  <div className="p-6 bg-indigo-50 rounded-3xl border-2 border-indigo-100 flex justify-between items-center">
                    <span className="text-lg font-black text-indigo-900">إجمالي قيمة الاستحقاق:</span>
                    <span className="text-3xl font-black text-indigo-700">{data.totalValue?.toLocaleString()} {db.settings.currency}</span>
                  </div>
                  {data.notes && (
                    <div className="p-4 border border-slate-100 rounded-2xl bg-slate-50/30">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">ملاحظات إضافية:</span>
                      <p className="text-sm font-bold text-slate-700 leading-relaxed italic">"{data.notes}"</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-lg font-bold leading-relaxed">بيان رسمي معتمد بناء على السجلات الجارية.</p>
              )}
           </div>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print grid grid-cols-2 gap-4 p-4">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-8 bg-white relative mb-4 rounded-[2rem] shadow-sm">
            <div className="flex justify-between items-start border-b-2 border-indigo-100 pb-4 mb-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-500 uppercase">قسيمة راتب معتمدة</p>
                  <h3 className="text-xl font-black text-slate-900 leading-none">{emp?.name}</h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-1">{emp?.position} - {emp?.department}</p>
               </div>
               <div className="text-left text-[10px] font-black text-slate-400">
                  <p>الفترة: {p.month} / {p.year}</p>
                  <p>تاريخ: {new Date().toLocaleDateString()}</p>
                  <p>ساعات العمل: {p.workingHours} س</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-[10px] font-bold">
               <div className="col-span-2 text-[10px] font-black text-indigo-800 mb-1 border-b">المستحقات (+)</div>
               <div className="flex justify-between text-slate-600 border-b border-slate-50"><span>الراتب الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600 border-b border-slate-50"><span>المواصلات:</span> <span>+{p.transport.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600 border-b border-slate-50"><span>العمل الإضافي:</span> <span>+{p.overtimePay.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600 border-b border-slate-50"><span>المكافآت:</span> <span>+{p.bonuses.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600 border-b border-slate-50"><span>الإنتاج:</span> <span>+{p.production.toLocaleString()}</span></div>
               
               <div className="col-span-2 text-[10px] font-black text-rose-800 mb-1 mt-2 border-b">الاستقطاعات (-)</div>
               <div className="flex justify-between text-rose-600 border-b border-slate-50"><span>تأخير:</span> <span>-{p.lateDeduction.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600 border-b border-slate-50"><span>انصراف مبكر:</span> <span>-{p.earlyDepartureDeduction.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600 border-b border-slate-50"><span>أيام غياب:</span> <span>-{p.absenceDeduction.toLocaleString()} ({p.absenceDays} ي)</span></div>
               <div className="flex justify-between text-rose-600 border-b border-slate-50"><span>أقساط سلف:</span> <span>-{p.loanInstallment.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600 border-b border-slate-50"><span>خصومات أخرى:</span> <span>-{p.manualDeductions.toLocaleString()}</span></div>
               
               <div className="col-span-2 flex justify-between text-lg font-black text-indigo-950 pt-3 mt-3 border-t-2 border-indigo-900 items-baseline">
                 <span>صافي الراتب:</span>
                 <div className="text-right">
                    <span className="text-2xl">{p.netSalary.toLocaleString()}</span>
                    <span className="text-[10px] mr-2 opacity-60 font-black">{db.settings.currency}</span>
                 </div>
               </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-[8px] font-black opacity-40">
               <p>توقيع المحاسب</p>
               <p>توقيع الموظف</p>
            </div>
            <div className="mt-3 text-center border-t border-dashed pt-2">
              <p className="text-[6px] font-black text-slate-300">تطوير م. مهند أحمد - 0998171954</p>
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
    }, 600);
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
                   <label className="text-[11pt] font-black mb-1 block">نوع الإجازة</label>
                   <select className="w-full p-4 border-2 rounded-xl font-bold text-lg bg-slate-50" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                      <option value="annual">سنوية</option>
                      <option value="sick">مرضية</option>
                      <option value="emergency">طارئة</option>
                      <option value="unpaid">بدون راتب (مخصومة)</option>
                      <option value="marriage">زواج</option>
                      <option value="death">وفاة قريب</option>
                   </select>
                </div>
                <div className="flex items-center justify-between bg-slate-100 p-5 rounded-2xl border-2 col-span-2">
                   <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${data.isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                      <span className="text-[12pt] font-black text-slate-800">هل الإجازة مأجورة الراتب؟</span>
                   </div>
                   <button type="button" onClick={() => set({...data, isPaid: !data.isPaid})} className="transition-transform active:scale-90">
                      {data.isPaid ? <ToggleRight size={48} className="text-emerald-600" /> : <ToggleLeft size={48} className="text-slate-400" />}
                   </button>
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">تاريخ البدء</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold text-lg" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} />
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">تاريخ الانتهاء</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold text-lg" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} />
                </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black text-lg">{name}</td><td className="px-6 py-4 text-md">{i.type === 'annual' ? 'سنوية' : i.type === 'sick' ? 'مرضية' : i.type === 'unpaid' ? 'غير مأجورة' : i.type}</td><td className={`px-6 py-4 font-black ${i.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>{i.isPaid ? 'مأجورة' : 'مخصومة'}</td><td className="px-6 py-4">{i.startDate}</td><td className="px-6 py-4">{i.endDate}</td></>)} 
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
          tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'قيمة القسط', 'بداية التحصيل']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-4">
              <input type="number" placeholder="المبلغ" className="p-4 border rounded-xl font-black text-lg" value={data.amount || ''} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} />
              <input type="number" placeholder="الأقساط" className="p-4 border rounded-xl font-black text-lg" value={data.installmentsCount || ''} onChange={e => set({...data, installmentsCount: Number(e.target.value), monthlyInstallment: Number(data.amount || 0) / Number(e.target.value || 1)})} />
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black text-lg">{name}</td><td className="px-6 py-4 font-bold">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.installmentsCount}</td><td className="px-6 py-4 font-black text-indigo-700">{Math.round(i.monthlyInstallment).toLocaleString()}</td><td className="px-6 py-4">{i.collectionDate}</td></>)} 
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
            <div className="grid grid-cols-1 gap-6">
                <div>
                   <label className="text-[11pt] font-black mb-1 block">نوع السند المالي</label>
                   <select className="w-full p-4 border-2 rounded-xl font-black text-lg bg-slate-50 shadow-inner" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                      <option value="bonus">مكافأة تميز (+)</option>
                      <option value="production_incentive">حافز إنتاج (+)</option>
                      <option value="deduction">خصم مالي (-)</option>
                      <option value="payment">سلفة فورية / دفعة (-)</option>
                   </select>
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">المبلغ</label>
                   <input type="number" className="w-full p-5 border-2 border-indigo-100 rounded-2xl font-black text-3xl text-center text-indigo-700 focus:border-indigo-600 transition" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">السبب / البيان</label>
                   <textarea className="w-full p-4 border rounded-xl font-bold h-24 text-lg" value={data.reason} onChange={e => set({...data, reason: e.target.value})} placeholder="اكتب سبب السند هنا بالتفصيل..."></textarea>
                </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black text-lg">{name}</td><td className="px-6 py-4 font-bold">{i.type === 'bonus' ? 'مكافأة' : i.type === 'deduction' ? 'خصم' : i.type === 'production_incentive' ? 'حافز إنتاج' : 'سلفة'}</td><td className={`px-6 py-4 font-black text-xl ${i.type==='deduction'||i.type==='payment'?'text-rose-600':'text-indigo-700'}`}>{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} settings={db.settings} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
      case 'payroll': return (
        <div className="space-y-8 animate-in fade-in duration-700">
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center no-print text-right gap-4">
             <div>
                <h2 className="text-3xl font-black text-indigo-700">مسير رواتب الموظفين - {currentMonth}/{currentYear}</h2>
                <p className="text-slate-400 font-bold mt-1 text-sm">يتم الآن احتساب الغياب بناءً على نظام دوام ({db.settings.salaryCycle === 'weekly' ? db.settings.weeklyCycleDays : db.settings.monthlyCycleDays}) أيام المعتمد.</p>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-100 text-indigo-700 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-200 transition"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer size={20}/> طباعة المسير</button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden relative print:border-none">
             <div className="overflow-x-auto overflow-y-hidden">
               <table className="w-full text-center text-[15px] font-bold print:text-[12px]">
                 <thead className="bg-indigo-950 text-white font-black text-[16px] uppercase">
                   <tr>
                     <th className="px-6 py-6 text-right sticky right-0 bg-indigo-950 z-10 min-w-[220px]">الموظف</th>
                     <th className="px-2 py-6">الأساسي</th>
                     <th className="px-2 py-6">المواصلات</th>
                     <th className="px-2 py-6">حضور</th>
                     <th className="px-2 py-6">غياب</th>
                     <th className="px-2 py-6 text-emerald-300">مكافآت (+)</th>
                     <th className="px-2 py-6 text-emerald-300">إنتاج (+)</th>
                     <th className="px-2 py-6 text-emerald-300">إضافي (+)</th>
                     <th className="px-2 py-6 text-rose-300">تأخير (-)</th>
                     <th className="px-2 py-6 text-rose-300">سلف (-)</th>
                     <th className="px-2 py-6 text-rose-300">أخرى (-)</th>
                     <th className="px-6 py-6 text-center bg-indigo-900 min-w-[170px] shadow-2xl">صافي الراتب</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {currentPayrolls.map(p => (
                     <tr key={p.id} className="hover:bg-indigo-50/40 transition-all">
                       <td className="px-6 py-6 text-right font-black text-slate-900 dark:text-slate-100 whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10 border-l border-slate-50 text-xl">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                       <td className="px-2 py-6 text-slate-500 font-bold">{p.baseSalary.toLocaleString()}</td>
                       <td className="px-2 py-6 text-indigo-700 font-black">{p.transport.toLocaleString()}</td>
                       <td className="px-2 py-6 font-black text-slate-700">{p.workingDays} ي</td>
                       <td className={`px-2 py-6 text-lg ${p.absenceDays > 0 ? 'text-rose-600 font-black' : 'text-slate-300'}`}>{p.absenceDays} ي</td>
                       <td className="px-2 py-6 text-emerald-600 font-black">+{p.bonuses.toLocaleString()}</td>
                       <td className="px-2 py-6 text-emerald-600 font-black">+{p.production.toLocaleString()}</td>
                       <td className="px-2 py-6 text-emerald-600 font-bold">+{p.overtimePay.toLocaleString()}</td>
                       <td className={`px-2 py-6 ${p.lateDeduction > 0 ? 'text-rose-600' : 'text-slate-400'}`}>-{p.lateDeduction.toLocaleString()}</td>
                       <td className="px-2 py-6 text-rose-600 font-bold">-{p.loanInstallment.toLocaleString()}</td>
                       <td className="px-2 py-6 text-rose-600 font-bold">-{p.manualDeductions.toLocaleString()}</td>
                       <td className="px-6 py-6 font-black bg-indigo-50/80 dark:bg-indigo-900/10 text-[22px] text-indigo-900 dark:text-indigo-300 border-r border-indigo-100">
                          {p.netSalary.toLocaleString()}
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-indigo-950 text-white font-black text-[16px] border-t-2 border-indigo-900">
                    <tr>
                       <td colSpan={11} className="p-10 text-right text-2xl">إجمالي المستحقات النهائية للمنشأة (لهذا الشهر):</td>
                       <td className="p-10 text-center text-4xl text-emerald-300 shadow-inner">
                          {currentPayrolls.reduce((sum, p) => sum + p.netSalary, 0).toLocaleString()} <span className="text-sm">{db.settings.currency}</span>
                       </td>
                    </tr>
                 </tfoot>
               </table>
             </div>
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
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 p-6 font-cairo ${db.settings.theme === 'dark' ? 'dark' : ''}`} dir="rtl">
         <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border-4 border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
            
            <div className="text-center mb-12 relative z-10">
               <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-5xl font-black mb-6 shadow-2xl shadow-indigo-500/40">S</div>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">نظام SAM Pro</h2>
               <p className="text-slate-400 font-bold mt-2">نظام إدارة الموارد البشرية المتطور</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
               <div>
                  <label className="text-xs font-black text-slate-500 block mb-3 mr-3 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> اسم المستخدم
                  </label>
                  <div className="relative">
                    <input 
                      type="text" 
                      className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl shadow-inner dark:text-white" 
                      placeholder="اسم المستخدم (admin)"
                      value={loginForm.username} 
                      onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                    />
                  </div>
               </div>
               <div>
                  <label className="text-xs font-black text-slate-500 block mb-3 mr-3 uppercase tracking-widest flex items-center gap-2">
                    <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> كلمة المرور
                  </label>
                  <div className="relative">
                    <input 
                      type="password" 
                      className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl shadow-inner dark:text-white" 
                      placeholder="••••••"
                      value={loginForm.password} 
                      onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
                    />
                    <Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={24}/>
                  </div>
               </div>
               
               <div className="flex flex-col gap-4">
                 <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300">
                    دخـول للـنـظام
                 </button>
                 
                 <button type="button" onClick={() => setShowHint(!showHint)} className="flex items-center justify-center gap-2 text-indigo-600 font-bold text-sm hover:underline">
                   <HelpCircle size={16}/> هل نسيت كلمة المرور؟
                 </button>

                 {showHint && (
                   <div className="p-6 bg-indigo-50 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-800 rounded-[1.5rem] animate-in slide-in-from-top-4">
                     <p className="text-center text-xs font-black text-indigo-700 dark:text-indigo-400">
                       <span className="block opacity-60 mb-1">تلميح كلمة المرور:</span>
                       {db.settings.passwordHint || 'لا يوجد تلميح متاح حالياً. يرجى مراجعة المسؤول.'}
                     </p>
                   </div>
                 )}
               </div>
            </form>
         </div>
      </div>
    );
  }

  const PrintPortalContent = () => {
    const portalNode = document.getElementById('sam-print-portal');
    if (!individualPrintItem || !portalNode) return null;
    return createPortal(
      <div className="print-isolated-wrapper text-right w-full" dir="rtl">
        {individualPrintItem.type === 'vouchers' 
          ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
          : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
      </div>,
      portalNode
    );
  };

  return (
    <div className={db.settings.theme === 'dark' ? 'dark' : ''}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
        {renderActiveTab()}
        {individualPrintItem && (
          <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-center justify-center p-6 no-print overflow-y-auto">
            <div className="bg-white p-10 w-full max-w-5xl shadow-2xl rounded-[3.5rem] border-4 border-white/20 transition-all">
               <div className="flex justify-between items-center mb-10 border-b-2 pb-6 text-right">
                  <h3 className="font-black text-indigo-800 text-2xl">معاينة المستند الرسمي</h3>
                  <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition transform hover:rotate-90" disabled={isPrinting}><X size={44}/></button>
               </div>
               <div className="bg-white rounded-[2rem] text-right overflow-hidden border border-slate-100 p-2">
                  {individualPrintItem.type === 'vouchers' 
                    ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                    : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
               </div>
               <div className="flex gap-6 mt-12 no-print">
                  <button onClick={executePrintAction} disabled={isPrinting} className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {isPrinting ? <Loader2 className="animate-spin" size={32}/> : <Printer size={32}/>}
                    {isPrinting ? 'جاري التحضير...' : 'تـنـفـيذ الـطـباعـة'}
                  </button>
                  <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 py-6 rounded-[2.5rem] font-black text-xl text-slate-500 hover:bg-slate-200 transition">إغلاق</button>
               </div>
            </div>
          </div>
        )}
        <PrintPortalContent />
      </Layout>
    </div>
  );
};

export default App;