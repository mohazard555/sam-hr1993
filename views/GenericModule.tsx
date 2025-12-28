
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, Archive, History, Filter, X } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface GenericModuleProps<T> {
  title: string;
  lang: 'ar' | 'en';
  employees: Employee[];
  items: T[];
  onSave: (item: T) => void;
  onDelete: (id: string) => void;
  onPrint?: () => void;
  onPrintIndividual?: (item: T) => void;
  archiveMode: boolean;
  onToggleArchive: () => void;
  renderForm: (formData: Partial<T>, setFormData: React.Dispatch<React.SetStateAction<Partial<T>>>) => React.ReactNode;
  renderRow: (item: T, employeeName: string) => React.ReactNode;
  tableHeaders: string[];
  initialData: Partial<T>;
}

export function GenericModule<T extends { id: string; employeeId: string; date?: string; startDate?: string; endDate?: string; amount?: number; type?: string; remainingAmount?: number; isPaid?: boolean; isArchived?: boolean; status?: string }>({ 
  title, lang, employees, items, onSave, onDelete, onPrint, onPrintIndividual, archiveMode, onToggleArchive, renderForm, renderRow, tableHeaders, initialData 
}: GenericModuleProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(initialData);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const isRtl = lang === 'ar';

  const filteredItems = useMemo(() => {
    let list = (items || []).filter(item => {
      if (!item) return false;
      const archived = item.isArchived === true;
      if (archiveMode && !archived) return false;
      if (!archiveMode && archived) return false;

      const emp = employees.find(e => e.id === item.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch) return false;

      const itemDate = item.date || item.startDate;
      if (itemDate) {
        if (dateFrom && itemDate < dateFrom) return false;
        if (dateTo && itemDate > dateTo) return false;
      }
      return true;
    });
    return list.sort((a, b) => ((b.date || b.startDate) || '').localeCompare((a.date || a.startDate) || ''));
  }, [items, archiveMode, searchTerm, dateFrom, dateTo, employees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert('يرجى اختيار الموظف أولاً');
    onSave({ ...formData, id: formData.id || Math.random().toString(36).substr(2, 9) } as T);
    setShowModal(false);
    setFormData(initialData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
        <div className="flex items-center gap-4">
           <div className={`p-4 rounded-2xl ${archiveMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {archiveMode ? <History size={28}/> : <Archive size={28}/>}
           </div>
           <div>
              <h2 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">{title}</h2>
              <p className="text-xs font-bold text-slate-500">{archiveMode ? 'استعراض الأرشيف التاريخي' : 'إدارة الطلبات والبيانات الحالية'}</p>
           </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!archiveMode && (
            <button onClick={() => { setFormData(initialData); setShowModal(true); }} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition"><Plus size={20} /> إضافة جديد</button>
          )}
          <button onClick={onToggleArchive} className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all ${archiveMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
             {archiveMode ? <Calendar size={20}/> : <History size={20}/>} {archiveMode ? 'العودة للمهام' : 'سجل الأرشيف'}
          </button>
          <button onClick={() => exportToExcel(filteredItems, title)} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><FileDown size={20} /> Excel</button>
          {onPrint && <button onClick={onPrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer size={20} /> طباعة القائمة</button>}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border dark:border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-4 no-print items-end">
         <div className="relative">
            <Search className="absolute right-4 top-3.5 text-slate-400" size={18}/>
            <input className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black" placeholder="بحث باسم الموظف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
         </div>
         <div className="flex gap-2">
            <div className="flex-1"><label className="text-[10px] font-black mr-2 text-slate-400">من تاريخ</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
            <div className="flex-1"><label className="text-[10px] font-black mr-2 text-slate-400">إلى تاريخ</label><input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
         </div>
         <button onClick={() => {setSearchTerm(''); setDateFrom(''); setDateTo('');}} className="p-3 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs hover:bg-slate-200 transition">تصفير الفلاتر</button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b">
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
                    {onPrintIndividual && (
                      <button onClick={() => onPrintIndividual(item)} title="طباعة السند" className="p-2 text-slate-500 rounded-lg hover:bg-slate-100 transition"><Printer size={16}/></button>
                    )}
                    <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-2 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"><Edit2 size={16}/></button>
                    <button onClick={() => { if(confirm('حذف نهائي؟')) onDelete(item.id); }} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50 transition"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-indigo-600 dark:bg-indigo-800 border-b flex justify-between items-center">
              <h3 className="text-2xl font-black text-white">{formData.id ? 'تعديل سجل' : 'إضافة سجل'} - {title}</h3>
              <button onClick={() => setShowModal(false)} className="text-white/60 hover:text-white transition"><X size={32}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              <div>
                <label className="block text-[10px] font-black mb-2 text-slate-400 uppercase tracking-widest">الموظف المعني</label>
                <select className="w-full p-4 border-2 dark:bg-slate-800 rounded-2xl font-black dark:text-white" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                  <option value="">-- اختر الموظف --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="border-t-2 border-slate-100 dark:border-slate-800 pt-8">
                {renderForm(formData, setFormData)}
              </div>
              <div className="flex gap-4 pt-4">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">حفظ البيانات</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 dark:text-white py-5 rounded-2xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
