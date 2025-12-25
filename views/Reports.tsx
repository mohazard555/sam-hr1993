
import React, { useState, useMemo } from 'react';
import { Employee, PayrollRecord, LeaveRequest, AttendanceRecord, FinancialEntry } from '../types';
import { DB } from '../db/store';
import { Printer, TrendingUp, Users, Wallet, Filter, Calendar as CalendarIcon, User as UserIcon, FileDown, Search } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface Props {
  db: DB;
  payrolls: PayrollRecord[];
  lang: 'ar' | 'en';
}

const ReportsView: React.FC<Props> = ({ db, payrolls, lang }) => {
  const isRtl = lang === 'ar';
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  const departments: string[] = Array.from(new Set(db.employees.map(e => e.department)));

  const getDeptStats = (dept: string) => {
    const emps = db.employees.filter(e => e.department === dept);
    const deptPayrolls = payrolls.filter(p => emps.some(e => e.id === p.employeeId));
    const totalSalaries = deptPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    return { count: emps.length, total: totalSalaries };
  };

  const proReportData = useMemo(() => {
    return db.employees.map(emp => {
      if (selectedEmpId && emp.id !== selectedEmpId) return null;

      const filterByDate = (dateStr: string) => {
        if (!startDate && !endDate) return true;
        const d = new Date(dateStr);
        const start = startDate ? new Date(startDate) : new Date('1900-01-01');
        const end = endDate ? new Date(endDate) : new Date('2100-12-31');
        return d >= start && d <= end;
      };

      const att = db.attendance.filter(a => a.employeeId === emp.id && filterByDate(a.date));
      const fin = db.financials.filter(f => f.employeeId === emp.id && filterByDate(f.date));
      const pay = db.payrollHistory.filter(p => p.employeeId === emp.id && filterByDate(`${p.year}-${String(p.month).padStart(2, '0')}-01`));

      const totalLate = att.reduce((acc, a) => acc + a.lateMinutes, 0);
      const totalOT = att.reduce((acc, a) => acc + a.overtimeMinutes, 0);
      const bonuses = fin.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
      const deductions = fin.filter(f => f.type === 'deduction').reduce((acc, f) => acc + f.amount, 0);
      const production = fin.filter(f => f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);

      return {
        empName: emp.name,
        dept: emp.department,
        presentDays: att.filter(a => a.status === 'present').length,
        totalLate,
        totalOT,
        bonuses,
        deductions,
        production,
        netPaid: pay.reduce((acc, p) => acc + p.netSalary, 0)
      };
    }).filter(Boolean);
  }, [selectedEmpId, startDate, endDate, db]);

  const handleExportPro = () => {
    exportToExcel(proReportData, "SAM_Professional_Report");
  };

  return (
    <div className="space-y-12">
      {/* 1. Header with Global Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl gap-6">
        <div>
           <h2 className="text-2xl font-black text-indigo-700 dark:text-indigo-400">تحليلات SAM الاحترافية</h2>
           <p className="text-xs font-bold text-slate-500 uppercase mt-1">تتبع الحضور، الماليات، الإنتاج والرواتب</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={handleExportPro} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-emerald-700 shadow-lg">
             <FileDown size={18} /> Excel
          </button>
          <button onClick={() => window.print()} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-black shadow-lg">
             <Printer size={18} /> طباعة التقرير
          </button>
        </div>
      </div>

      {/* 2. Advanced Search Filter */}
      <section className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-lg no-print">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
               <label className="text-xs font-black text-slate-500 mb-2 block uppercase">تصفية حسب الموظف</label>
               <div className="relative">
                  <UserIcon className="absolute right-3 top-3 text-slate-400" size={18} />
                  <select className="w-full pr-10 pl-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black outline-none" value={selectedEmpId} onChange={e => setSelectedEmpId(e.target.value)}>
                    <option value="">كافة الموظفين</option>
                    {db.employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                  </select>
               </div>
            </div>
            <div>
               <label className="text-xs font-black text-slate-500 mb-2 block uppercase">من تاريخ</label>
               <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
            </div>
            <div>
               <label className="text-xs font-black text-slate-500 mb-2 block uppercase">إلى تاريخ</label>
               <input type="date" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border-2 dark:border-slate-700 rounded-2xl font-black outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
         </div>
      </section>

      {/* 3. Professional Analytic Table */}
      <section className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
        <div className="p-8 border-b dark:border-slate-800">
           <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">التفاصيل التحليلية للموارد البشرية</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 border-b dark:border-slate-700">
               <tr>
                  <th className="p-4 font-black">الموظف / القسم</th>
                  <th className="p-4 text-center font-black">أيام الحضور</th>
                  <th className="p-4 text-center font-black">تأخير (س)</th>
                  <th className="p-4 text-center font-black">إضافي (س)</th>
                  <th className="p-4 text-center font-black">مكافآت</th>
                  <th className="p-4 text-center font-black">خصومات</th>
                  <th className="p-4 text-center font-black">إنتاج</th>
                  <th className="p-4 text-center font-black">إجمالي مدفوع</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
               {proReportData.map((d: any) => (
                 <tr key={d.empName} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4">
                       <p className="font-black text-slate-950 dark:text-white">{d.empName}</p>
                       <p className="text-[10px] font-bold text-slate-500 uppercase">{d.dept}</p>
                    </td>
                    <td className="p-4 text-center font-bold">{d.presentDays}</td>
                    <td className="p-4 text-center font-bold text-rose-600">{(d.totalLate / 60).toFixed(1)}</td>
                    <td className="p-4 text-center font-bold text-emerald-600">{(d.totalOT / 60).toFixed(1)}</td>
                    <td className="p-4 text-center font-bold text-emerald-600">+{d.bonuses.toLocaleString()}</td>
                    <td className="p-4 text-center font-bold text-rose-600">-{d.deductions.toLocaleString()}</td>
                    <td className="p-4 text-center font-bold text-indigo-600">{d.production.toLocaleString()}</td>
                    <td className="p-4 text-center font-black bg-indigo-50 dark:bg-indigo-900/10 text-indigo-700 dark:text-indigo-400">{d.netPaid.toLocaleString()} {db.settings.currency}</td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 4. Department Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {departments.map(dept => {
          const stats = getDeptStats(dept);
          return (
            <div key={dept} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-800 shadow-lg hover:border-indigo-500 transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                  <Users size={24} />
                </div>
              </div>
              <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-white">{dept || 'بدون قسم'}</h3>
              <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">الموظفين:</span>
                  <span className="font-black text-slate-950 dark:text-white">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500">الكتلة المالية:</span>
                  <span className="font-black text-indigo-700 dark:text-indigo-400">{stats.total.toLocaleString()} {db.settings.currency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ReportsView;
