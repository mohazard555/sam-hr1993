
import React from 'react';
import { 
  Users, Clock, CreditCard, Calendar, 
  BarChart3, Settings as SettingsIcon, LayoutDashboard,
  Wallet, Zap, LogOut, Sun, Moon, FileText, Building, Printer, ClipboardList
} from 'lucide-react';
import { useTranslation } from '../utils/translations';
import { Language, User, Theme } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  lang: Language;
  theme: Theme;
  toggleTheme: () => void;
  currentUser: User | null;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, lang, theme, toggleTheme, currentUser, onLogout }) => {
  const t = useTranslation(lang);
  const isRtl = lang === 'ar';

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
    { id: 'employees', label: t('employees'), icon: Users, roles: ['admin', 'manager', 'viewer'] },
    { id: 'departments', label: isRtl ? 'الأقسام' : 'Departments', icon: Building, roles: ['admin', 'manager'] },
    { id: 'attendance', label: t('attendance'), icon: Clock, roles: ['admin', 'manager', 'viewer'] },
    { id: 'leaves', label: t('leaves'), icon: Calendar, roles: ['admin', 'manager'] },
    { id: 'financials', label: t('financials'), icon: Wallet, roles: ['admin', 'manager'] },
    { id: 'loans', label: t('loans'), icon: CreditCard, roles: ['admin', 'manager'] },
    { id: 'production', label: t('production'), icon: Zap, roles: ['admin', 'manager'] },
    { id: 'payroll', label: t('payroll'), icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'documents', label: isRtl ? 'النماذج المطبوعة' : 'Print Forms', icon: ClipboardList, roles: ['admin', 'manager'] },
    { id: 'reports', label: isRtl ? 'التقارير النوعية' : 'Reports', icon: FileText, roles: ['admin', 'manager'] },
    { id: 'settings', label: t('settings'), icon: SettingsIcon, roles: ['admin'] },
  ];

  // تأمين فلترة القائمة بناءً على الرتبة الحقيقية
  const userRole = currentUser?.role || 'viewer';
  const filteredMenu = menuItems.filter(item => userRole === 'admin' || item.roles.includes(userRole));

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white flex flex-col no-print border-l dark:border-slate-800 shrink-0">
        <div className="p-6 border-b border-indigo-900">
          <h1 className="text-2xl font-black text-indigo-400 flex items-center gap-2">
            <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/50">S</div>
            <span>SAM</span>
          </h1>
          <p className="text-[10px] text-indigo-300 mt-1 font-bold tracking-widest uppercase">HRMS PRO</p>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                : 'text-indigo-300 hover:bg-indigo-900 hover:text-white'
              }`}
            >
              <item.icon size={20} />
              <span className="font-bold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-indigo-900 bg-indigo-950/50">
          <div className="flex items-center justify-between mb-4 bg-indigo-900/40 p-2 rounded-lg">
             <button onClick={toggleTheme} className="p-2 hover:bg-indigo-800 rounded-lg text-indigo-300">
                {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
             </button>
             <button onClick={onLogout} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg">
                <LogOut size={20} />
             </button>
          </div>
          <div className="text-[10px] font-bold text-indigo-400 space-y-1 text-center opacity-80">
            <p>Developed by Mohannad Ahmad</p>
            <p>Tel: +963 998 171 954</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950">
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 no-print shadow-sm z-10 shrink-0">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-left">
                <p className="text-xs text-slate-700 dark:text-slate-400 font-black">{currentUser?.name || 'مستخدم'}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase">{userRole}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border dark:border-slate-700">
                <Users size={20} className="text-indigo-600 dark:text-indigo-500" />
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8">
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;
