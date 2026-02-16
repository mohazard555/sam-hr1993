
import { AttendanceRecord, CompanySettings, Employee, Loan, FinancialEntry, PayrollRecord, ProductionEntry, LeaveRequest, PermissionRecord } from '../types';

export const calculateTimeDiffMinutes = (time1: string, time2: string): number => {
  if (!time1 || !time2) return 0;
  const [h1, m1] = time1.split(':').map(Number);
  const [h2, m2] = time2.split(':').map(Number);
  return (h1 * 60 + m1) - (h2 * 60 + m2);
};

const getOverlapDays = (start1: Date, end1: Date, start2: Date, end2: Date): number => {
  const start = start1 > start2 ? start1 : start2;
  const end = end1 < end2 ? end1 : end2;
  if (start > end) return 0;
  return Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
};

export const generatePayrollForRange = (
  startDate: string,
  endDate: string,
  employees: Employee[], 
  attendance: AttendanceRecord[], 
  loans: Loan[], 
  financials: FinancialEntry[],
  production: ProductionEntry[],
  settings: CompanySettings,
  leaves: LeaveRequest[] = [],
  permissions: PermissionRecord[] = [] // إضافة الأذونات
): PayrollRecord[] => {
  const isWeekly = settings.salaryCycle === 'weekly';
  const startPeriod = new Date(startDate);
  const endPeriod = new Date(endDate);
  
  const diffTime = Math.abs(endPeriod.getTime() - startPeriod.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

  return employees.map(emp => {
    const cycleDays = emp.workDaysPerCycle || (isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26));
    const workingHoursPerDay = emp.workingHoursPerDay || 8;
    
    const dailyRate = emp.baseSalary / cycleDays;
    const hourlyRate = dailyRate / workingHoursPerDay;

    const empAttendance = attendance.filter(a => a.employeeId === emp.id && a.date >= startDate && a.date <= endDate && !a.isArchived);
    const empFinancials = financials.filter(f => f.employeeId === emp.id && f.date >= startDate && f.date <= endDate && !f.isArchived);
    const empProduction = production.filter(p => p.employeeId === emp.id && p.date >= startDate && p.date <= endDate && !p.isArchived);
    const empPermissions = (permissions || []).filter(p => p.employeeId === emp.id && p.date >= startDate && p.date <= endDate && !p.isArchived);
    
    const paidLeaveDays = leaves
      .filter(l => l.employeeId === emp.id && l.status === 'approved' && l.isPaid && !l.isArchived)
      .reduce((acc, leave) => {
        const leaveStart = new Date(leave.startDate);
        const leaveEnd = new Date(leave.endDate);
        return acc + getOverlapDays(startPeriod, endPeriod, leaveStart, leaveEnd);
      }, 0);

    const workingDays = empAttendance.filter(a => a.status === 'present').length;
    const absenceDays = Math.max(0, diffDays - (workingDays + paidLeaveDays)); 
    const absenceDeduction = Math.round(absenceDays * dailyRate);

    const dailyTransportRate = emp.transportAllowance / cycleDays;
    const transportEarned = emp.isTransportExempt 
      ? emp.transportAllowance 
      : Math.max(0, emp.transportAllowance - (absenceDays * dailyTransportRate));

    const bonuses = empFinancials.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
    const productionIncentives = empFinancials.filter(f => f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const totalProductionValue = empProduction.reduce((acc, p) => acc + p.totalValue, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction' || f.type === 'payment').reduce((acc, f) => acc + f.amount, 0);

    // حساب الأذونات
    const totalPermissionHours = empPermissions.reduce((acc, p) => acc + Number(p.hours), 0);
    const permissionDeductionValue = Math.round(totalPermissionHours * hourlyRate * (emp.customDeductionRate || 1));

    const minDaysToDeduct = isWeekly ? 5 : 20; 
    let totalLoanInstallments = 0;
    
    const activeLoans = loans.filter(l => {
      if (l.employeeId !== emp.id || l.remainingAmount <= 0 || l.isArchived) return false;
      const targetDate = l.collectionDate || l.date;
      if (l.isImmediate) {
         return (targetDate >= startDate && targetDate <= endDate);
      }
      if (diffDays < minDaysToDeduct) return false;
      if (targetDate > endDate) return false;
      return true;
    });

    totalLoanInstallments = activeLoans.reduce((sum, loan) => {
      const installmentValue = loan.isImmediate ? loan.remainingAmount : loan.monthlyInstallment;
      return sum + Math.min(installmentValue, loan.remainingAmount);
    }, 0);

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
    const totalDeductions = absenceDeduction + manualDeductions + Math.round(lateDeductionValue) + Math.round(earlyDeductionValue) + totalLoanInstallments + permissionDeductionValue;
    
    const netSalary = totalEarnings - totalDeductions;

    return {
      id: `${emp.id}-${startDate}-${endDate}`,
      employeeId: emp.id,
      month: startPeriod.getMonth() + 1,
      year: startPeriod.getFullYear(),
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
      permissionHours: totalPermissionHours,
      permissionDeduction: permissionDeductionValue,
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
  settings: CompanySettings,
  leaves: LeaveRequest[] = [],
  permissions: PermissionRecord[] = []
): PayrollRecord[] => {
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${String(month).padStart(2, '0')}-${lastDay}`;
  return generatePayrollForRange(startDate, endDate, employees, attendance, loans, financials, production, settings, leaves, permissions);
};