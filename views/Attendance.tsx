
import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, CompanySettings } from '../types';
import { Clock, Trash2, Edit2, FileDown, Search, Calendar, Printer } from 'lucide-react';
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

    // Find the specific employee to check for custom shift times
    const emp = employees.find(e => e.id === selectedEmp);
    const shiftIn = emp?.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp?.customCheckOut || settings.officialCheckOut;

    // Calculate relative to the specific shift assigned to THIS employee
    const lateMinutes = Math.max(0, calculateTimeDiffMinutes(checkIn, shiftIn));
    const overtimeMinutes = Math.max(0, calculateTimeDiffMinutes(checkOut, shiftOut));

    const record: AttendanceRecord = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      employeeId: selectedEmp,
      date,
      checkIn,
      checkOut,
      lateMinutes,
      overtimeMinutes,
      status: 'present'
    };
    onSaveRecord(record);
    resetForm();
  };

  const resetForm = () => {
    setEditingId(null);
    setSelectedEmp('');
    setCheckIn(settings.officialCheckIn);
    setCheckOut(settings.officialCheckOut);
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleEdit = (r: AttendanceRecord) => {
    setEditingId(r.id);
    setSelectedEmp(r.employeeId);
    setDate(r.date);
    setCheckIn(r.checkIn);
    setCheckOut(r.checkOut);
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      const nameMatch = emp?.name.toLowerCase().includes(searchTerm.toLowerCase());
      const dateMatch = r.date === date;
      return nameMatch && dateMatch;
    });
  }, [records, date, searchTerm, employees]);

  const handleExport = () => {
    const data = filteredRecords.map(r => {
      const emp = employees.find(e => e.id === r.employeeId);
      return {
        [isRtl ? 'الموظف' : 'Employee']: emp?.name,
        [isRtl ? 'التاريخ' : 'Date']: r.date,
        [isRtl ? 'حضور' : 'Check-In']: r.checkIn,
        [isRtl ? 'انصراف' : 'Check-Out']: r.checkOut,
        [isRtl ? 'تأخير (د)' : 'Late (m)']: r.lateMinutes,
        [isRtl ? 'إضافي (د)' : 'OT (m)']: r.overtimeMinutes
      };
    });
    exportToExcel(data, "Attendance_Report");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Registration Form */}
      <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl h-fit no-print">
        <h3 className="text-2xl font-black mb-8 flex items-center gap-3 text-indigo-700 dark:text-indigo-400">
          <Clock className="text-indigo-600" size={28} />
          {editingId ? (isRtl ? 'تعديل سجل' : 'Edit Record') : (isRtl ? 'تسجيل حضور وانصراف' : 'Registration')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="text-xs font-black block mb-2 text-slate-500 uppercase">{isRtl ? 'الموظف' : 'Employee'}</label>
            <select 
              className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition"
              value={selectedEmp}
              onChange={e => {
                const id = e.target.value;
                setSelectedEmp(id);
                // Pre-fill with employee's custom shift if available
                const emp = employees.find(emp => emp.id === id);
                if (emp) {
                  setCheckIn(emp.customCheckIn || settings.officialCheckIn);
                  setCheckOut(emp.customCheckOut || settings.officialCheckOut);
                }
              }}
              required
            >
              <option value="">{isRtl ? 'اختر موظف...' : 'Select Employee'}</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-black block mb-2 text-slate-500 uppercase">{isRtl ? 'التاريخ' : 'Date'}</label>
            <input type="date" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black block mb-2 text-slate-500 uppercase">{isRtl ? 'دخول' : 'In'}</label>
              <input type="time" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="text-xs font-black block mb-2 text-slate-500 uppercase">{isRtl ? 'خروج' : 'Out'}</label>
              <input type="time" className="w-full p-4 border-2 dark:bg-slate-800 dark:border-slate-700 border-slate-200 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600 transition" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button className="w-full bg-indigo-700 text-white py-5 rounded-2xl font-black text-lg hover:bg-indigo-800 transition shadow-xl shadow-indigo-100 dark:shadow-none">
              {isRtl ? 'حفظ السجل' : 'Save Record'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="w-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 py-4 rounded-2xl font-black">
                {isRtl ? 'إلغاء التعديل' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Records Table */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-xl no-print flex flex-col md:flex-row justify-between items-center gap-4">
           <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-4 top-4 text-slate-400" size={18} />
              <input 
                className="w-full pr-12 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 rounded-2xl font-black text-slate-950 dark:text-white outline-none focus:border-indigo-600"
                placeholder={isRtl ? 'بحث باسم الموظف...' : 'Search...'}
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           <div className="flex gap-2">
              <button onClick={handleExport} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-lg">
                <FileDown size={18}/> Excel
              </button>
              <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-black shadow-lg">
                <Printer size={18}/> {isRtl ? 'طباعة' : 'Print'}
              </button>
           </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-slate-100 dark:border-slate-800 shadow-2xl overflow-hidden">
          <div className="p-8 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
            <h3 className="text-xl font-black text-slate-950 dark:text-white flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              {isRtl ? 'سجلات تاريخ:' : 'Date:'} {date}
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-slate-100 font-black text-xs uppercase">
                <tr>
                  <th className="px-8 py-6">{isRtl ? 'الموظف' : 'Employee'}</th>
                  <th className="px-8 py-6 text-center">{isRtl ? 'حضور' : 'In'}</th>
                  <th className="px-8 py-6 text-center">{isRtl ? 'انصراف' : 'Out'}</th>
                  <th className="px-8 py-6 text-center">{isRtl ? 'تأخير' : 'Late'}</th>
                  <th className="px-8 py-6 text-center">{isRtl ? 'إضافي' : 'OT'}</th>
                  <th className="px-8 py-6 text-center no-print">{isRtl ? 'إجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredRecords.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="px-8 py-6 font-black text-slate-950 dark:text-white text-lg">
                        {employees.find(e => e.id === r.employeeId)?.name}
                        <p className="text-[10px] text-slate-500 font-bold uppercase">{employees.find(e => e.id === r.employeeId)?.department}</p>
                    </td>
                    <td className="px-8 py-6 text-center font-black text-slate-900 dark:text-slate-200">{r.checkIn}</td>
                    <td className="px-8 py-6 text-center font-black text-slate-900 dark:text-slate-200">{r.checkOut}</td>
                    <td className="px-8 py-6 text-center">
                        <span className={`font-black ${r.lateMinutes > 0 ? 'text-rose-700 bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-xl' : 'text-slate-400'}`}>
                            {r.lateMinutes > 0 ? `${r.lateMinutes} د` : '-'}
                        </span>
                    </td>
                    <td className="px-8 py-6 text-center">
                        <span className={`font-black ${r.overtimeMinutes > 0 ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-xl' : 'text-slate-400'}`}>
                            {r.overtimeMinutes > 0 ? `${r.overtimeMinutes} د` : '-'}
                        </span>
                    </td>
                    <td className="px-8 py-6 text-center no-print">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleEdit(r)} className="p-3 text-indigo-600 hover:bg-indigo-50 rounded-2xl transition"><Edit2 size={18}/></button>
                        <button onClick={() => { if(confirm(isRtl ? 'حذف؟' : 'Delete?')) onDeleteRecord(r.id); }} className="p-3 text-rose-600 hover:bg-rose-50 rounded-2xl transition"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRecords.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-24 text-slate-400 italic font-black">
                      {isRtl ? 'لا توجد سجلات مطابقة للبحث' : 'No matching records'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
