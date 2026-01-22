
import { AttendanceRecord, CompanySettings, Employee, Loan, FinancialEntry, PayrollRecord, ProductionEntry } from '../types';

export const calculateTimeDiffMinutes = (time1: string, time2: string): number => {
  if (!time1 || !time2) return 0;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) - (h2 * 60 + m2);
};

export const generatePayrollForRange = (
  startDate: string,
  endDate: string,
  employees: Employee[], 
  attendance: AttendanceRecord[], 
  loans: Loan[], 
  financials: FinancialEntry[],
  production: ProductionEntry[],
  settings: CompanySettings
): PayrollRecord[] => {
  const isWeekly = settings.salaryCycle === 'weekly';
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // حساب عدد الأيام في النطاق المحدد
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return employees.map(emp => {
    // عدد الأيام المستهدفة بناءً على إعدادات الموظف أو الشركة
    const cycleDays = emp.workDaysPerCycle || (isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26));
    const workingHoursPerDay = emp.workingHoursPerDay || 8;
    
    // الراتب اليومي والساعة
    const dailyRate = emp.baseSalary / cycleDays;
    const hourlyRate = dailyRate / workingHoursPerDay;

    // تصفية البيانات ضمن النطاق الزمني
    const empAttendance = attendance.filter(a => a.employeeId === emp.id && a.date >= startDate && a.date <= endDate && !a.isArchived);
    const empFinancials = financials.filter(f => f.employeeId === emp.id && f.date >= startDate && f.date <= endDate && !f.isArchived);
    const empProduction = production.filter(p => p.employeeId === emp.id && p.date >= startDate && p.date <= endDate && !p.isArchived);

    const workingDays = empAttendance.filter(a => a.status === 'present').length;
    
    // حساب الغياب (الأيام التي لم يحضر فيها ضمن النطاق)
    const absenceDays = Math.max(0, diffDays - workingDays); 
    const absenceDeduction = absenceDays * dailyRate;

    const totalBonuses = empFinancials.filter(f => f.type === 'bonus' || f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const totalProductionValue = empProduction.reduce((acc, p) => acc + p.totalValue, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction' || f.type === 'payment').reduce((acc, f) => acc + f.amount, 0);

    const empLoan = loans.find(l => l.employeeId === emp.id && l.remainingAmount > 0 && !l.isArchived);
    // القسط يحسب إذا كان النطاق يغطي فترة زمنية كافية (مثلاً أكثر من 20 يوم)
    const loanInstallment = (empLoan && diffDays >= 20) ? Math.min(empLoan.monthlyInstallment, empLoan.remainingAmount) : 0;

    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;

    const totalLateMinutes = empAttendance.reduce((acc, record) => {
      const lateMins = Math.max(0, calculateTimeDiffMinutes(record.checkIn, shiftIn));
      return acc + (lateMins > settings.gracePeriodMinutes ? lateMins : 0);
    }, 0);
    const lateDeductionValue = (totalLateMinutes / 60) * (emp.customDeductionRate || settings.deductionPerLateMinute || 1) * hourlyRate;

    const totalEarlyMins = empAttendance.reduce((acc, record) => Math.max(0, calculateTimeDiffMinutes(shiftOut, record.checkOut)) + acc, 0);
    const earlyDeductionValue = (totalEarlyMins / 60) * hourlyRate;

    const otRate = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const totalOTMins = empAttendance.reduce((acc, r) => Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut)) + acc, 0);
    const overtimePay = (totalOTMins / 60) * hourlyRate * otRate;

    const totalDeductions = manualDeductions + lateDeductionValue + earlyDeductionValue + loanInstallment + (absenceDeduction > 0 ? absenceDeduction : 0);
    
    // صافي الراتب: (الراتب حسب أيام العمل) + البدلات + الحوافز - الخصومات
    const netSalary = (dailyRate * workingDays) + (emp.transportAllowance * (workingDays / cycleDays)) + totalBonuses + totalProductionValue + overtimePay - (manualDeductions + lateDeductionValue + earlyDeductionValue + loanInstallment);

    return {
      id: `${emp.id}-${startDate}-${endDate}`,
      employeeId: emp.id,
      month: start.getMonth() + 1,
      year: start.getFullYear(),
      baseSalary: Math.round(dailyRate * workingDays),
      bonuses: totalBonuses,
      transport: Math.round(emp.transportAllowance * (workingDays / cycleDays)),
      production: totalProductionValue,
      overtimePay: Math.round(overtimePay),
      overtimeMinutes: totalOTMins,
      loanInstallment: loanInstallment,
      lateDeduction: Math.round(lateDeductionValue),
      earlyDepartureMinutes: totalEarlyMins,
      earlyDepartureDeduction: Math.round(earlyDeductionValue),
      absenceDays,
      absenceDeduction: Math.round(absenceDeduction),
      manualDeductions: Math.round(manualDeductions),
      deductions: Math.round(totalDeductions),
      lateMinutes: totalLateMinutes,
      workingHours: Number(((workingDays * workingHoursPerDay)).toFixed(1)),
      workingDays,
      netSalary: Math.round(Math.max(0, netSalary)),
      isPaid: false
    };
  });
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
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return generatePayrollForRange(startDate, endDate, employees, attendance, loans, financials, production, settings);
};
