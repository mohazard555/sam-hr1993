
import React, { useState } from 'react';
import { Plus, Trash2, Building, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Employee } from '../types';

interface Props {
  departments: string[];
  employees: Employee[];
  onUpdate: (depts: string[]) => void;
  onUpdateEmployee: (emp: Employee) => void;
}

const Departments: React.FC<Props> = ({ departments, employees, onUpdate, onUpdateEmployee }) => {
  const [newDept, setNewDept] = useState('');
  const [expandedDept, setExpandedDept] = useState<string | null>(null);

  const addDept = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDept && !departments.includes(newDept)) {
      onUpdate([...departments, newDept]);
      setNewDept('');
    }
  };

  const removeDept = (dept: string) => {
    if (window.confirm(`هل أنت متأكد من حذف قسم "${dept}"؟`)) {
      onUpdate(departments.filter(d => d !== dept));
    }
  };

  const changeEmpDept = (emp: Employee, newD: string) => {
    onUpdateEmployee({ ...emp, department: newD });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800">
        <h3 className="text-xl font-black mb-6 text-indigo-600 flex items-center gap-2">
          <Building size={24}/>
          إدارة أقسام الشركة والموظفين
        </h3>
        <form onSubmit={addDept} className="flex gap-4 mb-10">
          <input 
            className="flex-1 p-3 border-2 border-slate-200 dark:border-slate-800 dark:bg-slate-800 rounded-xl font-bold text-slate-900 dark:text-white"
            placeholder="اسم القسم الجديد..."
            value={newDept}
            onChange={e => setNewDept(e.target.value)}
          />
          <button type="submit" className="bg-indigo-600 text-white px-8 rounded-xl font-black shadow-lg hover:bg-indigo-700 transition">
            <Plus size={20}/>
          </button>
        </form>

        <div className="space-y-4">
          {departments.map(dept => {
            const deptEmps = employees.filter(e => e.department === dept);
            const isExpanded = expandedDept === dept;

            return (
              <div key={dept} className="bg-slate-50 dark:bg-slate-800/40 rounded-[2rem] border-2 border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 overflow-hidden transition-all">
                <div 
                  className="flex items-center justify-between p-6 cursor-pointer"
                  onClick={() => setExpandedDept(isExpanded ? null : dept)}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600">
                       <Building size={20} />
                    </div>
                    <div>
                      <span className="font-black text-lg text-slate-900 dark:text-white">{dept}</span>
                      <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                        <Users size={12}/> {deptEmps.length} موظف
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={(e) => { e.stopPropagation(); removeDept(dept); }} className="p-2 text-slate-400 hover:text-rose-600 transition">
                      <Trash2 size={18}/>
                    </button>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-6 pt-0 bg-white/50 dark:bg-slate-950/20 border-t dark:border-slate-800 animate-in slide-in-from-top-2">
                    <h4 className="text-xs font-black text-indigo-500 mb-4 uppercase">موظفو القسم:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                       {deptEmps.map(emp => (
                         <div key={emp.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                           <span className="font-bold text-slate-900 dark:text-white text-sm">{emp.name}</span>
                           <select 
                             className="text-[10px] font-black p-1 bg-slate-50 dark:bg-slate-800 border rounded"
                             value={emp.department}
                             onChange={(e) => changeEmpDept(emp, e.target.value)}
                           >
                             {departments.map(d => <option key={d} value={d}>{d}</option>)}
                           </select>
                         </div>
                       ))}
                       {deptEmps.length === 0 && <p className="text-xs text-slate-400 italic">لا يوجد موظفين في هذا القسم</p>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Departments;
