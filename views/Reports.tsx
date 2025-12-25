
import React from 'react';
import { Employee, PayrollRecord } from '../types';
// DB is exported from store, not types
import { DB } from '../db/store';
import { Printer, TrendingUp, Users, Wallet } from 'lucide-react';

interface Props {
  db: DB;
  payrolls: PayrollRecord[];
  lang: 'ar' | 'en';
}

const ReportsView: React.FC<Props> = ({ db, payrolls, lang }) => {
  const isRtl = lang === 'ar';
  // Explicitly type as string[] to avoid unknown type inference
  const departments: string[] = Array.from(new Set(db.employees.map(e => e.department)));

  const getDeptStats = (dept: string) => {
    const emps = db.employees.filter(e => e.department === dept);
    const deptPayrolls = payrolls.filter(p => emps.some(e => e.id === p.employeeId));
    const totalSalaries = deptPayrolls.reduce((sum, p) => sum + p.netSalary, 0);
    return { count: emps.length, total: totalSalaries };
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center no-print bg-white dark:bg-slate-900 p-6 rounded-3xl border dark:border-slate-800 shadow-sm">
        <h2 className="text-2xl font-black text-indigo-600">تقارير الأقسام والتحليل المالي</h2>
        <button onClick={() => window.print()} className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100">
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
                  <TrendingUp size={24} />
                </div>
                <span className="text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1 rounded-full font-black">نشط</span>
              </div>
              <h3 className="text-xl font-black mb-2 text-slate-800 dark:text-slate-100">{dept || 'بدون قسم'}</h3>
              <div className="space-y-3 pt-4 border-t dark:border-slate-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Users size={16}/> الموظفين:</span>
                  <span className="font-black text-slate-800 dark:text-slate-100">{stats.count}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-slate-500 flex items-center gap-2"><Wallet size={16}/> إجمالي الرواتب:</span>
                  <span className="font-black text-indigo-600">{stats.total.toLocaleString()} {db.settings.currency}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Table for Print */}
      <div className="print-only mt-10">
         <h1 className="text-3xl font-black text-center mb-10 text-indigo-700 underline underline-offset-8">تقرير الأقسام التفصيلي - SAM</h1>
         <table className="w-full text-center border-collapse">
            <thead className="bg-indigo-600 text-white">
               <tr>
                  <th className="p-4 border">اسم القسم</th>
                  <th className="p-4 border">عدد الموظفين</th>
                  <th className="p-4 border">كتلة الرواتب</th>
                  <th className="p-4 border">متوسط الراتب</th>
               </tr>
            </thead>
            <tbody>
               {departments.map(dept => {
                 const stats = getDeptStats(dept);
                 return (
                   <tr key={dept} className="border-b odd:bg-slate-50">
                      <td className="p-4 font-black">{dept}</td>
                      <td className="p-4">{stats.count}</td>
                      <td className="p-4 font-bold text-indigo-700">{stats.total.toLocaleString()}</td>
                      <td className="p-4">{(stats.total / (stats.count || 1)).toLocaleString()}</td>
                   </tr>
                 );
               })}
            </tbody>
         </table>
      </div>
    </div>
  );
};

export default ReportsView;
