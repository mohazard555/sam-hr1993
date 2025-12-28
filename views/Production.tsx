
import React, { useState, useMemo } from 'react';
import { Employee, ProductionEntry } from '../types';
import { Zap, Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, User as UserIcon, Settings2, Package, Archive, History, CalendarRange } from 'lucide-react';
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
    if (confirm('نقل سجل الإنتاج للأرشيف؟')) {
       onSave({ ...item, isArchived: true });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
        <div className="flex items-center gap-4">
           <div className={`p-4 rounded-2xl ${archiveMode ? 'bg-amber-100 text-amber-600' : 'bg-indigo-100 text-indigo-600'}`}>
              {archiveMode ? <History size={28}/> : <Zap size={28}/>}
           </div>
           <div>
              <h2 className="text-2xl font-black text-indigo-700">{archiveMode ? 'أرشيف الإنتاج التاريخي' : 'سجلات الإنتاج الجاري'}</h2>
              <p className="text-xs font-bold text-slate-500">تسجيل ومتابعة إنتاج الموظفين اليومي</p>
           </div>
        </div>
        <div className="flex gap-2">
          {!archiveMode && (
            <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-indigo-700 transition-all font-black"><Plus size={20} /> تسجيل جديد</button>
          )}
          <button onClick={onToggleArchive} className={`px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg transition-all ${archiveMode ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'} font-black`}>
             {archiveMode ? <Calendar size={20}/> : <Archive size={20}/>} {archiveMode ? 'العودة للمهام' : 'الأرشيف'}
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg font-black"><Printer size={20} /> طباعة القائمة</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-indigo-900 text-white border-b">
            <tr className="font-black text-xs uppercase">
              <th className="px-6 py-5">الموظف / التاريخ</th>
              <th className="px-6 py-5 text-center">عدد القطع</th>
              <th className="px-6 py-5">الملاحظات</th>
              <th className="px-6 py-5 text-center">الإجمالي</th>
              <th className="px-6 py-5 text-center no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-indigo-50 transition">
                <td className="px-6 py-5">
                   <p className="font-black">{employees.find(e => e.id === item.employeeId)?.name}</p>
                   <p className="text-[10px] text-slate-400 font-bold uppercase">{item.date}</p>
                </td>
                <td className="px-6 py-5 text-center">
                   <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded font-black text-xs">{item.piecesCount} قطعة</span>
                </td>
                <td className="px-6 py-5 text-xs text-slate-600 font-bold max-w-[200px] truncate" title={item.notes}>
                   {item.notes || '-'}
                </td>
                <td className="px-6 py-5 text-center font-black text-emerald-600">{(item.totalValue || 0).toLocaleString()}</td>
                <td className="px-6 py-5 text-center no-print">
                  <div className="flex justify-center gap-2">
                    {onPrintIndividual && (
                      <button onClick={() => onPrintIndividual(item)} title="طباعة الإشعار" className="p-2 text-slate-500 rounded hover:bg-slate-100 transition"><Printer size={16}/></button>
                    )}
                    {!archiveMode && (
                      <button onClick={() => handleArchive(item)} title="نقل للأرشيف" className="p-2 text-amber-600 rounded hover:bg-amber-50 transition"><Archive size={16}/></button>
                    )}
                    <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-2 text-indigo-600 rounded hover:bg-indigo-50 transition"><Edit2 size={16}/></button>
                    <button onClick={() => { if(confirm('حذف نهائي؟')) onDelete(item.id); }} className="p-2 text-rose-600 rounded hover:bg-rose-50 transition"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[150] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-2xl border dark:border-slate-800 overflow-hidden">
            <div className="p-8 bg-indigo-600 text-white border-b flex justify-between items-center font-black">
              <h3 className="text-2xl flex items-center gap-2 font-black"><Package/> تسجيل بيانات الإنتاج</h3>
              <button onClick={() => setShowModal(false)} className="text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <select className="w-full p-4 border rounded-xl font-black dark:bg-slate-800 dark:text-white" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                <option value="">اختر موظف...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <input type="number" placeholder="عدد القطع" className="p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.piecesCount} onChange={e => setFormData({...formData, piecesCount: Number(e.target.value)})} />
                <input type="number" placeholder="قيمة القطعة" className="p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.valuePerPiece} onChange={e => setFormData({...formData, valuePerPiece: Number(e.target.value)})} />
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center font-black text-emerald-600 flex items-center justify-center">
                  الإجمالي: {((formData.piecesCount || 0) * (formData.valuePerPiece || 0)).toLocaleString()}
                </div>
              </div>
              <div>
                 <label className="text-[10px] font-black text-slate-500 uppercase block mb-1">ملاحظات إضافية (اختياري)</label>
                 <textarea className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white h-24" placeholder="اكتب ملاحظاتك هنا لتظهر في التقارير..." value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl font-black">حفظ السجل</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
