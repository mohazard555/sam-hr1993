
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
    
    setEditingId(null); 
    setSelectedEmp('');
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return (emp?.name.toLowerCase().includes(archiveSearch.toLowerCase()) || !archiveSearch) && r.date === date && !r.isArchived;
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
    <div className="space-y-8 print:w-full print:p-0">
      <div className="hidden print:flex justify-between items-center border-b-4 border-indigo-950 pb-4 mb-6 w-full text-indigo-950">
        <div className="text-right flex-1">
          <h1 className="text-3xl font-black mb-1">{settings.name}</h1>
          <p className="text-lg font-black text-indigo-700">تقرير سجلات الحضور والانصراف</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase">الفترة: {showArchive ? `${dateFrom} إلى ${dateTo}` : `يوم ${date}`}</p>
        </div>
        <div className="flex-none px-6">
          {settings.logo && <img src={settings.logo} className="h-14 w-auto object-contain" alt="Logo" />}
        </div>
        <div className="text-left flex-1 font-bold text-[8px]">
          <p>تاريخ الاستخراج: {new Date().toLocaleDateString('ar-EG')}</p>
          <p>عدد السجلات: {showArchive ? archivedRecords.length : filteredRecords.length}</p>
        </div>
      </div>

      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border dark:border-slate-800 no-print">
         <h2 className="text-2xl font-black text-indigo-700">{showArchive ? 'سجل الحضور التاريخي' : 'إدارة الحضور اليومي'}</h2>
         <button onClick={() => setShowArchive(!showArchive)} className={`flex items-center gap-2 px-8 py-3 rounded-2xl font-black transition-all ${showArchive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white'}`}>
           {showArchive ? 'العودة للتسجيل' : 'عرض الأرشيف المتقدم'}
         </button>
      </div>

      {!showArchive ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-1 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border shadow-2xl h-fit no-print">
            <h3 className="text-xl font-black mb-8 flex items-center gap-2 text-indigo-700 text-right"><Clock size={24} /> تسجيل حضور</h3>
            <form onSubmit={handleSubmit} className="space-y-6 text-right">
              <div><label className="text-xs font-black block">التاريخ</label><input type="date" className="w-full p-4 border rounded-xl font-bold bg-indigo-50/50" value={date} onChange={e => setDate(e.target.value)} /></div>
              <div><label className="text-xs font-black block">الموظف</label><select className="w-full p-4 border rounded-xl font-bold" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required><option value="">-- اختر --</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-[10px] font-black">الدخول</label><input type="time" className="w-full p-3 border rounded-xl font-bold" value={checkIn} onChange={e => setCheckIn(e.target.value)} /></div><div><label className="text-[10px] font-black">الانصراف</label><input type="time" className="w-full p-3 border rounded-xl font-bold" value={checkOut} onChange={e => setCheckOut(e.target.value)} /></div></div>
              <button className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black shadow-lg">تأكيد التسجيل</button>
            </form>
          </div>
          <div className="lg:col-span-3">
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border shadow-xl overflow-visible">
              <table className="w-full text-right print:table-auto">
                <thead className="bg-slate-50 border-b print:bg-slate-50 print:text-black">
                  <tr className="text-slate-500 font-black text-xs uppercase">
                    <th className="px-8 py-5">الموظف</th><th className="text-center py-5">الوقت</th><th className="text-center py-5">ساعات</th><th className="text-center py-5 no-print">إجراء</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 transition print:border-b">
                      <td className="px-8 py-4 font-black">{employees.find(e => e.id === r.employeeId)?.name}</td>
                      <td className="text-center font-bold">{r.checkIn} - {r.checkOut}</td>
                      <td className="text-center text-indigo-600 font-black">{formatHours(calculateTimeDiffMinutes(r.checkOut, r.checkIn))}</td>
                      <td className="text-center no-print"><button onClick={() => onDeleteRecord(r.id)} className="p-2 text-rose-600"><Trash2 size={16}/></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6 print:w-full">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border grid grid-cols-1 md:grid-cols-4 gap-6 no-print text-right">
              <div><label className="text-xs font-black block">من</label><input type="date" className="w-full p-3 border rounded-xl font-bold" value={dateFrom} onChange={e => setDateFrom(e.target.value)} /></div>
              <div><label className="text-xs font-black block">إلى</label><input type="date" className="w-full p-3 border rounded-xl font-bold" value={dateTo} onChange={e => setDateTo(e.target.value)} /></div>
              <div className="flex items-end gap-2"><button onClick={() => window.print()} className="w-full bg-slate-900 text-white p-3 rounded-xl font-black"><Printer size={20}/> طباعة الأرشيف</button></div>
           </div>
           <div className="bg-white dark:bg-slate-900 rounded-[2rem] border shadow-2xl overflow-visible print:w-full">
             <table className="w-full text-right text-sm print:table-auto">
                <thead className="bg-slate-100 border-b print:bg-slate-100">
                  <tr className="text-slate-500 font-black text-xs">
                    <th className="px-8 py-4">التاريخ</th><th className="px-8 py-4">الموظف</th><th className="text-center py-4">الوقت</th><th className="text-center py-4">الساعات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {archivedRecords.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 font-bold print:border-b">
                      <td className="px-8 py-4 text-slate-500">{r.date}</td>
                      <td className="px-8 py-4">{employees.find(e => e.id === r.employeeId)?.name}</td>
                      <td className="text-center">{r.checkIn} - {r.checkOut}</td>
                      <td className="text-center font-black text-indigo-700">{formatHours(calculateTimeDiffMinutes(r.checkOut, r.checkIn))}</td>
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
