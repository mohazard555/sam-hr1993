
import { AttendanceRecord, CompanySettings, Employee, Loan, FinancialEntry, PayrollRecord, ProductionEntry } from '../types';

export const calculateTimeDiffMinutes = (time1: string, time2: string): number => {
  if (!time1 || !time2) return 0;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) - (h2 * 60 + m2);
};

// دالة لحساب عدد أيام العمل المحتملة في الشهر (باستثناء الجمعة إذا كانت عطلة)
const getPotentialWorkDays = (month: number, year: number, fridayIsWorkDay: boolean): number => {
  const lastDay = new Date(year, month, 0).getDate();
  let count = 0;
  for (let d = 1; d <= lastDay; d++) {
    const dayOfWeek = new Date(year, month - 1, d).getDay(); // 5 is Friday
    if (dayOfWeek !== 5 || fridayIsWorkDay) {
      count++;
    }
  }
  return count;
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
  const potentialWorkDays = getPotentialWorkDays(month, year, settings.fridayIsWorkDay);
  const daysInCycle = settings.salaryCycle === 'weekly' ? 7 : 30;

  return employees.map(emp => {
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

    const totalBonuses = empFinancials.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
    const totalProductionValue = empProduction.reduce((acc, p) => acc + p.totalValue, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction').reduce((acc, f) => acc + f.amount, 0);

    const totalWorkingMinutes = empAttendance.reduce((acc, r) => {
      const duration = calculateTimeDiffMinutes(r.checkOut, r.checkIn);
      return acc + (duration > 0 ? duration : 0);
    }, 0);

    // حساب سعر اليوم والساعة بناءً على إعدادات الشركة
    const dailyRate = emp.baseSalary / daysInCycle;
    const hourlyRate = dailyRate / 8;
    
    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;

    // الحضور والغياب
    const workingDays = empAttendance.filter(a => a.status === 'present').length;
    // إذا كان الموظف حضر أياماً أكثر من أيام العمل المحتملة (عمل في العطل)، لا يخصم منه
    const absenceDays = Math.max(0, potentialWorkDays - workingDays);
    const absenceDeduction = absenceDays * dailyRate;

    // التأخير
    const totalLateMinutes = empAttendance.reduce((acc, record) => {
      const lateMins = Math.max(0, calculateTimeDiffMinutes(record.checkIn, shiftIn));
      const effectiveLate = lateMins > settings.gracePeriodMinutes ? lateMins : 0;
      return acc + effectiveLate;
    }, 0);
    const lateDeductionValue = (totalLateMinutes / 60) * (emp.customDeductionRate || settings.deductionPerLateMinute || 1) * hourlyRate;

    // انصراف مبكر
    const totalEarlyDepartureMinutes = empAttendance.reduce((acc, record) => {
      const earlyMins = Math.max(0, calculateTimeDiffMinutes(shiftOut, record.checkOut));
      return acc + earlyMins;
    }, 0);
    const earlyDepartureDeductionValue = (totalEarlyDepartureMinutes / 60) * hourlyRate;

    // إضافي
    const overtimeRateMultiplier = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const totalOvertimeMinutes = empAttendance.reduce((acc, r) => {
      const otMins = Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut));
      return acc + otMins;
    }, 0);
    const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate * overtimeRateMultiplier;

    const totalDeductions = manualDeductions + lateDeductionValue + earlyDepartureDeductionValue + loanInstallment + absenceDeduction;
    const netSalary = emp.baseSalary + emp.transportAllowance + totalBonuses + totalProductionValue + overtimePay - totalDeductions;

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
