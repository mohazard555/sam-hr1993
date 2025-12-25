
export type Language = 'ar' | 'en';
export type UserRole = 'admin' | 'manager' | 'viewer';
export type Theme = 'light' | 'dark';

export interface User {
  id: string;
  username: string;
  password?: string;
  role: UserRole;
  name: string;
  permissions: string[]; // ['read_payroll', 'edit_employees', etc]
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
}

export interface Employee {
  id: string;
  name: string;
  position: string;
  department: string;
  baseSalary: number;
  transportAllowance: number;
  joinDate: string;
  phone: string;
  nationalId: string;
  vacationBalance: number;
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
}

export interface Loan {
  id: string;
  employeeId: string;
  amount: number;
  monthlyInstallment: number;
  date: string;
  remainingAmount: number;
  reason?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: 'annual' | 'sick' | 'unpaid' | 'emergency';
  startDate: string;
  endDate: string;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
}

export interface FinancialEntry {
  id: string;
  employeeId: string;
  type: 'bonus' | 'deduction' | 'production_incentive';
  amount: number;
  date: string;
  reason: string;
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
  deductions: number; 
  netSalary: number;
  isPaid: boolean;
}
