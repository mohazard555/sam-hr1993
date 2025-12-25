
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, CompanySettings } from '../types';
import { Clock, Trash2, Edit2, FileDown, Search, Calendar, Printer, CheckCircle, AlertCircle } from 'lucide-react';
import { calculateTimeDiffMinutes } from '../utils/calculations';
import { exportToExcel } from '../utils/export';

interface Props {
  employees: Employee[];
  records: AttendanceRecord[];
  settings: CompanySettings;
  onSaveRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  lang: 'ar' | 'en';
}

const Attendance: React.FC<Props> = ({ employees, records, settings, onSaveRecord, onDeleteRecord, lang }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [checkIn, setCheckIn] = useState(settings.officialCheckIn);
  const [checkOut, setCheckOut] = useState(settings.officialCheckOut);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');

  const isRtl = lang === 'ar';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;
    const emp = employees.find(e => e.id === selectedEmp);
    const shiftIn = emp?.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp?.customCheckOut || settings.officialCheckOut;
    const lateMinutes = Math.max(0, calculateTimeDiffMinutes(checkIn, shiftIn));
    const overtimeMinutes = Math.max(0, calculateTimeDiffMinutes(checkOut, shiftOut));

    onSaveRecord({
      id: editingId || Math.random().toString(36).substr(2, 9),
      employeeId: selectedEmp,
      date, checkIn, checkOut, lateMinutes, overtimeMinutes, status: 'present'
    });
    setEditingId(null); setSelectedEmp('');
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return emp?.name.toLowerCase().includes(searchTerm.toLowerCase()) && r.date === date;
    });
  }, [records, date, searchTerm, employees]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
      {/* Registration Form */}
      <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl h-fit no-print">
        <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-indigo-700">
          <Clock size={24} /> تسجيل دوام
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div><label className="text-[10px] font-black uppercase mb-1 block">الموظف</label>
          <select className="w-full p-4 border dark:bg-slate-800 rounded-xl font-bold" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required>
            <option value="">اختر...</option>
            {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select></div>
          <div><label className="text-[10px] font-black uppercase mb-1 block">التاريخ</label><input type="date" className="w-full p-4 border dark:bg-slate-800 rounded-xl font-bold" value={date} onChange={e => setDate(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
             <div><label className="text-[10px] font-black block">دخول</label><input type="time" className="w-full p-3 border dark:bg-slate-800 rounded-xl font-bold" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div>
             <div><label className="text-[10px] font-black block">خروج</label><input type="time" className="w-full p-3 border dark:bg-slate-800 rounded-xl font-bold" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div>
          </div>
          <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">حفظ السجل</button>
        </form>
      </div>

      {/* Table Section */}
      <div className="lg:col-span-3 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border dark:border-slate-800 shadow-xl no-print flex justify-between items-center">
           <div className="relative flex-1 max-w-xs"><Search className="absolute right-3 top-2.5 text-slate-400" size={18}/><input className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl font-black" placeholder="بحث باسم الموظف..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
           <div className="flex gap-2">
              <button onClick={() => exportToExcel(filteredRecords, "Attendance")} className="p-3 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition"><FileDown size={20}/></button>
              <button onClick={() => window.print()} className="p-3 bg-slate-50 text-slate-900 rounded-xl hover:bg-slate-100 transition"><Printer size={20}/></button>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl overflow-hidden">
          <table className="w-full text-right">
            <thead className="bg-slate-50 dark:bg-slate-800 border-b">
              <tr className="text-slate-500 font-black text-xs uppercase">
                <th className="px-8 py-6">الموظف</th>
                <th className="text-center py-6">الوقت الفعلي</th>
                <th className="text-center py-6">الحالة</th>
                <th className="text-center py-6 no-print">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredRecords.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                  <td className="px-8 py-5">
                    <p className="font-black text-slate-900 dark:text-white text-lg">{employees.find(e => e.id === r.employeeId)?.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase">{r.date}</p>
                  </td>
                  <td className="text-center font-bold">
                     <span className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl text-indigo-700 dark:text-indigo-400">{r.checkIn} - {r.checkOut}</span>
                  </td>
                  <td className="text-center">
                    <div className="flex flex-col items-center gap-1">
                       {r.lateMinutes > 0 ? (
                         <span className="flex items-center gap-1 text-rose-600 font-black text-xs"><AlertCircle size={14}/> متأخر {r.lateMinutes} د</span>
                       ) : (
                         <span className="flex items-center gap-1 text-emerald-600 font-black text-xs"><CheckCircle size={14}/> في الموعد</span>
                       )}
                       {r.overtimeMinutes > 0 && <span className="text-indigo-600 font-black text-[10px]">إضافي +{r.overtimeMinutes} د</span>}
                    </div>
                  </td>
                  <td className="text-center no-print">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => { setEditingId(r.id); setSelectedEmp(r.employeeId); setCheckIn(r.checkIn); setCheckOut(r.checkOut); setDate(r.date); }} className="p-2 text-indigo-600 rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={() => onDeleteRecord(r.id)} className="p-2 text-rose-600 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
