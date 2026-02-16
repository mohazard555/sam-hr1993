
import React, { useState, useMemo } from 'react';
import { Employee, PayrollRecord, LeaveRequest, AttendanceRecord, FinancialEntry } from '../types';
import { DB } from '../db/store';
import { Printer, TrendingUp, Users, Wallet, Filter, Calendar as CalendarIcon, User as UserIcon, FileDown, Search, ArrowRightLeft, ChartBar, ArrowUpRight, ArrowDownRight, Minus, Scale } from 'lucide-react';
import { exportToExcel } from '../utils/export';

interface Props {
  db: DB;
  payrolls: PayrollRecord[];
  lang: 'ar' | 'en';
  onPrint: () => void;
}

const ReportsView: React.FC<Props> = ({ db, payrolls, lang, onPrint }) => {
  const isRtl = lang === 'ar';
  const [reportType, setReportType] = useState<'standard' | 'comparative'>('standard');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [startDate, setStartDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);

  // Comparison states
  const [compMonth1, setCompMonth1] = useState(new Date().getMonth() + 1);
  const [compYear1, setCompYear1] = useState(new Date().getFullYear());
  const [compMonth2, setCompMonth2] = useState(new Date().getMonth());
  const [compYear2, setCompYear2] = useState(new Date().getFullYear());

  const proReportData = useMemo(() => {
    return db.employees.map(emp => {
      if (selectedEmpId && emp.id !== selectedEmpId) return null;
      const filterByDate = (dateStr: string) => {
        const d = new Date(dateStr);
        const start = new Date(startDate);
        const end = new Date(endDate);
        return d >= start && d <= end;
      };

      const att = db.attendance.filter(a => a.employeeId === emp.id && filterByDate(a.date));
      const payHist = (db.payrollHistory || []).filter(p => p.employeeId === emp.id && filterByDate(`${p.year}-${String(p.month).padStart(2, '0')}-01`));
      const currentPay = payrolls.find(p => p.employeeId === emp.id);

      return {
        empName: emp.name,
        dept: emp.department,
        base: emp.baseSalary,
        trans: emp.transportAllowance,
        presentDays: att.filter(a => a.status === 'present').length,
        totalLate: att.reduce((acc, a) => acc + a.lateMinutes, 0),
        totalOT: att.reduce((acc, a) => acc + a.overtimeMinutes, 0),
        bonuses: currentPay?.bonuses || 0,
        deductions: currentPay?.deductions || 0,
        loans: currentPay?.loanInstallment || 0,
        netPaid: payHist.reduce((acc, p) => acc + p.netSalary, 0) + (currentPay?.netSalary || 0)
      };
    }).filter(Boolean);
  }, [selectedEmpId, startDate, endDate, db, payrolls]);

  const comparativeData = useMemo(() => {
    const getPeriodStats = (m: number, y: number) => {
      // ندمج الأرشيف مع البيانات الحالية إذا كانت هي المختارة في المقارنة
      const histRecords = (db.payrollHistory || []).filter(p => p.month === m && p.year === y);
      
      // إذا كان الشهر المختار هو الشهر الحالي في المسير المفتوح، نستخدم بيانات الرواتب الحالية
      const isCurrentMonth = payrolls.length > 0 && payrolls[0].month === m && payrolls[0].year === y;
      const targetRecords = isCurrentMonth ? payrolls : histRecords;

      return {
        empCount: targetRecords.length,
        totalBase: targetRecords.reduce((s, r) => s + r.baseSalary, 0),
        totalNet: targetRecords.reduce((s, r) => s + r.netSalary, 0),
        totalOT: targetRecords.reduce((s, r) => s + r.overtimePay, 0),
        totalBonuses: targetRecords.reduce((s, r) => s + r.bonuses, 0),
        totalProduction: targetRecords.reduce((s, r) => s + r.production, 0),
        totalDeductions: targetRecords.reduce((s, r) => s + r.deductions, 0),
        totalLoans: targetRecords.reduce((s, r) => s + r.loanInstallment, 0),
      };
    };

    const p1 = getPeriodStats(compMonth1, compYear1);
    const p2 = getPeriodStats(compMonth2, compYear2);

    return { p1, p2 };
  }, [db.payrollHistory, payrolls, compMonth1, compYear1, compMonth2, compYear2]);

  const renderVariance = (val1: number, val2: number, inverse = false) => {
    if (val1 === val2) return <span className="text-slate-400 flex items-center gap-1"><Minus size={12}/> 0%</span>;
    const diff = val2 - val1;
    const percent = val1 === 0 ? 100 : Math.round((diff / val1) * 100);
    const isIncrease = diff > 0;
    
    // inverse تعني أن الزيادة في هذا الحقل سيئة (مثل الخصومات)
    const color = isIncrease 
      ? (inverse ? 'text-rose-600' : 'text-emerald-600') 
      : (inverse ? 'text-emerald-600' : 'text-rose-600');

    return (
      <span className={`text-[10px] font-black flex items-center gap-1 ${color}`}>
        {isIncrease ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
        {Math.abs(percent)}%
      </span>
    );
  };

  return (
    <div className="space-y-8">
      {/* Tab Switcher */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-3xl w-fit mx-auto no-print">
         <button onClick={() => setReportType('standard')} className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${reportType === 'standard' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}><ChartBar size={18}/> التقارير العامة</button>
         <button onClick={() => setReportType('comparative')} className={`px-8 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${reportType === 'comparative' ? 'bg-white shadow text-indigo-700' : 'text-slate-500'}`}><ArrowRightLeft size={18}/> مقارنة الفترات</button>
      </div>

      {reportType === 'standard' ? (
        <>
          <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl gap-6">
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="flex items-center gap-4">
                  {db.settings.logo && <img src={db.settings.logo} className="h-10 w-auto object-contain" />}
                  <div><h2 className="text-2xl font-black text-indigo-700">التحليلات النوعية</h2><p className="text-xs font-bold text-slate-500">نظرة شاملة على الأداء المالي</p></div>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border">
                  <div className="flex items-center gap-1 px-3">
                     <span className="text-[10px] font-black text-slate-400">من:</span>
                     <input type="date" className="bg-transparent text-xs font-bold outline-none" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="w-px h-6 bg-slate-200"></div>
                  <div className="flex items-center gap-1 px-3">
                     <span className="text-[10px] font-black text-slate-400">إلى:</span>
                     <input type="date" className="bg-transparent text-xs font-bold outline-none" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => exportToExcel(proReportData, "SAM_Quality_Report")} className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition"><FileDown size={18} /> Excel</button>
              <button onClick={onPrint} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg"><Printer size={18} /> طباعة</button>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden">
             <div className="overflow-x-auto">
               <table className="w-full text-right text-[10px] font-bold">
                 <thead className="bg-indigo-950 text-white font-black uppercase">
                    <tr>
                      <th className="p-4 text-right">الموظف / القسم</th>
                      <th className="text-center p-4">الأساسي</th>
                      <th className="text-center p-4">المواصلات</th>
                      <th className="text-center p-4">أيام الحضور</th>
                      <th className="text-center p-4">تأخير (س)</th>
                      <th className="text-center p-4">إضافي (س)</th>
                      <th className="text-center p-4">الاستقطاعات</th>
                      <th className="text-center p-4">أقساط السلف</th>
                      <th className="text-center p-4">صافي المدفوع</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {proReportData.map((d: any) => (
                      <tr key={d.empName} className="hover:bg-slate-50 transition-all">
                         <td className="p-4"><p className="font-black text-slate-900 dark:text-white">{d.empName}</p><p className="text-[9px] text-slate-400">{d.dept}</p></td>
                         <td className="p-4 text-center">{d.base.toLocaleString()}</td>
                         <td className="p-4 text-center">{d.trans.toLocaleString()}</td>
                         <td className="p-4 text-center font-black">{d.presentDays} ي</td>
                         <td className="p-4 text-center text-rose-600">{(d.totalLate / 60).toFixed(1)}</td>
                         <td className="p-4 text-center text-emerald-600">{(d.totalOT / 60).toFixed(1)}</td>
                         <td className="p-4 text-center text-rose-500">{(d.deductions).toLocaleString()}</td>
                         <td className="p-4 text-center text-rose-600 font-black">{(d.loans).toLocaleString()}</td>
                         <td className="p-4 text-center font-black bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-700">{d.netPaid.toLocaleString()}</td>
                      </tr>
                    ))}
                    {proReportData.length === 0 && (
                      <tr><td colSpan={9} className="p-20 text-center text-slate-400 italic">لا توجد بيانات للفترة المحددة</td></tr>
                    )}
                 </tbody>
               </table>
             </div>
          </section>
        </>
      ) : (
        <div className="space-y-8 animate-in fade-in slide-in-from-top-4 no-print pb-10">
           <div className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-xl border grid grid-cols-2 md:grid-cols-4 gap-6 text-right">
              <div className="col-span-2">
                 <label className="text-xs font-black text-indigo-700 mb-2 block uppercase flex items-center gap-2">
                   <div className="w-2 h-2 bg-indigo-600 rounded-full"></div> الفترة الأولى (الأساس)
                 </label>
                 <div className="flex gap-2">
                    <select className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black outline-none" value={compMonth1} onChange={e => setCompMonth1(Number(e.target.value))}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>شهر {i+1}</option>)}</select>
                    <input type="number" className="w-32 p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black outline-none" value={compYear1} onChange={e => setCompYear1(Number(e.target.value))} />
                 </div>
              </div>
              <div className="col-span-2">
                 <label className="text-xs font-black text-rose-700 mb-2 block uppercase flex items-center gap-2">
                    <div className="w-2 h-2 bg-rose-600 rounded-full"></div> الفترة الثانية (للمقارنة)
                 </label>
                 <div className="flex gap-2">
                    <select className="flex-1 p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black outline-none" value={compMonth2} onChange={e => setCompMonth2(Number(e.target.value))}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>شهر {i+1}</option>)}</select>
                    <input type="number" className="w-32 p-4 bg-slate-50 dark:bg-slate-800 border rounded-2xl font-black outline-none" value={compYear2} onChange={e => setCompYear2(Number(e.target.value))} />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* بطاقة الفترة 1 */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border border-indigo-100 dark:border-indigo-900 relative">
                 <div className="absolute -top-4 -right-4 bg-indigo-600 text-white px-6 py-2 rounded-full font-black text-xs shadow-lg">الفترة الأساسية</div>
                 <h4 className="text-2xl font-black mb-8 flex items-center gap-3 text-indigo-700">
                    <CalendarIcon size={28}/> {compMonth1} / {compYear1}
                 </h4>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                       <span className="font-black text-slate-500">عدد الموظفين المشاركين:</span>
                       <span className="font-black text-xl text-slate-900 dark:text-white">{comparativeData.p1.empCount}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100">
                          <p className="text-[10px] font-black text-indigo-400 mb-1 uppercase">إجمالي الاستحقاق</p>
                          <p className="text-lg font-black text-indigo-700">{comparativeData.p1.totalNet.toLocaleString()}</p>
                       </div>
                       <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100">
                          <p className="text-[10px] font-black text-emerald-400 mb-1 uppercase">إجمالي الإضافي</p>
                          <p className="text-lg font-black text-emerald-700">{comparativeData.p1.totalOT.toLocaleString()}</p>
                       </div>
                       <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100">
                          <p className="text-[10px] font-black text-rose-400 mb-1 uppercase">إجمالي الخصومات</p>
                          <p className="text-lg font-black text-rose-700">{comparativeData.p1.totalDeductions.toLocaleString()}</p>
                       </div>
                       <div className="p-4 bg-slate-50/50 dark:bg-slate-800 rounded-2xl border border-slate-100">
                          <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">أقساط السلف</p>
                          <p className="text-lg font-black text-slate-700">{comparativeData.p1.totalLoans.toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* بطاقة الفترة 2 مع الفوارق */}
              <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-2xl border border-rose-100 dark:border-rose-900 relative">
                 <div className="absolute -top-4 -right-4 bg-rose-600 text-white px-6 py-2 rounded-full font-black text-xs shadow-lg">مقارنة التغير</div>
                 <h4 className="text-2xl font-black mb-8 flex items-center gap-3 text-rose-700">
                    <CalendarIcon size={28}/> {compMonth2} / {compYear2}
                 </h4>

                 <div className="space-y-4">
                    <div className="flex justify-between items-center p-5 bg-slate-50 dark:bg-slate-800 rounded-3xl">
                       <span className="font-black text-slate-500">عدد الموظفين: {comparativeData.p2.empCount}</span>
                       {renderVariance(comparativeData.p1.empCount, comparativeData.p2.empCount)}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                       <div className="p-4 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-2xl border border-indigo-100 flex flex-col">
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-black text-indigo-400 mb-1 uppercase">صافي الرواتب</p>
                             {renderVariance(comparativeData.p1.totalNet, comparativeData.p2.totalNet)}
                          </div>
                          <p className="text-lg font-black text-indigo-700">{comparativeData.p2.totalNet.toLocaleString()}</p>
                       </div>

                       <div className="p-4 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 flex flex-col">
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-black text-emerald-400 mb-1 uppercase">الإضافي المنصرف</p>
                             {renderVariance(comparativeData.p1.totalOT, comparativeData.p2.totalOT)}
                          </div>
                          <p className="text-lg font-black text-emerald-700">{comparativeData.p2.totalOT.toLocaleString()}</p>
                       </div>

                       <div className="p-4 bg-rose-50/50 dark:bg-rose-900/10 rounded-2xl border border-rose-100 flex flex-col">
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-black text-rose-400 mb-1 uppercase">إجمالي الخصومات</p>
                             {renderVariance(comparativeData.p1.totalDeductions, comparativeData.p2.totalDeductions, true)}
                          </div>
                          <p className="text-lg font-black text-rose-700">{comparativeData.p2.totalDeductions.toLocaleString()}</p>
                       </div>

                       <div className="p-4 bg-slate-50/50 dark:bg-slate-800 rounded-2xl border border-slate-100 flex flex-col">
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-black text-slate-400 mb-1 uppercase">أقساط السلف</p>
                             {renderVariance(comparativeData.p1.totalLoans, comparativeData.p2.totalLoans, true)}
                          </div>
                          <p className="text-lg font-black text-slate-700">{comparativeData.p2.totalLoans.toLocaleString()}</p>
                       </div>
                    </div>

                    {/* تحليل نهائي */}
                    <div className="mt-6 p-6 bg-slate-900 text-white rounded-3xl flex items-center justify-between">
                       <div className="flex items-center gap-4">
                          <div className="p-3 bg-indigo-600 rounded-2xl">
                             <Scale size={24}/>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">فارق التكلفة التشغيلية</p>
                             <p className="text-xl font-black">
                                {Math.abs(comparativeData.p2.totalNet - comparativeData.p1.totalNet).toLocaleString()}
                                <span className="text-xs mr-2 opacity-50">{db.settings.currency}</span>
                             </p>
                          </div>
                       </div>
                       <div className="text-left">
                          {comparativeData.p2.totalNet > comparativeData.p1.totalNet ? (
                             <span className="text-xs font-black text-rose-400 bg-rose-400/10 px-4 py-2 rounded-full border border-rose-400/20 flex items-center gap-2">
                                <ArrowUpRight size={16}/> زيادة تكاليف
                             </span>
                          ) : (
                             <span className="text-xs font-black text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-full border border-emerald-400/20 flex items-center gap-2">
                                <ArrowDownRight size={16}/> انخفاض تكاليف
                             </span>
                          )}
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReportsView;
