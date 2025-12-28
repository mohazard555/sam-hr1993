
import React, { useState } from 'react';
import { Employee, CompanySettings } from '../types';
import { Printer, FileText, User, ClipboardList, AlertTriangle, CheckCircle2, Calendar } from 'lucide-react';

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
    leave: { title: 'طلب إجازة رسمي', icon: Calendar, color: 'text-indigo-600', bg: 'bg-indigo-50', placeholder: 'حدد نوع الإجازة وتاريخها وسببها...' },
    permission: { title: 'إذن انصراف / دخول', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', placeholder: 'اذكر سبب الإذن والموعد المطلوب...' },
    warning: { title: 'لفت نظر / إنذار إداري', icon: FileText, color: 'text-amber-600', bg: 'bg-amber-50', placeholder: 'اشرح مخالفة الموظف وتفاصيل الإنذار...' },
    penalty: { title: 'قرار عقوبة / خصم مالي', icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', placeholder: 'حدد قيمة الخصم وتفاصيل المخالفة الموجبة للعقوبة...' },
  };

  const handleGenerate = () => {
    if (!selectedEmp) return alert('يرجى اختيار موظف أولاً');
    const emp = employees.find(e => e.id === selectedEmp);
    onPrint({
      title: formConfigs[formType].title,
      data: {
        employeeId: selectedEmp,
        employeeName: emp?.name,
        notes: details,
        date: new Date().toISOString().split('T')[0],
        id: 'FORM-' + Math.random().toString(36).substr(2, 6).toUpperCase()
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border dark:border-slate-800">
        <div className="flex items-center gap-4 mb-10">
           <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
              <Printer size={32}/>
           </div>
           <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white">مركز الوثائق والنماذج</h2>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">توليد مستندات رسمية جاهزة للطباعة والتوقيع</p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">1. اختيار الموظف المعني</label>
              <select className="w-full p-4 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-2xl font-black transition-all outline-none" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                 <option value="">-- اختر موظف من القائمة --</option>
                 {employees.map(e => <option key={e.id} value={e.id}>{e.name} ({e.department})</option>)}
              </select>
           </div>
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">2. نوع النموذج المطلوب</label>
              <div className="grid grid-cols-2 gap-3">
                 {(Object.keys(formConfigs) as Array<keyof typeof formConfigs>).map(type => (
                   <button key={type} onClick={() => setFormType(type)} className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${formType === type ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800 hover:border-indigo-200'}`}>
                      <span className={`${formType === type ? 'text-indigo-600' : 'text-slate-400'}`}>{React.createElement(formConfigs[type].icon, { size: 24 })}</span>
                      <span className={`text-[10px] font-black ${formType === type ? 'text-indigo-700' : 'text-slate-500'}`}>{formConfigs[type].title.split(' ')[0]}</span>
                   </button>
                 ))}
              </div>
           </div>
        </div>

        <div className="space-y-6">
           <div>
              <label className="text-[10px] font-black text-slate-400 uppercase mb-2 block">3. تفاصيل المستند (البيان)</label>
              <textarea className="w-full p-6 bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 rounded-3xl font-bold h-48 outline-none transition-all resize-none" placeholder={formConfigs[formType].placeholder} value={details} onChange={e => setDetails(e.target.value)}></textarea>
           </div>
           
           <div className={`p-6 rounded-3xl border-2 border-dashed flex items-center gap-4 ${formConfigs[formType].bg} ${formConfigs[formType].color.replace('text', 'border')}`}>
              <span className={formConfigs[formType].color}>{React.createElement(formConfigs[formType].icon, { size: 40 })}</span>
              <div>
                 <h4 className="font-black text-lg">سوف يتم توليد: {formConfigs[formType].title}</h4>
                 <p className="text-xs font-bold opacity-70">المستند سيشمل الترويسة الرسمية، رقم مرجعي، ومكان لتوقيع الموظف والإدارة.</p>
              </div>
           </div>

           <button onClick={handleGenerate} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl shadow-2xl hover:bg-slate-950 transition-all flex items-center justify-center gap-3">
              <Printer size={28}/> معاينة وطباعة الوثيقة
           </button>
        </div>
      </div>
    </div>
  );
};

export default PrintForms;
