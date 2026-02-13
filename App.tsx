
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
import { Employee, PayrollRecord, FinancialEntry, Loan, LeaveRequest, ProductionEntry, AttendanceRecord, Warning, PrintHistoryRecord, ArchiveLog } from './types';
import { generatePayrollForRange } from './utils/calculations';
import { exportToExcel } from './utils/export';
import { Printer, X, ReceiptText, CalendarDays, Loader2, FileText, CheckCircle, Info, ShieldAlert, Package, Layers, Clock, TrendingUp, Lock, HelpCircle, ToggleLeft, ToggleRight, AlertCircle, Calendar, FileDown, LayoutPanelLeft, LayoutPanelTop, Zap, Key, ShieldCheck, AlertOctagon, WifiOff, Globe } from 'lucide-react';

// ملاحظة للمطور: قم بتغيير هذا الرابط إلى رابط خادم التحقق الخاص بك
const VERIFICATION_API_URL = 'https://your-api-server.com/verify-license';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showHint, setShowHint] = useState(false);
  
  // حالات التفعيل
  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [activationKey, setActivationKey] = useState<string>('');
  const [activationError, setActivationError] = useState<string>('');
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  // دالة الحصول على بصمة الجهاز المستقرة
  const getMachineId = async (): Promise<string> => {
    try {
      // @ts-ignore
      if (typeof FingerprintJS !== 'undefined') {
        // @ts-ignore
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
      }
    } catch (e) {
      console.warn("FingerprintJS Fallback", e);
    }

    let fallbackId = localStorage.getItem('SAM_DEVICE_FINGERPRINT');
    if (!fallbackId) {
      const entropy = [
        navigator.userAgent,
        navigator.language,
        screen.width + 'x' + screen.height,
        new Date().getTimezoneOffset(),
        navigator.hardwareConcurrency || 'unknown',
        navigator.platform
      ].join('|');
      
      fallbackId = 'SAM-' + btoa(entropy).substring(0, 32);
      localStorage.setItem('SAM_DEVICE_FINGERPRINT', fallbackId);
    }
    return fallbackId;
  };

  // التحقق من حالة التفعيل عند الإقلاع
  useEffect(() => {
    const checkActivationStatus = async () => {
      try {
        const visitorId = await getMachineId();
        const storedLicense = localStorage.getItem('SAM_LICENSE');
        const boundFingerprint = localStorage.getItem('SAM_BOUND_FP');
        const activationStatus = localStorage.getItem('SAM_ACTIVATED') === 'true';

        if (activationStatus && storedLicense && boundFingerprint) {
          if (boundFingerprint !== visitorId) {
            setActivationError('تم اكتشاف تغيير في عتاد الجهاز أو محاولة نقل الترخيص.');
            setIsActivated(false);
          } else {
            setIsActivated(true);
          }
        } else {
          setIsActivated(false);
        }
      } catch (err) {
        console.error("Critical Security Error", err);
      } finally {
        setIsInitializing(false);
      }
    };

    checkActivationStatus();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');
    const inputKey = activationKey.trim().toUpperCase();

    if (!inputKey) return;

    if (!navigator.onLine) {
      setActivationError('التفعيل لأول مرة يتطلب اتصالاً نشطاً بالإنترنت. يرجى الاتصال والمحاولة مجدداً.');
      return;
    }

    setIsVerifying(true);

    try {
      const visitorId = await getMachineId();
      await new Promise(resolve => setTimeout(resolve, 2000)); 

      const validLicenses = [
        "LIC-7X2K-9PQM-11A4", "LIC-AP92-XKQ1-447Z", "LIC-LL29-PPQ2-79MQ", "LIC-MQ18-ZZ20-199Q", "LIC-1QQ0-AA29-MZ22",
        "LIC-299X-ZLQ4-MM18", "LIC-20QA-812P-922A", "LIC-PQ17-2XM4-555Z", "LIC-KZ77-PLQ2-19XQ", "LIC-33LM-92QK-ZZPQ",
        "LIC-88PA-19ZQ-100X", "LIC-11ZX-PMQ2-8PQL", "LIC-KQ44-91MX-721Z", "LIC-9QQQ-28PQ-PM29", "LIC-AQP2-199Z-LZL1",
        "LIC-K22M-1ZQ9-PQP4", "LIC-7ZA1-3PQ2-QZ99", "LIC-1X92-8QM2-PAQZ", "LIC-8KZ1-12QM-QMMQ", "LIC-2AMQ-9Z91-277P",
        "LIC-QZ11-MKP2-19LQ", "LIC-92MQ-KQ11-82A4", "LIC-ZZP0-3QK1-229M", "LIC-55KQ-AQ21-Z9P4", "LIC-X2MM-91QZ-P20P",
        "LIC-19ZK-PP81-3QAQ", "LIC-7PQA-2QK2-L19Z", "LIC-P9A2-KMQ1-77ZQ", "LIC-AQZ1-1K11-2MM9", "LIC-009X-PQ29-LZQ2",
        "LIC-LZ22-QM44-19PM", "LIC-PX91-22LA-77QM", "LIC-K2PQ-1Q11-9MZA", "LIC-AP21-Q219-0ZQM", "LIC-ZLP2-8A91-Q4MZ",
        "LIC-719P-KLQ2-MM29", "LIC-MQ33-9KX1-ZZ10", "LIC-PA92-11ZQ-2QK4", "LIC-Q2P1-3KM1-P8Z1", "LIC-X9A4-QML1-21QZ",
        "LIC-21PQ-MQP2-991K", "LIC-KQ88-7LZ2-103P", "LIC-PP37-12MQ-Z0A2", "LIC-Z19Q-Q2M1-77PL", "LIC-19MZ-AQ01-2LZP",
        "LIC-2K21-0MQ2-9PQL", "LIC-MZ10-1Q77-QA92", "LIC-12PA-177Q-99ZQ", "LIC-AZ22-KP10-PQ91", "LIC-LP71-22MZ-QMK4",
        "LIC-3XQ2-0A91-Z7QP", "LIC-1Q92-PLK2-MAQ1", "LIC-7PM4-QZ21-1ZL0", "LIC-NM21-Q772-1LPQ", "LIC-9ZL1-221Q-Q7KP",
        "LIC-ZZ14-9P81-MP22", "LIC-88MZ-KQ12-Z1QA", "LIC-PPQ1-10ZK-9A72", "LIC-L19Q-1MM2-22AP", "LIC-MAA2-QP33-71ZK",
        "LIC-ZQ99-81MZ-P2Q4", "LIC-KM17-19AP-ZZ21", "LIC-Z11A-QM82-0KP2", "LIC-9Q21-P2ZM-2ALM", "LIC-LQ10-7A92-QMP1",
        "LIC-23MZ-MM27-81QP", "LIC-7K92-PQ11-Z1MZ", "LIC-4ML2-PPX1-QQ91", "LIC-PZ22-91A4-MKQM", "LIC-AZ11-K2Q3-PP20",
        "LIC-QM99-PX44-1ZQ2", "LIC-1Z72-ZQ21-0QKP", "LIC-9PA1-M122-QZMQ", "LIC-7Q11-PAQ2-1KLM", "LIC-2MQ1-K92A-PPQ1",
        "LIC-P771-1ZQ2-ALP2", "LIC-XQ92-0MZ2-P12Q", "LIC-QA88-221Z-Z31P", "LIC-MLQ1-12KP-M2Q2", "LIC-23ZQ-19KQ-QP81",
        "LIC-A0Q1-K9L2-MMQP", "LIC-PZ21-17QK-ZZ11", "LIC-ZM22-8K21-1QZ2", "LIC-1KQM-22A1-P92Z", "LIC-NQ92-MZ21-LZQ1",
        "LIC-2PA1-7KQ2-9Q11", "LIC-L0Q2-19ZX-QPQ2", "LIC-9ZM1-AQ91-K277", "LIC-PQ29-1ZQ1-MMP2", "LIC-ZQ17-MX22-91LQ",
        "LIC-Q201-PL22-7QZ2", "LIC-AZ88-129M-PQ10", "LIC-M7Q1-19ZA-QK21", "LIC-P1A2-9MZ1-QL20", "LIC-QZ21-11P2-KQPP",
        "LIC-LQ10-9Q21-AZ91", "LIC-2MP9-ZZP1-Q1K2", "LIC-Z1QM-20A9-PPM1", "LIC-10QZ-MQ22-17KP"
      ];

      if (!validLicenses.includes(inputKey)) {
        setActivationError('مفتاح الترخيص غير صالح أو غير موجود في قاعدة البيانات.');
        setIsVerifying(false);
        return;
      }

      localStorage.setItem('SAM_LICENSE', inputKey);
      localStorage.setItem('SAM_BOUND_FP', visitorId);
      localStorage.setItem('SAM_ACTIVATED', 'true');
      
      setIsActivated(true);
      setIsVerifying(false);
    } catch (err) {
      setActivationError('فشل الاتصال بخادم التفعيل. يرجى التحقق من الإنترنت.');
      setIsVerifying(false);
    }
  };

  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: string, data: any} | null>(null);
  
  const [payrollDateFrom, setPayrollDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [payrollDateTo, setPayrollDateTo] = useState(new Date().toISOString().split('T')[0]);

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
    if (confirm('هل أنت متأكد تماماً؟ سيتم حذف كافة البيانات نهائياً!')) {
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
        departments: ['الإدارة العامة', 'المحاسبة', 'الموارد البشرية', 'الإنتاج', 'المبيعات'],
        printHistory: [],
        settings: { ...db.settings, archiveLogs: [] }
      };
      setDb(resetDB);
      saveDB(resetDB);
    }
  };

  // دالة الأرشفة المطورة
  const handleRunArchive = (type: 'manual' | 'auto' = 'manual') => {
    try {
      const retentionDays = db.settings.archiveRetentionDays || 90;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
      const cutoffStr = cutoffDate.toISOString().split('T')[0];

      let totalArchivedCount = 0;
      const snapshot: any = {
        attendance: [],
        loans: [],
        leaves: [],
        financials: [],
        production: []
      };

      const newDB = { ...db };

      // دالة مساعدة للأرشفة
      const archiveCollection = (key: keyof DB, dateField: string = 'date') => {
        const collection = newDB[key] as any[];
        if (!Array.isArray(collection)) return;

        const updated = collection.map(item => {
          const itemDate = item[dateField] || item.startDate || item.date;
          if (!item.isArchived && itemDate <= cutoffStr) {
            totalArchivedCount++;
            snapshot[key].push(item);
            return { ...item, isArchived: true };
          }
          return item;
        });

        (newDB as any)[key] = updated;
      };

      archiveCollection('attendance');
      archiveCollection('loans');
      archiveCollection('leaves', 'startDate');
      archiveCollection('financials');
      archiveCollection('production');

      if (totalArchivedCount === 0 && type === 'manual') {
        alert(`لا توجد سجلات غير مؤرشفة أقدم من ${cutoffStr} حالياً.`);
        return;
      }

      const newLog: ArchiveLog = {
        id: Math.random().toString(36).substr(2, 9),
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toLocaleString('ar-EG'),
        type: type,
        recordsCount: totalArchivedCount,
        performedBy: currentUser?.name || 'النظام',
        details: `أرشفة السجلات حتى تاريخ ${cutoffStr}`,
        snapshotData: JSON.stringify(snapshot)
      };

      newDB.settings.archiveLogs = [newLog, ...(db.settings.archiveLogs || [])];
      setDb(newDB);
      
      if (type === 'manual') {
        alert(`نجحت عملية الأرشفة! تم نقل ${totalArchivedCount} سجل إلى الأرشيف التاريخي.`);
      }
    } catch (error) {
      console.error("Archive Error:", error);
      alert("حدث خطأ غير متوقع أثناء محاولة الأرشفة. يرجى التحقق من وحدة التحكم.");
    }
  };

  const currentPayrolls = useMemo(() => generatePayrollForRange(
    payrollDateFrom, 
    payrollDateTo, 
    db.employees || [], 
    db.attendance || [], 
    db.loans || [], 
    db.financials || [], 
    db.production || [], 
    db.settings
  ), [payrollDateFrom, payrollDateTo, db]);

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

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employeesCount={db.employees.length} todayAttendance={db.attendance.filter(a => a.date === new Date().toISOString().split('T')[0]).length} totalLoans={db.loans.filter(l => !l.isArchived && l.remainingAmount > 0).reduce((acc, l) => acc + (l.remainingAmount || 0), 0)} totalSalaryBudget={currentPayrolls.reduce((acc, p) => acc + p.netSalary, 0)} />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} onPrintList={(list) => setIndividualPrintItem({ title: 'قائمة الموظفين الكاملة', type: 'employee_list', data: list })} />;
      case 'departments': return <Departments departments={db.departments || []} employees={db.employees || []} onUpdate={depts => setDb(prev => ({...prev, departments: [...depts]}))} onUpdateEmployee={emp => updateList('employees', emp)} onPrintDept={(name, emps) => setIndividualPrintItem({ title: `قائمة موظفي قسم ${name}`, type: 'department_list', data: emps })} />;
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
            <div className="grid grid-cols-2 gap-6 text-right">
                <div className="col-span-2">
                   <label className="text-[11pt] font-black mb-1 block">نوع الإجازة</label>
                   <select className="w-full p-4 border-2 rounded-xl font-bold text-lg bg-slate-50 shadow-inner" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                      <option value="annual">سنوية</option>
                      <option value="sick">مرضية</option>
                      <option value="emergency">طارئة</option>
                      <option value="unpaid">بدون راتب (مخصومة)</option>
                   </select>
                </div>
                <div className="flex items-center justify-between bg-slate-100 p-5 rounded-2xl border-2 col-span-2">
                   <span className="text-[12pt] font-black">هل الإجازة مأجورة الراتب؟</span>
                   <button type="button" onClick={() => set({...data, isPaid: !data.isPaid})}>
                      {data.isPaid ? <ToggleRight size={48} className="text-emerald-600" /> : <ToggleLeft size={48} className="text-slate-400" />}
                   </button>
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">تاريخ البدء</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold" value={data.startDate} onChange={e => set({...data, startDate: e.target.value})} />
                </div>
                <div>
                   <label className="text-[11pt] font-black mb-1 block">تاريخ الانتهاء</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold" value={data.endDate} onChange={e => set({...data, endDate: e.target.value})} />
                </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td>{i.type}</td><td className={i.isPaid ? 'text-emerald-600' : 'text-rose-600'}>{i.isPaid ? 'نعم' : 'لا'}</td><td>{i.startDate}</td><td>{i.endDate}</td></>)} 
        />
      );
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={() => handleRunArchive('manual')} onClearData={handleClearData} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      case 'documents': return <PrintForms employees={db.employees || []} attendance={db.attendance || []} financials={db.financials || []} warnings={db.warnings || []} leaves={db.leaves || []} loans={db.loans || []} settings={db.settings} printHistory={db.printHistory || []} onPrint={(doc) => setIndividualPrintItem(doc as any)} />;
      case 'loans': return (
        <GenericModule<Loan> 
          title="سجل السلف والقروض" lang={db.settings.language} employees={db.employees} items={db.loans} 
          companyName={db.settings.name} logo={db.settings.logo}
          archiveMode={archiveModes.loans} onToggleArchive={() => setArchiveModes(p => ({...p, loans: !p.loans}))} 
          onSave={i => updateList('loans', i)} onDelete={id => deleteFromList('loans', id)} onArchive={i => archiveItem('loans', i)}
          onPrintIndividual={i => setIndividualPrintItem({title: "سند سلفة موظف", type: 'loan', data: i})} 
          initialData={{ amount: 0, installmentsCount: 1, monthlyInstallment: 0, remainingAmount: 0, date: new Date().toISOString().split('T')[0], isImmediate: false }} 
          tableHeaders={['الموظف', 'المبلغ', 'الأقساط', 'قيمة القسط', 'التاريخ']} 
          renderForm={(data, set) => (
            <div className="grid grid-cols-2 gap-6 text-right">
              <div className="col-span-2">
                <label className="text-[11pt] font-black mb-1 block">المبلغ الإجمالي</label>
                <input type="number" className="w-full p-4 border rounded-xl font-black text-xl" value={data.amount || ''} onChange={e => set({...data, amount: Number(e.target.value), remainingAmount: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-[11pt] font-black mb-1 block">قيمة القسط</label>
                <input type="number" className="w-full p-4 border rounded-xl font-bold" value={data.monthlyInstallment || ''} onChange={e => set({...data, monthlyInstallment: Number(e.target.value)})} />
              </div>
              <div>
                <label className="text-[11pt] font-black mb-1 block">عدد الأقساط</label>
                <input type="number" className="w-full p-4 border rounded-xl font-bold" value={data.installmentsCount || ''} onChange={e => set({...data, installmentsCount: Number(e.target.value)})} />
              </div>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td>{i.amount.toLocaleString()}</td><td>{i.installmentsCount}</td><td>{i.monthlyInstallment.toLocaleString()}</td><td>{i.date}</td></>)} 
        />
      );
      case 'production': return <Production employees={db.employees} items={db.production || []} settings={db.settings} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
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
                <select className="w-full p-4 border-2 rounded-xl font-black text-lg" value={data.type} onChange={e => set({...data, type: e.target.value as any})}>
                   <option value="bonus">مكافأة تميز (+)</option>
                   <option value="deduction">خصم مالي (-)</option>
                   <option value="payment">سلفة فورية / دفعة (-)</option>
                </select>
                <input type="number" placeholder="المبلغ" className="w-full p-5 border-2 rounded-2xl font-black text-3xl text-center" value={data.amount} onChange={e => set({...data, amount: Number(e.target.value)})} />
                <textarea className="w-full p-4 border rounded-xl font-bold h-24" value={data.reason} onChange={e => set({...data, reason: e.target.value})} placeholder="السبب..."></textarea>
            </div>
          )} 
          renderRow={(i, name) => (<><td className="px-6 py-4 font-black">{name}</td><td>{i.type}</td><td className={i.type === 'deduction' ? 'text-rose-600' : 'text-indigo-700'}>{i.amount.toLocaleString()}</td><td>{i.date}</td></>)} 
        />
      );
      default: return null;
    }
  };

  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-cairo" dir="rtl">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-xl font-black">جاري التحقق من أمان الجهاز...</p>
      </div>
    );
  }

  if (!isActivated) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 p-6 font-cairo`} dir="rtl">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border-4 border-white/10 relative overflow-hidden">
          <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-rose-600/5 rounded-full blur-3xl"></div>
          <div className="text-center mb-10 relative z-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl">
              <Globe size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">تفعيل SAM Pro Online</h2>
            <p className="text-slate-400 font-bold mt-2">يرجى إدخال مفتاح الترخيص المعتمد لربط هذا الجهاز</p>
          </div>
          <form onSubmit={handleActivate} className="space-y-8 relative z-10">
            <div className="space-y-4">
              <div className={`p-4 rounded-2xl flex items-center gap-3 font-bold text-xs ${navigator.onLine ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                {navigator.onLine ? <CheckCircle size={16}/> : <WifiOff size={16}/>}
                {navigator.onLine ? 'متصل بالإنترنت - جاهز للتحقق' : 'غير متصل بالإنترنت - التفعيل غير ممكن'}
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 block mb-3 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> كود الترخيص الرقمي
                </label>
                <input 
                  type="text" 
                  disabled={isVerifying}
                  className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl text-center tracking-widest uppercase dark:text-white" 
                  placeholder="LIC-XXXX-XXXX-XXXX"
                  value={activationKey}
                  onChange={e => setActivationKey(e.target.value)}
                  required
                />
              </div>
            </div>
            {activationError && (
              <div className="p-5 bg-rose-50 text-rose-700 border-2 border-rose-100 rounded-[2rem] flex items-start gap-3 font-black text-sm animate-in shake duration-300">
                <AlertOctagon size={32} className="shrink-0 text-rose-600" />
                <div className="flex flex-col">
                   <span className="text-rose-900">خطأ في التفعيل:</span>
                   <span className="opacity-80 leading-relaxed">{activationError}</span>
                </div>
              </div>
            )}
            <button 
              type="submit" 
              disabled={isVerifying || !navigator.onLine}
              className="w-full bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:grayscale"
            >
              {isVerifying ? <Loader2 className="animate-spin" size={28}/> : <ShieldCheck size={28} />}
              {isVerifying ? 'جاري التحقق من المفتاح...' : 'تفعيل وربط الجهاز'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 p-6 font-cairo ${db.settings.theme === 'dark' ? 'dark' : ''}`} dir="rtl">
         <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border-4 border-white/10 relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl"></div>
            <div className="text-center mb-12 relative z-10">
               <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-5xl font-black mb-6 shadow-2xl shadow-indigo-500/40">S</div>
               <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">نظام SAM Pro</h2>
               <p className="text-slate-400 font-bold mt-2">نسخة مفعلة ومرخصة للجهاز الحالي</p>
            </div>
            <form onSubmit={handleLogin} className="space-y-8 relative z-10">
               <div>
                  <label className="text-xs font-black text-slate-500 block mb-3 mr-3 uppercase tracking-widest flex items-center gap-2">
                     <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> اسم المستخدم
                  </label>
                  <input 
                    type="text" 
                    className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl shadow-inner dark:text-white" 
                    placeholder="admin"
                    value={loginForm.username} 
                    onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
                  />
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
               <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] transition-all">
                  دخـول للـنـظام
               </button>
               <button type="button" onClick={() => setShowHint(!showHint)} className="w-full text-center text-indigo-600 font-bold text-sm hover:underline flex items-center justify-center gap-2">
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
            </form>
         </div>
      </div>
    );
  }

  return (
    <div className={db.settings.theme === 'dark' ? 'dark' : ''}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
        {renderActiveTab()}
      </Layout>
    </div>
  );
};

export default App;
