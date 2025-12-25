
import React, { useState } from 'react';
import { Employee } from '../types';
import { UserPlus, Search, Edit2, Trash2, Settings2, Clock } from 'lucide-react';

interface Props {
  employees: Employee[];
  departments: string[];
  onAdd: (e: Employee) => void;
  onDelete: (id: string) => void;
}

const Employees: React.FC<Props> = ({ employees, departments, onAdd, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<Partial<Employee>>({
    baseSalary: 3000,
    transportAllowance: 500,
    vacationBalance: 21,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      position: formData.position || '',
      department: formData.department || '',
      baseSalary: Number(formData.baseSalary),
      transportAllowance: Number(formData.transportAllowance),
      nationalId: formData.nationalId || '',
      phone: formData.phone || '',
      joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      vacationBalance: Number(formData.vacationBalance),
      customOvertimeRate: formData.customOvertimeRate ? Number(formData.customOvertimeRate) : undefined,
      customDeductionRate: formData.customDeductionRate ? Number(formData.customDeductionRate) : undefined,
      customCheckIn: formData.customCheckIn || undefined,
      customCheckOut: formData.customCheckOut || undefined,
    };
    onAdd(newEmp);
    setShowModal(false);
    setFormData({
      baseSalary: 3000,
      transportAllowance: 500,
      vacationBalance: 21,
    });
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setShowModal(true);
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-2.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="بحث عن موظف..."
            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setFormData({ baseSalary: 3000, transportAllowance: 500, vacationBalance: 21 }); setShowModal(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition shadow-xl font-black"
        >
          <UserPlus size={20} />
          إضافة موظف
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs">الموظف</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs">المنصب / القسم</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs text-center">الراتب</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs text-center">الدوام</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{emp.nationalId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-slate-900 dark:text-slate-200 font-black">{emp.position}</p>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400 font-bold">{emp.department}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="font-black text-slate-900 dark:text-white">{emp.baseSalary}</p>
                    <p className="text-[10px] text-emerald-700 font-bold">+{emp.transportAllowance}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <div className="inline-flex flex-col items-center">
                       <Clock size={12} className="text-slate-500 mb-1"/>
                       <p className="text-[10px] font-black text-slate-700 dark:text-slate-300">
                         {emp.customCheckIn || 'افتراضي'} - {emp.customCheckOut || 'افتراضي'}
                       </p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(emp)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"><Edit2 size={16}/></button>
                      <button onClick={() => onDelete(emp.id)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800">
            <div className="sticky top-0 p-6 border-b bg-white dark:bg-slate-900 dark:border-slate-800 flex justify-between items-center z-10">
              <h3 className="text-xl font-black text-slate-900 dark:text-white">{formData.id ? 'تعديل موظف' : 'إضافة موظف'}</h3>
              <button onClick={() => setShowModal(false)} className="w-8 h-8 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">الاسم الكامل</label>
                  <input required className="w-full p-3 border-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">المنصب</label>
                  <input required className="w-full p-3 border-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">القسم</label>
                  <select required className="w-full p-3 border-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                     <option value="">اختر قسم...</option>
                     {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">الراتب الأساسي</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white" value={formData.baseSalary || 0} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">المواصلات</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white" value={formData.transportAllowance || 0} onChange={e => setFormData({...formData, transportAllowance: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-600 dark:text-slate-400 uppercase">رقم الهاتف</label>
                  <input className="w-full p-3 border-2 dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-white" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t dark:border-slate-800 pt-8">
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-black text-indigo-600 uppercase text-xs"><Clock size={16}/> إعدادات الدوام المخصصة</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1">وقت الحضور</label>
                      <input type="time" className="w-full p-2 border dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg font-bold" value={formData.customCheckIn || ''} onChange={e => setFormData({...formData, customCheckIn: e.target.value})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1">وقت الانصراف</label>
                      <input type="time" className="w-full p-2 border dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg font-bold" value={formData.customCheckOut || ''} onChange={e => setFormData({...formData, customCheckOut: e.target.value})} />
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 font-black text-emerald-600 uppercase text-xs"><Settings2 size={16}/> إعدادات الحساب المخصصة</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1">سعر الإضافي (مضاعف)</label>
                      <input type="number" step="0.1" className="w-full p-2 border dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg font-bold" value={formData.customOvertimeRate || ''} onChange={e => setFormData({...formData, customOvertimeRate: e.target.value ? Number(e.target.value) : undefined})} />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-500 block mb-1">قيمة خصم الدقيقة</label>
                      <input type="number" step="0.1" className="w-full p-2 border dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg font-bold" value={formData.customDeductionRate || ''} onChange={e => setFormData({...formData, customDeductionRate: e.target.value ? Number(e.target.value) : undefined})} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
