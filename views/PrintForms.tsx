
import React, { useState, useMemo } from 'react';
import { Employee, CompanySettings, AttendanceRecord, FinancialEntry, Warning, LeaveRequest, Loan, PrintHistoryRecord, PermissionRecord } from '../types';
import { 
  Printer, FileText, User, ClipboardList, AlertTriangle, 
  CheckCircle2, Calendar, Wallet, Zap, Star, Search, Filter, 
  ChevronRight, ArrowRight, History, ShieldAlert, Award, FileClock, X, Trash2
} from 'lucide-react';

interface Props {
  employees: Employee[];
  attendance: AttendanceRecord[];
  financials: FinancialEntry[];
  warnings: Warning[];
  leaves: LeaveRequest[];
  loans: Loan[];
  permissions?: PermissionRecord[];
  settings: CompanySettings;
  printHistory: PrintHistoryRecord[];
  onPrint: (doc: { title: string, type: string, data: any }) => void;
}

const PrintForms: React.FC<Props> = ({ employees, attendance, financials, warnings, leaves, loans, permissions = [], settings, printHistory, onPrint }) => {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [activeCategory, setActiveCategory] = useState<'admin' | 'finance' | 'reports' | 'history'>('admin');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'admin', title: 'وثائق إدارية', icon: User, color: 'text-blue-600', bg: 'bg-blue-50' },
    { id: 'finance', title: 'سندات مالية', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { id: 'reports', title: 'تقارير أداء', icon: ClipboardList, color: 'text-indigo-600', bg: 'bg-indigo-50' },
    { id: 'history', title: 'المحفوظات', icon: FileClock, color: 'text-slate-600', bg: 'bg-slate-50' }
  ];

  const templates = [
    { id: 'leave', title: 'سجل إجازات الموظف', cat: 'admin', icon: Calendar, desc: 'تقرير مفصل بكافة الإجازات السنوية والطبية' },
    { id: 'permission', title: 'أذونات العمل', cat: 'admin', icon: CheckCircle2, desc: 'سجل تصاريح الخروج والمهمات الخارجية' },
    { id: 'warning', title: 'عقوبات الموظف', cat: 'admin', icon: ShieldAlert, desc: 'سجل الإنذارات الرسمية والإجراءات التأديبية' },
    { id: 'bonus', title: 'المكافآت والحوافز', cat: 'finance', icon: Award, desc: 'بيان بالمكافآت المالية والتحفيزية المستحقة' },
    { id: 'loan', title: 'سند سلفة موظف', cat: 'finance', icon: Wallet, desc: 'توثيق مبالغ السلف وجدولة الأقساط المعتمدة' },
    { id: 'att_summary', title: 'سجل الحضور والانصراف', cat: 'reports', icon: History, desc: 'تقرير شامل لمواعيد الدوام لفترة محددة' },
    { id: 'evaluation', title: 'التقييم السنوي للآداء', cat: 'reports', icon: Zap, desc: 'شهادة تقييم مهنية بناءً على مؤشرات الأداء' }
  ];

  const filteredEmployees = useMemo(() => {
    return employees.filter(e => 
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleGenerate = (templateId: string) => {
    if (!selectedEmp) return alert('يرجى اختيار موظف من القائمة الجانبية أولاً');
    
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
    } else if (templateId === 'warning') {
      type = 'warning';
      const lastWarning = warnings.filter(w => w.employeeId === selectedEmp).sort((a,b) => b.date.localeCompare(a.date))[0];
      if (!lastWarning) {
          alert('لا توجد سجلات عقوبات لهذا الموظف لإصدار وثيقة حالياً.');
          return;
      }
      data = { ...data, ...lastWarning };
    } else if (templateId === 'leave') {
       type = 'leave';
       const lastLeave = leaves.filter(l => l.employeeId === selectedEmp && l.status === 'approved').sort((a,b) => b.startDate.localeCompare(a.startDate))[0];
       if (!lastLeave) {
           alert('لا توجد إجازات معتمدة مسجلة لهذا الموظف لإصدار إشعار.');
           return;
       }
       data = { ...data, ...lastLeave };
    } else if (templateId === 'permission') {
       type = 'permission';
       const lastPermission = permissions.filter(p => p.employeeId === selectedEmp).sort((a,b) => b.date.localeCompare(a.date))[0];
       if (!lastPermission) {
           alert('لا توجد أذونات خروج مسجلة لهذا الموظف لإصدار سند.');
           return;
       }
       data = { ...data, ...lastPermission };
    } else if (templateId === 'loan') {
       type = 'loan';
       const activeLoan = loans.filter(l => l.employeeId === selectedEmp && l.remainingAmount > 0).sort((a,b) => b.date.localeCompare(a.date))[0];
       if (!activeLoan) {
           alert('لا توجد سلف نشطة مسجلة لهذا الموظف حالياً لإصدار سند.');
           return;
       }
       data = { ...data, ...activeLoan };
    } else if (templateId === 'evaluation') {
       data.notes = "إقرار أداء: بناءً على مراجعة الكفاءة للفترة المنقضية، نؤكد أن الموظف المذكور قد استوفى معايير الأداء المؤسسي بمستوى (جيد جداً)، مع التوصية بالاستمرار في تطوير مهارات القيادة والعمل الجماعي.";
    } else if (templateId === 'bonus') {
       type = 'financial';
       const lastBonus = financials.filter(f => f.employeeId === selectedEmp && f.type === 'bonus').sort((a,b) => b.date.localeCompare(a.date))[0];
       if (!lastBonus) {
           alert('لا توجد مكافآت مسجلة لهذا الموظف لإصدار سند.');
           return;
       }
       data = { ...data, ...lastBonus };
    }

    onPrint({
      title: template?.title || 'وثيقة رسمية',
      type: type,
      data: data
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-10 no-print">
        <div className="flex items-center gap-6 text-right">
           <div className="p-6 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/40">
              <Printer size={40}/>
           </div>
           <div>
              <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">نظام الوثائق المتكامل</h2>
              <p className="text-sm font-bold text-slate-400 mt-2">إصدار كافة التقارير والنماذج الرسمية بلمسة واحدة</p>
           </div>
        </div>

        <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-800 p-2 rounded-[2.5rem]">
           {categories.map(cat => (
             <button 
               key={cat.id} 
               onClick={() => setActiveCategory(cat.id as any)}
               className={`flex items-center gap-2 px-6 py-3 rounded-[2rem] font-black transition-all ${activeCategory === cat.id ? 'bg-white dark:bg-slate-900 shadow-xl scale-105 ' + cat.color : 'text-slate-400'}`}
             >
                <cat.icon size={18}/> {cat.title}
             </button>
           ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* الموظفين والبحث */}
        <div className="lg:col-span-1 space-y-6 no-print">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border dark:border-slate-800">
              <h3 className="text-xl font-black mb-6 text-indigo-700 flex items-center gap-2">
                <Search size={24}/> اختيار الموظف
              </h3>
              <div className="relative mb-6">
                 <input 
                   type="text" 
                   placeholder="بحث بالاسم أو القسم..." 
                   className="w-full pr-6 pl-12 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-bold transition-all outline-none text-right" 
                   value={searchTerm}
                   onChange={e => setSearchTerm(e.target.value)}
                 />
                 <Search className="absolute left-4 top-4 text-slate-400" size={18}/>
              </div>
              <div className="space-y-2 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar rtl">
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
                 {filteredEmployees.length === 0 && <p className="text-center py-10 text-slate-400 italic">لا يوجد نتائج للبحث</p>}
              </div>
           </div>

           {activeCategory === 'reports' && (
             <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-2xl border dark:border-slate-800 animate-in slide-in-from-bottom-4">
                <h3 className="text-xl font-black mb-6 text-emerald-600 flex items-center gap-2">
                   <Filter size={24}/> تحديد النطاق الزمني
                </h3>
                <div className="space-y-4">
                   <div className="text-right">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">تاريخ البداية</label>
                      <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-center" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                   </div>
                   <div className="text-right">
                      <label className="text-[10px] font-black text-slate-400 uppercase mb-1 block">تاريخ النهاية</label>
                      <input type="date" className="w-full p-4 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold text-center" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                   </div>
                </div>
             </div>
           )}
        </div>

        {/* القوالب المتاحة / سجل المحفوظات */}
        <div className="lg:col-span-2">
           {activeCategory === 'history' ? (
             <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-xl border dark:border-slate-800 overflow-hidden text-right">
               <div className="p-8 border-b dark:border-slate-800 bg-slate-50/50 flex justify-between items-center">
                  <h4 className="font-black text-indigo-700 flex items-center gap-2"><FileClock size={20}/> سجل المستندات المطبوعة</h4>
                  <span className="text-xs font-bold text-slate-400">آخر {printHistory.length} عمليات</span>
               </div>
               <div className="divide-y dark:divide-slate-800 max-h-[700px] overflow-y-auto">
                 {printHistory.map(record => (
                   <div key={record.id} className="p-6 hover:bg-indigo-50/20 transition-all flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                           <FileText size={20}/>
                        </div>
                        <div>
                           <p className="font-black text-slate-900 dark:text-white">{record.title}</p>
                           <p className="text-[10px] font-bold text-slate-500 italic mt-1">{record.employeeName} - {new Date(record.date).toLocaleString('ar-EG')}</p>
                        </div>
                     </div>
                     <button 
                       onClick={() => handleGenerate(templates.find(t => t.title === record.title)?.id || 'evaluation')} 
                       className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                       title="إعادة إصدار"
                     >
                       <Printer size={18}/>
                     </button>
                   </div>
                 ))}
                 {printHistory.length === 0 && (
                   <div className="p-20 text-center text-slate-400 italic font-black">لم يتم طباعة أي مستندات رسمية حتى الآن.</div>
                 )}
               </div>
             </div>
           ) : (
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
                     <div className="w-full">
                        <h4 className="text-2xl font-black text-slate-900 dark:text-white">{template.title}</h4>
                        <p className="text-xs font-bold text-slate-400 mt-2 leading-relaxed">{template.desc}</p>
                     </div>
                     <div className="mt-auto pt-6 w-full flex justify-between items-center border-t border-slate-50 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-widest">توليد تقرير احترافي</span>
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-slate-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                           <ChevronRight size={24}/>
                        </div>
                     </div>
                  </button>
                ))}
             </div>
           )}

           {/* تلميحات احترافية */}
           <div className="mt-10 bg-slate-900 text-white p-10 rounded-[3.5rem] shadow-2xl flex items-center gap-10">
              <div className="hidden md:block">
                 <div className="w-24 h-24 bg-indigo-500/20 rounded-full flex items-center justify-center animate-pulse">
                    <FileText size={40} className="text-indigo-400"/>
                 </div>
              </div>
              <div className="text-right">
                 <h5 className="text-xl font-black mb-2">معلومات النظام الذكي</h5>
                 <p className="text-sm font-bold text-slate-400 leading-relaxed">
                   عند إصدار "سند سلفة"، سيقوم النظام تلقائياً بسحب تفاصيل آخر سلفة نشطة للموظف بما في ذلك جدول الأقساط. يمكنك التحكم في اتجاه الطباعة (طولي/عرضي) من نافذة المعاينة لضمان أفضل تنسيق للمستند قبل تنفيذه. يتم الاحتفاظ بنسخة رقمية من السند في تبويب "المحفوظات".
                 </p>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default PrintForms;
