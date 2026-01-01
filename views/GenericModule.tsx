
import React, { useState, useMemo } from 'react';
import { Employee } from '../types';
import { Plus, Trash2, Edit2, Printer, Archive, History, X, Search, Calendar, FileDown } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface GenericModuleProps<T> {
  title: string;
  lang: 'ar' | 'en';
  employees: Employee[];
  items: T[];
  onSave: (item: T) => void;
  onDelete: (id: string) => void;
  onArchive?: (item: T) => void;
  onPrintIndividual?: (item: T) => void;
  archiveMode: boolean;
  onToggleArchive: () => void;
  renderForm: (formData: Partial<T>, setFormData: React.Dispatch<React.SetStateAction<Partial<T>>>) => React.ReactNode;
  renderRow: (item: T, employeeName: string) => React.ReactNode;
  renderFooter?: (filteredItems: T[]) => React.ReactNode;
  tableHeaders: string[];
  initialData: Partial<T>;
  companyName: string;
  logo?: string;
}

export function GenericModule<T extends { id: string; employeeId: string; date?: string; startDate?: string; endDate?: string; isArchived?: boolean }>({ 
  title, lang, employees, items, onSave, onDelete, onArchive, onPrintIndividual, archiveMode, onToggleArchive, renderForm, renderRow, renderFooter, tableHeaders, initialData, companyName, logo 
}: GenericModuleProps<T>) {
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState<Partial<T>>(initialData);
  
  const [archiveSearch, setArchiveSearch] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const filteredItems = useMemo(() => {
    let list = (items || []).filter(item => {
      const archived = item.isArchived === true;
      if (archiveMode && !archived) return false;
      if (!archiveMode && archived) return false;
      
      const emp = employees.find(e => e.id === item.employeeId);
      const matchesSearch = emp?.name.toLowerCase().includes(archiveSearch.toLowerCase());
      if (!matchesSearch) return false;

      const itemDate = item.date || item.startDate;
      if (itemDate) {
        if (dateFrom && itemDate < dateFrom) return false;
        if (dateTo && itemDate > dateTo) return false;
      }

      return true;
    });
    return list.sort((a, b) => ((b.date || b.startDate) || '').localeCompare((a.date || a.startDate) || ''));
  }, [items, archiveMode, archiveSearch, dateFrom, dateTo, employees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert('يرجى اختيار الموظف أولاً');
    onSave({ ...formData, id: formData.id || Math.random().toString(36).substr(2, 9) } as T);
    setShowModal(false);
    setFormData(initialData);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print text-right">
        <div className="flex items-center gap-4">
           <div className={`p-4 rounded-2xl ${archiveMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {archiveMode ? <History size={28}/> : <Archive size={28}/>}
           </div>
           <h2 className="text-2xl font-black text-indigo-700">{title} {archiveMode ? '(الأرشيف)' : ''}</h2>
        </div>
        <div className="flex gap-2">
          {!archiveMode && <button onClick={() => { setFormData(initialData); setShowModal(true); }} className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Plus size={20} /> إضافة جديد</button>}
          <button onClick={onToggleArchive} className={`px-8 py-3 rounded-2xl font-black transition-all shadow-lg ${archiveMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
             {archiveMode ? 'العودة للمهام' : 'سجل الأرشيف'}
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black shadow-lg"><Printer size={20} /></button>
        </div>
      </div>

      {archiveMode && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] shadow-lg border dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-4 no-print animate-in fade-in duration-300">
           <div className="relative">
              <Search className="absolute right-3 top-3.5 text-slate-400" size={18}/>
              <input type="text" placeholder="بحث باسم الموظف..." className="w-full pr-10 p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" value={archiveSearch} onChange={e => setArchiveSearch(e.target.value)} />
           </div>
           <div className="relative">
              <Calendar className="absolute right-3 top-3.5 text-slate-400" size={18}/>
              <input type="date" className="w-full pr-10 p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-center" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
           </div>
           <div className="relative">
              <Calendar className="absolute right-3 top-3.5 text-slate-400" size={18}/>
              <input type="date" className="w-full pr-10 p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold text-center" value={dateTo} onChange={e => setDateTo(e.target.value)} />
           </div>
           <button onClick={() => exportToExcel(filteredItems, title + "_Archive")} className="bg-emerald-600 text-white font-black rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-700 transition">
              <FileDown size={18}/> تصدير Excel
           </button>
        </div>
      )}

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b">
              <tr className="text-slate-900 dark:text-slate-100 font-black text-xs uppercase">
                {tableHeaders.map((h, i) => <th key={i} className="px-6 py-5">{h}</th>)}
                <th className="px-6 py-5 text-center no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-50 transition font-bold text-xs">
                  {renderRow(item, employees.find(e => e.id === item.employeeId)?.name || 'Unknown')}
                  <td className="px-6 py-5 text-center no-print">
                    <div className="flex justify-center gap-2">
                      {onPrintIndividual && <button onClick={() => onPrintIndividual(item)} title="طباعة مستند" className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"><Printer size={16}/></button>}
                      {!archiveMode && onArchive && <button onClick={() => onArchive(item)} title="نقل للأرشيف" className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition"><Archive size={16}/></button>}
                      <button onClick={() => { setFormData(item); setShowModal(true); }} title="تعديل" className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg transition"><Edit2 size={16}/></button>
                      <button onClick={() => { if(confirm('حذف السجل نهائياً؟')) onDelete(item.id); }} title="حذف" className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {renderFooter && (
              <tfoot className="bg-indigo-950 text-white font-black text-xs border-t-4 border-indigo-900">
                 {renderFooter(filteredItems)}
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[600] flex items-center justify-center p-4 no-print">
          <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] shadow-2xl w-full max-w-2xl border-4 border-white/20 overflow-hidden relative">
            <div className="p-10 bg-indigo-600 text-white flex justify-between items-center text-right relative">
              <h3 className="text-3xl font-black w-full text-center tracking-tighter">سجل جديد - {title}</h3>
              <button onClick={() => setShowModal(false)} className="absolute left-10 top-1/2 -translate-y-1/2 text-white/80 hover:text-white transition-all"><X size={40}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-12 space-y-10 text-right">
              <div>
                <label className="block text-[10pt] font-black mb-3 text-slate-400 uppercase tracking-widest mr-2">الموظف المعني</label>
                <select className="w-full p-5 bg-white border-2 border-slate-100 rounded-[1.5rem] font-black outline-none focus:border-indigo-600 transition-all text-xl shadow-sm text-center" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                  <option value="">-- اختر الموظف --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="pt-2">{renderForm(formData, setFormData)}</div>
              <div className="flex gap-6 pt-10">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-6 rounded-[2.5rem] font-black text-2xl shadow-xl hover:bg-indigo-700 transition-all">حفظ البيانات</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 py-6 rounded-[2.5rem] font-black text-2xl">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
