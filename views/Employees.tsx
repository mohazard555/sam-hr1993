
import React, { useState } from 'react';
import { Employee } from '../types';
import { UserPlus, Search, Edit2, Trash2, Mail, Phone, Settings2 } from 'lucide-react';

interface Props {
  employees: Employee[];
  onAdd: (e: Employee) => void;
  onDelete: (id: string) => void;
}

const Employees: React.FC<Props> = ({ employees, onAdd, onDelete }) => {
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
          <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="بحث عن موظف بالاسم، المنصب، أو القسم..."
            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => { setFormData({ baseSalary: 3000, transportAllowance: 500, vacationBalance: 21 }); setShowModal(true); }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition shadow-xl shadow-indigo-100 dark:shadow-none font-black"
        >
          <UserPlus size={20} />
          إضافة موظف جديد
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700">
              <tr>
                <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-black uppercase text-xs">الموظف</th>
                <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-black uppercase text-xs">المنصب / القسم</th>
                <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-black uppercase text-xs text-center">الراتب / المواصلات</th>
                <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-black uppercase text-xs text-center">الإضافي / الخصم</th>
                <th className="px-6 py-5 text-slate-600 dark:text-slate-400 font-black uppercase text-xs text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 font-black text-lg">
                        {emp.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold">{emp.nationalId}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-slate-800 dark:text-slate-200 font-black">{emp.position}</p>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md text-slate-500 font-bold">{emp.department}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="font-black text-indigo-600">{emp.baseSalary}</p>
                    <p className="text-[10px] text-emerald-600 font-bold">+{emp.transportAllowance}</p>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="text-[10px] font-bold text-slate-500">
                      {emp.customOvertimeRate ? `إضافي: ${emp.customOvertimeRate}x` : 'إضافي: افتراضي'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-500">
                      {emp.customDeductionRate ? `خصم: ${emp.customDeductionRate}/د` : 'خصم: افتراضي'}
                    </p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(emp)} className="p-3 text-slate-400 hover:text-indigo-600 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition"><Edit2 size={18}/></button>
                      <button onClick={() => onDelete(emp.id)} className="p-3 text-slate-400 hover:text-red-600 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-400 italic">لا يوجد موظفين مطابقين للبحث</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden">
            <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
              <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-400">{formData.id ? 'تعديل بيانات موظف' : 'إضافة موظف جديد'}</h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-white dark:bg-slate-700 rounded-full shadow hover:scale-110 transition">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الاسم الكامل</label>
                  <input required className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">المسمى الوظيفي</label>
                  <input required className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">القسم</label>
                  <input className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">الراتب الأساسي</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.baseSalary || 0} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">بدل المواصلات</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.transportAllowance || 0} onChange={e => setFormData({...formData, transportAllowance: Number(e.target.value)})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">رقم الهاتف</label>
                  <input className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                
                <div className="col-span-full border-t dark:border-slate-800 pt-6 mt-2">
                  <div className="flex items-center gap-2 mb-4 text-indigo-600">
                    <Settings2 size={18} />
                    <span className="font-black text-sm uppercase">تخصيص القيم (اختياري)</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-500 uppercase">سعر ساعة الإضافي (مضاعف)</label>
                      <input type="number" step="0.1" placeholder="مثال: 1.5" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.customOvertimeRate || ''} onChange={e => setFormData({...formData, customOvertimeRate: e.target.value ? Number(e.target.value) : undefined})} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-black text-slate-500 uppercase">قيمة خصم الدقيقة الواحدة</label>
                      <input type="number" step="0.1" placeholder="مثال: 2.0" className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-bold" value={formData.customDeductionRate || ''} onChange={e => setFormData({...formData, customDeductionRate: e.target.value ? Number(e.target.value) : undefined})} />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-10 flex gap-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-[2rem] font-black text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 dark:shadow-none transition-all">حفظ البيانات</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-[2rem] font-black text-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-all">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
