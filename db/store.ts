
import { 
  CompanySettings, 
  User,
  Employee,
  AttendanceRecord,
  Loan,
  LeaveRequest,
  FinancialEntry,
  Warning,
  PayrollRecord
} from '../types';

const STORAGE_KEY = 'SAM_HR_DB_V4';

export interface DB {
  settings: CompanySettings;
  users: User[];
  employees: Employee[];
  attendance: AttendanceRecord[];
  loans: Loan[];
  leaves: LeaveRequest[];
  financials: FinancialEntry[];
  warnings: Warning[];
  payrolls: PayrollRecord[];
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
  overtimeHourRate: 1.5
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
      warnings: [],
      payrolls: []
    };
    saveDB(initialDB);
    return initialDB;
  }
  return JSON.parse(data);
};

export const saveDB = (db: DB) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
  // Apply theme to HTML tag
  if (db.settings.theme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};
