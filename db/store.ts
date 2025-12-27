
import { 
  CompanySettings, 
  User,
  Employee,
  AttendanceRecord,
  Loan,
  LeaveRequest,
  FinancialEntry,
  Warning,
  PayrollRecord,
  ProductionEntry
} from '../types';

const STORAGE_KEY = 'SAM_HR_DB_V6_PRO';

export interface DB {
  settings: CompanySettings;
  users: User[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  loans: Loan[];
  leaves: LeaveRequest[];
  financials: FinancialEntry[];
  production: ProductionEntry[]; // حقل الإنتاج
  warnings: Warning[];
  payrolls: PayrollRecord[];
  payrollHistory: PayrollRecord[];
  departments: string[];
}

const DEFAULT_SETTINGS: CompanySettings = {
  name: 'SAM لادارة شؤون الموظفين',
  address: 'سوريا - دمشق',
  phone: '+963-000-0000',
  logo: '',
  language: 'ar',
  theme: 'light',
  currency: 'SYP',
  availableCurrencies: ['SYP', 'SAR', 'USD', 'EGP', 'AED'],
  gracePeriodMinutes: 15,
  officialCheckIn: '08:00',
  officialCheckOut: '16:00',
  deductionPerLateMinute: 1.0,
  overtimeHourRate: 1.5,
  salaryCycle: 'monthly'
};

const INITIAL_USER: User = {
  id: 'admin-sam',
  username: 'admin',
  password: '123',
  role: 'admin',
  name: 'المدير العام',
  permissions: ['all']
};

export const loadDB = (): DB => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) {
    const initialDB: DB = {
      settings: DEFAULT_SETTINGS,
      users: [INITIAL_USER],
      employees: [],
      attendance: [],
      loans: [],
      leaves: [],
      financials: [],
      production: [],
      warnings: [],
      payrolls: [],
      payrollHistory: [],
      departments: ['الإدارة العامة', 'المحاسبة', 'الموارد البشرية', 'الإنتاج', 'المبيعات']
    };
    saveDB(initialDB);
    return initialDB;
  }
  const parsed = JSON.parse(data);
  if (!parsed.departments) parsed.departments = [];
  if (!parsed.payrollHistory) parsed.payrollHistory = [];
  if (!parsed.production) parsed.production = [];
  if (!parsed.settings.salaryCycle) parsed.settings.salaryCycle = 'monthly';
  return parsed;
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  if (db.settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
