
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
  
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return employees.map(emp => {
    const cycleDays = emp.workDaysPerCycle || (isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26));
    const workingHoursPerDay = emp.workingHoursPerDay || 8;
    
    const dailyRate = emp.baseSalary / cycleDays;
    const hourlyRate = dailyRate / workingHoursPerDay;

    const empAttendance = attendance.filter(a => a.employeeId === emp.id && a.date >= startDate && a.date <= endDate && !a.isArchived);
    const empFinancials = financials.filter(f => f.employeeId === emp.id && f.date >= startDate && f.date <= endDate && !f.isArchived);
    const empProduction = production.filter(p => p.employeeId === emp.id && p.date >= startDate && p.date <= endDate && !p.isArchived);

    const workingDays = empAttendance.filter(a => a.status === 'present').length;
    
    const absenceDays = Math.max(0, diffDays - workingDays); 
    const absenceDeduction = Math.round(absenceDays * dailyRate);

    const dailyTransportRate = emp.transportAllowance / cycleDays;
    const transportEarned = emp.isTransportExempt 
      ? emp.transportAllowance 
      : Math.max(0, emp.transportAllowance - (absenceDays * dailyTransportRate));

    const bonuses = empFinancials.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
    const productionIncentives = empFinancials.filter(f => f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const totalProductionValue = empProduction.reduce((acc, p) => acc + p.totalValue, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction' || f.type === 'payment').reduce((acc, f) => acc + f.amount, 0);

    // إصلاح منطق السلف: جمع كافة السلف النشطة التي بدأ تاريخ تحصيلها
    const minDaysToDeduct = isWeekly ? 5 : 20; 
    let totalLoanInstallments = 0;
    
    if (diffDays >= minDaysToDeduct) {
      const activeLoans = loans.filter(l => {
        if (l.employeeId !== emp.id || l.remainingAmount <= 0 || l.isArchived) return false;
        // التحقق من أن تاريخ التحصيل قبل أو ضمن تاريخ نهاية الفلتر المختار
        if (l.collectionDate && l.collectionDate > endDate) return false;
        return true;
      });

      totalLoanInstallments = activeLoans.reduce((sum, loan) => {
        return sum + Math.min(loan.monthlyInstallment, loan.remainingAmount);
      }, 0);
    }

    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;

    const gracePeriod = Number(settings.gracePeriodMinutes || 0);
    const totalLateMinutes = empAttendance.reduce((acc, record) => {
      const lateMins = Math.max(0, calculateTimeDiffMinutes(record.checkIn, shiftIn));
      return acc + (lateMins > gracePeriod ? lateMins : 0);
    }, 0);
    
    const lateDeductionValue = (totalLateMinutes / 60) * (emp.customDeductionRate || 1) * hourlyRate;

    const totalEarlyMins = empAttendance.reduce((acc, record) => {
      const earlyMins = Math.max(0, calculateTimeDiffMinutes(shiftOut, record.checkOut));
      return acc + earlyMins;
    }, 0);
    const earlyDeductionValue = (totalEarlyMins / 60) * (emp.customDeductionRate || 1) * hourlyRate;

    const otRate = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const totalOTMins = empAttendance.reduce((acc, r) => {
      const otMins = Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut));
      return acc + otMins;
    }, 0);
    const overtimePay = (totalOTMins / 60) * hourlyRate * otRate;

    const totalEarnings = emp.baseSalary + Math.round(transportEarned) + bonuses + productionIncentives + totalProductionValue + overtimePay;
    const totalDeductions = absenceDeduction + manualDeductions + Math.round(lateDeductionValue) + Math.round(earlyDeductionValue) + totalLoanInstallments;
    
    const netSalary = totalEarnings - totalDeductions;

    return {
      id: `${emp.id}-${startDate}-${endDate}`,
      employeeId: emp.id,
      month: start.getMonth() + 1,
      year: start.getFullYear(),
      baseSalary: emp.baseSalary,
      bonuses: bonuses + productionIncentives,
      transport: Math.round(transportEarned),
      production: totalProductionValue,
      overtimePay: Math.round(overtimePay),
      overtimeMinutes: totalOTMins,
      loanInstallment: totalLoanInstallments,
      lateDeduction: Math.round(lateDeductionValue),
      earlyDepartureMinutes: totalEarlyMins,
      earlyDepartureDeduction: Math.round(earlyDeductionValue),
      absenceDays,
      absenceDeduction,
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
