
import React, { useState, useMemo } from 'react';
import { Employee, CompanySettings, AttendanceRecord, FinancialEntry } from '../types';
import { 
  Printer, FileText, User, ClipboardList, AlertTriangle, 
  CheckCircle2, Calendar, Wallet, Zap, Star, Search, Filter, 
  ChevronRight, ArrowRight, History
} from 'lucide-react';

interface Props {
  employees: Employee[];
  attendance: AttendanceRecord[];
  financials: FinancialEntry[];
  settings: CompanySettings;
  onPrint: (doc: { title: string, type: string, data: any }) => void;
}

const PrintForms: React.FC<Props> = ({ employees, attendance, financials, settings, onPrint }) => {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [activeCategory, setActiveCategory] = useState<'admin' | 'finance' | 'reports'>('admin');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'admin', title: 'وثائق إدارية', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'finance', title: 'سندات مالية', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'reports', title: 'تقارير أداء', icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' }
  ];

  const templates = [
    { id: 'leave', title: 'طلب إجازة رسمي', cat: 'admin', icon: Calendar, desc: 'نموذج إجازة سنوية أو مرضية جاهز للتوقيع' },
    { id: 'permission', title: 'إذن مغادرة / انصراف', cat: 'admin', icon: CheckCircle2, desc: 'تصريح خروج موثق لمهمة عمل أو عذر' },
    { id: 'warning', title: 'إنذار / لفت نظر', cat: 'admin', icon: AlertTriangle, desc: 'وثيقة توبيخ رسمية لمخالفة اللوائح' },
    { id: 'bonus', title: 'سند مكافأة استحقاق', cat: 'finance', icon: Star, desc: 'إشعار مالي بصرف حوافز أو مكافأة أداء' },
    { id: 'payment', title: 'سند صرف داخلي', cat: 'finance', icon: Wallet, desc: 'توثيق مدفوعات نقدية أو عينية للموظف' },
    { id: 'att_summary', title: 'سجل حضور وانصراف', cat: 'reports', icon: History, desc: 'تقرير مفصل بمواعيد الدوام لفترة محددة' },
    { id: 'evaluation', title: 'تقييم الأداء السنوي', cat: 'reports', icon: Zap, desc: 'شهادة تقدير أو تقرير تقييم كفاءة مهني' }
  ];

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleGenerate = (templateId: string) => {
    if (!selectedEmp) return alert('يرجى اختيار موظف من القائمة أولاً');
    
    const emp = employees.find(e => e.id === selectedEmp);
    const template = templates.find(t => t.id === templateId);

    let type = 'document';
    let data: any = {
      employeeId: selectedEmp,
      employeeName: emp?.name,
      date: new Date().toISOString().split('T')[0],
      notes: ''
    };

    if (templateId === 'att_summary') {
      type = 'report_attendance';
      data.records = attendance.filter(a => a.employeeId === selectedEmp && a.date >= dateFrom && a.date <= dateTo);
    } else if (templateId === 'evaluation') {
       data.notes = "بناءً على مراجعة الأداء للفترة المنصرمة، تم تقييم أداء الموظف بمستوى ممتاز، مع التنويه على كفاءته في تنفيذ المهام الموكلة إليه والالتزام باللوائح الداخلية للمؤسسة.";
    }

    onPrint({
      title: template?.title || 'مستند رسمي',
      type: type,
      data: data
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      {/* Header Section */}
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-10">
        <div className="flex items-center gap-6 text-right">
           <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/40">
              <Printer size={40}/>
           </div>
           <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">مركز الوثائق الذكي</h2>
              <p className="text-sm font-bold text-slate-400 mt-2">توليد تقارير ونماذج احترافية بضغطة زر واحدة</p>
           </div>
        </div>

        <div className="flex gap-4 bg-slate-100 dark:bg-slate-800 p-2 rounded-[2.5rem] no-print">
           {categories.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setActiveCategory(cat.id as any)}
               className={`flex items-center gap-3 px-8 py-4 rounded-[2rem] font-black transition-all ${activeCategory === cat.id ? 'bg-white dark:bg-slate-900 shadow-xl scale-105 ' + cat.color : 'text-slate-400'}`}
             >
                <cat.icon size={22}/> {cat.title}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Step 1: Employee Selection */}
        <div className="lg:col-span-1 space-y-6 no-print">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border dark:border-slate-800">
              <h3 className="text-xl font-black mb-6 text-indigo-700 flex items-center gap-2">
                <User size={24}/> الموظف المستهدف
              </h3>
              <div className="relative mb-6">
                 <Search className="absolute right-4 top-3.5 text-slate-400" size={18}/>
                 <input 
                   type="text" 
                   placeholder="بحث باسم الموظف..." 
                   className="w-full pr-12 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold transition-all outline-none" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                 {filteredEmployees.map(emp => (
                   <button 
                     key={emp.id} 
                     onClick={() => setSelectedEmp(emp.id)}
                     className={`w-full p-4 rounded-2xl flex items-center justify-between transition-all border-2 ${selectedEmp === emp.id ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' : 'bg-slate-50 dark:bg-slate-800 border-transparent hover:border-slate-200'}`}
                   >
                      <div className="text-right">
                         <p className="font-black text-sm">{emp.name}</p>
                         <p className={`text-[10px] ${selectedEmp === emp.id ? 'text-white/60' : 'text-slate-400'}`}>{emp.department}</p>
                      </div>
                      {selectedEmp === emp.id && <ArrowRight size={20}/>}
                   </button>
                 ))}
              </div>
           </div>

           {activeCategory === 'reports' && (
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border dark:border-slate-800 animate-in slide-in-from-bottom-4">
                <h3 className="text-xl font-black mb-6 text-emerald-600 flex items-center gap-2">
                   <Filter size={24}/> نطاق الفترة الزمنية
                </h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">من تاريخ</label>
                      <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                   </div>
                   <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">إلى تاريخ</label>
                      <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* Step 2: Templates Selection */}
        <div className="lg:col-span-2">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.filter(t => t.cat === activeCategory).map(template => (
                <button 
                  key={template.id}
                  onClick={() => handleGenerate(template.id)}
                  className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border border-slate-100 dark:border-slate-800 text-right group hover:scale-[1.02] hover:shadow-2xl transition-all relative overflow-hidden flex flex-col items-start gap-4"
                >
                   <div className={`p-5 rounded-3xl ${categories.find(c => c.id === activeCategory)?.bg} transition-transform group-hover:rotate-12`}>
                      <template.icon size={32} className={categories.find(c => c.id === activeCategory)?.color}/>
                   </div>
                   <div>
                      <h4 className="text-2xl font-black text-slate-900 dark:text-white">{template.title}</h4>
                      <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">{template.desc}</p>
                   </div>
                   <div className="mt-auto pt-6 w-full flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">توليد فوري</span>
                      <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                         <ChevronRight size={24}/>
                      </div>
                   </div>
                </button>
              ))}
           </div>

           {/* Quick Guide Card */}
           <div className="mt-10 bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex items-center gap-10">
              <div className="hidden md:block">
                 <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center animate-pulse">
                    <Star size={40} className="text-amber-400"/>
                 </div>
              </div>
              <div className="text-right">
                 <h5 className="text-xl font-black mb-2">هل تعلم؟</h5>
                 <p className="text-sm font-bold text-slate-400 leading-relaxed">
                   يقوم نظام SAM بسحب البيانات التاريخية للموظف تلقائياً ودمجها في الوثائق. عند اختيار "سجل الحضور"، ستحصل على جدول كامل يغطي الفترة المختارة دون تدخل يدوي.
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrintForms;
