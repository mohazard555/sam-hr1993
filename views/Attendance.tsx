
import React, { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, CompanySettings } from '../types';
import { Clock, Trash2, Edit2, FileDown, Search, Calendar, Printer, CheckCircle, AlertCircle, Archive, X } from 'lucide-react';
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

  const handleEdit = (r: AttendanceRecord) => {
    setEditingId(r.id);
    setSelectedEmp(r.employeeId);
    setCheckIn(r.checkIn);
    setCheckOut(r.checkOut);
    setDate(r.date);
    if (showArchive) setShowArchive(false);
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
    return `${h}س ${m}د`;
  };

  const handleExportExcel = () => {
    const dataToExport = archivedRecords.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return {
        'التاريخ': r.date,
        'اسم الموظف': emp?.name || 'غير معروف',
        'وقت الحضور': r.checkIn,
        'وقت الانصراف': r.checkOut,
        'دقائق التأخير': r.lateMinutes,
        'دقائق الإضافي': r.overtimeMinutes,
        'ساعات العمل': formatHours(calculateTimeDiffMinutes(r.checkOut, r.checkIn))
      };
    });
    exportToExcel(dataToExport, "Attendance_Report");
  };

  return (
    <div className="space-y-4">
      {/* Printable Header - Visible only when printing */}
      <div className="hidden print:block text-right mb-6 pb-4 border-b-2 border-slate-900">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-slate-900">{settings.name}</h1>
            <h2 className="text-lg font-bold text-indigo-700 mt-1">
              {showArchive 
                ? `تقرير الحضور التاريخي (من ${dateFrom} إلى ${dateTo})` 
                : `سجل الحضور والانصراف اليومي - بتاريخ: ${date}`}
            </h2>
          </div>
          {settings.logo && <img src={settings.logo} className="h-12 w-auto object-contain" alt="Logo" />}
        </div>
        <div className="flex justify-between items-center mt-3 text-[10px] font-bold text-slate-500 uppercase">
          <p>تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
          <p>إجمالي السجلات: {showArchive ? archivedRecords.length : filteredRecords.length}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border dark:border-slate-800 no-print">
         <h2 className="text-base font-black text-indigo-700">{showArchive ? 'سجل الحضور التاريخي' : 'إدارة الحضور اليومي'}</h2>
         <button onClick={() => setShowArchive(!showArchive)} className={`flex items-center gap-2 px-6 py-2 rounded-xl font-black text-xs transition-all ${showArchive ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-900 text-white'}`}>
           {showArchive ? <Calendar size={16}/> : <Archive size={16}/>} {showArchive ? 'العودة' : 'الأرشيف المتقدم'}
         </button>
      </div>

      {!showArchive ? (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 animate-in fade-in duration-500">
          {/* Form Section */}
          <div className="xl:col-span-1 bg-white dark:bg-slate-900 p-5 rounded-2xl border dark:border-slate-800 shadow-sm h-fit no-print">
            <h3 className="text-sm font-black mb-5 flex items-center gap-2 text-indigo-700"><Clock size={18} /> {editingId ? 'تعديل السجل' : 'تسجيل حضور'}</h3>
            <form onSubmit={handleSubmit} className="space-y-4 text-right">
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block">تاريخ الدوام</label>
                <input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase mb-1 block">الموظف</label>
                <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)} required>
                  <option value="">-- اختر الموظف --</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              
              <div className="space-y-3">
                 <div>
                    <label className="text-[10px] font-black block mb-1">وقت الدخول</label>
                    <input type="time" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
                 </div>
                 <div>
                    <label className="text-[10px] font-black block mb-1">وقت الانصراف</label>
                    <input type="time" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
                 </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-black text-xs shadow-md">
                   {editingId ? 'تحديث' : 'تأكيد الحضور'}
                </button>
                {editingId && <button type="button" onClick={() => {setEditingId(null); setSelectedEmp('');}} className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl"><X size={16}/></button>}
              </div>
            </form>
          </div>

          <div className="xl:col-span-3 space-y-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none">
              <div className="overflow-x-auto print:overflow-visible">
                <table className="w-full text-right text-[11px] font-bold print:w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b dark:border-slate-700 font-black print:bg-slate-100 print:text-black">
                    <tr>
                      <th className="px-5 py-3">الموظف</th>
                      <th className="text-center py-3">الوقت</th>
                      <th className="text-center py-3">العمل</th>
                      <th className="text-center py-3">الحالة</th>
                      <th className="text-center py-3 no-print">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredRecords.map(r => {
                      const emp = employees.find(e => e.id === r.employeeId);
                      return (
                        <tr key={r.id} className="hover:bg-slate-50 transition print:border-b">
                          <td className="px-5 py-2">
                            <p className="font-black text-slate-900 dark:text-white">{emp?.name}</p>
                            <p className="text-[9px] text-slate-400 print:hidden">{r.date}</p>
                          </td>
                          <td className="text-center">
                            <span className="bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400 print:bg-transparent print:text-black">{r.checkIn} - {r.checkOut}</span>
                          </td>
                          <td className="text-center text-indigo-600 print:text-black">{formatHours(calculateTimeDiffMinutes(r.checkOut, r.checkIn))}</td>
                          <td className="text-center">
                              {r.lateMinutes > 0 ? (
                                <span className="text-rose-600 text-[9px]">متأخر {r.lateMinutes}د</span>
                              ) : (
                                <span className="text-emerald-600 text-[9px]">نظامي</span>
                              )}
                          </td>
                          <td className="text-center no-print px-5">
                            <div className="flex justify-center gap-1">
                              <button onClick={() => handleEdit(r)} className="p-1.5 text-indigo-600"><Edit2 size={14}/></button>
                              <button onClick={() => onDeleteRecord(r.id)} className="p-1.5 text-rose-600"><Trash2 size={14}/></button>
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
        </div>
      ) : (
        <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-500">
           <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 no-print text-right">
              <div>
                <select className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={archiveEmpId} onChange={e => setArchiveEmpId(e.target.value)}>
                   <option value="">كل الموظفين</option>
                   {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
              <input type="date" className="w-full p-2 bg-slate-50 dark:bg-slate-800 border dark:border-slate-700 rounded-lg font-bold text-xs" value={dateTo} onChange={e => setDateTo(e.target.value)} />
              <div className="flex gap-2">
                 <button onClick={handleExportExcel} className="flex-1 bg-emerald-600 text-white p-2 rounded-lg flex items-center justify-center gap-2 font-black text-xs"><FileDown size={14}/> Excel</button>
                 <button onClick={() => window.print()} className="flex-1 bg-slate-900 text-white p-2 rounded-lg flex items-center justify-center gap-2 font-black text-xs"><Printer size={14}/> طباعة</button>
              </div>
           </div>

           <div className="bg-white dark:bg-slate-900 rounded-2xl border dark:border-slate-800 shadow-sm overflow-hidden print:border-none print:shadow-none">
             <div className="overflow-x-auto print:overflow-visible">
               <table className="w-full text-right text-[11px] font-bold print:w-full">
                  <thead className="bg-slate-50 dark:bg-slate-800 border-b print:bg-slate-100 print:text-black">
                    <tr className="text-slate-500 font-black uppercase print:text-black">
                      <th className="px-5 py-3">التاريخ</th>
                      <th className="px-5 py-3">الموظف</th>
                      <th className="text-center py-3">الحضور</th>
                      <th className="text-center py-3">الانصراف</th>
                      <th className="text-center py-3">المدة</th>
                      <th className="text-center py-3">تأخير</th>
                      <th className="text-center py-3 no-print">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {archivedRecords.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50 transition print:border-b">
                        <td className="px-5 py-2 text-slate-500 print:text-black">{r.date}</td>
                        <td className="px-5 py-2">{employees.find(e => e.id === r.employeeId)?.name}</td>
                        <td className="text-center">{r.checkIn}</td>
                        <td className="text-center">{r.checkOut}</td>
                        <td className="text-center text-indigo-700 print:text-black">{formatHours(calculateTimeDiffMinutes(r.checkOut, r.checkIn))}</td>
                        <td className={`text-center ${r.lateMinutes > 0 ? 'text-rose-600' : ''} print:text-black`}>{r.lateMinutes}د</td>
                        <td className="text-center no-print px-5">
                           <div className="flex justify-center gap-1">
                             <button onClick={() => handleEdit(r)} className="p-1.5 text-indigo-600"><Edit2 size={14}/></button>
                             <button onClick={() => onDeleteRecord(r.id)} className="p-1.5 text-rose-600"><Trash2 size={14}/></button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
               </table>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
