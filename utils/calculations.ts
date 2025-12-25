
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
  return employees.map(emp => {
    const empAttendance = attendance.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && a.employeeId === emp.id;
    });

    const empFinancials = financials.filter(f => {
      const d = new Date(f.date);
      return d.getMonth() + 1 === month && d.getFullYear() === year && f.employeeId === emp.id;
    });

    const empLoan = loans.find(l => l.employeeId === emp.id && l.remainingAmount > 0);

    const totalBonuses = empFinancials.filter(f => f.type === 'bonus').reduce((acc, f) => acc + f.amount, 0);
    const totalProduction = empFinancials.filter(f => f.type === 'production_incentive').reduce((acc, f) => acc + f.amount, 0);
    const manualDeductions = empFinancials.filter(f => f.type === 'deduction').reduce((acc, f) => acc + f.amount, 0);

    // Calculate Late Penalties (Late > grace period)
    const lateDeduction = empAttendance.reduce((acc, record) => {
      const late = Math.max(0, record.lateMinutes - settings.gracePeriodMinutes);
      return acc + (late * settings.deductionPerLateMinute);
    }, 0);

    // Calculate Overtime Pay
    // Formula: (Base Salary / 30 / 8) * OvertimeMinutes/60 * Rate
    const hourlyRate = (emp.baseSalary / 30 / 8);
    const totalOvertimeMinutes = empAttendance.reduce((acc, r) => acc + r.overtimeMinutes, 0);
    const overtimePay = (totalOvertimeMinutes / 60) * hourlyRate * settings.overtimeHourRate;

    const loanInstallment = empLoan ? Math.min(empLoan.monthlyInstallment, empLoan.remainingAmount) : 0;
    const totalDeductions = manualDeductions + lateDeduction + loanInstallment;
    
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
      deductions: Math.round(totalDeductions),
      netSalary: Math.round(Math.max(0, netSalary)),
      isPaid: false
    };
  });
};
