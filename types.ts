
export type Language = 'ar' | 'en';
export type UserRole = 'admin' | 'manager' | 'viewer';
export type Theme = 'light' | 'dark';
export type SalaryCycle = 'monthly' | 'weekly';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  permissions: string[];
}

export interface ArchiveLog {
  id: string;
  date: string;
  type: string;
  recordsCount: number;
  performedBy: string;
}

export interface CompanySettings {
  name: string;
  address: string;
  phone: string;
  logo: string;
  language: Language;
  theme: Theme;
  currency: string;
  availableCurrencies: string[];
  gracePeriodMinutes: number;
  officialCheckIn: string;
  officialCheckOut: string;
  deductionPerLateMinute: number;
  overtimeHourRate: number;
  salaryCycle: SalaryCycle;
  monthlyCycleDays: number;
  weeklyCycleDays: number;
  passwordHint?: string;
  archiveRetentionDays: number;
  archiveLogs: [];
  fridayIsWorkDay: boolean;
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  transportAllowance: number;
  isTransportExempt?: boolean; // استثناء من خصم المواصلات عند الغياب
  joinDate: string;
  phone: string;
  nationalId: string;
  address?: string;
  vacationBalance: number;
  workDaysPerCycle: number;
  workingHoursPerDay: number; 
  customOvertimeRate?: number;
  customDeductionRate?: number;
  customCheckIn?: string;
  customCheckOut?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string;
  checkOut: string;
  lateMinutes: number;
  overtimeMinutes: number;
  status: 'present' | 'absent' | 'leave' | 'excused';
  isArchived?: boolean;
}

export interface Loan {
  id: string;
  employeeId: string;
  amount: number;
  installmentsCount: number;
  monthlyInstallment: number;
  date: string;
  collectionDate?: string; 
  remainingAmount: number;
  reason?: string;
  isArchived?: boolean;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'unpaid' | 'emergency' | 'marriage' | 'death' | 'maternity' | 'hajj';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  isPaid: boolean;
  reason?: string;
  isArchived?: boolean;
}

export interface ProductionEntry {
  id: string;
  employeeId: string;
  date: string;
  piecesCount: number;
  specifications: string;
  valuePerPiece: number;
  totalValue: number;
  notes?: string;
  isArchived?: boolean;
}

export interface FinancialEntry {
  id: string;
  employeeId: string;
  type: 'bonus' | 'deduction' | 'production_incentive' | 'payment';
  amount: number;
  date: string;
  reason: string;
  isArchived?: boolean;
}

export interface Warning {
  id: string;
  employeeId: string;
  type: 'verbal' | 'written' | 'final';
  date: string;
  reason: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  month: number;
  year: number;
  baseSalary: number;
  bonuses: number;
  transport: number;
  production: number;
  overtimePay: number;
  overtimeMinutes: number;
  loanInstallment: number;
  lateDeduction: number; 
  earlyDepartureMinutes: number;
  earlyDepartureDeduction: number;
  absenceDays: number;
  absenceDeduction: number;
  manualDeductions: number; 
  deductions: number; 
  lateMinutes: number;
  workingHours: number;
  workingDays: number;
  netSalary: number;
  isPaid: boolean;
  finalizedAt?: string;
}
