
import React, { useState } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, Edit2, Search } from 'lucide-react';

interface GenericModuleProps<T> {
  title: string;
  lang: 'ar' | 'en';
  employees: Employee[];
  items: T[];
  onSave: (item: T) => void;
  onDelete: (id: string) => void;
  renderForm: (formData: Partial<T>, setFormData: React.Dispatch<React.SetStateAction<Partial<T>>>) => React.ReactNode;
  renderRow: (item: T, employeeName: string) => React.ReactNode;
  tableHeaders: string[];
  initialData: Partial<T>;
}

export function GenericModule<T extends { id: string; employeeId: string }>({ 
  title, lang, employees, items, onSave, onDelete, renderForm, renderRow, tableHeaders, initialData 
}: GenericModuleProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(initialData);
  const isRtl = lang === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const item = {
      ...formData,
      id: formData.id || Math.random().toString(36).substr(2, 9)
    } as T;
    onSave(item);
    setShowModal(false);
    setFormData(initialData);
  };

  const handleEdit = (item: T) => {
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(isRtl ? 'هل أنت متأكد من الحذف؟' : 'Are you sure?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-2xl font-black text-slate-800">{title}</h2>
        <button 
          onClick={() => { setFormData(initialData); setShowModal(true); }}
          className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition"
        >
          <Plus size={20} />
          {isRtl ? 'إضافة جديد' : 'Add New'}
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-700 border-b">
            <tr>
              {tableHeaders.map((h, i) => <th key={i} className="px-6 py-4 font-bold">{h}</th>)}
              <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 transition">
                {renderRow(item, employees.find(e => e.id === item.employeeId)?.name || 'Unknown')}
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleEdit(item)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={() => handleDelete(item.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={tableHeaders.length + 1} className="py-20 text-center text-slate-400 italic">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-xl overflow-hidden">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h3 className="text-xl font-bold text-indigo-900">{isRtl ? 'إدخال بيانات' : 'Enter Data'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-950 font-black">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1 text-slate-700">{isRtl ? 'الموظف' : 'Employee'}</label>
                <select 
                  className="w-full p-3 border border-slate-300 rounded-xl font-bold" 
                  value={formData.employeeId || ''}
                  onChange={e => setFormData({...formData, employeeId: e.target.value})}
                  required
                >
                  <option value="">{isRtl ? 'اختر موظف' : 'Select Employee'}</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {renderForm(formData, setFormData)}
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-indigo-100 hover:bg-indigo-700">{isRtl ? 'حفظ' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 py-4 rounded-2xl font-bold">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
