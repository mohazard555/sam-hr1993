
import React, { useState } from 'react';
import { Employee, CompanySettings } from '../types';
import { Printer, FileText, ClipboardList, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

interface Props {
  employees: Employee[];
  settings: CompanySettings;
  onPrint: (doc: { title: string, data: any }) => void;
}

const PrintForms: React.FC<Props> = ({ employees, settings, onPrint }) => {
  const [selectedEmp, setSelectedEmp] = useState('');
  const [formType, setFormType] = useState<'leave' | 'permission' | 'warning' | 'penalty'>('leave');
  const [details, setDetails] = useState('');

  const formConfigs = {
    leave: { 
      title: 'طلب إجازة رسمي', 
      icon: Calendar, 
      color: 'text-indigo-600', 
      placeholder: 'السيد مدير الموارد البشرية المحترم،\n\nأرجو التكرم بالموافقة على منحي إجازة (سنوية/مرضية/اضطرارية) تبدأ من تاريخ ... ولغاية تاريخ ...\n\nولكم خالص الشكر والتقدير.' 
    },
    permission: { 
      title: 'إذن مغادرة مؤقت', 
      icon: CheckCircle2, 
      color: 'text-emerald-600', 
      placeholder: 'يسمح للموظف المذكور أدناه بمغادرة مكان العمل مؤقتاً في تمام الساعة ... وذلك لمهمة خارجية/ظرف خاص، على أن يعود في تمام الساعة ...' 
    },
    warning: { 
      title: 'كتاب لفت نظر إداري رسمي', 
      icon: FileText, 
      color: 'text-amber-600', 
      placeholder: 'بالإشارة إلى سجلات الحضور والانصراف/التقييم الفني، فقد تبيّن قيامكم بمخالفة (تأخر متكرر/عدم الالتزام بالتعليمات) بتاريخ ...\n\nوعليه يتم لفت نظركم رسمياً بضرورة تلافي هذه المخالفة مستقبلاً تحت طائلة المسؤولية.' 
    },
    penalty: { 
      title: 'قرار عقوبة إدارية مسببة', 
      icon: AlertTriangle, 
      color: 'text-rose-600', 
      placeholder: 'قررت إدارة المؤسسة بناءً على الصلاحيات الممنوحة لها، فرض عقوبة (خصم مبلغ مالي/حسم يوم عمل) على الموظف المذكور، وذلك نتيجة تكرار المخالفات المنسوبة إليه بتاريخ ...' 
    },
  };

  const handleGenerate = () => {
    if (!selectedEmp) return alert('يرجى اختيار الموظف أولاً من القائمة');
    const emp = employees.find(e => e.id === selectedEmp);
    onPrint({
      title: formConfigs[formType].title,
      data: {
        employeeId: selectedEmp,
        employeeName: emp?.name,
        notes: details,
        date: new Date().toLocaleDateString('ar-SY'),
        id: 'DOC-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20 no-print">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border dark:border-slate-800">
        <div className="flex items-center gap-4 mb-10">
           <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
              <FileText size={32}/>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">محرر الخطابات الإدارية</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">إنشاء وثائق رسمية دقيقة للتوقيع</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">1. اسم الموظف المعني</label>
              <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black transition-all outline-none dark:text-white" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                 <option value="">-- اختر من السجلات --</option>
                 {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
              </select>
           </div>
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">2. نوع الخطاب الرسمي</label>
              <div className="grid grid-cols-2 gap-3">
                 {(Object.keys(formConfigs) as Array<keyof typeof formConfigs>).map(type => (
                   <button key={type} onClick={() => { setFormType(type); setDetails(formConfigs[type].placeholder); }} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formType === type ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-md' : 'border-slate-100 dark:border-slate-800'}`}>
                      <span className={`${formType === type ? 'text-indigo-600' : 'text-slate-400'}`}>{React.createElement(formConfigs[type].icon, { size: 24 })}</span>
                      <span className={`text-[10px] font-black ${formType === type ? 'text-indigo-700' : 'text-slate-500'}`}>{formConfigs[type].title.split(' ')[0]}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block tracking-widest">3. نص الموضوع والبيانات</label>
              <textarea className="w-full p-8 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-3xl font-bold h-64 outline-none transition-all resize-none text-lg leading-relaxed dark:text-white" placeholder="أدخل محتوى الخطاب هنا..." value={details} onChange={e => setDetails(e.target.value)}></textarea>
           </div>
           
           <button onClick={handleGenerate} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3">
              <Printer size={28}/> توليد ومعاينة الطباعة
           </button>
        </div>
      </div>
    </div>
  );
};

export default PrintForms;
