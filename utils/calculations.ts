
import { AttendanceRecord, CompanySettings, Employee, Loan, FinancialEntry, PayrollRecord, ProductionEntry } from '../types';

export const calculateTimeDiffMinutes = (time1: string, time2: string): number => {
  if (!time1 || !time2) return 0;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) - (h2 * 60 + m2);
};

// دالة لحساب عدد أيام العمل المستهدفة للموظف في الشهر الحالي بناءً على نظامه الخاص
const getEmployeeTargetDaysForMonth = (month: number, year: number, emp: Employee, settings: CompanySettings): number => {
  const isWeekly = settings.salaryCycle === 'weekly';
  const empCycleDays = emp.workDaysPerCycle || (isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26));
  
  if (!isWeekly) return empCycleDays;

  // إذا كان النظام أسبوعياً، نحسب عدد الأسابيع في الشهر ونضربها في أيام عمل الموظف في الأسبوع
  const lastDay = new Date(year, month, 0).getDate();
  const weeksInMonth = lastDay / 7;
  // مثلاً 4.28 أسبوع * 6 أيام عمل = ~26 يوم مستهدف في الشهر
  return Math.round(weeksInMonth * empCycleDays);
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
    // عدد الأيام التي يجب على هذا الموظف تحديداً أن يعملها في هذا الشهر
    const targetWorkDays = getEmployeeTargetDaysForMonth(month, year, emp, settings);
    
    // القسمة لحساب سعر اليوم تعتمد على أيام الدورة (مثلاً 6 أيام) وليس أيام الشهر الكاملة
    const salaryCycleDivisor = emp.workDaysPerCycle || (isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26));

    const empAttendance = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && a.employeeId === emp.id && !a.isArchived;
    });

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

    // سعر اليوم = الراتب / عدد أيام العمل الفعلية في الدورة (بدون العطل)
    const dailyRate = emp.baseSalary / salaryCycleDivisor;
    const hourlyRate = dailyRate / 8;
    
    // الراتب الأساسي المتوقع لكامل الشهر هو الراتب المكتوب في العقد (معادلة للحساب الصافي)
    // لاحظ: إذا كان الموظف يعمل بنظام أسبوعي، نضرب سعر اليوم في عدد أيام الشهر المستهدفة
    const monthlyBasePotential = isWeekly ? (dailyRate * targetWorkDays) : emp.baseSalary;

    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;

    // الحضور والغياب
    const workingDays = empAttendance.filter(a => a.status === 'present').length;
    // الغياب = الأيام المستهدفة لهذا الموظف في الشهر - الأيام التي حضرها فعلياً
    const absenceDays = Math.max(0, targetWorkDays - workingDays);
    const absenceDeduction = absenceDays * dailyRate;

    // التأخير والانصراف المبكر
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

    // الإضافي
    const overtimeRateMultiplier = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const totalOvertimeMinutes = empAttendance.reduce((acc, r) => {
      const otMins = Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut));
      return acc + otMins;
    }, 0);
    const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate * overtimeRateMultiplier;

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
