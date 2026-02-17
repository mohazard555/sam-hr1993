
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
import ManagerDashboard from './views/ManagerDashboard';
import { GenericModule } from './views/GenericModule';
import { loadDB, saveDB, DB } from './db/store';
import { Employee, PayrollRecord, FinancialEntry, Loan, LeaveRequest, ProductionEntry, AttendanceRecord, Warning, PrintHistoryRecord, PermissionRecord, SalaryCycle, User } from './types';
import { generatePayrollForRange, calculateTimeDiffMinutes } from './utils/calculations';
import { exportToExcel } from './utils/export';
import { Printer, X, ReceiptText, CalendarDays, Loader2, FileText, CheckCircle, Info, ShieldAlert, Package, Layers, Clock, TrendingUp, Lock, HelpCircle, ToggleLeft, ToggleRight, AlertCircle, Calendar, FileDown, LayoutPanelLeft, LayoutPanelTop, Zap, Timer, Filter, ShieldCheck, Award } from 'lucide-react';

type PrintType = 'production' | 'loan' | 'leave' | 'financial' | 'document' | 'vouchers' | 'report_attendance' | 'report_financial' | 'warning' | 'employee_list' | 'department_list' | 'permission';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showHint, setShowHint] = useState(false);
  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: PrintType, data: any} | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  const [payrollDateFrom, setPayrollDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [payrollDateTo, setPayrollDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [payrollCycleFilter, setPayrollCycleFilter] = useState<'all' | SalaryCycle>('all');

  const [archiveModes, setArchiveModes] = useState<Record<string, boolean>>({
    leaves: false, financials: false, loans: false, production: false, permissions: false
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

  const currentPayrolls = useMemo(() => {
    const rawPayrolls = generatePayrollForRange(
      payrollDateFrom, 
      payrollDateTo, 
      db.employees || [], 
      db.attendance || [], 
      db.loans || [], 
      db.financials || [], 
      db.production || [], 
      db.settings,
      db.leaves || [],
      db.permissions || []
    );

    if (payrollCycleFilter === 'all') return rawPayrolls;
    
    return rawPayrolls.filter(p => {
       const emp = db.employees.find(e => e.id === p.employeeId);
       const empCycle = emp?.cycleType || db.settings.salaryCycle;
       return empCycle === payrollCycleFilter;
    });
  }, [payrollDateFrom, payrollDateTo, db, payrollCycleFilter]);

  const payrollTotals = useMemo(() => {
    return currentPayrolls.reduce((acc, p) => ({
      base: acc.base + p.baseSalary,
      transport: acc.transport + p.transport,
      bonuses: acc.bonuses + p.bonuses,
      production: acc.production + p.production,
      overtime: acc.overtime + p.overtimePay,
      late: acc.late + p.lateDeduction,
      early: acc.early + p.earlyDepartureDeduction,
      permissions: acc.permissions + (p.permissionDeduction || 0),
      loans: acc.loans + p.loanInstallment,
      manual: acc.manual + p.manualDeductions,
      net: acc.net + p.netSalary
    }), { base: 0, transport: 0, bonuses: 0, production: 0, overtime: 0, late: 0, early: 0, permissions: 0, loans: 0, manual: 0, net: 0 });
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
    if(!confirm('هل أنت متأكد من الحذف؟')) return;
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

  const handleClearData = () => {
    if (confirm('تحذير نهائي: سيتم حذف كافة السجلات (موظفين، رواتب، حضور، إنتاج، سلف، ...) ولا يمكن التراجع عن هذا الإجراء. هل أنت متأكد؟')) {
      setDb(prev => ({
        ...prev,
        employees: [],
        attendance: [],
        permissions: [],
        loans: [],
        leaves: [],
        financials: [],
        production: [],
        warnings: [],
        payrolls: [],
        payrollHistory: [],
        printHistory: []
      }));
      alert('تم مسح كافة سجلات البيانات بنجاح.');
    }
  };

  const handleImport = (newDb: DB) => {
    setDb(newDb);
    setActiveTab('dashboard');
  };

  const handleUpdateAdmin = (updatedAdmin: Partial<User>) => {
    setDb(prev => ({
      ...prev,
      users: prev.users.map(u => u.id === 'admin-sam' ? { ...u, ...updatedAdmin } : u)
    }));
    alert('تم تحديث بيانات المسؤول بنجاح.');
  };

  const formatMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return `${hours}س ${mins}د`;
  };

  const renderActiveTab = () => {
    const isRtl = db.settings.language === 'ar';
    switch (activeTab) {
      case 'dashboard': return <Dashboard 
        employeesCount={db.employees.length} 
        todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} 
        totalLoans={db.loans.filter(l => !l.isArchived && l.remainingAmount > 0).reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} 
        totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} 
      />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} onPrintList={(list) => setIndividualPrintItem({ title: 'قائمة الموظفين الكاملة', type: 'employee_list', data: list })} />;
      case 'departments': return <Departments departments={db.departments || []} employees={db.employees || []} onUpdate={depts => setDb(prev => ({...prev, departments: [...depts]}))} onUpdateEmployee={emp => updateList('employees', emp)} onPrintDept={(name, emps) => setIndividualPrintItem({ title: `قائمة موظفي قسم ${name}`, type: 'department_list', data: emps })} />;
      case 'attendance': return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang={db.settings.language} onPrint={() => window.print()} />;
      
      case 'permissions': return (
        <GenericModule<PermissionRecord>
          title={isRtl ? "سجل الأذونات الساعية" : "Time Permissions Log"}
          lang={db.settings.language} employees={db.employees} items={db.permissions}
          companyName={db.settings.name} logo={db.settings.logo}
          archiveMode={archiveModes.permissions} onToggleArchive={() => setArchiveModes(p => ({...p, permissions: !p.permissions}))}
          onSave={i => updateList('permissions', i)} onDelete={id => deleteFromList('permissions', id)} onArchive={i => archiveItem('permissions', i)}
          onPrintIndividual={i => setIndividualPrintItem({title: "إذن خروج ساعي رسمي", type: 'permission', data: i})}
          initialData={{ date: new Date().toISOString().split('T')[0], hours: 0, exitTime: '10:00', returnTime: '11:00', reason: '' }}
          tableHeaders={isRtl ? ['الموظف', 'التاريخ', 'من (خروج)', 'إلى (عودة)', 'المدة', 'السبب'] : ['Employee', 'Date', 'Exit', 'Return', 'Duration', 'Reason']}
          renderForm={(data, set) => {
             const updateHours = (exit: string, back: string) => {
                const mins = calculateTimeDiffMinutes(back, exit);
                const hrs = mins > 0 ? Number((mins / 60).toFixed(2)) : 0;
                set({...data, exitTime: exit, returnTime: back, hours: hrs});
             };
             return (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-black mb-1">{isRtl ? 'تاريخ الإذن' : 'Permission Date'}</label>
                  <input type="date" className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:text-white" value={data.date} onChange={e => set({...data, date: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black mb-1 text-rose-600">{isRtl ? 'وقت الخروج' : 'Exit Time'}</label>
                    <input type="time" className="w-full p-3 border rounded-xl font-black dark:bg-slate-800 dark:text-white" value={data.exitTime} onChange={e => updateHours(e.target.value, data.returnTime || '00:00')} />
                  </div>
                  <div>
                    <label className="block text-xs font-black mb-1 text-emerald-600">{isRtl ? 'وقت العودة' : 'Return Time'}</label>
                    <input type="time" className="w-full p-3 border rounded-xl font-black dark:bg-slate-800 dark:text-white" value={data.returnTime} onChange={e => updateHours(data.exitTime || '00:00', e.target.value)} />
                  </div>
                </div>
                <div className="bg-indigo-50 dark:bg-indigo-900/30 p-4 rounded-2xl border-2 border-dashed border-indigo-200 text-center">
                   <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">المدة المحسوبة تلقائياً</p>
                   <p className="text-2xl font-black text-indigo-700">{data.hours} ساعة</p>
                </div>
                <div>
                  <label className="block text-xs font-black mb-1">{isRtl ? 'السبب (اختياري)' : 'Reason (Optional)'}</label>
                  <textarea className="w-full p-3 border rounded-xl dark:bg-slate-800 dark:text-white" value={data.reason} onChange={e => set({...data, reason: e.target.value})} placeholder={isRtl ? "اكتب سبب الإذن..." : "Reason..."} />
                </div>
              </div>
             );
          }}
          renderRow={(i, name) => (
            <>
              <td className="px-6 py-4 font-black">{name}</td>
              <td className="px-6 py-4">{i.date}</td>
              <td className="px-6 py-4 text-rose-500 font-bold">{i.exitTime}</td>
              <td className="px-6 py-4 text-emerald-600 font-bold">{i.returnTime}</td>
              <td className="px-6 py-4 font-black text-indigo-600">{i.hours} ساعة</td>
              <td className="px-6 py-4 text-slate-500 italic text-[10px]">{i.reason || '-'}</td>
            </>
          )}
        />
      );

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
            <div className="grid grid-cols-2 gap-6 text-right">
                <div className="col-span-2">
                   <label className="text-[11pt] font-black mb-1 block">نوع الإجازة</label>
                   <select className="w-full p-4 border-2 rounded-xl font-bold text-lg bg-slate-50 dark:bg-slate-800 dark:text-white shadow-inner" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                      <option value="annual">سنوية</option>
                      <option value="sick">مرضية</option>
                      <option value="emergency">طارئة</option>
                      <option value="unpaid">بدون راتب (مخصومة)</option>
                      <option value="marriage">زواج</option>
                      <option value="death">وفاة قريب</option>
                   </select>
                </div>
                <div className="flex items-center justify-between bg-slate-100 dark:bg-slate-800 p-5 rounded-2xl border-2 col-span-2">
                   <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${data.isPaid ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`}></div>
                      <span className="text-[12pt] font-black text-slate-800 dark:text-slate-200">هل الإجازة مأجورة الراتب؟</span>
                   </div>
                   <button type="button" onClick={() => set({...data, isPaid: !data.isPaid})} className="transition-transform active:scale-90">
                      {data.isPaid ? <ToggleRight size={48} className="text-emerald-600" /> : <ToggleLeft size={48} className="text-slate-400" />}
                   </button>
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">تاريخ البدء</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold text-lg dark:bg-slate-800 dark:text-white" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} />
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">تاريخ الانتهاء</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold text-lg dark:bg-slate-800 dark:text-white" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} />
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
          initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0], collectionDate: new Date().toISOString().split('T')[0], isImmediate: false }} 
          tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'قيمة القسط', 'بداية التحصيل']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-6 text-right">
              <div className="col-span-2">
                <label className="text-[11pt] font-black mb-1 block">إجمالي مبلغ السلفة</label>
                <input type="number" placeholder="المبلغ" className="w-full p-4 border rounded-xl font-black text-xl text-indigo-700 dark:bg-slate-800 dark:text-white" value={data.amount || ''} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value), monthlyInstallment: data.isImmediate ? Number(e.target.value) : data.monthlyInstallment})} />
              </div>
              
              <div className="col-span-2 flex items-center justify-between bg-rose-50 dark:bg-rose-900/10 p-5 rounded-2xl border-2 border-rose-100 dark:border-rose-900/30 shadow-inner">
                <div className="flex items-center gap-3">
                   <div className={`w-3 h-3 rounded-full ${data.isImmediate ? 'bg-rose-500 animate-pulse' : 'bg-slate-300'}`}></div>
                   <div>
                      <span className="text-[12pt] font-black text-rose-800 dark:text-rose-400 block">تحصيل فوري من الراتب القادم؟</span>
                      <span className="text-[10px] font-bold text-slate-500 italic block leading-none mt-1">* سيتم خصم كامل السلفة فوراً ولن تبقى ديناً على الموظف.</span>
                   </div>
                </div>
                <button type="button" onClick={() => set({...data, isImmediate: !data.isImmediate, installmentsCount: 1, monthlyInstallment: data.amount || 0})} className="transition-transform active:scale-90">
                   {data.isImmediate ? <ToggleRight size={48} className="text-rose-600" /> : <ToggleLeft size={48} className="text-slate-400" />}
                </button>
              </div>

              {!data.isImmediate && (
                <>
                  <div>
                    <label className="text-[11pt] font-black mb-1 block">قيمة القسط</label>
                    <input type="number" placeholder="قيمة القسط" className="w-full p-4 border rounded-xl font-black text-xl text-indigo-700 dark:bg-slate-800 dark:text-white" value={data.monthlyInstallment || ''} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[11pt] font-black mb-1 block">عدد الأقساط</label>
                    <input type="number" className="w-full p-4 border rounded-xl font-bold text-lg dark:bg-slate-800 dark:text-white" value={data.installmentsCount || ''} onChange={e => set({...data, installmentsCount: Number(e.target.value)})} />
                  </div>
                </>
              )}
              
              <div className="col-span-2">
                <label className="text-[11pt] font-black mb-1 block">تاريخ منح السلفة</label>
                <input type="date" className="w-full p-4 border rounded-xl font-bold text-lg dark:bg-slate-800 dark:text-white" value={data.date || ''} onChange={e => set({...data, date: e.target.value})} />
              </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black text-lg">{name}</td><td className="px-6 py-4 font-bold">{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.isImmediate ? 'فوري' : i.installmentsCount}</td><td className="px-6 py-4 font-black text-indigo-700">{Math.round(i.monthlyInstallment).toLocaleString()}</td><td className="px-6 py-4 text-xs font-bold text-slate-500">{i.isImmediate ? 'الراتب القادم' : i.collectionDate}</td></>)} 
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
                   <select className="w-full p-4 border-2 rounded-xl font-black text-lg bg-slate-50 dark:bg-slate-800 dark:text-white shadow-inner" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                      <option value="bonus">مكافأة تميز (+)</option>
                      <option value="production_incentive">حافز إنتاج (+)</option>
                      <option value="deduction">خصم مالي (-)</option>
                      <option value="payment">سلفة فورية / دفعة (-)</option>
                   </select>
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">المبلغ</label>
                   <input type="number" className="w-full p-5 border-2 border-indigo-100 rounded-2xl font-black text-3xl text-center text-indigo-700 dark:text-white focus:border-indigo-600 transition dark:bg-slate-800" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">السبب / البيان</label>
                   <textarea className="w-full p-4 border rounded-xl font-bold h-24 text-lg dark:bg-slate-800 dark:text-white" value={data.reason} onChange={e => set({...data, reason: e.target.value})} placeholder="اكتب سبب السند هنا بالتفصيل..."></textarea>
                </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black text-lg">{name}</td><td className="px-6 py-4 font-bold">{i.type === 'bonus' ? 'مكافأة' : i.type === 'deduction' ? 'خصم' : i.type === 'production_incentive' ? 'حافز إنتاج' : 'سلفة'}</td><td className={`px-6 py-4 font-black text-xl ${i.type==='deduction'||i.type==='payment'?'text-rose-600':'text-indigo-700'}`}>{i.amount.toLocaleString()}</td><td className="px-6 py-4">{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} settings={db.settings} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
      
      case 'payroll': return (
        <div className="space-y-8 animate-in fade-in duration-700">
          {/* ترويسة الطباعة الرسمية لمسير الرواتب */}
          <div className="hidden print:block text-right mb-8 pb-6 border-b-4 border-indigo-900">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-black text-slate-900">{db.settings.name}</h1>
                <h2 className="text-xl font-bold text-indigo-700 mt-2">
                  {payrollCycleFilter === 'weekly' ? 'مسير الرواتب الأسبوعي' : 
                   payrollCycleFilter === 'monthly' ? 'مسير الرواتب الشهري' : 
                   'مسير الرواتب العام'} 
                  (من {payrollDateFrom} إلى {payrollDateTo})
                </h2>
              </div>
              {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" alt="Logo" />}
            </div>
            <div className="flex justify-between items-center mt-4 text-xs font-bold text-slate-400">
              <p>تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
              <p>العملة المعتمدة: {db.settings.currency}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl gap-6 mb-8">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
                   <TrendingUp size={28}/>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-6">
                   <div>
                      <h2 className="text-2xl font-black text-indigo-700 dark:text-white">تصفية مسير الرواتب</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex flex-col">
                           <label className="text-[10px] font-black mr-2 dark:text-slate-400">من تاريخ</label>
                           <input type="date" className="p-2 border rounded-xl font-bold text-xs outline-none focus:border-indigo-600 dark:bg-slate-800 dark:text-white" value={payrollDateFrom} onChange={e => setPayrollDateFrom(e.target.value)} />
                        </div>
                        <div className="flex flex-col">
                           <label className="text-[10px] font-black mr-2 dark:text-slate-400">إلى تاريخ</label>
                           <input type="date" className="p-2 border rounded-xl font-bold text-xs outline-none focus:border-indigo-600 dark:bg-slate-800 dark:text-white" value={payrollDateTo} onChange={e => setPayrollDateTo(e.target.value)} />
                        </div>
                      </div>
                   </div>
                   
                   <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700">
                      <label className="text-[10px] font-black text-slate-400 block mb-1 mr-2 uppercase flex items-center gap-1"><Filter size={10}/> تصنيف الدوام</label>
                      <div className="flex gap-1">
                         <button onClick={() => setPayrollCycleFilter('all')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${payrollCycleFilter === 'all' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>الكل</button>
                         <button onClick={() => setPayrollCycleFilter('monthly')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${payrollCycleFilter === 'monthly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>شهري</button>
                         <button onClick={() => setPayrollCycleFilter('weekly')} className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${payrollCycleFilter === 'weekly' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-200'}`}>أسبوعي</button>
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={handleExportPayrollExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg"><FileDown size={20}/> Excel</button>
                <button onClick={() => { setPrintOrientation('landscape'); setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls }); }} className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-200 transition"><ReceiptText size={20}/> القسائم</button>
                <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer size={20}/> طباعة</button>
             </div>
          </div>
          
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden relative print:border-none print:shadow-none print:w-full">
             <div className="overflow-x-auto print:overflow-visible">
               <table className="w-full text-center text-[13px] font-bold print:text-[10px] print:w-full">
                 <thead className="bg-indigo-950 text-white font-black text-[15px] uppercase">
                   <tr>
                     <th className="px-4 py-5 text-right sticky right-0 bg-indigo-950 z-10 min-w-[180px] print:min-w-[120px]">الموظف</th>
                     <th className="px-1 py-5">الأساسي</th>
                     <th className="px-1 py-5">مواصلات</th>
                     <th className="px-1 py-5">حضور</th>
                     <th className="px-1 py-5">غياب</th>
                     <th className="px-1 py-5 text-emerald-300">مكافأة</th>
                     <th className="px-1 py-5 text-emerald-300">إنتاج</th>
                     <th className="px-1 py-5 text-emerald-300">إضافي</th>
                     <th className="px-1 py-5 text-rose-300">تأخير</th>
                     <th className="px-1 py-5 text-rose-300">انصراف</th>
                     <th className="px-1 py-5 text-rose-300">أذونات</th>
                     <th className="px-1 py-5 text-rose-300">سلف</th>
                     <th className="px-1 py-5 text-rose-300">أخرى</th>
                     <th className="px-4 py-5 text-center bg-indigo-900 min-w-[130px] shadow-2xl print:bg-slate-200 print:text-black">الصافي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {currentPayrolls.map(p => (
                     <tr key={p.id} className="hover:bg-indigo-50/40 transition-all border-b print:border-slate-300">
                       <td className="px-4 py-5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10 border-l border-slate-50 text-lg print:text-[11px]">
                          <div>{db.employees.find(e => e.id === p.employeeId)?.name}</div>
                          <div className="text-[8px] font-black text-indigo-500 uppercase tracking-widest no-print">
                             {db.employees.find(e => e.id === p.employeeId)?.cycleType === 'weekly' ? 'أسبوعي' : 'شهري'}
                          </div>
                       </td>
                       <td className="px-1 py-5 text-slate-500 dark:text-slate-400">{p.baseSalary.toLocaleString()}</td>
                       <td className="px-1 py-5 text-indigo-700 dark:text-indigo-400">{p.transport.toLocaleString()}</td>
                       <td className="px-1 py-5 text-slate-700 dark:text-slate-300">{p.workingDays} ي</td>
                       <td className={`px-1 py-5 ${p.absenceDays > 0 ? 'text-rose-600 font-black' : 'text-emerald-500 font-black'}`}>
                         {p.absenceDays > 0 ? `${p.absenceDays} ي` : '0'}
                       </td>
                       <td className="px-1 py-5 text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                       <td className="px-1 py-5 text-emerald-600">
                          <div className="flex flex-col items-center">
                            <span className="text-[9px] font-black opacity-60">
                                {p.productionPieces || 0} ط × {p.productionPieces > 0 ? Math.round(p.production / p.productionPieces).toLocaleString() : 0}
                            </span>
                            <span>+{p.production.toLocaleString()}</span>
                          </div>
                       </td>
                       <td className="px-1 py-5 text-emerald-600">
                         <div className="flex flex-col items-center">
                           <span className="text-[9px] font-black opacity-60">{formatMinutes(p.overtimeMinutes)}</span>
                           <span>+{p.overtimePay.toLocaleString()}</span>
                         </div>
                       </td>
                       <td className={`px-1 py-5 ${p.lateDeduction > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                         <div className="flex flex-col items-center">
                           <span className="text-[9px] font-black opacity-60">{formatMinutes(p.lateMinutes)}</span>
                           <span>-{p.lateDeduction.toLocaleString()}</span>
                         </div>
                       </td>
                       <td className={`px-1 py-5 ${p.earlyDepartureDeduction > 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                         <div className="flex flex-col items-center">
                           <span className="text-[9px] font-black opacity-60">{formatMinutes(p.earlyDepartureMinutes)}</span>
                           <span>-{p.earlyDepartureDeduction.toLocaleString()}</span>
                         </div>
                       </td>
                       <td className={`px-1 py-5 ${(p.permissionHours || 0) > 0 ? 'text-rose-600 font-black' : 'text-slate-400'}`}>
                         <div className="flex flex-col items-center">
                           <span className="text-[9px] font-black opacity-60">{p.permissionHours || 0} س</span>
                           <span>-{(p.permissionDeduction || 0).toLocaleString()}</span>
                         </div>
                       </td>
                       <td className="px-1 py-5 text-rose-600">-{p.loanInstallment.toLocaleString()}</td>
                       <td className="px-1 py-5 text-rose-600">-{p.manualDeductions.toLocaleString()}</td>
                       <td className="px-4 py-5 font-black bg-indigo-50/80 dark:bg-indigo-900/10 text-[18px] text-indigo-900 dark:text-indigo-300 border-r border-indigo-100 print:bg-white print:text-black print:text-[12px]">
                          {p.netSalary.toLocaleString()}
                       </td>
                     </tr>
                   ))}
                 </tbody>
                 <tfoot className="bg-indigo-950 text-white font-black text-[13px] border-t-4 border-indigo-900 print:bg-slate-100 print:text-black">
                    <tr className="shadow-2xl">
                       <td className="px-4 py-6 text-right sticky right-0 bg-indigo-950 z-10 print:bg-slate-100">إجمالي المسير:</td>
                       <td className="px-1 py-6">{payrollTotals.base.toLocaleString()}</td>
                       <td className="px-1 py-6">{payrollTotals.transport.toLocaleString()}</td>
                       <td colSpan={2} className="px-1 py-6 text-slate-400">---</td>
                       <td className="px-1 py-6 text-emerald-400">+{payrollTotals.bonuses.toLocaleString()}</td>
                       <td className="px-1 py-6 text-emerald-400">+{payrollTotals.production.toLocaleString()}</td>
                       <td className="px-1 py-6 text-emerald-400">+{payrollTotals.overtime.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.late.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.early.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.permissions.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.loans.toLocaleString()}</td>
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.manual.toLocaleString()}</td>
                       <td className="px-4 py-6 text-[22px] bg-indigo-900 text-white shadow-2xl print:bg-slate-300 print:text-black print:text-[14px]">
                          {payrollTotals.net.toLocaleString()}
                       </td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
          
          <div className="hidden print:block mt-12 p-8 border-t-2 border-dashed border-slate-300">
             <div className="grid grid-cols-3 gap-10 text-center font-black text-sm">
                <div>توقيع المحاسب العام</div>
                <div>توقيع مدير الموارد البشرية</div>
                <div>توقيع المدير المفوض</div>
             </div>
          </div>
        </div>
      );
      case 'documents': return <PrintForms employees={db.employees || []} attendance={db.attendance || []} financials={db.financials || []} warnings={db.warnings || []} leaves={db.leaves || []} loans={db.loans || []} permissions={db.permissions} settings={db.settings} printHistory={db.printHistory || []} onPrint={(doc) => setIndividualPrintItem(doc as any)} />;
      case 'manager': return <ManagerDashboard />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={handleUpdateAdmin} onImport={handleImport} onRunArchive={() => {}} onClearData={handleClearData} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      default: return null;
    }
  };

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: PrintType, data: any }) => {
    const emp = db.employees.find(e => e.id === data.employeeId);
    
    const PrintHeader = () => (
      <div className="flex justify-between items-start border-b-4 border-indigo-900 pb-6 mb-8 text-right">
        <div>
          <h1 className="text-3xl font-black text-indigo-950 mb-1">{db.settings.name}</h1>
          <p className="text-indigo-600 font-black text-sm uppercase tracking-widest">{title}</p>
          <div className="mt-2 text-[10px] font-bold text-slate-500">
             <p>{db.settings.address}</p>
             <p>تاريخ الصدور: {new Date().toLocaleDateString('ar-EG')}</p>
          </div>
        </div>
        {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" />}
      </div>
    );

    const Signatures = () => (
      <div className="mt-16 pt-8 border-t-2 border-dashed flex justify-between items-center text-center font-black text-xs text-slate-700">
         <div className="flex-1">توقيع الموظف</div>
         <div className="flex-1">توقيع المدير المباشر</div>
         <div className="flex-1">ختم المؤسسة</div>
      </div>
    );

    if (type === 'employee_list' || type === 'department_list') {
      const employeesList = (data || []) as Employee[];
      return (
        <div className="p-4 w-full bg-white min-h-[95vh] flex flex-col border-4 border-indigo-950 rounded-[2rem] overflow-hidden">
           <PrintHeader />
          <table className="w-full border-collapse text-[7px] text-right font-bold">
             <thead className="bg-indigo-950 text-white font-black">
                <tr>
                  <th className="p-1 border">#</th><th className="p-1 border">الاسم</th><th className="p-1 border">المنصب</th><th className="p-1 border">القسم</th><th className="p-1 border">العنوان</th><th className="p-1 border">الأساسي</th><th className="p-1 border">المواصلات</th><th className="p-1 border">الدوام</th><th className="p-1 border">الهوية</th><th className="p-1 border">تاريخ التعيين</th>
                </tr>
             </thead>
             <tbody className="divide-y">
                {employeesList.map((emp, idx) => (
                  <tr key={emp.id} className="hover:bg-slate-50 border-x">
                    <td className="p-1 border">{idx + 1}</td><td className="p-1 border font-black whitespace-nowrap">{emp.name}</td><td className="p-1 border">{emp.position}</td><td className="p-1 border">{emp.department}</td><td className="p-1 border text-[6px]">{emp.address || '-'}</td><td className="p-1 border">{emp.baseSalary.toLocaleString()}</td><td className="p-1 border">{emp.transportAllowance.toLocaleString()}</td><td className="p-1 border">{emp.cycleType === 'weekly' ? 'أسبوعي' : 'شهري'}</td><td className="p-1 border">{emp.nationalId}</td><td className="p-1 border">{emp.joinDate}</td>
                  </tr>
                ))}
             </tbody>
          </table>
          <div className="mt-auto pt-4 border-t-2 border-dashed flex justify-between items-center text-[7px] text-slate-400 font-bold uppercase tracking-widest">
             <p>إجمالي الموظفين: {employeesList.length}</p><p>SAM HRMS PRO - CERTIFIED REPORT</p>
          </div>
        </div>
      );
    }

    return (
      <div className="p-10 w-full bg-white min-h-[95vh] flex flex-col border-4 border-indigo-950 rounded-[2rem] text-right">
          <PrintHeader />
          <div className="flex-1 space-y-10">
             <div className="bg-slate-50 p-8 rounded-[2rem] border-2 border-slate-100 grid grid-cols-2 gap-y-6">
                <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">اسم الموظف</p><p className="text-xl font-black text-indigo-950">{emp?.name || data.employeeName}</p></div>
                <div><p className="text-[10px] font-black text-slate-400 uppercase mb-1">المنصب</p><p className="text-lg font-bold text-slate-700">{emp?.position} - {emp?.department}</p></div>
                <div className="col-span-2 border-t pt-4 text-left font-mono text-xs text-slate-400">REF: {data.id?.toUpperCase() || 'NEW-DOC'}</div>
             </div>

             <div className="p-8 bg-white border-2 border-dashed border-slate-200 rounded-[2rem]">
                {type === 'production' && (
                  <div className="space-y-6">
                     <h4 className="text-2xl font-black text-indigo-700 mb-8 text-center border-b pb-4">إشعار إنتاجية معتمد</h4>
                     <div className="grid grid-cols-2 gap-8 text-center">
                        <div className="bg-slate-50 p-6 rounded-2xl border">
                           <span className="block text-xs font-black text-slate-400 mb-1">تاريخ العملية</span>
                           <span className="text-xl font-black">{data.date}</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border">
                           <span className="block text-xs font-black text-slate-400 mb-1">الكمية المنجزة</span>
                           <span className="text-xl font-black">{data.piecesCount} قطعة</span>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-2xl border">
                           <span className="block text-xs font-black text-slate-400 mb-1">سعر القطعة</span>
                           <span className="text-xl font-black">{data.valuePerPiece?.toLocaleString()} {db.settings.currency}</span>
                        </div>
                        <div className="bg-indigo-600 text-white p-6 rounded-2xl shadow-xl flex flex-col justify-center">
                           <span className="block text-xs font-black opacity-60 mb-1">إجمالي المستحق</span>
                           <span className="text-3xl font-black">{data.totalValue?.toLocaleString()} {db.settings.currency}</span>
                        </div>
                     </div>
                     <div className="mt-8 p-6 bg-slate-50 border rounded-2xl font-bold italic">
                        <p className="text-xs font-black text-slate-400 mb-2 underline">البيان / الملاحظات:</p>
                        <p className="text-lg">"{data.notes || 'لا يوجد ملاحظات إضافية'}"</p>
                     </div>
                  </div>
                )}
                {type === 'permission' && (
                   <div className="space-y-6 text-center">
                      <h4 className="text-2xl font-black text-indigo-700 mb-8 border-b pb-4">إذن خروج ساعي رسمي</h4>
                      <div className="grid grid-cols-2 gap-8">
                         <div className="bg-slate-50 p-4 rounded-xl">
                            <span className="block text-xs font-black text-slate-400 mb-1">وقت الخروج</span>
                            <span className="text-3xl font-black text-rose-600">{data.exitTime}</span>
                         </div>
                         <div className="bg-slate-50 p-4 rounded-xl">
                            <span className="block text-xs font-black text-slate-400 mb-1">وقت العودة</span>
                            <span className="text-3xl font-black text-emerald-600">{data.returnTime}</span>
                         </div>
                         <div className="col-span-2 bg-indigo-600 text-white p-6 rounded-2xl shadow-lg">
                            <span className="block text-xs font-black opacity-60 mb-1">إجمالي الساعات المعتمدة</span>
                            <span className="text-4xl font-black">{data.hours} ساعة</span>
                         </div>
                      </div>
                      <div className="text-right mt-10 p-6 border rounded-2xl bg-slate-50/50">
                         <p className="text-xs font-black text-slate-400 mb-2 underline">سبب الإذن:</p>
                         <p className="text-lg font-bold italic">"{data.reason || 'مهمة عمل رسمية / ظرف طارئ'}"</p>
                      </div>
                   </div>
                )}
                {type === 'leave' && (
                  <div className="space-y-6">
                     <h4 className="text-2xl font-black text-indigo-700 mb-8 text-center border-b pb-4">إشعار إجازة معتمد</h4>
                     <div className="grid grid-cols-2 gap-6 text-lg font-bold">
                        <div className="bg-slate-50 p-4 rounded-xl"><span>نوع الإجازة:</span> <span className="font-black text-indigo-600">{data.type}</span></div>
                        <div className="bg-slate-50 p-4 rounded-xl"><span>الحالة المالية:</span> <span className={`font-black ${data.isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>{data.isPaid ? 'مأجورة' : 'غير مأجورة'}</span></div>
                        <div className="col-span-2 bg-indigo-50 p-6 rounded-2xl text-center">
                           <p className="text-sm font-black text-slate-400 mb-2">النطاق الزمني</p>
                           <p className="text-xl font-black">من {data.startDate} حتى {data.endDate}</p>
                        </div>
                     </div>
                  </div>
                )}
                {type === 'loan' && (
                  <div className="space-y-6">
                     <h4 className="text-2xl font-black text-emerald-700 mb-8 text-center border-b pb-4">سند سلفة مالية</h4>
                     <div className="text-center p-10 bg-emerald-50 rounded-[3rem] border-2 border-emerald-100">
                        <p className="text-xs font-black text-emerald-600 uppercase mb-2">المبلغ المعتمد</p>
                        <p className="text-5xl font-black text-emerald-900">{data.amount?.toLocaleString()} {db.settings.currency}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-6 mt-8">
                        <div className="bg-slate-50 p-5 rounded-2xl border text-center">
                           <span className="block text-[10px] font-black text-slate-400 mb-1">تاريخ منح السلفة</span>
                           <span className="text-lg font-black">{data.date}</span>
                        </div>
                        <div className="bg-slate-50 p-5 rounded-2xl border text-center">
                           <span className="block text-[10px] font-black text-slate-400 mb-1">بداية التحصيل</span>
                           <span className="text-lg font-black">{data.isImmediate ? 'الراتب القادم (فوري)' : data.collectionDate}</span>
                        </div>
                        <div className="col-span-2 bg-indigo-50 p-6 rounded-[2rem] border-2 border-dashed border-indigo-200 text-center font-bold">
                           {data.isImmediate ? (
                             <p className="text-indigo-900">سيتم تحصيل كامل المبلغ <span className="font-black">دفعة واحدة</span> من أقرب مسير رواتب.</p>
                           ) : (
                             <p className="text-indigo-900">يتم تحصيل المبلغ على <span className="text-indigo-600 font-black">{data.installmentsCount} أقساط</span>، بقيمة <span className="text-indigo-600 font-black">{data.monthlyInstallment?.toLocaleString()}</span> للقسط الواحد.</p>
                           )}
                        </div>
                        <div className="col-span-2 bg-rose-50 p-4 rounded-xl text-center border">
                           <span className="block text-[10px] font-black text-rose-600 uppercase mb-1">الرصيد المتبقي للذمة</span>
                           <span className="text-2xl font-black text-rose-900">{data.remainingAmount?.toLocaleString()} {db.settings.currency}</span>
                        </div>
                     </div>
                  </div>
                )}
                {type === 'financial' && (
                  <div className="space-y-6">
                     <h4 className="text-2xl font-black text-indigo-700 mb-8 text-center border-b pb-4">سند صرف / خصم مالي</h4>
                     <div className={`p-10 rounded-[3rem] text-center border-4 ${data.type === 'deduction' ? 'bg-rose-50 border-rose-100 text-rose-900' : 'bg-emerald-50 border-emerald-100 text-emerald-900'}`}>
                        <p className="text-xs font-black uppercase mb-2">قيمة السند</p>
                        <p className="text-5xl font-black">{data.amount?.toLocaleString()} {db.settings.currency}</p>
                     </div>
                     <div className="p-8 bg-slate-50 rounded-2xl font-bold">
                        <p className="text-xs font-black text-slate-400 mb-2 underline">البيان:</p>
                        <p className="text-xl">"{data.reason}"</p>
                     </div>
                  </div>
                )}
                {type === 'warning' && (
                   <div className="space-y-8">
                      <div className="flex items-center gap-6 text-rose-600">
                         <ShieldAlert size={60}/>
                         <div>
                            <h4 className="text-3xl font-black">قرار إنذار رسمي</h4>
                            <p className="text-sm font-bold opacity-80">تحذير مسجل في الملف السلوكي للموظف</p>
                         </div>
                      </div>
                      <div className="p-10 bg-rose-50 rounded-[3rem] border-4 border-rose-100 text-rose-900 font-bold leading-relaxed text-xl">
                         <p className="text-xs font-black uppercase mb-4 text-rose-600 underline">تفاصيل الواقعة / المخالفة:</p>
                         "{data.reason}"
                      </div>
                   </div>
                )}
                {type === 'document' && (
                  <div className="p-10 text-center font-black text-slate-400 italic">
                     {data.notes || 'وثيقة رسمية صادرة ومعتمدة من النظام السحابي لمؤسسة SAM HRMS'}
                  </div>
                )}
             </div>
          </div>
          <Signatures />
      </div>
    );
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className={`vouchers-grid-print grid ${printOrientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 p-4`} dir="rtl">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-6 bg-white relative mb-4 rounded-3xl">
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-4">
               <div className="flex items-center gap-3">
                  {db.settings.logo && <img src={db.settings.logo} className="h-8 w-auto object-contain" alt="Logo" />}
                  <div className="text-right">
                     <p className="text-[10px] font-black text-indigo-600 uppercase">قسيمة راتب معتمدة</p>
                     <h3 className="text-lg font-black text-slate-900">{emp?.name}</h3>
                     <p className="text-[9px] font-bold text-slate-500 mt-1">{emp?.position} - {emp?.department} ({ (emp?.cycleType || db.settings.salaryCycle) === 'weekly' ? 'أسبوعي' : 'شهري' })</p>
                  </div>
               </div>
               <div className="text-left text-[9px] font-bold text-slate-400">
                  <p>الفترة: {p.month} / {p.year}</p>
                  <p>تاريخ الطباعة: {new Date().toLocaleDateString('ar-EG')}</p>
               </div>
            </div>
            
            <div className="space-y-1.5 text-[11px] font-bold">
               <div className="bg-slate-50 p-2 rounded-xl mb-3 space-y-1 border border-slate-100">
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-black">الراتب التعاقدي:</span>
                    <span className="font-black text-indigo-700">{p.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700">
                    <span className="font-black">ساعات العمل الفعلية:</span>
                    <span className="font-black text-indigo-700">{p.workingHours.toFixed(1)} ساعة</span>
                  </div>
               </div>

               <div className="text-[#00a693] font-black border-b pb-1 mb-1">الإضافات (+)</div>
               <div className="flex justify-between items-center text-[#00a693]">
                 <span className="font-black">بدل مواصلات:</span>
                 <span className="font-black">{p.transport.toLocaleString()}+</span>
               </div>
               <div className="flex justify-between items-center text-[#00a693]">
                 <span className="font-black">العمل الإضافي ({formatMinutes(p.overtimeMinutes)}):</span>
                 <span className="font-black">{p.overtimePay.toLocaleString()}+</span>
               </div>
               <div className="flex justify-between items-center text-[#00a693]">
                 <span className="font-black">المكافآت:</span>
                 <span className="font-black">{p.bonuses.toLocaleString()}+</span>
               </div>
               <div className="flex justify-between items-center text-[#00a693]">
                 <span className="font-black">الإنتاج ({p.productionPieces} ط × {p.productionPieces > 0 ? Math.round(p.production/p.productionPieces).toLocaleString() : 0}):</span>
                 <span className="font-black">{p.production.toLocaleString()}+</span>
               </div>
               
               <div className="text-[#d91e5b] font-black border-t pt-2 mt-2">الاستقطاعات (-)</div>
               <div className="flex justify-between items-center text-[#d91e5b]">
                 <span className="font-black">تأخير ({formatMinutes(p.lateMinutes)}):</span>
                 <span className="font-black">{p.lateDeduction.toLocaleString()}-</span>
               </div>
               <div className="flex justify-between items-center text-[#d91e5b]">
                 <span className="font-black">انصراف مبكر ({formatMinutes(p.earlyDepartureMinutes)}):</span>
                 <span className="font-black">{p.earlyDepartureDeduction.toLocaleString()}-</span>
               </div>
               <div className="flex justify-between items-center text-[#d91e5b]">
                 <span className="font-black">خصم أذونات ({p.permissionHours} س):</span>
                 <span className="font-black">{(p.permissionDeduction || 0).toLocaleString()}-</span>
               </div>
               <div className="flex justify-between items-center text-[#d91e5b]">
                 <span className="font-black">أيام غياب ({p.absenceDays} ي):</span>
                 <span className="font-black">{p.absenceDeduction.toLocaleString()}-</span>
               </div>
               <div className="flex justify-between items-center text-[#d91e5b]">
                 <span className="font-black">أقساط سلف:</span>
                 <span className="font-black">{p.loanInstallment.toLocaleString()}-</span>
               </div>
               <div className="flex justify-between items-center text-[#d91e5b]">
                 <span className="font-black">خصومات أخرى:</span>
                 <span className="font-black">{p.manualDeductions.toLocaleString()}-</span>
               </div>
               
               <div className="flex justify-between text-lg font-black text-indigo-900 pt-3 mt-3 border-t-2 border-indigo-900">
                 <span>صافي الراتب:</span>
                 <div className="text-left">
                    <span>{p.netSalary.toLocaleString()}</span>
                    <span className="text-[10px] mr-1 opacity-60">{db.settings.currency}</span>
                 </div>
               </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const PrintPortalContent = () => {
    const portalNode = document.getElementById('sam-print-portal');
    if (!individualPrintItem || !portalNode) return null;
    return createPortal(
      <div className="print-isolated-wrapper text-right w-full bg-white" dir="rtl">
        <style dangerouslySetInnerHTML={{ __html: `
          @page { size: ${printOrientation}; margin: 5mm; }
          .vouchers-grid-print { 
            grid-template-columns: ${printOrientation === 'landscape' ? 'repeat(2, minmax(0, 1fr))' : 'repeat(1, minmax(0, 1fr))'}; 
          }
        ` }} />
        {individualPrintItem.type === 'vouchers' 
          ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
          : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
      </div>,
      portalNode
    );
  };

  const executePrintAction = () => {
    setIsPrinting(true);
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 600);
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

  const handleExportPayrollExcel = () => {
    const exportData = currentPayrolls.map(p => {
      const emp = db.employees.find(e => e.id === p.employeeId);
      return {
        'اسم الموظف': emp?.name,
        'القسم': emp?.department,
        'نوع الدوام': (emp?.cycleType || db.settings.salaryCycle) === 'weekly' ? 'أسبوعي' : 'شهري',
        'الأساسي': p.baseSalary,
        'بدل المواصلات': p.transport,
        'أيام الحضور': p.workingDays,
        'أيام الغياب': p.absenceDays,
        'مكافآت': p.bonuses,
        'إنتاج': p.production,
        'عدد قطع الإنتاج': p.productionPieces,
        'إضافي': p.overtimePay,
        'تأخير': p.lateDeduction,
        'انصراف مبكر': p.earlyDepartureDeduction,
        'خصم أذونات': p.permissionDeduction,
        'سلف': p.loanInstallment,
        'خصومات أخرى': p.manualDeductions,
        'صافي الراتب': p.netSalary
      };
    });
    exportToExcel(exportData, "Payroll_Report");
  };

  return (
    <div className={db.settings.theme === 'dark' ? 'dark' : ''}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
        {renderActiveTab()}
        {individualPrintItem && (
          <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-start justify-center p-6 no-print overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 p-10 w-full max-w-5xl shadow-2xl rounded-[3.5rem] border-4 border-white/20 transition-all my-10">
               <div className="flex justify-between items-center mb-10 border-b-2 pb-6 text-right">
                  <div className="flex items-center gap-6">
                    <h3 className="font-black text-indigo-800 dark:text-indigo-400 text-2xl">معاينة المستند الرسمي</h3>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl gap-2 no-print">
                      <button onClick={() => setPrintOrientation('landscape')} className={`px-4 py-2 rounded-xl text-sm font-black ${printOrientation === 'landscape' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}><LayoutPanelLeft size={18}/> عرضي</button>
                      <button onClick={() => setPrintOrientation('portrait')} className={`px-4 py-2 rounded-xl text-sm font-black ${printOrientation === 'portrait' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-700 dark:text-indigo-400' : 'text-slate-400'}`}><LayoutPanelTop size={18}/> طولي</button>
                    </div>
                  </div>
                  <button onClick={() => setIndividualPrintItem(null)} className="text-rose-500 p-2 hover:bg-rose-50 rounded-full transition transform hover:rotate-90" disabled={isPrinting}><X size={44}/></button>
               </div>
               <div className="bg-white dark:bg-slate-900 rounded-[2rem] text-right overflow-hidden border border-slate-100 dark:border-slate-800 p-2">
                  {individualPrintItem.type === 'vouchers' 
                    ? <VouchersPrintGrid payrolls={individualPrintItem.data} />
                    : <DocumentPrintCard title={individualPrintItem.title} type={individualPrintItem.type} data={individualPrintItem.data} />}
               </div>
               <div className="flex gap-6 mt-12 no-print">
                  <button onClick={executePrintAction} disabled={isPrinting} className="flex-[2] bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl flex items-center justify-center gap-4 hover:bg-indigo-700 transition-all">
                    {isPrinting ? <Loader2 className="animate-spin" size={32}/> : <Printer size={32}/>}
                    {isPrinting ? 'جاري التحضير...' : 'تـنـفـيذ الـطـباعـة'}
                  </button>
                  <button onClick={() => setIndividualPrintItem(null)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-6 rounded-[2.5rem] font-black text-xl text-slate-500 hover:bg-slate-200 transition">إغلاق</button>
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
