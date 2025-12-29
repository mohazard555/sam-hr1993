
import React, { useState, useMemo } from 'react';
import { Employee, ProductionEntry } from '../types';
import { Zap, Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, User as UserIcon, Settings2, Package, Archive, History, CalendarRange, X } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface Props {
  employees: Employee[];
  items: ProductionEntry[];
  onSave: (item: ProductionEntry) => void;
  onDelete: (id: string) => void;
  onPrintIndividual?: (item: ProductionEntry) => void;
  archiveMode: boolean;
  onToggleArchive: () => void;
}

const Production: React.FC<Props> = ({ employees, items, onSave, onDelete, onPrintIndividual, archiveMode, onToggleArchive }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [formData, setFormData] = useState<Partial<ProductionEntry>>({
    date: new Date().toISOString().split('T')[0],
    piecesCount: 0,
    valuePerPiece: 0,
    totalValue: 0,
    notes: ''
  });

  const filteredItems = useMemo(() => {
    return (items || []).filter(item => {
      const isArchived = item.isArchived === true;
      if (archiveMode && !isArchived) return false;
      if (!archiveMode && isArchived) return false;

      const emp = employees.find(e => e.id === item.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
      if (!nameMatch) return false;

      if (dateFrom && item.date < dateFrom) return false;
      if (dateTo && item.date > dateTo) return false;

      return true;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [items, archiveMode, searchTerm, dateFrom, dateTo, employees]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) return alert('يرجى اختيار موظف');
    const total = (formData.piecesCount || 0) * (formData.valuePerPiece || 0);
    onSave({ 
      ...formData, 
      id: formData.id || Math.random().toString(36).substr(2, 9),
      totalValue: total
    } as ProductionEntry);
    setShowModal(false);
    setFormData({ date: new Date().toISOString().split('T')[0], piecesCount: 0, valuePerPiece: 0, totalValue: 0, notes: '' });
  };

  const handleArchive = (item: ProductionEntry) => {
    if (confirm('نقل سجل الإنتاج للأرشيف التاريخي؟')) {
       onSave({ ...item, isArchived: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print text-right">
        <div className="flex items-center gap-4">
           <div className={`p-4 rounded-2xl ${archiveMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {archiveMode ? <History size={28}/> : <Zap size={28}/>}
           </div>
           <div className="text-right">
              <h2 className="text-2xl font-black text-indigo-700">{archiveMode ? 'أرشيف الإنتاج التاريخي' : 'سجلات الإنتاج والقطع اليومي'}</h2>
              <p className="text-xs font-bold text-slate-500">متابعة دقيقة لكميات الإنتاج وقيم الاستحقاق</p>
           </div>
        </div>
        <div className="flex gap-2">
          {!archiveMode && (
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition font-black"><Plus size={20} /> تسجيل إنتاج جديد</button>
          )}
          <button onClick={onToggleArchive} className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all ${archiveMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} font-black`}>
             {archiveMode ? <Calendar size={20}/> : <Archive size={20}/>} {archiveMode ? 'العودة للتسجيل' : 'عرض سجل الأرشيف'}
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg font-black"><Printer size={20} /> طباعة القائمة</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto relative">
        <div className="print-only p-12 text-center border-b-4 border-slate-900 bg-slate-50">
           <h1 className="text-3xl font-black text-indigo-900 uppercase">تقرير الإنتاجية {archiveMode ? '(الأرشيف)' : '(الجاري)'}</h1>
           <p className="text-sm font-bold opacity-60">تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
        </div>
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50 dark:bg-slate-800 border-b">
            <tr className="text-slate-900 dark:text-slate-100 font-black text-xs uppercase">
              <th className="px-6 py-5">الموظف / التاريخ</th>
              <th className="px-6 py-5 text-center">كمية الإنتاج (قطع)</th>
              <th className="px-6 py-5 text-center">سعر القطعة</th>
              <th className="px-6 py-5 text-center">إجمالي الاستحقاق</th>
              <th className="px-6 py-5 no-print text-center">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-indigo-50/20 transition font-bold">
                <td className="px-6 py-5">
                   <p className="font-black text-slate-900 dark:text-white">{employees.find(e => e.id === item.employeeId)?.name}</p>
                   <p className="text-[10px] text-slate-400 font-bold">{item.date}</p>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 px-4 py-2 rounded-xl font-black">{item.piecesCount} قطعة</span>
                </td>
                <td className="px-6 py-5 text-center">
                   {item.valuePerPiece?.toLocaleString()}
                </td>
                <td className="px-6 py-5 text-center font-black text-emerald-600 bg-emerald-50/30">
                   { (item.totalValue || 0).toLocaleString() }
                </td>
                <td className="px-6 py-5 text-center no-print">
                   <div className="flex justify-center gap-2">
                    <button onClick={() => onPrintIndividual?.(item)} className="p-2 text-indigo-600 rounded-lg hover:bg-indigo-50 transition"><Printer size={18}/></button>
                    {!archiveMode && <button onClick={() => handleArchive(item)} className="p-2 text-amber-600 rounded-lg hover:bg-amber-50 transition"><Archive size={18}/></button>}
                    <button onClick={() => onDelete(item.id)} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50 transition"><Trash2 size={16}/></button>
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
            <div className="p-8 bg-indigo-600 text-white border-b flex justify-between items-center text-right">
              <h3 className="text-2xl font-black flex items-center gap-2"><Package/> تسجيل بيانات الإنتاج</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:text-slate-200 transition"><X size={32}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6 text-right">
              <div>
                <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">الموظف المنفذ</label>
                <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800 dark:text-white text-right" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                  <option value="">-- اختر الموظف --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">تاريخ العمل</label>
                   <input type="date" className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">كمية الإنتاج (عدد القطع)</label>
                   <input type="number" placeholder="مثال: 150" className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.piecesCount || ''} onChange={e => setFormData({...formData, piecesCount: Number(e.target.value)})} />
                </div>
                <div>
                   <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">سعر القطعة الواحدة</label>
                   <input type="number" placeholder="مثال: 500" className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.valuePerPiece || ''} onChange={e => setFormData({...formData, valuePerPiece: Number(e.target.value)})} />
                </div>
                <div className="flex flex-col justify-center">
                   <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">إجمالي استحقاق الموظف</p>
                   <div className="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-xl border-2 border-dashed border-indigo-200 text-center font-black text-indigo-700">
                      { ((formData.piecesCount || 0) * (formData.valuePerPiece || 0)).toLocaleString() }
                   </div>
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl hover:bg-indigo-700 transition">تأكيد وحفظ السجل</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
