
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

  // إضافة فئات الطباعة للجسم عند فتح المعاينة
  useEffect(() => {
    if (individualPrintItem) {
      document.body.classList.add('printing-individual');
      // تقرير القسائم والوثائق الفردية يكون طولياً
      if (individualPrintItem.type === 'vouchers' || individualPrintItem.type === 'document' || individualPrintItem.type === 'warning') {
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

  // إضافة فئات الطباعة لصفحة الرواتب العامة
  useEffect(() => {
    if (activeTab === 'payroll' || activeTab === 'reports') {
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
        {db.settings.logo ? (
            <img src={db.settings.logo} className="h-14 w-auto object-contain" alt="Logo" />
        ) : (
            <div className="w-12 h-12 bg-slate-200 rounded-xl flex items-center justify-center font-black text-xl">S</div>
        )}
      </div>
      <div className="text-left flex-1 font-bold text-[8px] space-y-0.5">
        <p className="bg-slate-50 p-1 rounded px-2">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
        <p className="bg-slate-50 p-1 rounded px-2">الوقت: {new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد', position: 'غير محدد' };
    return (
      <div className="bg-white print-card w-full max-w-4xl mx-auto shadow-none relative overflow-visible">
        <PrintableHeader title={title} />
        <div className="space-y-6 relative z-10 text-right">
           <div className="flex justify-between items-center bg-slate-50 p-6 rounded-2xl border border-slate-100">
             <div className="flex-1">
                <span className="text-[8px] font-black text-indigo-400 block uppercase mb-1">الموظف:</span>
                <span className="text-xl font-black text-slate-900 leading-tight">{emp.name}</span>
                <p className="text-[10px] font-bold text-slate-500">{emp.position}</p>
             </div>
             <div className="text-left flex-1">
                <span className="text-[8px] font-black text-slate-400 block uppercase mb-1">القسم:</span>
                <span className="text-md font-bold text-indigo-700">{emp.department}</span>
             </div>
           </div>
           <div className="p-6 border-2 border-dashed border-slate-200 rounded-2xl">
              {type === 'production' ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[8px] font-black text-slate-400 block">الكمية:</span>
                      <span className="text-lg font-black text-slate-900">{data.piecesCount} قطعة</span>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[8px] font-black text-slate-400 block">السعر:</span>
                      <span className="text-lg font-black text-slate-900">{data.valuePerPiece?.toLocaleString()} {db.settings.currency}</span>
                    </div>
                  </div>
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 flex justify-between items-center">
                    <span className="text-md font-black text-indigo-900">الإجمالي:</span>
                    <span className="text-2xl font-black text-indigo-700">{data.totalValue?.toLocaleString()} {db.settings.currency}</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 min-h-[100px]">
                   <p className="text-md font-bold leading-relaxed">{data.reason || data.notes || 'بيان رسمي معتمد بناء على السجلات الجارية لنظام الموارد البشرية SAM.'}</p>
                   {type === 'financial' && (
                     <div className="p-4 bg-slate-50 rounded-xl border flex justify-between items-center">
                        <span className="font-black">المبلغ المقرر:</span>
                        <span className="text-xl font-black">{data.amount?.toLocaleString()} {db.settings.currency}</span>
                     </div>
                   )}
                </div>
              )}
           </div>
           <div className="grid grid-cols-2 gap-10 pt-10 px-4">
              <div className="text-center border-t border-slate-200 pt-2">
                 <p className="text-[10px] font-black">توقيع المسؤول</p>
              </div>
              <div className="text-center border-t border-slate-200 pt-2">
                 <p className="text-[10px] font-black">توقيع الموظف</p>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className="vouchers-grid-print grid grid-cols-2 gap-6 p-4">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-6 bg-white relative mb-4 rounded-2xl shadow-none break-inside-avoid">
            <div className="flex justify-between items-start border-b border-indigo-100 pb-2 mb-3">
               <div className="text-right">
                  <p className="text-[8px] font-black text-indigo-500 uppercase">قسيمة راتب معتمدة</p>
                  <h3 className="text-md font-black text-slate-900 leading-none">{emp?.name}</h3>
               </div>
               <div className="text-left text-[8px] font-bold text-slate-400">
                  <p>{p.month} / {p.year}</p>
               </div>
            </div>
            
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[8pt] font-bold">
               <div className="col-span-2 text-[8px] font-black text-indigo-800 border-b">المستحقات</div>
               <div className="flex justify-between text-slate-600"><span>الأساسي:</span> <span>{p.baseSalary.toLocaleString()}</span></div>
               <div className="flex justify-between text-emerald-600 font-black"><span>الصافي:</span> <span>{p.netSalary.toLocaleString()}</span></div>
               <div className="col-span-2 text-[8px] font-black text-rose-800 border-b mt-2">الاستقطاعات</div>
               <div className="flex justify-between text-rose-600"><span>غياب:</span> <span>{p.absenceDeduction.toLocaleString()}</span></div>
               <div className="flex justify-between text-rose-600"><span>أقساط:</span> <span>{p.loanInstallment.toLocaleString()}</span></div>
            </div>
            <div className="mt-4 pt-2 border-t border-dashed flex justify-between items-center text-[7px] font-black opacity-50">
               <span>المحاسب</span>
               <span>المستلم</span>
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
          <PrintableHeader title={`مسير رواتب الموظفين لشهر ${currentMonth} / ${currentYear}`} subtitle={`نظام الدوام: ${db.settings.salaryCycle === 'weekly' ? 'أسبوعي' : 'شهري'} - الدورة: ${db.settings.salaryCycle === 'weekly' ? db.settings.weeklyCycleDays : db.settings.monthlyCycleDays} يوم`} />
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center no-print text-right gap-4">
             <div className="flex items-center gap-4 text-right">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
                   <TrendingUp size={32}/>
                </div>
                <div>
                   <h2 className="text-3xl font-black text-indigo-700 leading-tight">مسير رواتب الموظفين</h2>
                   <div className="flex items-center gap-2 text-slate-400 font-bold mt-1 text-sm">
                      <AlertCircle size={14} className="text-indigo-500"/>
                      <span>يتم الحساب بناءً على الدورة المالية الثابتة لضمان دقة التقارير.</span>
                   </div>
                </div>
             </div>
             <div className="flex gap-3">
                <button onClick={() => setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls })} className="bg-indigo-100 text-indigo-700 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-200 transition"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-black transition"><Printer size={20}/> طباعة المسير</button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-visible relative print:border-none print:shadow-none print:w-full">
             <div className="overflow-x-auto print:overflow-visible">
               <table className="w-full text-center text-[13px] font-bold print:text-[8pt] print:w-full print:table-auto">
                 <thead className="bg-indigo-950 text-white font-black uppercase print:bg-slate-50 print:text-black">
                   <tr>
                     <th className="px-4 py-5 text-right sticky right-0 bg-indigo-950 z-10 min-w-[160px] print:min-w-[80px] print:bg-slate-50">الموظف</th>
                     <th className="px-1 py-5">الأساسي</th>
                     <th className="px-1 py-5">مواصلات</th>
                     <th className="px-1 py-5">حضور</th>
                     <th className="px-1 py-5">غياب</th>
                     <th className="px-1 py-5 text-emerald-300 print:text-black">مكافأة</th>
                     <th className="px-1 py-5 text-emerald-300 print:text-black">إنتاج</th>
                     <th className="px-1 py-5 text-emerald-300 print:text-black">إضافي</th>
                     <th className="px-1 py-5 text-rose-300 print:text-black">تأخير</th>
                     <th className="px-1 py-5 text-rose-300 print:text-black">سلف</th>
                     <th className="px-1 py-5 text-rose-300 print:text-black">أخرى</th>
                     <th className="px-4 py-5 text-center bg-indigo-900 min-w-[120px] shadow-2xl print:bg-slate-100 print:text-black">الصافي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {currentPayrolls.map(p => (
                     <tr key={p.id} className="hover:bg-indigo-50/40 transition-all border-b print:border-slate-100">
                       <td className="px-4 py-4 text-right font-black text-slate-900 dark:text-white whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10 border-l border-slate-50 text-lg print:text-[9pt] print:bg-white">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                       <td className="px-1 py-4 text-slate-500">{(p.baseSalary || 0).toLocaleString()}</td>
                       <td className="px-1 py-4 text-indigo-700">{(p.transport || 0).toLocaleString()}</td>
                       <td className="px-1 py-4 text-slate-700">{p.workingDays || 0} ي</td>
                       <td className={`px-1 py-4 ${p.absenceDays > 0 ? 'text-rose-600 font-black' : 'text-emerald-500 font-black'}`}>
                         {(p.absenceDays || 0) > 0 ? `${p.absenceDays} ي` : '0'}
                       </td>
                       <td className="px-1 py-4 text-emerald-600">+{(p.bonuses || 0).toLocaleString()}</td>
                       <td className="px-1 py-4 text-emerald-600">+{(p.production || 0).toLocaleString()}</td>
                       <td className="px-1 py-4 text-emerald-600">+{(p.overtimePay || 0).toLocaleString()}</td>
                       <td className={`px-1 py-4 ${(p.lateDeduction + p.earlyDepartureDeduction) > 0 ? 'text-rose-600' : 'text-slate-400'}`}>-{(p.lateDeduction + p.earlyDepartureDeduction).toLocaleString()}</td>
                       <td className="px-1 py-4 text-rose-600">-{(p.loanInstallment || 0).toLocaleString()}</td>
                       <td className="px-1 py-4 text-rose-600">-{(p.manualDeductions || 0).toLocaleString()}</td>
                       <td className="px-4 py-4 font-black bg-indigo-50/80 dark:bg-indigo-900/10 text-[18px] text-indigo-900 dark:text-indigo-300 border-r border-indigo-100 print:bg-white print:text-black print:text-[10pt]">
                          {(p.netSalary || 0).toLocaleString()}
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-indigo-950 text-white font-black text-[13px] border-t-4 border-indigo-900 print:bg-slate-100 print:text-black print:border-t-2 print:border-black">
                    <tr className="shadow-2xl">
                       <td className="px-4 py-6 text-right sticky right-0 bg-indigo-950 z-10 print:bg-slate-100 print:text-sm">إجمالي المسير:</td>
                       <td className="px-1 py-6">{payrollTotals.base.toLocaleString()}</td>
                       <td className="px-1 py-6">{payrollTotals.transport.toLocaleString()}</td>
                       <td className="px-1 py-6 text-indigo-300 print:text-black">{payrollTotals.workingDays} ي</td>
                       <td className="px-1 py-6 text-rose-300 print:text-black">{payrollTotals.absenceDays} ي</td>
                       <td className="px-1 py-6 text-emerald-400 print:text-black">+{payrollTotals.bonuses.toLocaleString()}</td>
                       <td className="px-1 py-6 text-emerald-400 print:text-black">+{payrollTotals.production.toLocaleString()}</td>
                       <td className="px-1 py-6 text-emerald-400 print:text-black">+{payrollTotals.overtime.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300 print:text-black">-{(payrollTotals.late + payrollTotals.early).toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300 print:text-black">-{payrollTotals.loans.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300 print:text-black">-{payrollTotals.manual.toLocaleString()}</td>
                       <td className="px-4 py-6 text-[22px] bg-indigo-900 text-white shadow-2xl print:bg-slate-200 print:text-black print:text-[14pt]">
                          {payrollTotals.net.toLocaleString()}
                       </td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
          
          <div className="hidden print:block mt-12 p-8 border-t border-slate-300">
             <div className="grid grid-cols-3 gap-10 text-center font-black text-[10px]">
                <div>توقيع المحاسب</div>
                <div>مدير الموارد البشرية</div>
                <div>المدير العام (الختم)</div>
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
         <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] p-12 shadow-2xl border-4 border-white/5 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
            
            <div className="text-center mb-12 relative z-10">
               <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-xl">S</div>
               <h2 className="text-3xl font-black text-slate-900 dark:text-white">نظام SAM Pro</h2>
               <p className="text-slate-400 font-bold mt-2">نظام إدارة الموارد البشرية المتطور</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
               <div>
                  <label className="text-[10px] font-black text-slate-500 block mb-2 mr-3 uppercase tracking-widest">اسم المستخدم</label>
                  <input type="text" className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl shadow-inner dark:text-white" value={loginForm.username} onChange={e => setLoginForm({...loginForm, username: e.target.value})} />
               </div>
               <div>
                  <label className="text-[10px] font-black text-slate-500 block mb-2 mr-3 uppercase tracking-widest">كلمة المرور</label>
                  <input type="password" className="w-full p-5 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl shadow-inner dark:text-white" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
               </div>
               <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-2xl shadow-xl hover:bg-indigo-700 transition-all">دخـول للـنـظام</button>
            </form>
         </div>
      </div>
    );
  }

  const PrintPortalContent = () => {
    const portalNode = document.getElementById('sam-print-portal');
    if (!individualPrintItem || !portalNode) return null;
    return createPortal(
      <div className="print-isolated-wrapper text-right w-full overflow-visible" dir="rtl">
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
            <div className="bg-white p-8 w-full max-w-5xl shadow-2xl rounded-[3rem] border-2 border-white/20 transition-all text-right">
               <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h3 className="font-black text-indigo-800 text-xl tracking-tight">معاينة المستند الرسمي للطباعة</h3>
                  <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition transform hover:rotate-90" disabled={isPrinting}><X size={32}/></button>
               </div>
               <div className="bg-white rounded-2xl overflow-visible border border-slate-100 p-4 min-h-[400px]">
                  {individualPrintItem.type === 'vouchers' 
                    ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                    : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
               </div>
               <div className="flex gap-4 mt-8 no-print">
                  <button onClick={executePrintAction} disabled={isPrinting} className="flex-[2] bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl shadow-xl flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all disabled:opacity-50">
                    {isPrinting ? <Loader2 className="animate-spin" size={24}/> : <Printer size={24}/>}
                    {isPrinting ? 'جاري التحضير...' : 'تـنـفـيذ الـطـباعـة'}
                  </button>
                  <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 py-5 rounded-[2rem] font-black text-lg text-slate-500 hover:bg-slate-200 transition">إغلاق</button>
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
