
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, CompanySettings } from '../types';
import { Clock, Trash2, Edit2, FileDown, Search, Calendar, Printer, CheckCircle, AlertCircle, Archive, Filter, X } from 'lucide-react';
import { calculateTimeDiffMinutes } from '../utils/calculations';
import { exportToExcel } from '../utils/export';

interface Props {
  employees: Employee[];
  records: AttendanceRecord[];
  settings: CompanySettings;
  onSaveRecord: (record: AttendanceRecord) => void;
  onDeleteRecord: (id: string) => void;
  lang: 'ar' | 'en';
  onPrint: () => void;
}

const Attendance: React.FC<Props> = ({ employees, records, settings, onSaveRecord, onDeleteRecord, lang, onPrint }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedEmp, setSelectedEmp] = useState('');
  const [checkIn, setCheckIn] = useState(settings.officialCheckIn);
  const [checkOut, setCheckOut] = useState(settings.officialCheckOut);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  
  const [showArchive, setShowArchive] = useState(false);
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveEmpId, setArchiveEmpId] = useState('');
  const [dateFrom, setDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

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

  const handleEdit = (r: AttendanceRecord) => {
    setEditingId(r.id);
    setSelectedEmp(r.employeeId);
    setCheckIn(r.checkIn);
    setCheckOut(r.checkOut);
    setDate(r.date);
    if (showArchive) {
        // إذا كنا في الأرشيف نفتح النموذج في مودال صغير أو نعود للواجهة
        // للخيار الأبسط سنغلق الأرشيف ونفعل وضع التعديل
        setShowArchive(false);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return emp?.name.toLowerCase().includes(archiveSearch.toLowerCase()) && r.date === date;
    });
  }, [records, date, archiveSearch, employees]);

  const archivedRecords = useMemo(() => {
    return records.filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(archiveSearch.toLowerCase());
      const empMatch = !archiveEmpId || r.employeeId === archiveEmpId;
      const dateMatch = (!dateFrom || r.date >= dateFrom) && (!dateTo || r.date <= dateTo);
      return nameMatch && empMatch && dateMatch;
    }).sort((a,b) => b.date.localeCompare(a.date));
  }, [records, archiveSearch, archiveEmpId, dateFrom, dateTo, employees]);

  const formatHours = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `${h} س ${m} د`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 no-print">
         <h2 className="text-2xl font-black text-indigo-700">{showArchive ? 'أرشيف الحضور التاريخي' : 'تسجيل الحضور اليومي'}</h2>
         <button onClick={() => setShowArchive(!showArchive)} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all ${showArchive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white'}`}>
           {showArchive ? <Calendar size={20}/> : <Archive size={20}/>} {showArchive ? 'العودة للتسجيل' : 'عرض الأرشيف'}
         </button>
      </div>

      {!showArchive ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-in fade-in duration-500">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl h-fit">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-indigo-700 text-right"><Clock size={24} /> {editingId ? 'تعديل سجل دوام' : 'تسجيل دوام'}</h3>
            <form onSubmit={handleSubmit} className="space-y-6 text-right">
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
              <div className="flex gap-2">
                <button className={`flex-1 ${editingId ? 'bg-indigo-600' : 'bg-indigo-600'} text-white py-4 rounded-xl font-black shadow-lg`}>{editingId ? 'تحديث السجل' : 'حفظ السجل'}</button>
                {editingId && <button type="button" onClick={() => {setEditingId(null); setSelectedEmp('');}} className="p-4 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={20}/></button>}
              </div>
            </form>
          </div>

          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50 dark:bg-slate-800 border-b">
                  <tr className="text-slate-500 font-black text-xs uppercase">
                    <th className="px-8 py-6">الموظف</th>
                    <th className="text-center py-6">الوقت المسجل</th>
                    <th className="text-center py-6">ساعات العمل</th>
                    <th className="text-center py-6">الحالة</th>
                    <th className="text-center py-6 no-print">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredRecords.map(r => {
                    const emp = employees.find(e => e.id === r.employeeId);
                    const officialIn = emp?.customCheckIn || settings.officialCheckIn;
                    const officialOut = emp?.customCheckOut || settings.officialCheckOut;
                    const requiredMins = calculateTimeDiffMinutes(officialOut, officialIn);
                    const actualMins = calculateTimeDiffMinutes(r.checkOut, r.checkIn);
                    
                    return (
                      <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="px-8 py-5">
                          <p className="font-black text-slate-900 dark:text-white text-lg">{emp?.name}</p>
                          <p className="text-[10px] text-slate-500 font-bold uppercase">{r.date}</p>
                        </td>
                        <td className="text-center font-bold">
                           <span className="bg-indigo-50 dark:bg-indigo-900/20 px-4 py-2 rounded-xl text-indigo-700 dark:text-indigo-400">{r.checkIn} - {r.checkOut}</span>
                        </td>
                        <td className="text-center">
                          <div className="flex flex-col text-[10px] font-black items-center">
                            <span className="text-slate-400">المستحقة: {formatHours(requiredMins)}</span>
                            <span className="text-indigo-600 font-black border-t dark:border-slate-700 mt-1 pt-1">الفعلية: {formatHours(actualMins)}</span>
                          </div>
                        </td>
                        <td className="text-center">
                          <div className="flex flex-col items-center gap-1">
                             {r.lateMinutes > 0 ? (
                               <span className="flex items-center gap-1 text-rose-600 font-black text-xs"><AlertCircle size={14}/> متأخر {r.lateMinutes} د</span>
                             ) : (
                               <span className="flex items-center gap-1 text-emerald-600 font-black text-xs"><CheckCircle size={14}/> في الموعد</span>
                             )}
                          </div>
                        </td>
                        <td className="text-center no-print">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => handleEdit(r)} className="p-2 text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit2 size={16}/></button>
                            <button onClick={() => onDeleteRecord(r.id)} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 size={16}/></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border dark:border-slate-800 grid grid-cols-1 md:grid-cols-4 gap-6 no-print text-right">
              <div className="md:col-span-1">
                <label className="text-xs font-black mb-1 block">تصفية حسب الموظف</label>
                <select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" value={archiveEmpId} onChange={e => setArchiveEmpId(e.target.value)}>
                   <option value="">كل الموظفين</option>
                   {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-black mb-1 block">من تاريخ</label>
                <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              </div>
              <div className="md:col-span-1">
                <label className="text-xs font-black mb-1 block">إلى تاريخ</label>
                <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border rounded-xl font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              </div>
              <div className="flex items-end gap-2">
                 <button onClick={() => exportToExcel(archivedRecords, "AttendanceArchive")} className="flex-1 bg-emerald-600 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg"><FileDown size={18}/> Excel</button>
                 <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white p-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg"><Printer size={18}/> طباعة</button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border dark:border-slate-800 shadow-2xl overflow-hidden overflow-x-auto">
             <div className="print-only p-10 text-center border-b-4 border-slate-900 bg-slate-50">
                <div className="flex justify-between items-center mb-6">
                   <h1 className="text-3xl font-black text-indigo-900">سجل أرشيف الحضور والانصراف</h1>
                   <p className="text-sm font-bold bg-white px-4 py-2 border rounded-xl">الفترة: {dateFrom} - {dateTo}</p>
                </div>
                {archiveEmpId && <p className="text-xl font-black text-slate-700">الموظف المعني: {employees.find(e => e.id === archiveEmpId)?.name}</p>}
             </div>

             <table className="w-full text-right text-sm">
                <thead className="bg-slate-100 dark:bg-slate-900 border-b">
                  <tr className="text-slate-500 font-black text-xs uppercase">
                    <th className="px-8 py-4">التاريخ</th>
                    <th className="px-8 py-4">الموظف</th>
                    <th className="text-center py-4">الحضور</th>
                    <th className="text-center py-4">الانصراف</th>
                    <th className="text-center py-4">الساعات الفعلية</th>
                    <th className="text-center py-4">تأخير (د)</th>
                    <th className="text-center py-4 no-print">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {archivedRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition font-bold">
                      <td className="px-8 py-4 text-slate-500">{r.date}</td>
                      <td className="px-8 py-4">{employees.find(e => e.id === r.employeeId)?.name}</td>
                      <td className="text-center">{r.checkIn}</td>
                      <td className="text-center">{r.checkOut}</td>
                      <td className="text-center font-black text-indigo-700">{formatHours(calculateTimeDiffMinutes(r.checkOut, r.checkIn))}</td>
                      <td className={`text-center ${r.lateMinutes > 0 ? 'text-rose-600 font-black' : ''}`}>{r.lateMinutes}</td>
                      <td className="text-center no-print">
                         <div className="flex justify-center gap-2">
                           <button onClick={() => handleEdit(r)} className="p-2 text-indigo-600 rounded-lg hover:bg-indigo-50"><Edit2 size={16}/></button>
                           <button onClick={() => onDeleteRecord(r.id)} className="p-2 text-rose-600 rounded-lg hover:bg-rose-50"><Trash2 size={16}/></button>
                         </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
