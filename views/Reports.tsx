
import React, { useState } from 'react';
import { Employee, PayrollRecord, LeaveRequest, AttendanceRecord } from '../types';
import { DB } from '../db/store';
import { Printer, TrendingUp, Users, Wallet, Filter, Calendar as CalendarIcon, User as UserIcon } from 'lucide-react';

interface Props {
  db: DB;
  payrolls: PayrollRecord[];
  lang: 'ar' | 'en';
}

const ReportsView: React.FC<Props> = ({ db, payrolls, lang }) => {
  const isRtl = lang === 'ar';
  const departments: string[] = Array.from(new Set(db.employees.map(e => e.department)));

  // States for Employee Report
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const getDeptStats = (dept: string) => {
    const emps = db.employees.filter(e => e.department === dept);
    const deptPayrolls = payrolls.filter(p => emps.some(e => e.id === p.employeeId));
    const totalSalaries = deptPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    return { count: emps.length, total: totalSalaries };
  };

  const getEmpDetailedReport = () => {
    if (!selectedEmpId) return null;

    const emp = db.employees.find(e => e.id === selectedEmpId);
    if (!emp) return null;

    // Filter relevant data by date range if provided
    const filterByDate = (dateStr: string) => {
      if (!startDate && !endDate) return true;
      const d = new Date(dateStr);
      const start = startDate ? new Date(startDate) : new Date('1900-01-01');
      const end = endDate ? new Date(endDate) : new Date('2100-12-31');
      return d >= start && d <= end;
    };

    const empAttendance = db.attendance.filter(a => a.employeeId === selectedEmpId && filterByDate(a.date));
    const empLeaves = db.leaves.filter(l => l.employeeId === selectedEmpId && (filterByDate(l.startDate) || filterByDate(l.endDate)));
    const empLoans = db.loans.filter(lo => lo.employeeId === selectedEmpId);
    
    // Total stats
    const totalPresent = empAttendance.filter(a => a.status === 'present').length;
    const totalAbsent = empAttendance.filter(a => a.status === 'absent').length;
    const totalLeaves = empLeaves.filter(l => l.status === 'approved').length;
    const totalLateMins = empAttendance.reduce((acc, a) => acc + a.lateMinutes, 0);
    const totalOTMins = empAttendance.reduce((acc, a) => acc + a.overtimeMinutes, 0);

    return {
      emp,
      attendance: empAttendance,
      leaves: empLeaves,
      loans: empLoans,
      summary: {
        totalPresent,
        totalAbsent,
        totalLeaves,
        totalLateMins,
        totalOTMins
      }
    };
  };

  const empReport = getEmpDetailedReport();

  return (
    <div className="space-y-12">
      {/* 1. Department Overview */}
      <section className="space-y-6">
        <div className="flex justify-between items-center no-print bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm">
          <h2 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
            <TrendingUp size={24}/>
            {isRtl ? 'تحليل الأقسام والكتلة المالية' : 'Department Analysis'}
          </h2>
          <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg transition-all">
            <Printer size={20} />
            {isRtl ? 'طباعة التقرير العام' : 'Print General Report'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {departments.map(dept => {
            const stats = getDeptStats(dept);
            return (
              <div key={dept} className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border-2 border-slate-100 dark:border-slate-800 shadow-lg hover:border-indigo-500 transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                    <Users size={24} />
                  </div>
                </div>
                <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-slate-100">{dept || 'بدون قسم'}</h3>
                <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">{isRtl ? 'الموظفين:' : 'Employees:'}</span>
                    <span className="font-black text-slate-800 dark:text-slate-100">{stats.count}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-500">{isRtl ? 'إجمالي الرواتب:' : 'Total Salaries:'}</span>
                    <span className="font-black text-indigo-600">{stats.total.toLocaleString()} {db.settings.currency}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. Individual Employee Detailed Report */}
      <section className="space-y-6 no-print">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl space-y-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b dark:border-slate-800 pb-8">
            <h2 className="text-2xl font-black text-indigo-600 flex items-center gap-2">
               <UserIcon size={24}/>
               {isRtl ? 'تقرير تفصيلي لموظف' : 'Employee Detailed Report'}
            </h2>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700">
                <Filter size={18} className="text-indigo-600" />
                <select className="bg-transparent font-black text-sm outline-none" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                  <option value="">{isRtl ? 'اختر موظف...' : 'Select Employee...'}</option>
                  {db.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border dark:border-slate-700">
                <CalendarIcon size={18} className="text-indigo-600" />
                <input type="date" className="bg-transparent text-xs outline-none font-bold" value={startDate} onChange={e => setStartDate(e.target.value)} />
                <span className="text-xs font-bold">-</span>
                <input type="date" className="bg-transparent text-xs outline-none font-bold" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>
          </div>

          {empReport ? (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-800/50">
                   <p className="text-xs font-black text-indigo-500 uppercase mb-1">أيام الحضور</p>
                   <p className="text-3xl font-black">{empReport.summary.totalPresent}</p>
                </div>
                <div className="p-6 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] border-2 border-rose-100 dark:border-rose-800/50">
                   <p className="text-xs font-black text-rose-500 uppercase mb-1">أيام الغياب</p>
                   <p className="text-3xl font-black">{empReport.summary.totalAbsent}</p>
                </div>
                <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-[2rem] border-2 border-amber-100 dark:border-amber-800/50">
                   <p className="text-xs font-black text-amber-500 uppercase mb-1">إجمالي الإجازات</p>
                   <p className="text-3xl font-black">{empReport.summary.totalLeaves}</p>
                </div>
                <div className="p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-[2rem] border-2 border-emerald-100 dark:border-emerald-800/50">
                   <p className="text-xs font-black text-emerald-500 uppercase mb-1">ساعات الإضافي</p>
                   <p className="text-3xl font-black">{(empReport.summary.totalOTMins / 60).toFixed(1)}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 border-r-4 border-indigo-600 pr-4">سجل الحضور الأخير</h4>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="p-3">التاريخ</th>
                          <th className="p-3 text-center">دخول</th>
                          <th className="p-3 text-center">خروج</th>
                          <th className="p-3 text-center">تأخير (د)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empReport.attendance.slice(0, 10).map(a => (
                          <tr key={a.id} className="border-t dark:border-slate-700">
                            <td className="p-3 font-bold">{a.date}</td>
                            <td className="p-3 text-center">{a.checkIn}</td>
                            <td className="p-3 text-center">{a.checkOut}</td>
                            <td className="p-3 text-center text-rose-600 font-black">{a.lateMinutes}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-black text-slate-800 dark:text-slate-100 border-r-4 border-emerald-600 pr-4">الإجازات الموافق عليها</h4>
                  <div className="bg-white dark:bg-slate-800 rounded-2xl overflow-hidden border dark:border-slate-700">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 dark:bg-slate-700/50">
                        <tr>
                          <th className="p-3">النوع</th>
                          <th className="p-3">من</th>
                          <th className="p-3">إلى</th>
                          <th className="p-3 text-center">الحالة</th>
                        </tr>
                      </thead>
                      <tbody>
                        {empReport.leaves.filter(l => l.status === 'approved').map(l => (
                          <tr key={l.id} className="border-t dark:border-slate-700">
                            <td className="p-3 font-bold">{l.type}</td>
                            <td className="p-3">{l.startDate}</td>
                            <td className="p-3">{l.endDate}</td>
                            <td className="p-3 text-center">
                              <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-[10px] font-black uppercase">approved</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 italic">يرجى اختيار موظف لاستعراض تقريره التفصيلي</div>
          )}
        </div>
      </section>

      {/* Detailed General Table for Print Only */}
      <div className="print-only mt-10">
         <h1 className="text-3xl font-black text-center mb-10 text-indigo-700 underline underline-offset-8 uppercase">SAM - {isRtl ? 'التقرير الختامي للموارد البشرية' : 'General HR Report'}</h1>
         <table className="w-full text-center border-collapse border-2 border-indigo-700">
            <thead className="bg-indigo-600 text-white font-black">
               <tr>
                  <th className="p-4 border border-indigo-800">اسم القسم</th>
                  <th className="p-4 border border-indigo-800">عدد الموظفين</th>
                  <th className="p-4 border border-indigo-800">إجمالي الرواتب</th>
                  <th className="p-4 border border-indigo-800">متوسط الراتب</th>
               </tr>
            </thead>
            <tbody>
               {departments.map(dept => {
                 const stats = getDeptStats(dept);
                 return (
                   <tr key={dept} className="border-b odd:bg-slate-50 font-bold">
                      <td className="p-4 border">{dept || 'عام'}</td>
                      <td className="p-4 border">{stats.count}</td>
                      <td className="p-4 border text-indigo-700 font-black">{stats.total.toLocaleString()} {db.settings.currency}</td>
                      <td className="p-4 border">{(stats.total / (stats.count || 1)).toLocaleString()}</td>
                   </tr>
                 );
               })}
            </tbody>
         </table>
         <div className="mt-20 flex justify-between px-10 font-black text-sm text-slate-500 uppercase">
            <div>توقيع المدير: ..............................</div>
            <div>التاريخ: {new Date().toLocaleDateString()}</div>
         </div>
      </div>
    </div>
  );
};

export default ReportsView;
