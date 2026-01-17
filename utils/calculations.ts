
import { AttendanceRecord, CompanySettings, Employee, Loan, FinancialEntry, PayrollRecord, ProductionEntry } from '../types';

export const calculateTimeDiffMinutes = (time1: string, time2: string): number => {
  if (!time1 || !time2) return 0;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) - (h2 * 60 + m2);
};

export const generateMonthlyPayroll = (
  month: number, 
  year: number, 
  employees: Employee[], 
  attendance: AttendanceRecord[], 
  loans: Loan[], 
  financials: FinancialEntry[],
  production: ProductionEntry[],
  settings: CompanySettings
): PayrollRecord[] => {
  const isWeekly = settings.salaryCycle === 'weekly';

  return employees.map(emp => {
    // 1. تحديد عدد الأيام المطلوبة في الدورة الواحدة (المستهدف)
    // نستخدم الرقم المحدد في بطاقة الموظف أو القيمة الافتراضية من الإعدادات
    const targetWorkDays = emp.workDaysPerCycle || (isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26));

    const empAttendance = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && a.employeeId === emp.id && !a.isArchived;
    });

    // 2. حساب الراتب اليومي بناءً على أيام الدورة (مثلاً الراتب / 6 أيام للأسبوع)
    const dailyRate = emp.baseSalary / targetWorkDays;
    const hourlyRate = dailyRate / 8;

    const workingDays = empAttendance.filter(a => a.status === 'present').length;
    
    // 3. الغياب = (أيام الدورة المطلوبة) - (الحضور الفعلي المسجل في الشهر)
    // إذا حضر الموظف 6 أيام في نظام أسبوعي، يكون الغياب = 6 - 6 = 0
    const absenceDays = Math.max(0, targetWorkDays - workingDays);
    const absenceDeduction = absenceDays * dailyRate;

    // 4. الحسابات المالية الأخرى
    const empFinancials = financials.filter(f => {
      const d = new Date(f.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && f.employeeId === emp.id && !f.isArchived;
    });

    const empProduction = production.filter(p => {
      const d = new Date(p.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && p.employeeId === emp.id && !p.isArchived;
    });

    const empLoan = loans.find(l => l.employeeId === emp.id && l.remainingAmount > 0 && !l.isArchived);
    const loanInstallment = empLoan ? Math.min(empLoan.monthlyInstallment, empLoan.remainingAmount) : 0;

    const totalBonuses = empFinancials.filter(f => f.type === 'bonus' || f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const totalProductionValue = empProduction.reduce((acc, p) => acc + p.totalValue, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction' || f.type === 'payment').reduce((acc, f) => acc + f.amount, 0);

    const totalWorkingMinutes = empAttendance.reduce((acc, r) => {
      const duration = calculateTimeDiffMinutes(r.checkOut, r.checkIn);
      return acc + (duration > 0 ? duration : 0);
    }, 0);

    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;

    const totalLateMinutes = empAttendance.reduce((acc, record) => {
      const lateMins = Math.max(0, calculateTimeDiffMinutes(record.checkIn, shiftIn));
      const effectiveLate = lateMins > settings.gracePeriodMinutes ? lateMins : 0;
      return acc + effectiveLate;
    }, 0);
    const lateDeductionValue = (totalLateMinutes / 60) * (emp.customDeductionRate || settings.deductionPerLateMinute || 1) * hourlyRate;

    const totalEarlyDepartureMinutes = empAttendance.reduce((acc, record) => {
      const earlyMins = Math.max(0, calculateTimeDiffMinutes(shiftOut, record.checkOut));
      return acc + earlyMins;
    }, 0);
    const earlyDepartureDeductionValue = (totalEarlyDepartureMinutes / 60) * hourlyRate;

    const overtimeRateMultiplier = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const totalOvertimeMinutes = empAttendance.reduce((acc, r) => {
      const otMins = Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut));
      return acc + otMins;
    }, 0);
    const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate * overtimeRateMultiplier;

    // الراتب الأساسي هنا هو قيمة الدورة الواحدة المعرفة في بطاقة الموظف
    const monthlyBasePotential = emp.baseSalary;
    
    const totalDeductions = manualDeductions + lateDeductionValue + earlyDepartureDeductionValue + loanInstallment + absenceDeduction;
    const netSalary = monthlyBasePotential + emp.transportAllowance + totalBonuses + totalProductionValue + overtimePay - totalDeductions;

    return {
      id: `${emp.id}-${month}-${year}`,
      employeeId: emp.id,
      month,
      year,
      baseSalary: emp.baseSalary,
      bonuses: totalBonuses,
      transport: emp.transportAllowance,
      production: totalProductionValue,
      overtimePay: Math.round(overtimePay),
      overtimeMinutes: totalOvertimeMinutes,
      loanInstallment: loanInstallment,
      lateDeduction: Math.round(lateDeductionValue),
      earlyDepartureMinutes: totalEarlyDepartureMinutes,
      earlyDepartureDeduction: Math.round(earlyDepartureDeductionValue),
      absenceDays,
      absenceDeduction: Math.round(absenceDeduction),
      manualDeductions: Math.round(manualDeductions),
      deductions: Math.round(totalDeductions),
      lateMinutes: totalLateMinutes,
      workingHours: Number((totalWorkingMinutes / 60).toFixed(1)),
      workingDays,
      netSalary: Math.round(Math.max(0, netSalary)),
      isPaid: false
    };
  });
};
