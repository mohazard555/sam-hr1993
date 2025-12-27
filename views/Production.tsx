
import React, { useState, useMemo } from 'react';
import { Employee, ProductionEntry } from '../types';
import { Zap, Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, User as UserIcon, Settings2, Package, Archive } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface Props {
  employees: Employee[];
  items: ProductionEntry[];
  onSave: (item: ProductionEntry) => void;
  onDelete: (id: string) => void;
  archiveMode: boolean;
  onToggleArchive: () => void;
  onPrint: () => void;
}

const Production: React.FC<Props> = ({ employees, items, onSave, onDelete, archiveMode, onToggleArchive, onPrint }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Partial<ProductionEntry>>({
    date: new Date().toISOString().split('T')[0],
    piecesCount: 0,
    valuePerPiece: 0,
    totalValue: 0
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      return emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [items, searchTerm, employees]);

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
    setFormData({ date: new Date().toISOString().split('T')[0], piecesCount: 0, valuePerPiece: 0, totalValue: 0 });
  };

  const totalValue = filteredItems.reduce((acc, i) => acc + i.totalValue, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
        <h2 className="text-2xl font-black text-indigo-700 flex items-center gap-3"><Zap size={28}/> {archiveMode ? 'أرشيف الإنتاج' : 'الإنتاج الجاري'}</h2>
        <div className="flex gap-2">
          <button onClick={onToggleArchive} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2">
             {archiveMode ? <Calendar size={20}/> : <Archive size={20}/>} {archiveMode ? 'العودة' : 'الأرشيف'}
          </button>
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Plus size={20} /> إضافة جديد</button>
          <button onClick={onPrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Printer size={20} /> طباعة</button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-indigo-900 text-white border-b">
            <tr className="font-black text-xs uppercase">
              <th className="px-6 py-5">الموظف</th>
              <th className="px-6 py-5">التاريخ</th>
              <th className="px-6 py-5 text-center">القطع</th>
              <th className="px-6 py-5 text-center">الإجمالي</th>
              <th className="px-6 py-5 text-center no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                <td className="px-6 py-5 font-black">{employees.find(e => e.id === item.employeeId)?.name}</td>
                <td className="px-6 py-5 font-bold text-slate-500">{item.date}</td>
                <td className="px-6 py-5 text-center">{item.piecesCount}</td>
                <td className="px-6 py-5 text-center font-black text-emerald-600">{(item.totalValue || 0).toLocaleString()}</td>
                <td className="px-6 py-5 text-center no-print">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-2 text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border dark:border-slate-800">
            <div className="p-8 bg-indigo-600 text-white border-b rounded-t-[3rem] flex justify-between items-center font-black">
              <h3 className="text-2xl flex items-center gap-2"><Package/> تسجيل إنتاج</h3>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <select className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                <option value="">اختر موظف...</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
              <div className="grid grid-cols-2 gap-4">
                <input type="date" className="p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                <input type="number" placeholder="عدد القطع" className="p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.piecesCount} onChange={e => setFormData({...formData, piecesCount: Number(e.target.value)})} />
                <input type="number" placeholder="قيمة القطعة" className="p-4 border rounded-xl font-bold dark:bg-slate-800 dark:text-white" value={formData.valuePerPiece} onChange={e => setFormData({...formData, valuePerPiece: Number(e.target.value)})} />
                <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl text-center font-black text-emerald-600">
                  الإجمالي: {((formData.piecesCount || 0) * (formData.valuePerPiece || 0)).toLocaleString()}
                </div>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg">حفظ</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
