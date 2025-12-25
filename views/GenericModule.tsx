
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar } from 'lucide-react';
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
  type?: 'loans' | 'leaves' | 'financials' | 'production' | 'warnings';
}

export function GenericModule<T extends { id: string; employeeId: string; date?: string; startDate?: string; endDate?: string }>({ 
  title, lang, employees, items, onSave, onDelete, renderForm, renderRow, tableHeaders, initialData, type 
}: GenericModuleProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const isRtl = lang === 'ar';

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const itemDate = item.date || item.startDate || '';
      const dateMatch = (!dateFrom || itemDate >= dateFrom) && (!dateTo || itemDate <= dateTo);
      
      return nameMatch && dateMatch;
    });
  }, [items, searchTerm, dateFrom, dateTo, employees]);

  const handleExport = () => {
    const exportData = filteredItems.map(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      const { id, employeeId, ...rest } = item as any;
      return { [isRtl ? 'الموظف' : 'Employee']: emp?.name, ...rest };
    });
    exportToExcel(exportData, title);
  };

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-xl border dark:border-slate-800 no-print">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">{title}</h2>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setFormData(initialData); setShowModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-indigo-700 transition shadow-lg">
            <Plus size={20} /> {isRtl ? 'إضافة جديد' : 'Add New'}
          </button>
          <button onClick={handleExport} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700 transition shadow-lg">
            <FileDown size={20} /> Excel
          </button>
          <button onClick={() => window.print()} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-slate-900 transition shadow-lg">
            <Printer size={20} /> {isRtl ? 'طباعة' : 'Print'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 no-print bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-lg">
         <div className="relative">
           <Search className="absolute right-3 top-3 text-slate-400" size={18} />
           <input className="w-full pr-10 pl-4 py-2 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-xl font-bold" placeholder={isRtl ? 'بحث باسم الموظف...' : 'Search employee...'} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <input type="date" className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-xl font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
         </div>
         <div className="flex items-center gap-2">
            <Calendar size={18} className="text-indigo-600" />
            <input type="date" className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-xl font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} />
         </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-100 dark:bg-slate-800 border-b dark:border-slate-700">
            <tr className="text-slate-900 dark:text-slate-100">
              {tableHeaders.map((h, i) => <th key={i} className="px-6 py-4 font-black text-xs uppercase">{h}</th>)}
              <th className="px-6 py-4 text-center no-print">{isRtl ? 'إجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                {renderRow(item, employees.find(e => e.id === item.employeeId)?.name || 'Unknown')}
                <td className="px-6 py-4 text-center no-print">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={() => { if(confirm(isRtl ? 'حذف؟' : 'Delete?')) onDelete(item.id); }} className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr><td colSpan={tableHeaders.length + 1} className="py-20 text-center text-slate-400 italic font-bold">{isRtl ? 'لا توجد بيانات متاحة' : 'No data available'}</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border dark:border-slate-800">
            <div className="p-6 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-xl font-black text-indigo-900 dark:text-indigo-400">{isRtl ? 'إدخال بيانات' : 'Enter Data'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-950 font-black">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-4">
              <div>
                <label className="block text-xs font-black mb-1 text-slate-500 uppercase">{isRtl ? 'الموظف' : 'Employee'}</label>
                <select 
                  className="w-full p-3 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-xl font-black text-slate-900 dark:text-white" 
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
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-4 rounded-2xl font-black shadow-xl hover:bg-indigo-700">{isRtl ? 'حفظ' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-4 rounded-2xl font-black">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
