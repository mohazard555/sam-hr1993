
import React, { useState, useMemo } from 'react';
import { Employee, ProductionEntry } from '../types';
import { Zap, Plus, Trash2, Edit2, Search, FileDown, Printer, Calendar, User as UserIcon, Settings2, Package } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface Props {
  employees: Employee[];
  items: ProductionEntry[];
  onSave: (item: ProductionEntry) => void;
  onDelete: (id: string) => void;
}

const Production: React.FC<Props> = ({ employees, items, onSave, onDelete }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEmpId, setFilterEmpId] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  
  const [formData, setFormData] = useState<Partial<ProductionEntry>>({
    date: new Date().toISOString().split('T')[0],
    piecesCount: 0,
    valuePerPiece: 0,
    totalValue: 0
  });

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const emp = employees.find(e => e.id === item.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const empMatch = !filterEmpId || item.employeeId === filterEmpId;
      const dateMatch = (!dateFrom || item.date >= dateFrom) && (!dateTo || item.date <= dateTo);
      return nameMatch && empMatch && dateMatch;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [items, searchTerm, filterEmpId, dateFrom, dateTo, employees]);

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
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
        <h2 className="text-2xl font-black text-indigo-700 flex items-center gap-3"><Zap size={28}/> نظام تتبع الإنتاج بالقطعة</h2>
        <div className="flex gap-2">
          <button onClick={() => setShowModal(true)} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Plus size={20} /> إضافة إنتاج</button>
          <button onClick={() => exportToExcel(filteredItems, "ProductionReport")} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><FileDown size={20} /> Excel</button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2"><Printer size={20} /> طباعة</button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 no-print bg-white dark:bg-slate-900 p-8 rounded-[2rem] border dark:border-slate-800 shadow-lg">
         <div className="relative"><Search className="absolute right-4 top-3.5 text-slate-400" size={18}/><input className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl font-black" placeholder="بحث بالاسم..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
         <div><select className="w-full p-3.5 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" value={filterEmpId} onChange={e => setFilterEmpId(e.target.value)}><option value="">كل الموظفين</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
         <div className="flex items-center gap-2"><span className="text-xs font-black">من:</span><input type="date" className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold border" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
         <div className="flex items-center gap-2"><span className="text-xs font-black">إلى:</span><input type="date" className="flex-1 p-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-bold border" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
      </div>

      {/* List */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border dark:border-slate-800 overflow-hidden overflow-x-auto">
        <table className="w-full text-right">
          <thead className="bg-indigo-900 text-white border-b">
            <tr className="font-black text-xs uppercase">
              <th className="px-6 py-5">الموظف</th>
              <th className="px-6 py-5">التاريخ</th>
              <th className="px-6 py-5 text-center">القطع</th>
              <th className="px-6 py-5">المواصفات</th>
              <th className="px-6 py-5 text-center">القيمة/قطعة</th>
              <th className="px-6 py-5 text-center">الإجمالي</th>
              <th className="px-6 py-5 text-center no-print">إجراءات</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map(item => (
              <tr key={item.id} className="hover:bg-indigo-50/30 transition">
                <td className="px-6 py-5 font-black">{employees.find(e => e.id === item.employeeId)?.name}</td>
                <td className="px-6 py-5 font-bold text-slate-500">{item.date}</td>
                <td className="px-6 py-5 text-center"><span className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-lg font-black">{item.piecesCount}</span></td>
                <td className="px-6 py-5 text-xs font-bold max-w-xs truncate">{item.specifications}</td>
                <td className="px-6 py-5 text-center font-bold">{(item.valuePerPiece || 0).toLocaleString()}</td>
                <td className="px-6 py-5 text-center font-black text-emerald-600">{(item.totalValue || 0).toLocaleString()}</td>
                <td className="px-6 py-5 text-center no-print">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => { setFormData(item); setShowModal(true); }} className="p-2 text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit2 size={16}/></button>
                    <button onClick={() => onDelete(item.id)} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 size={16}/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-slate-100 dark:bg-slate-800 font-black">
             <tr><td colSpan={5} className="px-6 py-6 text-xl">إجمالي الإنتاج المستحق</td><td colSpan={2} className="px-6 py-6 text-center text-2xl text-indigo-700">{totalValue.toLocaleString()}</td></tr>
          </tfoot>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl w-full max-w-2xl border dark:border-slate-800">
            <div className="p-8 bg-indigo-600 text-white border-b rounded-t-[3rem] flex justify-between items-center">
              <h3 className="text-2xl font-black flex items-center gap-2"><Package/> تسجيل دفعة إنتاج</h3>
              <button onClick={() => setShowModal(false)} className="text-white hover:opacity-70 font-black text-2xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="col-span-2">
                   <label className="text-[10px] font-black uppercase mb-1 block">الموظف</label>
                   <select className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" value={formData.employeeId || ''} onChange={e => setFormData({...formData, employeeId: e.target.value})} required>
                      <option value="">اختر الموظف...</option>
                      {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                   </select>
                </div>
                <div><label className="text-[10px] font-black uppercase mb-1 block">التاريخ</label><input type="date" className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                <div><label className="text-[10px] font-black uppercase mb-1 block">عدد القطع</label><input type="number" className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" value={formData.piecesCount} onChange={e => setFormData({...formData, piecesCount: Number(e.target.value)})} /></div>
                <div><label className="text-[10px] font-black uppercase mb-1 block">قيمة القطعة</label><input type="number" className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" value={formData.valuePerPiece} onChange={e => setFormData({...formData, valuePerPiece: Number(e.target.value)})} /></div>
                <div className="flex items-end"><div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-xl w-full text-center font-black text-emerald-600 text-xl">الإجمالي: {((formData.piecesCount || 0) * (formData.valuePerPiece || 0)).toLocaleString()}</div></div>
                <div className="col-span-2"><label className="text-[10px] font-black uppercase mb-1 block">مواصفات القطعة / ملاحظات</label><textarea className="w-full p-4 border rounded-xl font-bold dark:bg-slate-800" rows={2} value={formData.specifications} onChange={e => setFormData({...formData, specifications: e.target.value})} /></div>
              </div>
              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-lg shadow-xl">حفظ البيانات</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-5 rounded-2xl font-black">إلغاء</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Production;
