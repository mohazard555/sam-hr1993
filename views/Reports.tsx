
import React, { useState, useMemo } from 'react';
import { Employee, PayrollRecord, AttendanceRecord, FinancialEntry } from '../types';
import { DB } from '../db/store';
import { Printer, TrendingUp, Users, Wallet, Filter, Calendar as CalendarIcon, FileDown, Search, ArrowRightLeft, ChartBar, ArrowUpRight, ArrowDownRight, Minus, Scale, Calculator } from 'lucide-react';
import { exportToExcel } from '../utils/export';
import { generateMonthlyPayroll } from '../utils/calculations';

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
  const [compMonth1, setCompMonth1] = useState(new Date().getMonth() === 0 ? 12 : new Date().getMonth()); 
  const [compYear1, setCompYear1] = useState(new Date().getMonth() === 0 ? new Date().getFullYear() - 1 : new Date().getFullYear());
  const [compMonth2, setCompMonth2] = useState(new Date().getMonth() + 1);
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
        bonuses: (currentPay?.bonuses || 0),
        deductions: (currentPay?.deductions || 0),
        loans: (currentPay?.loanInstallment || 0),
        netPaid: payHist.reduce((acc, p) => acc + p.netSalary, 0) + (currentPay?.netSalary || 0)
      };
    }).filter(Boolean);
  }, [selectedEmpId, startDate, endDate, db, payrolls]);

  const handleExportStandardExcel = () => {
    const dataToExport = proReportData.map((d: any) => ({
      'اسم الموظف': d.empName,
      'القسم': d.dept,
      'الراتب الأساسي': d.base,
      'المواصلات': d.trans,
      'أيام الحضور': d.presentDays,
      'دقائق التأخير': d.totalLate,
      'الإضافي (ساعات)': (d.totalOT / 60).toFixed(2),
      'المكافآت': d.bonuses,
      'الاستقطاعات': d.deductions,
      'السلف': d.loans,
      'صافي المجموع المستلم': d.netPaid
    }));
    exportToExcel(dataToExport, "SAM_Payroll_Analysis");
  };

  const comparativeData = useMemo(() => {
    const getPeriodStats = (m: number, y: number) => {
      const histRecords = (db.payrollHistory || []).filter(p => Number(p.month) === m && Number(p.year) === y);
      let targetRecords: PayrollRecord[] = [];
      if (histRecords.length > 0) {
        targetRecords = histRecords;
      } else {
        targetRecords = generateMonthlyPayroll(m, y, db.employees, db.attendance, db.loans, db.financials, db.production, db.settings, db.leaves);
      }
      return {
        empCount: targetRecords.length,
        totalBase: targetRecords.reduce((s, r) => s + (Number(r.baseSalary) || 0), 0),
        totalNet: targetRecords.reduce((s, r) => s + (Number(r.netSalary) || 0), 0),
        totalOT: targetRecords.reduce((s, r) => s + (Number(r.overtimePay) || 0), 0),
        totalBonuses: targetRecords.reduce((s, r) => s + (Number(r.bonuses) || 0), 0),
        totalDeductions: targetRecords.reduce((s, r) => s + (Number(r.deductions) || 0), 0),
        totalLoans: targetRecords.reduce((s, r) => s + (Number(r.loanInstallment) || 0), 0),
      };
    };
    const p1 = getPeriodStats(compMonth1, compYear1);
    const p2 = getPeriodStats(compMonth2, compYear2);
    return { p1, p2 };
  }, [db, compMonth1, compYear1, compMonth2, compYear2]);

  const renderVariance = (val1: number, val2: number, inverse = false) => {
    if (val1 === val2) return <span className="text-slate-400 flex items-center gap-1 font-bold text-[10px]"><Minus size={10}/> 0%</span>;
    const diff = val2 - val1;
    const percent = val1 === 0 ? 100 : Math.round((diff / val1) * 100);
    const isIncrease = diff > 0;
    const color = isIncrease ? (inverse ? 'text-rose-600' : 'text-emerald-600') : (inverse ? 'text-emerald-600' : 'text-rose-600');
    return (
      <span className={`text-[11px] font-black flex items-center gap-0.5 ${color}`}>
        {isIncrease ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
        {Math.abs(percent)}%
      </span>
    );
  };

  return (
    <div className="space-y-8 pb-10">
      {/* ترويسة الطباعة الرسمية */}
      <div className="hidden print:block text-right mb-8 pb-6 border-b-4 border-indigo-900">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-black text-slate-900">{db.settings.name}</h1>
            <h2 className="text-xl font-bold text-indigo-700 mt-2">
              {reportType === 'standard' ? `تقرير تحليلات الرواتب (من ${startDate} إلى ${endDate})` : `تقرير مقارنة الفترات المالية (${compMonth1}/${compYear1} vs ${compMonth2}/${compYear2})`}
            </h2>
          </div>
          {db.settings.logo && <img src={db.settings.logo} className="h-16 w-auto object-contain" alt="Logo" />}
        </div>
        <div className="flex justify-between items-center mt-4 text-xs font-bold text-slate-400">
          <p>تاريخ استخراج التقرير: {new Date().toLocaleDateString('ar-EG')}</p>
          <p>العملة: {db.settings.currency}</p>
        </div>
      </div>

      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-[2rem] w-fit mx-auto no-print shadow-inner">
         <button onClick={() => setReportType('standard')} className={`px-10 py-3 rounded-[1.8rem] font-black text-sm flex items-center gap-2 transition-all ${reportType === 'standard' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-700' : 'text-slate-500'}`}><ChartBar size={18}/> التقارير النوعية</button>
         <button onClick={() => setReportType('comparative')} className={`px-10 py-3 rounded-[1.8rem] font-black text-sm flex items-center gap-2 transition-all ${reportType === 'comparative' ? 'bg-white dark:bg-slate-900 shadow-md text-indigo-700' : 'text-slate-500'}`}><ArrowRightLeft size={18}/> مقارنة الفترات</button>
      </div>

      {reportType === 'standard' ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-center no-print bg-white dark:bg-slate-900 p-8 rounded-[3rem] border dark:border-slate-800 shadow-xl gap-6 mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="flex items-center gap-4">
                  <div className="p-4 bg-indigo-600 text-white rounded-2xl shadow-lg">
                    <TrendingUp size={28}/>
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-indigo-700">تحليلات الرواتب</h2>
                    <p className="text-xs font-bold text-slate-500">مراجعة شاملة للبيانات المالية حسب الفترة</p>
                  </div>
               </div>
               <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center gap-1 px-3">
                     <span className="text-[10px] font-black text-slate-400">من:</span>
                     <input type="date" className="bg-transparent text-xs font-bold outline-none border-none focus:ring-0" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  </div>
                  <div className="w-px h-6 bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex items-center gap-1 px-3">
                     <span className="text-[10px] font-black text-slate-400">إلى:</span>
                     <input type="date" className="bg-transparent text-xs font-bold outline-none border-none focus:ring-0" value={endDate} onChange={e => setEndDate(e.target.value)} />
                  </div>
               </div>
            </div>
            <div className="flex gap-2">
              <button onClick={handleExportStandardExcel} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-emerald-700 transition"><FileDown size={20} /> Excel</button>
              <button onClick={onPrint} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-black transition"><Printer size={20} /> طباعة</button>
            </div>
          </div>

          <section className="bg-white dark:bg-slate-900 rounded-[3rem] shadow-2xl border dark:border-slate-800 overflow-hidden print:border-none print:shadow-none">
             <div className="overflow-x-auto print:overflow-visible">
               <table className="w-full text-right text-[11px] font-bold">
                 <thead className="bg-indigo-950 text-white font-black uppercase text-[13px] print:bg-slate-100 print:text-black">
                    <tr>
                      <th className="p-5 text-right">الموظف / القسم</th>
                      <th className="text-center p-5">الأساسي</th>
                      <th className="text-center p-5">المواصلات</th>
                      <th className="text-center p-5">أيام الحضور</th>
                      <th className="text-center p-5">إضافي (س)</th>
                      <th className="text-center p-5">الاستقطاعات</th>
                      <th className="text-center p-5">السلف</th>
                      <th className="text-center p-5 bg-indigo-900 print:bg-slate-200">صافي المجموع</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {proReportData.map((d: any) => (
                      <tr key={d.empName} className="hover:bg-indigo-50/30 transition-all border-b print:border-slate-300">
                         <td className="p-5">
                            <p className="font-black text-[14px] text-slate-900 dark:text-white leading-none">{d.empName}</p>
                            <p className="text-[10px] text-slate-400 mt-1 font-bold">{d.dept}</p>
                         </td>
                         <td className="p-5 text-center text-slate-600">{d.base.toLocaleString()}</td>
                         <td className="p-5 text-center text-indigo-700">{d.trans.toLocaleString()}</td>
                         <td className="p-5 text-center font-black text-slate-800 dark:text-slate-200">{d.presentDays} ي</td>
                         <td className="p-5 text-center text-emerald-600">{(d.totalOT / 60).toFixed(1)}</td>
                         <td className="p-5 text-center text-rose-500">{(d.deductions).toLocaleString()}</td>
                         <td className="p-5 text-center text-rose-600 font-black">{(d.loans).toLocaleString()}</td>
                         <td className="p-5 text-center font-black text-[16px] bg-indigo-50/50 dark:bg-indigo-900/10 text-indigo-900 dark:text-indigo-300 border-r border-indigo-100 print:bg-transparent print:text-black">{d.netPaid.toLocaleString()}</td>
                      </tr>
                    ))}
                 </tbody>
               </table>
             </div>
          </section>
        </div>
      ) : (
        <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700 pb-20">
           {/* منتقي الفترات - مخفي في الطباعة */}
           <div className="bg-white dark:bg-slate-900 p-10 rounded-[3.5rem] shadow-xl border dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-10 text-right no-print">
              <div>
                 <label className="text-xs font-black text-indigo-700 mb-4 block uppercase flex items-center gap-2 tracking-widest">
                   <div className="w-2.5 h-2.5 bg-indigo-600 rounded-full animate-pulse"></div> اختيار الفترة الأساسية
                 </label>
                 <div className="flex gap-3">
                    <select className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black outline-none focus:border-indigo-600 transition shadow-inner text-lg" value={compMonth1} onChange={e => setCompMonth1(Number(e.target.value))}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>شهر {i+1}</option>)}</select>
                    <input type="number" className="w-32 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black outline-none focus:border-indigo-600 transition shadow-inner text-lg text-center" value={compYear1} onChange={e => setCompYear1(Number(e.target.value))} />
                 </div>
              </div>
              <div className="relative">
                 <button onClick={onPrint} className="absolute -top-12 left-0 bg-slate-900 text-white px-8 py-3 rounded-2xl font-black flex items-center gap-2 shadow-lg hover:bg-black transition"><Printer size={20} /> طباعة المقارنة</button>
                 <label className="text-xs font-black text-rose-700 mb-4 block uppercase flex items-center gap-2 tracking-widest">
                    <div className="w-2.5 h-2.5 bg-rose-600 rounded-full animate-pulse"></div> اختيار فترة المقارنة
                 </label>
                 <div className="flex gap-3">
                    <select className="flex-1 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black outline-none focus:border-rose-600 transition shadow-inner text-lg" value={compMonth2} onChange={e => setCompMonth2(Number(e.target.value))}>{[...Array(12)].map((_,i)=><option key={i+1} value={i+1}>شهر {i+1}</option>)}</select>
                    <input type="number" className="w-32 p-5 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-2xl font-black outline-none focus:border-rose-600 transition shadow-inner text-lg text-center" value={compYear2} onChange={e => setCompYear2(Number(e.target.value))} />
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 print:grid-cols-2">
              {/* بطاقة الفترة 1 */}
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border-4 border-slate-50 dark:border-indigo-900/30 relative overflow-hidden group print:border-2 print:p-8 print:rounded-[2rem] print:shadow-none">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform no-print"></div>
                 <div className="absolute top-8 right-10 bg-indigo-600 text-white px-8 py-2 rounded-full font-black text-[10px] shadow-lg tracking-widest uppercase no-print">السجل المرجعي</div>
                 
                 <div className="flex items-center gap-5 mb-12 print:mb-6">
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-900/40 rounded-3xl text-indigo-700 shadow-inner no-print">
                       <CalendarIcon size={32}/>
                    </div>
                    <div>
                       <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-none print:text-xl font-black">فترة {compMonth1} / {compYear1}</h4>
                       <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">البيانات المالية المسجلة</p>
                    </div>
                 </div>
                 
                 <div className="space-y-6 print:space-y-3">
                    <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 group-hover:bg-indigo-50/30 transition-colors print:p-3 print:rounded-xl">
                       <div className="flex items-center gap-3">
                          <Users className="text-indigo-600 no-print" size={24}/>
                          <span className="font-black text-slate-600 dark:text-slate-400 text-lg uppercase print:text-sm">عدد الموظفين</span>
                       </div>
                       <span className="font-black text-3xl text-slate-900 dark:text-white tracking-tighter print:text-lg">{comparativeData.p1.empCount} <span className="text-xs opacity-50">عضو</span></span>
                    </div>

                    <div className="grid grid-cols-2 gap-6 print:gap-3">
                       <div className="p-8 bg-indigo-600 text-white rounded-[3rem] shadow-xl shadow-indigo-600/20 flex flex-col items-center text-center relative overflow-hidden print:p-4 print:rounded-2xl">
                          <Wallet className="absolute -bottom-4 -right-4 opacity-10 no-print" size={100}/>
                          <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">إجمالي الميزانية (الصافي)</p>
                          <p className="text-2xl font-black leading-none print:text-lg">{comparativeData.p1.totalNet.toLocaleString()}</p>
                          <p className="text-[10px] font-bold mt-2 opacity-50">{db.settings.currency}</p>
                       </div>
                       
                       <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-xl flex flex-col items-center text-center relative overflow-hidden print:p-4 print:rounded-2xl">
                          <Calculator className="absolute -bottom-4 -right-4 opacity-10 no-print" size={100}/>
                          <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">إجمالي الرواتب الأساسية</p>
                          <p className="text-2xl font-black leading-none print:text-lg">{comparativeData.p1.totalBase.toLocaleString()}</p>
                       </div>

                       <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 text-center print:p-2 print:rounded-xl">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">العمل الإضافي</p>
                          <p className="text-lg font-black text-emerald-700 print:text-sm">{comparativeData.p1.totalOT.toLocaleString()}</p>
                       </div>

                       <div className="p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/40 text-center print:p-2 print:rounded-xl">
                          <p className="text-[9px] font-black text-rose-600 uppercase mb-1">إجمالي الخصومات</p>
                          <p className="text-lg font-black text-rose-700 print:text-sm">{(comparativeData.p1.totalDeductions + comparativeData.p1.totalLoans).toLocaleString()}</p>
                       </div>
                    </div>
                 </div>
              </div>

              {/* بطاقة الفترة 2 مع الفوارق */}
              <div className="bg-white dark:bg-slate-900 p-12 rounded-[4rem] shadow-2xl border-4 border-rose-50 dark:border-rose-900/30 relative overflow-hidden group print:border-2 print:p-8 print:rounded-[2rem] print:shadow-none">
                 <div className="absolute top-0 left-0 w-32 h-32 bg-rose-600/5 rounded-full -ml-16 -mt-16 group-hover:scale-150 transition-transform no-print"></div>
                 <div className="absolute top-8 right-10 bg-rose-600 text-white px-8 py-2 rounded-full font-black text-[10px] shadow-lg tracking-widest uppercase no-print">تحليل التغير</div>
                 
                 <div className="flex items-center gap-5 mb-12 print:mb-6">
                    <div className="p-5 bg-rose-50 dark:bg-rose-900/40 rounded-3xl text-rose-700 shadow-inner no-print">
                       <CalendarIcon size={32}/>
                    </div>
                    <div>
                       <h4 className="text-3xl font-black text-slate-900 dark:text-white leading-none print:text-xl">فترة {compMonth2} / {compYear2}</h4>
                       <p className="text-xs font-bold text-slate-400 mt-2 uppercase tracking-wide">النتائج المالية المقارنة</p>
                    </div>
                 </div>

                 <div className="space-y-6 print:space-y-3">
                    <div className="flex justify-between items-center p-6 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] border-2 border-slate-100 dark:border-slate-700 group-hover:bg-rose-50/30 transition-colors print:p-3 print:rounded-xl">
                       <div className="flex items-center gap-3">
                          <Users className="text-rose-600 no-print" size={24}/>
                          <span className="font-black text-slate-600 dark:text-slate-400 text-lg uppercase print:text-sm">عدد الموظفين</span>
                       </div>
                       <div className="flex items-center gap-3">
                          {renderVariance(comparativeData.p1.empCount, comparativeData.p2.empCount)}
                          <span className="font-black text-3xl text-slate-900 dark:text-white tracking-tighter print:text-lg">{comparativeData.p2.empCount} <span className="text-xs opacity-50">عضو</span></span>
                       </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6 print:gap-3">
                       <div className="p-8 bg-rose-600 text-white rounded-[3rem] shadow-xl shadow-rose-600/20 flex flex-col items-center text-center relative overflow-hidden print:p-4 print:rounded-2xl">
                          <Wallet className="absolute -bottom-4 -right-4 opacity-10 no-print" size={100}/>
                          <div className="absolute top-3 right-5">{renderVariance(comparativeData.p1.totalNet, comparativeData.p2.totalNet, true)}</div>
                          <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">إجمالي الميزانية (الصافي)</p>
                          <p className="text-2xl font-black leading-none print:text-lg">{comparativeData.p2.totalNet.toLocaleString()}</p>
                          <p className="text-[10px] font-bold mt-2 opacity-50">{db.settings.currency}</p>
                       </div>
                       
                       <div className="p-8 bg-slate-900 text-white rounded-[3rem] shadow-xl flex flex-col items-center text-center relative overflow-hidden print:p-4 print:rounded-2xl">
                          <Calculator className="absolute -bottom-4 -right-4 opacity-10 no-print" size={100}/>
                          <div className="absolute top-3 right-5">{renderVariance(comparativeData.p1.totalBase, comparativeData.p2.totalBase)}</div>
                          <p className="text-[10px] font-black uppercase opacity-60 mb-2 tracking-widest">إجمالي الأساسي</p>
                          <p className="text-2xl font-black leading-none print:text-lg">{comparativeData.p2.totalBase.toLocaleString()}</p>
                       </div>

                       <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100 dark:border-emerald-900/40 text-center relative print:p-2 print:rounded-xl">
                          <div className="absolute top-1 right-2">{renderVariance(comparativeData.p1.totalOT, comparativeData.p2.totalOT)}</div>
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">العمل الإضافي</p>
                          <p className="text-lg font-black text-emerald-700 print:text-sm">{comparativeData.p2.totalOT.toLocaleString()}</p>
                       </div>

                       <div className="p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100 dark:border-rose-900/40 text-center relative print:p-2 print:rounded-xl">
                          <div className="absolute top-1 right-2">{renderVariance((comparativeData.p1.totalDeductions + comparativeData.p1.totalLoans), (comparativeData.p2.totalDeductions + comparativeData.p2.totalLoans), true)}</div>
                          <p className="text-[9px] font-black text-rose-600 uppercase mb-1">إجمالي الخصومات</p>
                          <p className="text-lg font-black text-rose-700 print:text-sm">{(comparativeData.p2.totalDeductions + comparativeData.p2.totalLoans).toLocaleString()}</p>
                       </div>
                    </div>

                    <div className="mt-8 p-8 bg-slate-950 text-white rounded-[3rem] flex items-center justify-between border-2 border-slate-800 shadow-2xl relative group print:p-4 print:rounded-2xl print:bg-slate-100 print:text-black print:border-slate-300">
                       <div className="flex items-center gap-5">
                          <div className={`p-4 rounded-2xl ${comparativeData.p2.totalNet > comparativeData.p1.totalNet ? 'bg-rose-600/20 text-rose-500' : 'bg-emerald-600/20 text-emerald-500'} transition-all group-hover:scale-110 shadow-lg no-print`}>
                             <Scale size={32}/>
                          </div>
                          <div>
                             <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">فارق الميزانية الكلي</p>
                             <p className="text-3xl font-black tracking-tighter print:text-xl">
                                {Math.abs(comparativeData.p2.totalNet - comparativeData.p1.totalNet).toLocaleString()}
                                <span className="text-[10px] mr-2 opacity-40 font-bold">{db.settings.currency}</span>
                             </p>
                          </div>
                       </div>
                       <div className="text-left">
                          {comparativeData.p2.totalNet > comparativeData.p1.totalNet ? (
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-rose-500 bg-rose-500/10 px-6 py-2 rounded-full border border-rose-500/30 flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-rose-900/20 print:bg-transparent print:border-rose-600">
                                   زيادة تكاليف <ArrowUpRight size={16}/>
                                </span>
                             </div>
                          ) : (
                             <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-6 py-2 rounded-full border border-emerald-500/30 flex items-center gap-2 uppercase tracking-widest shadow-lg shadow-emerald-900/20 print:bg-transparent print:border-emerald-600">
                                   وفر مالي <ArrowDownRight size={16}/>
                                </span>
                             </div>
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
