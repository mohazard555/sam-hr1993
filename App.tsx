
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
import { Employee, PayrollRecord, FinancialEntry, Loan, LeaveRequest, ProductionEntry, AttendanceRecord, Warning, PrintHistoryRecord } from './types';
import { generatePayrollForRange } from './utils/calculations';
import { exportToExcel } from './utils/export';
import { Printer, X, ReceiptText, CalendarDays, Loader2, FileText, CheckCircle, Info, ShieldAlert, Package, Layers, Clock, TrendingUp, Lock, HelpCircle, ToggleLeft, ToggleRight, AlertCircle, Calendar, FileDown, LayoutPanelLeft, LayoutPanelTop, Zap, Key, ShieldCheck } from 'lucide-react';

// قائمة التراخيص الـ 100 المعتمدة
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

  const [individualPrintItem, setIndividualPrintItem] = useState<{title: string, type: string, data: any} | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('landscape');
  
  const [payrollDateFrom, setPayrollDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [payrollDateTo, setPayrollDateTo] = useState(new Date().toISOString().split('T')[0]);

  const [archiveModes, setArchiveModes] = useState<Record<string, boolean>>({
    leaves: false, financials: false, loans: false, production: false
  });

  // دالة الحصول على بصمة الجهاز مع آلية احتياطية (Fallback) للأوفلاين
  const getMachineId = async (): Promise<string> => {
    try {
      // محاولة استخدام FingerprintJS إذا كانت المكتبة محملة (أونلاين)
      // @ts-ignore
      if (typeof FingerprintJS !== 'undefined') {
        // @ts-ignore
        const fp = await FingerprintJS.load();
        const result = await fp.get();
        return result.visitorId;
      }
    } catch (e) {
      console.warn("FingerprintJS failed to load or run, using local fallback", e);
    }

    // آلية احتياطية للأوفلاين أو عند حظر السكربتات
    let fallbackId = localStorage.getItem('SAM_FALLBACK_ID');
    if (!fallbackId) {
      // توليد معرف فريد للمتصفح الحالي وتخزينه
      fallbackId = 'SAM-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
      localStorage.setItem('SAM_FALLBACK_ID', fallbackId);
    }
    return fallbackId;
  };

  // التحقق من التفعيل عند تشغيل التطبيق
  useEffect(() => {
    const checkActivation = async () => {
      try {
        const visitorId = await getMachineId();
        const storedKey = localStorage.getItem('SAM_LICENSE');
        const storedFp = localStorage.getItem('SAM_FINGERPRINT');

        if (storedKey && storedFp) {
          if (!validLicenses.includes(storedKey)) {
            setActivationError('مفتاح الترخيص غير صالح.');
            setIsActivated(false);
          } else if (storedFp !== visitorId) {
            setActivationError('هذا الترخيص مرتب بجهاز آخر بالفعل.');
            setIsActivated(false);
          } else {
            setIsActivated(true);
          }
        } else {
          setIsActivated(false);
        }
      } catch (err) {
        console.error("Critical activation check error", err);
      } finally {
        setIsInitializing(false);
      }
    };

    checkActivation();
  }, []);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    setActivationError('');

    // التحقق من وجود المفتاح في القائمة المعتمدة
    if (!validLicenses.includes(activationKey.trim().toUpperCase())) {
      setActivationError('مفتاح الترخيص غير صحيح. يرجى التأكد من الكود المرفق.');
      return;
    }

    try {
      // الحصول على البصمة (سواء من المكتبة أو الـ Fallback)
      const visitorId = await getMachineId();

      localStorage.setItem('SAM_LICENSE', activationKey.trim().toUpperCase());
      localStorage.setItem('SAM_FINGERPRINT', visitorId);
      setIsActivated(true);
    } catch (err) {
      setActivationError('حدث خطأ فني أثناء التفعيل. يرجى المحاولة مرة أخرى.');
    }
  };

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
        printHistory: []
      };
      setDb(resetDB);
      saveDB(resetDB);
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

  const payrollTotals = useMemo(() => {
    return currentPayrolls.reduce((acc, p) => ({
      base: acc.base + p.baseSalary,
      transport: acc.transport + p.transport,
      bonuses: acc.bonuses + p.bonuses,
      production: acc.production + p.production,
      overtime: acc.overtime + p.overtimePay,
      late: acc.late + p.lateDeduction,
      early: acc.early + p.earlyDepartureDeduction,
      loans: acc.loans + p.loanInstallment,
      manual: acc.manual + p.manualDeductions,
      net: acc.net + p.netSalary
    }), { base: 0, transport: 0, bonuses: 0, production: 0, overtime: 0, late: 0, early: 0, loans: 0, manual: 0, net: 0 });
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

  const PrintableHeader = ({ title, subtitle }: { title: string, subtitle?: string }) => (
    <div className="flex justify-between items-start border-b-4 border-indigo-900 pb-6 mb-8 w-full text-indigo-950">
      <div className="text-right">
        <h1 className="text-3xl font-black leading-none">{db.settings.name}</h1>
        <p className="text-sm font-black text-indigo-700 mt-2">{title}</p>
        {subtitle && <p className="text-[10px] font-bold mt-1 text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex flex-col items-center">
        {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain mb-2" alt="Logo" />}
      </div>
      <div className="text-left">
        <p className="text-[10px] font-black text-slate-400 uppercase">تاريخ التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase">ساعة الطباعة: {new Date().toLocaleTimeString('ar-EG')}</p>
      </div>
    </div>
  );

  const EmployeeListPrintTable = ({ employees }: { employees: Employee[] }) => (
    <div className="w-full text-right p-4 bg-white">
      <PrintableHeader title="قائمة بيانات الموظفين" subtitle={`إجمالي العدد: ${employees.length} موظف`} />
      <table className="w-full border-collapse border border-slate-300">
        <thead className="bg-slate-100 font-black">
          <tr>
            <th className="p-2 border border-slate-300">الاسم</th>
            <th className="p-2 border border-slate-300">القسم</th>
            <th className="p-2 border border-slate-300">المنصب</th>
            <th className="p-2 border border-slate-300">الراتب</th>
            <th className="p-2 border border-slate-300">الهاتف</th>
            <th className="p-2 border border-slate-300">الهوية الوطنية</th>
            <th className="p-2 border border-slate-300 text-center">تاريخ التعيين</th>
          </tr>
        </thead>
        <tbody>
          {employees.map(emp => (
            <tr key={emp.id} className="text-sm border-b border-slate-200">
              <td className="p-2 border border-slate-300 font-bold">{emp.name}</td>
              <td className="p-2 border border-slate-300">{emp.department}</td>
              <td className="p-2 border border-slate-300">{emp.position}</td>
              <td className="p-2 border border-slate-300 text-center">{emp.baseSalary.toLocaleString()}</td>
              <td className="p-2 border border-slate-300 text-center">{emp.phone}</td>
              <td className="p-2 border border-slate-300 text-center">{emp.nationalId}</td>
              <td className="p-2 border border-slate-300 text-center">{emp.joinDate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  const DocumentPrintCard = ({ title, type, data }: { title: string, type: string, data: any }) => {
    if (type === 'employee_list' || type === 'department_list') {
      return <EmployeeListPrintTable employees={data} />;
    }

    const emp = db.employees.find(e => e.id === data.employeeId) || { name: data.employeeName || '.......', department: 'غير محدد', position: 'غير محدد' };
    const cycleText = db.settings.salaryCycle === 'weekly' ? 'أسبوعياً' : 'شهرياً';
    const cycleLabel = db.settings.salaryCycle === 'weekly' ? 'أسبوعي' : 'شهري';
    
    let description = data.notes || "بيان رسمي معتمد بناء على السجلات الجارية الموثقة في النظام.";
    
    if (type === 'warning') {
      description = `إقرار إداري: تم رصد مخالفة إدارية للموظف المذكور تتعلق بـ (${data.reason || 'سياسة العمل'})، وبناءً عليه تم إصدار هذا التنبيه الرسمي (${data.type === 'verbal' ? 'شفهي' : data.type === 'written' ? 'خطي' : 'نهائي'}) لضمان الالتزام بالمعايير المهنية.`;
    } else if (type === 'financial' && data.type === 'bonus') {
      description = `إشعار استحقاق: تقديراً للأداء والتميز، تم منح الموظف مكافأة مالية بقيمة (${data.amount.toLocaleString()}) كحافز تشجيعي، تضاف إلى الرصيد المالي في الدورة الحالية.`;
    } else if (type === 'leave') {
      description = `تصريح إجازة: تمت الموافقة على طلب الإجازة المقدم من الموظف لتبدأ من تاريخ (${data.startDate}) وتستمر حتى (${data.endDate})، مع التأكيد على الالتزام بموعد العودة المحدد.`;
    } else if (type === 'production') {
      description = `بيان إنتاجية: توثيق دقيق للكميات المنجزة من قبل الموظف في تاريخ (${data.date})، حيث بلغت الكمية (${data.piecesCount}) قطعة، مما يعكس مستوى الكفاءة والإنتاجية المحقق.`;
    } else if (type === 'loan') {
      if (data.isImmediate) {
         description = `سند سلفة فورية: تم تسليم الموظف مبلغ سلفة نقدية طارئة بقيمة إجمالية قدرها (${data.amount?.toLocaleString()})، وقد تقرر تحصيل كامل هذا المبلغ من أقرب استحقاق راتب للموظف لمرة واحدة، ولا يعتبر ديناً مجدولاً.`;
      } else {
         description = `سند سلفة: تم تسليم الموظف مبلغ سلفة نقدية بقيمة إجمالية قدرها (${data.amount?.toLocaleString()})، يتم سدادها على (${data.installmentsCount}) قسطاً ${cycleText}، وبقيمة قسط تبلغ (${data.monthlyInstallment?.toLocaleString()}). تبدأ عملية التحصيل اعتباراً من تاريخ (${data.collectionDate}).`;
      }
    }

    return (
      <div className="bg-white print-card w-full max-w-4xl mx-auto shadow-none relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] flex items-center justify-center pointer-events-none rotate-12">
            <h1 className="text-[8rem] font-black whitespace-nowrap">{db.settings.name}</h1>
        </div>
        <div className="print:hidden">
            <PrintableHeader title={title} />
        </div>
        <div className="hidden print:block">
            <div className="flex justify-between items-center border-b-2 border-indigo-100 pb-4 mb-6">
                <div className="text-right">
                    <h2 className="text-2xl font-black">{db.settings.name}</h2>
                    <p className="text-sm font-bold text-indigo-600">{title}</p>
                </div>
                {db.settings.logo && <img src={db.settings.logo} className="h-12 w-auto" />}
            </div>
        </div>
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
                </div>
              ) : type === 'loan' ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">إجمالي المبلغ:</span>
                      <span className="text-xl font-black text-slate-900">{data.amount?.toLocaleString()}</span>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <span className="text-[10px] font-black text-slate-400 block mb-1">عدد الأقساط:</span>
                      <span className="text-xl font-black text-slate-900">{data.installmentsCount}</span>
                    </div>
                    <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 text-center">
                      <span className="text-[10px] font-black text-indigo-400 block mb-1">القسط {cycleLabel}:</span>
                      <span className="text-xl font-black text-indigo-700">{data.monthlyInstallment?.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center px-4">
                    <p className="text-xs font-black text-slate-500">تاريخ بداية التحصيل: <span className="text-slate-900">{data.collectionDate}</span></p>
                    <p className="text-xs font-black text-rose-600">الرصيد المتبقي حالياً: <span className="font-black underline">{data.remainingAmount?.toLocaleString()} {db.settings.currency}</span></p>
                  </div>
                  {data.isImmediate && (
                    <div className="flex justify-center">
                       <span className="bg-rose-600 text-white px-6 py-2 rounded-full font-black text-xs uppercase tracking-widest shadow-lg">سلفة فورية - مستردة بالكامل</span>
                    </div>
                  )}
                </div>
              ) : null}

              <div className="mt-6 pt-4 border-t border-slate-100">
                <p className="text-lg font-bold leading-relaxed text-slate-800">{description}</p>
              </div>
           </div>
           
           <div className="grid grid-cols-2 gap-10 mt-10">
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 mb-8 uppercase">خـتـم المؤسسة</p>
                <div className="w-24 h-24 border-2 border-slate-100 rounded-full mx-auto opacity-20 flex items-center justify-center font-black">STAMP</div>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-black text-slate-400 mb-8 uppercase">توقيع المسؤول</p>
                <div className="h-px bg-slate-200 w-32 mx-auto"></div>
              </div>
           </div>
        </div>
      </div>
    );
  };

  const formatMinutes = (totalMinutes: number) => {
    const hours = Math.floor(totalMinutes / 60);
    const mins = Math.round(totalMinutes % 60);
    return `${hours}س ${mins}د`;
  };

  const VouchersPrintGrid = ({ payrolls }: { payrolls: PayrollRecord[] }) => (
    <div className={`vouchers-grid-print grid ${printOrientation === 'landscape' ? 'grid-cols-2' : 'grid-cols-1'} gap-4 p-4`} dir="rtl">
      {payrolls.map(p => {
        const emp = db.employees.find(e => e.id === p.employeeId);
        const grossEarnings = p.baseSalary + p.transport + p.bonuses + p.production + p.overtimePay;
        
        return (
          <div key={p.id} className="print-card border-2 border-slate-200 p-6 bg-white relative mb-4 rounded-3xl">
            <div className="flex justify-between items-start border-b-2 border-slate-100 pb-4 mb-4">
               <div className="text-right">
                  <p className="text-[10px] font-black text-indigo-600 uppercase">قسيمة راتب معتمدة</p>
                  <h3 className="text-lg font-black text-slate-900">{emp?.name}</h3>
                  <p className="text-[9px] font-bold text-slate-500 mt-1">{emp?.position} - {emp?.department}</p>
               </div>
               <div className="text-left text-[9px] font-bold text-slate-400">
                  <p>الفترة: {p.month} / {p.year}</p>
                  <p>تاريخ الطباعة: {new Date().toLocaleDateString()}</p>
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
                 <span className="font-black">الإنتاج:</span>
                 <span className="font-black">{p.production.toLocaleString()}+</span>
               </div>
               <div className="flex justify-between items-center text-[#00a693] border-t border-dotted mt-1 pt-1 opacity-80">
                 <span className="font-black italic">الراتب المستحق (الإجمالي):</span>
                 <span className="font-black">{grossEarnings.toLocaleString()}</span>
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
            
            <div className="mt-4 flex justify-between items-center text-[8px] font-black opacity-40">
               <p>توقيع المحاسب</p>
               <p>توقيع الموظف</p>
            </div>
          </div>
        );
      })}
    </div>
  );

  const executePrintAction = () => {
    setIsPrinting(true);
    
    if (individualPrintItem) {
      const empId = individualPrintItem.data?.employeeId || '';
      const emp = db.employees.find(e => e.id === empId);
      
      const newHistoryRecord: PrintHistoryRecord = {
        id: Math.random().toString(36).substr(2, 9),
        title: individualPrintItem.title,
        type: individualPrintItem.type,
        employeeId: empId,
        employeeName: emp?.name || 'غير حدد',
        date: new Date().toISOString(),
        notes: individualPrintItem.data?.notes || ''
      };

      setDb(prev => ({
        ...prev,
        printHistory: [newHistoryRecord, ...(prev.printHistory || [])]
      }));
    }

    setTimeout(() => {
      window.print();
      setIsPrinting(false);
    }, 600);
  };

  const handleExportPayrollExcel = () => {
    const exportData = currentPayrolls.map(p => {
      const emp = db.employees.find(e => e.id === p.employeeId);
      return {
        'اسم الموظف': emp?.name,
        'القسم': emp?.department,
        'الأساسي': p.baseSalary,
        'بدل المواصلات': p.transport,
        'أيام الحضور': p.workingDays,
        'أيام الغياب': p.absenceDays,
        'مكافآت': p.bonuses,
        'إنتاج': p.production,
        'إضافي': p.overtimePay,
        'تأخير': p.lateDeduction,
        'انصراف مبكر': p.earlyDepartureDeduction,
        'سلف': p.loanInstallment,
        'خصومات أخرى': p.manualDeductions,
        'صافي الراتب': p.netSalary
      };
    });
    exportToExcel(exportData, "Payroll_Report");
  };

  const renderActiveTab = () => {
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
      case 'production': return <Production employees={db.employees} items={db.production || []} settings={db.settings} onSave={i => updateList('production', i)} onDelete={id => deleteFromList('production', id)} archiveMode={archiveModes.production} onToggleArchive={() => setArchiveModes(p => ({...p, production: !p.production}))} onPrintIndividual={i => setIndividualPrintItem({title: "إشعار إنتاجية موظف", type: 'production', data: i})} />;
      case 'payroll': return (
        <div className="space-y-8 animate-in fade-in duration-700">
          <PrintableHeader title={`مسير رواتب الموظفين للفترة من ${payrollDateFrom} إلى ${payrollDateTo}`} subtitle={`نظام الدوام المعتمد: ${db.settings.salaryCycle === 'weekly' ? 'أسبوعي' : 'شهري'}`} />
          
          <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center no-print text-right gap-4">
             <div className="flex items-center gap-4">
                <div className="p-4 bg-indigo-600 text-white rounded-2xl">
                   <TrendingUp size={32}/>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-4">
                   <div>
                      <h2 className="text-2xl font-black text-indigo-700">تصفية مسير الرواتب</h2>
                      <div className="flex items-center gap-2 mt-2">
                        <input type="date" className="p-2 border rounded-xl font-bold text-xs" value={payrollDateFrom} onChange={e => setPayrollDateFrom(e.target.value)} />
                        <input type="date" className="p-2 border rounded-xl font-bold text-xs" value={payrollDateTo} onChange={e => setPayrollDateTo(e.target.value)} />
                      </div>
                   </div>
                </div>
             </div>
             <div className="flex gap-2">
                <button onClick={handleExportPayrollExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg"><FileDown size={20}/> Excel</button>
                <button onClick={() => { setPrintOrientation('landscape'); setIndividualPrintItem({ title: 'قسائم رواتب الموظفين', type: 'vouchers', data: currentPayrolls }); }} className="bg-indigo-100 text-indigo-700 px-8 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-200 transition"><ReceiptText size={20}/> القسائم</button>
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
                     <th className="px-1 py-5 text-rose-300">سلف</th>
                     <th className="px-4 py-5 text-center bg-indigo-900 min-w-[130px] shadow-2xl print:bg-slate-200 print:text-black">الصافي</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {currentPayrolls.map(p => (
                     <tr key={p.id} className="hover:bg-indigo-50/40 transition-all border-b print:border-slate-300">
                       <td className="px-4 py-5 text-right font-black text-slate-900 dark:text-white whitespace-nowrap sticky right-0 bg-white dark:bg-slate-900 z-10 border-l border-slate-50 text-lg print:text-[11px]">{db.employees.find(e => e.id === p.employeeId)?.name}</td>
                       <td className="px-1 py-5 text-slate-500">{p.baseSalary.toLocaleString()}</td>
                       <td className="px-1 py-5 text-indigo-700">{p.transport.toLocaleString()}</td>
                       <td className="px-1 py-5 text-slate-700">{p.workingDays} ي</td>
                       <td className="px-1 py-5 text-rose-600">{p.absenceDays} ي</td>
                       <td className="px-1 py-5 text-emerald-600">+{p.bonuses.toLocaleString()}</td>
                       <td className="px-1 py-5 text-emerald-600">+{p.production.toLocaleString()}</td>
                       <td className="px-1 py-5 text-emerald-600">+{p.overtimePay.toLocaleString()}</td>
                       <td className="px-1 py-5 text-rose-600">-{p.lateDeduction.toLocaleString()}</td>
                       <td className="px-1 py-5 text-rose-600">-{p.loanInstallment.toLocaleString()}</td>
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
                       <td className="px-1 py-6 text-rose-300">-{payrollTotals.loans.toLocaleString()}</td>
                       <td className="px-4 py-6 text-[22px] bg-indigo-900 text-white shadow-2xl print:bg-slate-300 print:text-black print:text-[14px]">
                          {payrollTotals.net.toLocaleString()}
                       </td>
                    </tr>
                 </tfoot>
               </table>
             </div>
          </div>
        </div>
      );
      case 'documents': return <PrintForms employees={db.employees || []} attendance={db.attendance || []} financials={db.financials || []} warnings={db.warnings || []} leaves={db.leaves || []} loans={db.loans || []} settings={db.settings} printHistory={db.printHistory || []} onPrint={(doc) => setIndividualPrintItem(doc as any)} />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => setDb(p => ({...p, users: [{...p.users[0], ...u}, ...p.users.slice(1)]}))} onImport={json => setDb(json)} onRunArchive={() => {}} onClearData={handleClearData} />;
      case 'reports': return <ReportsView db={db} payrolls={currentPayrolls} lang={db.settings.language} onPrint={() => window.print()} />;
      default: return null;
    }
  };

  // شاشة التحميل الأولية
  if (isInitializing) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-950 text-white font-cairo" dir="rtl">
        <Loader2 className="animate-spin text-indigo-500 mb-4" size={48} />
        <p className="text-xl font-black">جاري تهيئة النظام آمنياً...</p>
      </div>
    );
  }

  // شاشة التفعيل (License Activation)
  if (!isActivated) {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-slate-950 p-6 font-cairo`} dir="rtl">
        <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3.5rem] p-12 shadow-2xl border-4 border-white/10 relative overflow-hidden">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl font-black mb-6 shadow-2xl">
              <Key size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white">تفعيل نظام SAM Pro</h2>
            <p className="text-slate-400 font-bold mt-2">يرجى إدخال مفتاح الترخيص الخاص بك للبدء</p>
          </div>

          <form onSubmit={handleActivate} className="space-y-8">
            <div>
              <label className="text-xs font-black text-slate-500 block mb-3 uppercase tracking-widest flex items-center gap-2">
                <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> مفتاح الترخيص (License Key)
              </label>
              <input 
                type="text" 
                className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black transition-all outline-none text-xl text-center tracking-widest uppercase dark:text-white" 
                placeholder="LIC-XXXX-XXXX-XXXX"
                value={activationKey}
                onChange={e => setActivationKey(e.target.value)}
                required
              />
            </div>

            {activationError && (
              <div className="p-4 bg-rose-50 text-rose-600 border-2 border-rose-100 rounded-2xl flex items-center gap-3 font-black text-sm animate-in shake duration-300">
                <ShieldAlert size={20} />
                <span>{activationError}</span>
              </div>
            )}

            <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-2xl shadow-2xl shadow-indigo-600/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all duration-300 flex items-center justify-center gap-3">
              <ShieldCheck size={28} /> تفعيل النظام الآن
            </button>
            
            <p className="text-center text-[10px] text-slate-400 font-bold">
              ملاحظة: سيتم ربط هذا الترخيص بهذا الجهاز بشكل دائم.
            </p>
          </form>
        </div>
      </div>
    );
  }

  // شاشة تسجيل الدخول العادية (بعد التفعيل)
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

  return (
    <div className={db.settings.theme === 'dark' ? 'dark' : ''}>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
        {renderActiveTab()}
        {individualPrintItem && (
          <div className="fixed inset-0 bg-slate-950/95 z-[500] flex items-start justify-center p-6 no-print overflow-y-auto">
            <div className="bg-white p-10 w-full max-w-5xl shadow-2xl rounded-[3.5rem] border-4 border-white/20 transition-all my-10">
               <div className="flex justify-between items-center mb-10 border-b-2 pb-6 text-right">
                  <div className="flex items-center gap-6">
                    <h3 className="font-black text-indigo-800 text-2xl">معاينة المستند الرسمي</h3>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-2 no-print">
                      <button 
                        onClick={() => setPrintOrientation('landscape')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${printOrientation === 'landscape' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-400'}`}
                      >
                        <LayoutPanelLeft size={18}/> عرضي
                      </button>
                      <button 
                        onClick={() => setPrintOrientation('portrait')}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-black transition-all ${printOrientation === 'portrait' ? 'bg-white shadow-md text-indigo-700' : 'text-slate-400'}`}
                      >
                        <LayoutPanelTop size={18}/> طولي
                      </button>
                    </div>
                  </div>
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
