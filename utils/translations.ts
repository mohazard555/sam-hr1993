
import { Language } from '../types';

const translations = {
  ar: {
    dashboard: 'لوحة التحكم',
    employees: 'الموظفين',
    attendance: 'الحضور والانصراف',
    leaves: 'الإجازات',
    financials: 'الماليات',
    loans: 'السلف',
    production: 'الإنتاج',
    payroll: 'الرواتب',
    warnings: 'الإنذارات',
    settings: 'الإعدادات',
    logout: 'تسجيل خروج',
    totalEmployees: 'إجمالي الموظفين',
    todayAttendance: 'حضور اليوم',
    totalLoans: 'السلف القائمة',
    budget: 'ميزانية الرواتب',
    save: 'حفظ',
    cancel: 'إلغاء',
    add: 'إضافة',
    login: 'تسجيل دخول',
    username: 'اسم المستخدم',
    password: 'كلمة المرور',
    errorLogin: 'خطأ في اسم المستخدم أو كلمة المرور',
    currency: 'العملة',
    lang: 'اللغة',
    overtimeRate: 'سعر الساعة الإضافي',
    officialIn: 'الحضور الرسمي',
    officialOut: 'الانصراف الرسمي'
  },
  en: {
    dashboard: 'Dashboard',
    employees: 'Employees',
    attendance: 'Attendance',
    leaves: 'Leaves',
    financials: 'Financials',
    loans: 'Loans',
    production: 'Production',
    payroll: 'Payroll',
    warnings: 'Warnings',
    settings: 'Settings',
    logout: 'Logout',
    totalEmployees: 'Total Employees',
    todayAttendance: 'Today Attendance',
    totalLoans: 'Outstanding Loans',
    budget: 'Salary Budget',
    save: 'Save',
    cancel: 'Cancel',
    add: 'Add',
    login: 'Login',
    username: 'Username',
    password: 'Password',
    errorLogin: 'Invalid username or password',
    currency: 'Currency',
    lang: 'Language',
    overtimeRate: 'Overtime Rate',
    officialIn: 'Official In',
    officialOut: 'Official Out'
  }
};

export const useTranslation = (lang: Language) => {
  return (key: keyof typeof translations['ar']) => translations[lang][key] || key;
};
