
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

    const bonuses = empFinancials.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
    const productionIncentives = empFinancials.filter(f => f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const totalProductionValue = empProduction.reduce((acc, p) => acc + p.totalValue, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction' || f.type === 'payment').reduce((acc, f) => acc + f.amount, 0);

    const empLoan = loans.find(l => {
      if (l.employeeId !== emp.id || l.remainingAmount <= 0 || l.isArchived) return false;
      if (l.collectionDate && l.collectionDate > endDate) return false;
      return true;
    });

    const minDaysToDeduct = isWeekly ? 5 : 20; 
    const loanInstallment = (empLoan && diffDays >= minDaysToDeduct) ? Math.min(empLoan.monthlyInstallment, empLoan.remainingAmount) : 0;

    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;

    // حساب التأخير مع فترة السماح
    const totalLateMinutes = empAttendance.reduce((acc, record) => {
      const lateMins = Math.max(0, calculateTimeDiffMinutes(record.checkIn, shiftIn));
      // إذا تجاوز التأخير فترة السماح، يُحسب كامل التأخير
      return acc + (lateMins > (settings.gracePeriodMinutes || 0) ? lateMins : 0);
    }, 0);
    const lateDeductionValue = (totalLateMinutes / 60) * (emp.customDeductionRate || 1) * hourlyRate;

    // حساب الانصراف المبكر
    const totalEarlyMins = empAttendance.reduce((acc, record) => Math.max(0, calculateTimeDiffMinutes(shiftOut, record.checkOut)) + acc, 0);
    const earlyDeductionValue = (totalEarlyMins / 60) * (emp.customDeductionRate || 1) * hourlyRate;

    // حساب العمل الإضافي
    const otRate = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const totalOTMins = empAttendance.reduce((acc, r) => Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut)) + acc, 0);
    const overtimePay = (totalOTMins / 60) * hourlyRate * otRate;

    const totalEarnings = emp.baseSalary + emp.transportAllowance + bonuses + productionIncentives + totalProductionValue + overtimePay;
    const totalDeductions = absenceDeduction + manualDeductions + Math.round(lateDeductionValue) + Math.round(earlyDeductionValue) + loanInstallment;
    
    const netSalary = totalEarnings - totalDeductions;

    return {
      id: `${emp.id}-${startDate}-${endDate}`,
      employeeId: emp.id,
      month: start.getMonth() + 1,
      year: start.getFullYear(),
      baseSalary: emp.baseSalary,
      bonuses: bonuses + productionIncentives,
      transport: emp.transportAllowance,
      production: totalProductionValue,
      overtimePay: Math.round(overtimePay),
      overtimeMinutes: totalOTMins,
      loanInstallment: loanInstallment,
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