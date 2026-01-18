
import React, { useState } from 'react';
import { Plus, Trash2, Building, Users, ChevronDown, ChevronUp, UserPlus } from 'lucide-react';
import { Employee } from '../types';

interface Props {
  departments: string[];
  employees: Employee[];
  onUpdate: (depts: string[]) => void;
  onUpdateEmployee: (emp: Employee) => void;
}

const Departments: React.FC<Props> = ({ departments = [], employees = [], onUpdate, onUpdateEmployee }) => {
  const [newDept, setNewDept] = useState('');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const addDept = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedDept = newDept.trim();
    if (trimmedDept && !departments.includes(trimmedDept)) {
      // نرسل نسخة جديدة من المصفوفة لضمان تحديث الـ State في React
      const updatedDepts = [...departments, trimmedDept];
      onUpdate(updatedDepts);
      setNewDept('');
    } else if (departments.includes(trimmedDept)) {
      alert('هذا القسم موجود بالفعل!');
    }
  };

  const removeDept = (dept: string) => {
    if (window.confirm(`هل أنت متأكد من حذف قسم "${dept}"؟ سيتم إلغاء تعيين الموظفين منه.`)) {
      const updatedDepts = departments.filter(d => d !== dept);
      onUpdate(updatedDepts);
    }
  };

  const changeEmpDept = (emp: Employee, newD: string) => {
    onUpdateEmployee({ ...emp, department: newD });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white dark:bg-slate-900 p-10 rounded-[3rem] shadow-2xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-2xl font-black mb-8 text-indigo-700 dark:text-indigo-400 flex items-center gap-3">
          <Building size={28}/>
          إدارة هيكلية الأقسام والوحدات
        </h3>
        
        <form onSubmit={addDept} className="flex flex-col md:flex-row gap-4 mb-12">
          <input 
            className="flex-1 p-4 border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-800 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition"
            placeholder="اسم القسم الجديد (مثال: قسم الجودة)..."
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
          />
          <button 
            type="submit" 
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus size={24}/> إضافة القسم
          </button>
        </form>

        <div className="space-y-6">
          {departments.map(dept => {
            const deptEmps = (employees || []).filter(e => e.department === dept);
            const isExpanded = expandedDept === dept;

            return (
              <div key={dept} className="bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border-2 border-transparent hover:border-indigo-200 dark:hover:border-indigo-900 overflow-hidden transition-all shadow-sm">
                <div 
                  className="flex items-center justify-between p-7 cursor-pointer"
                  onClick={() => setExpandedDept(isExpanded ? null : dept)}
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-700 dark:text-indigo-400 shadow-inner">
                       <Building size={24} />
                    </div>
                    <div>
                      <span className="font-black text-xl text-slate-950 dark:text-white">{dept}</span>
                      <p className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 mt-1">
                        <Users size={14}/> {deptEmps.length} موظف نشط
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <button 
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeDept(dept); }} 
                      className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition"
                    >
                      <Trash2 size={20}/>
                    </button>
                    <div className="p-2 text-slate-400 bg-white dark:bg-slate-900 rounded-full shadow-sm">
                        {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-8 pt-0 bg-white/70 dark:bg-slate-950/20 border-t-2 dark:border-slate-800 animate-in slide-in-from-top-4">
                    <div className="flex justify-between items-center mb-6 pt-6">
                        <h4 className="text-sm font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <UserPlus size={16}/> الموظفين المنتسبين للقسم:
                        </h4>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       {deptEmps.map(emp => (
                         <div key={emp.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all">
                           <span className="font-black text-slate-950 dark:text-white text-sm">{emp.name}</span>
                           <select 
                             className="text-[10px] font-black p-2 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-xl focus:border-indigo-600 outline-none"
                             value={emp.department}
                             onChange={(e) => changeEmpDept(emp, e.target.value)}
                           >
                             {departments.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                         </div>
                       ))}
                       {deptEmps.length === 0 && (
                         <div className="col-span-full py-10 text-center text-slate-400 italic font-black text-sm">
                             لا يوجد موظفين حالياً في هذا القسم.
                         </div>
                       )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          {departments.length === 0 && (
            <div className="py-24 text-center text-slate-400 italic font-black">لم يتم تعريف أية أقسام بعد في هيكلية الشركة.</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Departments;
