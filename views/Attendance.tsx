
import React, { useState, useEffect } from 'react';
import { Employee, AttendanceRecord, CompanySettings } from '../types';
import { Clock, Trash2, Edit2, CheckCircle } from 'lucide-react';
import { calculateTimeDiffMinutes } from '../utils/calculations';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    const lateMinutes = Math.max(0, calculateTimeDiffMinutes(checkIn, settings.officialCheckIn));
    const overtimeMinutes = Math.max(0, calculateTimeDiffMinutes(checkOut, settings.officialCheckOut));

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

  const handleDelete = (id: string) => {
    if (window.confirm(lang === 'ar' ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) {
      onDeleteRecord(id);
    }
  };

  const isRtl = lang === 'ar';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xl h-fit">
        <h3 className="text-xl font-bold mb-6 flex items-center gap-2 text-indigo-900">
          <Clock className="text-indigo-600" />
          {editingId ? (isRtl ? 'تعديل سجل' : 'Edit Record') : (isRtl ? 'تسجيل حضور وانصراف' : 'Register Attendance')}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-bold block mb-1 text-slate-700">{isRtl ? 'الموظف' : 'Employee'}</label>
            <select 
              className="w-full p-3 border border-slate-300 rounded-xl font-semibold"
              value={selectedEmp}
              onChange={e => setSelectedEmp(e.target.value)}
              required
            >
              <option value="">{isRtl ? 'اختر موظف' : 'Select Employee'}</option>
              {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-sm font-bold block mb-1 text-slate-700">{isRtl ? 'التاريخ' : 'Date'}</label>
            <input type="date" className="w-full p-3 border border-slate-300 rounded-xl font-semibold" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-bold block mb-1 text-slate-700">{isRtl ? 'دخول' : 'In'}</label>
              <input type="time" className="w-full p-3 border border-slate-300 rounded-xl font-semibold" value={checkIn} onChange={e => setCheckIn(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-bold block mb-1 text-slate-700">{isRtl ? 'خروج' : 'Out'}</label>
              <input type="time" className="w-full p-3 border border-slate-300 rounded-xl font-semibold" value={checkOut} onChange={e => setCheckOut(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition shadow-lg shadow-indigo-100">
              {isRtl ? 'حفظ السجل' : 'Save Record'}
            </button>
            {editingId && (
              <button type="button" onClick={resetForm} className="bg-slate-200 text-slate-700 px-6 rounded-xl font-bold">
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <h3 className="text-lg font-bold text-slate-900">{isRtl ? 'سجلات اليوم' : 'Today Records'}</h3>
          <div className="text-sm font-bold text-indigo-600">{date}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-100 text-slate-700 text-sm">
              <tr>
                <th className="px-6 py-4">{isRtl ? 'الموظف' : 'Employee'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'حضور' : 'In'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'انصراف' : 'Out'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'تأخير' : 'Late'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إضافي' : 'OT'}</th>
                <th className="px-6 py-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {records.filter(r => r.date === date).map(r => (
                <tr key={r.id} className="hover:bg-slate-50 transition">
                  <td className="px-6 py-4 font-bold text-slate-900">{employees.find(e => e.id === r.employeeId)?.name}</td>
                  <td className="px-6 py-4 text-center font-semibold">{r.checkIn}</td>
                  <td className="px-6 py-4 text-center font-semibold">{r.checkOut}</td>
                  <td className="px-6 py-4 text-center text-red-700 font-bold">{r.lateMinutes > 0 ? `${r.lateMinutes} د` : '-'}</td>
                  <td className="px-6 py-4 text-center text-green-700 font-bold">{r.overtimeMinutes > 0 ? `${r.overtimeMinutes} د` : '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(r)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={16}/></button>
                      <button onClick={() => handleDelete(r.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
              {records.filter(r => r.date === date).length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400 italic">
                    {isRtl ? 'لا توجد سجلات لهذا التاريخ' : 'No records for this date'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
