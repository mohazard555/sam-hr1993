
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, User as UserIcon, CheckCircle2, XCircle } from 'lucide-react';
import { exportToExcel } from '../utils/export';

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
  moduleType?: string;
}

export function GenericModule<T extends { id: string; employeeId: string; date?: string; startDate?: string; endDate?: string; amount?: number; type?: string; remainingAmount?: number; isPaid?: boolean }>({ 
  title, lang, employees, items, onSave, onDelete, renderForm, renderRow, tableHeaders, initialData, moduleType 
}: GenericModuleProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const isRtl = lang === 'ar';

  const filteredItems = useMemo(() => {
    return (items || []).filter(item => {
      if (!item) return false;
      const emp = employees.find(e => e.id === item.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const itemDate = item.date || item.startDate || '';
      const dateMatch = (!dateFrom || itemDate >= dateFrom) && (!dateTo || itemDate <= dateTo);
      return nameMatch && dateMatch;
    });
  }, [items, searchTerm, dateFrom, dateTo, employees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert(isRtl ? 'اختر موظف' : 'Select employee');
    onSave({ ...formData, id: formData.id || Math.random().toString(36).substr(2, 9) } as T);
    setShowModal(false);
    setFormData(initialData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
        <h2 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{title}</h2>
        <div className="flex gap-2">
          <button onClick={() => { setFormData(initialData); setShowModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all"><Plus size={20} /> إضافة جديد</button>
          <button onClick={() => exportToExcel(filteredItems, title)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><FileDown size={20} /> Excel</button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Printer size={20} /> طباعة</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-lg">
         <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-400" size={18}/><input className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black" placeholder="بحث باسم الموظف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
         <div className="flex items-center gap-2"><span className="text-xs font-black">من:</span><input type="date" className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold border" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
         <div className="flex items-center gap-2"><span className="text-xs font-black">إلى:</span><input type="date" className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold border" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-100 dark:bg-slate-800 border-b">
            <tr className="text-slate-900 dark:text-slate-100 font-black text-xs uppercase">
              {tableHeaders.map((h, i) => <th key={i} className="px-6 py-5">{h}</th>)}
              <th className="px-6 py-5 text-center no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                {renderRow(item, employees.find(e => e.id === item.employeeId)?.name || 'Unknown')}
                <td className="px-6 py-5 text-center no-print">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-2 text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-400">إدخال سجل {title}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-950 font-black text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-[10px] font-black mb-2 text-slate-500 uppercase tracking-widest">الموظف</label>
                <select className="w-full p-4 border-2 dark:bg-slate-800 rounded-2xl font-black" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                  <option value="">اختر الموظف...</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              {renderForm(formData, setFormData)}
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg">حفظ</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-5 rounded-2xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
