
import { AttendanceRecord, CompanySettings, Employee, Loan, FinancialEntry, PayrollRecord } from '../types';

export const calculateTimeDiffMinutes = (time1: string, time2: string): number => {
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
  settings: CompanySettings
): PayrollRecord[] => {
  const daysInCycle = settings.salaryCycle === 'weekly' ? 7 : 30;

  return employees.map(emp => {
    const empAttendance = attendance.filter(a => {
      const d = new Date(a.date);
      // في حالة الأسبوعي قد نحتاج منطق تصفية مختلف، ولكن حالياً نعتمد على تاريخ الشهر
      return d.getMonth() + 1 === month && d.getFullYear() === year && a.employeeId === emp.id;
    });

    const empFinancials = financials.filter(f => {
      const d = new Date(f.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && f.employeeId === emp.id;
    });

    const empLoan = loans.find(l => l.employeeId === emp.id && l.remainingAmount > 0);
    const loanInstallment = empLoan ? Math.min(empLoan.monthlyInstallment, empLoan.remainingAmount) : 0;

    const totalBonuses = empFinancials.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
    const totalProduction = empFinancials.filter(f => f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction').reduce((acc, f) => acc + f.amount, 0);

    const totalWorkingMinutes = empAttendance.reduce((acc, r) => {
      const duration = calculateTimeDiffMinutes(r.checkOut, r.checkIn);
      return acc + (duration > 0 ? duration : 0);
    }, 0);

    const hourlyRate = (emp.baseSalary / daysInCycle / 8);
    const lateDeductionRate = emp.customDeductionRate ? (hourlyRate * emp.customDeductionRate) : settings.deductionPerLateMinute;
    const shiftIn = emp.customCheckIn || settings.officialCheckIn;
    
    const totalLateMinutes = empAttendance.reduce((acc, record) => {
      const lateMins = Math.max(0, calculateTimeDiffMinutes(record.checkIn, shiftIn));
      return acc + Math.max(0, lateMins - settings.gracePeriodMinutes);
    }, 0);
    const lateDeductionValue = (totalLateMinutes / 60) * (emp.customDeductionRate ? (hourlyRate * emp.customDeductionRate) : (hourlyRate * 1));

    const overtimeRateMultiplier = emp.customOvertimeRate ?? settings.overtimeHourRate;
    const shiftOut = emp.customCheckOut || settings.officialCheckOut;
    
    const totalOvertimeMinutes = empAttendance.reduce((acc, r) => {
      const otMins = Math.max(0, calculateTimeDiffMinutes(r.checkOut, shiftOut));
      return acc + otMins;
    }, 0);
    const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate * overtimeRateMultiplier;

    const totalDeductions = manualDeductions + lateDeductionValue + loanInstallment;
    const netSalary = emp.baseSalary + emp.transportAllowance + totalBonuses + totalProduction + overtimePay - totalDeductions;

    return {
      id: `${emp.id}-${month}-${year}`,
      employeeId: emp.id,
      month,
      year,
      baseSalary: emp.baseSalary,
      bonuses: totalBonuses,
      transport: emp.transportAllowance,
      production: totalProduction,
      overtimePay: Math.round(overtimePay),
      overtimeMinutes: totalOvertimeMinutes,
      loanInstallment: loanInstallment,
      deductions: Math.round(manualDeductions + lateDeductionValue),
      lateMinutes: totalLateMinutes,
      workingHours: Number((totalWorkingMinutes / 60).toFixed(1)),
      netSalary: Math.round(Math.max(0, netSalary)),
      isPaid: false
    };
  });
};
