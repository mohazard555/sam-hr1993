
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, User as UserIcon } from 'lucide-react';
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

export function GenericModule<T extends { id: string; employeeId: string; date?: string; startDate?: string; endDate?: string; amount?: number; type?: string }>({ 
  title, lang, employees, items, onSave, onDelete, renderForm, renderRow, tableHeaders, initialData, moduleType 
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
      return {
        [isRtl ? 'الموظف' : 'Employee']: emp?.name || 'Unknown',
        ...rest
      };
    });
    exportToExcel(exportData, `SAM_${title}`);
  };

  const handlePrint = () => {
    window.print();
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
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
        <h2 className="text-2xl font-black text-slate-950 dark:text-white">{title}</h2>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => { setFormData(initialData); setShowModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all">
            <Plus size={20} /> {isRtl ? 'إضافة جديد' : 'Add New'}
          </button>
          <button onClick={handleExport} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-lg transition-all">
            <FileDown size={20} /> Excel
          </button>
          <button onClick={handlePrint} className="bg-slate-950 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-black transition shadow-lg">
            <Printer size={20} /> {isRtl ? 'طباعة النتائج' : 'Print'}
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 no-print bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-lg">
         <div className="relative">
           <Search className="absolute right-4 top-4 text-slate-400" size={18} />
           <input 
             className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" 
             placeholder={isRtl ? 'بحث باسم الموظف...' : 'Search employee...'} 
             value={searchTerm} 
             onChange={e => setSearchTerm(e.target.value)} 
           />
         </div>
         <div className="flex items-center gap-3">
            <Calendar size={18} className="text-indigo-600 shrink-0" />
            <span className="text-xs font-black text-slate-500">{isRtl ? 'من:' : 'From:'}</span>
            <input type="date" className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
         </div>
         <div className="flex items-center gap-3">
            <Calendar size={18} className="text-indigo-600 shrink-0" />
            <span className="text-xs font-black text-slate-500">{isRtl ? 'إلى:' : 'To:'}</span>
            <input type="date" className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black" value={dateTo} onChange={e => setDateTo(e.target.value)} />
         </div>
      </div>

      {/* Table Section */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b-2 dark:border-slate-700">
              <tr className="text-slate-950 dark:text-slate-100 font-black text-xs uppercase">
                {tableHeaders.map((h, i) => <th key={i} className="px-6 py-5">{h}</th>)}
                <th className="px-6 py-5 text-center no-print">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  {renderRow(item, employees.find(e => e.id === item.employeeId)?.name || 'Unknown')}
                  <td className="px-6 py-5 text-center no-print">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition"><Edit2 size={18}/></button>
                      <button onClick={() => { if(confirm(isRtl ? 'هل تريد الحذف نهائياً؟' : 'Delete?')) onDelete(item.id); }} className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition"><Trash2 size={18}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={tableHeaders.length + 1} className="py-24 text-center text-slate-400 italic font-black">
                    {isRtl ? 'لا توجد بيانات تطابق بحثك' : 'No data found'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Form */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border dark:border-slate-800 animate-in zoom-in-95">
            <div className="p-8 bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 flex justify-between items-center">
              <h3 className="text-2xl font-black text-indigo-900 dark:text-indigo-400">{isRtl ? 'إدخال بيانات' : 'Enter Data'}</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-950 font-black text-2xl transition">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div>
                <label className="block text-xs font-black mb-2 text-slate-500 uppercase tracking-widest">{isRtl ? 'الموظف' : 'Employee'}</label>
                <div className="relative">
                  <UserIcon className="absolute right-4 top-4 text-indigo-500" size={18} />
                  <select 
                    className="w-full pr-12 pl-4 py-4 border-2 dark:bg-slate-800 dark:border-slate-700 rounded-2xl font-black text-slate-950 dark:text-white appearance-none outline-none focus:border-indigo-600 transition" 
                    value={formData.employeeId || ''}
                    onChange={e => setFormData({...formData, employeeId: e.target.value})}
                    required
                  >
                    <option value="">{isRtl ? 'اختر الموظف...' : 'Select Employee'}</option>
                    {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
                </div>
              </div>
              {renderForm(formData, setFormData)}
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-lg shadow-xl hover:bg-indigo-700 transition-all">{isRtl ? 'حفظ البيانات' : 'Save'}</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 py-5 rounded-[2rem] font-black text-lg transition-all">{isRtl ? 'إلغاء' : 'Cancel'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
