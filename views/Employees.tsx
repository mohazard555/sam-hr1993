
import React, { useState } from 'react';
import { Employee } from '../types';
import { UserPlus, Search, Edit2, Trash2, Mail, Phone } from 'lucide-react';

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
      id: Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      position: formData.position || '',
      department: formData.department || '',
      baseSalary: Number(formData.baseSalary),
      transportAllowance: Number(formData.transportAllowance),
      nationalId: formData.nationalId || '',
      phone: formData.phone || '',
      joinDate: new Date().toISOString().split('T')[0],
      vacationBalance: Number(formData.vacationBalance),
    };
    onAdd(newEmp);
    setShowModal(false);
    setFormData({});
  };

  const filtered = employees.filter(e => 
    e.name.includes(searchTerm) || e.position.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="relative w-72">
          <Search className="absolute right-3 top-2.5 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="بحث عن موظف..."
            className="w-full pr-10 pl-4 py-2 bg-white border rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100"
        >
          <UserPlus size={20} />
          إضافة موظف جديد
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="px-6 py-4 text-slate-600 font-bold">الموظف</th>
              <th className="px-6 py-4 text-slate-600 font-bold">المنصب / القسم</th>
              <th className="px-6 py-4 text-slate-600 font-bold">الراتب الأساسي</th>
              <th className="px-6 py-4 text-slate-600 font-bold">تاريخ الانضمام</th>
              <th className="px-6 py-4 text-slate-600 font-bold">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.map(emp => (
              <tr key={emp.id} className="hover:bg-slate-50 transition">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold">
                      {emp.name[0]}
                    </div>
                    <div>
                      <p className="font-bold text-slate-900">{emp.name}</p>
                      <p className="text-xs text-slate-500">{emp.nationalId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <p className="text-slate-800 font-medium">{emp.position}</p>
                  <p className="text-xs text-slate-500">{emp.department}</p>
                </td>
                <td className="px-6 py-4">
                  <p className="font-bold text-blue-600">{emp.baseSalary} ر.س</p>
                </td>
                <td className="px-6 py-4 text-slate-500">
                  {emp.joinDate}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition"><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(emp.id)} className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-400">لا يوجد موظفين حالياً</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50">
              <h3 className="text-xl font-bold">إضافة موظف جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">الاسم الكامل</label>
                <input required className="w-full p-3 border rounded-xl" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">المسمى الوظيفي</label>
                <input required className="w-full p-3 border rounded-xl" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">القسم</label>
                <input className="w-full p-3 border rounded-xl" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">الراتب الأساسي</label>
                <input type="number" className="w-full p-3 border rounded-xl" value={formData.baseSalary || 0} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">بدل المواصلات</label>
                <input type="number" className="w-full p-3 border rounded-xl" value={formData.transportAllowance || 0} onChange={e => setFormData({...formData, transportAllowance: Number(e.target.value)})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">رقم الهاتف</label>
                <input className="w-full p-3 border rounded-xl" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
              </div>
              <div className="col-span-2 mt-4 flex gap-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700">حفظ البيانات</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;
