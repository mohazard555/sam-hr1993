
import React, { useState } from 'react';
import { 
  Users, Clock, CreditCard, Calendar, 
  BarChart3, Settings as SettingsIcon, LayoutDashboard,
  Wallet, Zap, LogOut, Sun, Moon, FileText, Building, Printer, ClipboardList, ShieldAlert, Timer,
  Bell, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  notifications?: string[];
  onClearNotifications?: () => void;
  isSyncing?: boolean;
  logo?: string;
  companyName?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, activeTab, setActiveTab, lang, theme, toggleTheme, 
  currentUser, onLogout, notifications = [], onClearNotifications, isSyncing = false,
  logo, companyName
}) => {
  const t = useTranslation(lang);
  const isRtl = lang === 'ar';
  
  // حالة التحكم في ظهور الإدارة السحابية (مخفية افتراضياً)
  const [showCloudAdmin, setShowCloudAdmin] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const menuItems = [
    { id: 'dashboard', label: t('dashboard'), icon: LayoutDashboard, roles: ['admin', 'manager', 'viewer'] },
    { id: 'employees', label: t('employees'), icon: Users, roles: ['admin', 'manager', 'viewer'] },
    { id: 'departments', label: isRtl ? 'الأقسام' : 'Departments', icon: Building, roles: ['admin', 'manager'] },
    { id: 'attendance', label: t('attendance'), icon: Clock, roles: ['admin', 'manager', 'viewer'] },
    { id: 'permissions', label: isRtl ? 'الأذونات' : 'Permissions', icon: Timer, roles: ['admin', 'manager'] },
    { id: 'leaves', label: t('leaves'), icon: Calendar, roles: ['admin', 'manager'] },
    { id: 'financials', label: t('financials'), icon: Wallet, roles: ['admin', 'manager'] },
    { id: 'loans', label: t('loans'), icon: CreditCard, roles: ['admin', 'manager'] },
    { id: 'production', label: t('production'), icon: Zap, roles: ['admin', 'manager'] },
    { id: 'payroll', label: t('payroll'), icon: BarChart3, roles: ['admin', 'manager'] },
    { id: 'documents', label: isRtl ? 'النماذج المطبوعة' : 'Print Forms', icon: ClipboardList, roles: ['admin', 'manager'] },
    { id: 'reports', label: isRtl ? 'التقارير النوعية' : 'Reports', icon: FileText, roles: ['admin', 'manager'] },
    { id: 'manager', label: isRtl ? 'الإدارة السحابية' : 'Cloud Admin', icon: ShieldAlert, roles: ['admin'], isHidden: true },
    { id: 'settings', label: t('settings'), icon: SettingsIcon, roles: ['admin'] },
  ];

  const filteredMenu = menuItems.filter(item => {
    if (!currentUser) return false;
    
    // Admin always has everything, except cloud manager hidden by default
    if (currentUser.role === 'admin') {
      if (item.id === 'manager' && !showCloudAdmin) return false;
      return true;
    }
    
    // Regular users: show only if current user has the permission
    return (currentUser.permissions || []).includes(item.id);
  });

  return (
    <div className={`flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden ${isRtl ? 'text-right' : 'text-left'}`} dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white flex flex-col no-print border-l dark:border-slate-800 transition-all duration-300">
        <div className="p-6 border-b border-indigo-900">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowCloudAdmin(!showCloudAdmin)} 
              title={isRtl ? "تفعيل الخيارات المتقدمة" : "Toggle Advanced Options"}
              className="w-12 h-12 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/50 hover:bg-indigo-400 transition-colors cursor-pointer overflow-hidden group"
            >
              {logo ? (
                <img src={logo} className="w-full h-full object-contain group-hover:scale-110 transition-transform" alt="Logo" referrerPolicy="no-referrer" />
              ) : (
                <span className="text-xl font-black">S</span>
              )}
            </button>
            <div className="flex flex-col min-w-0">
                <h1 className="text-lg font-black text-white truncate leading-tight">
                    {companyName || 'SAM'}
                </h1>
                <p className="text-[10px] text-indigo-300 font-bold tracking-widest uppercase opacity-60">HRMS PRO</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-1">
          {filteredMenu.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-indigo-600 text-white shadow-lg scale-105' 
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
             <button onClick={toggleTheme} className="p-2 hover:bg-indigo-800 rounded-lg text-indigo-300 transition">
                {theme === 'light' ? <Moon size={20}/> : <Sun size={20}/>}
             </button>
             <button onClick={onLogout} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition">
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
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <header className="h-16 bg-white dark:bg-slate-900 border-b dark:border-slate-800 flex items-center justify-between px-8 no-print shadow-sm z-10">
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              {menuItems.find(m => m.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
             {/* Notifications Icon and Dropdown */}
             <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-2.5 rounded-xl transition-all relative ${showNotifications ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'}`}
                >
                  <Bell size={20} />
                  {notifications.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 animate-bounce">
                      {notifications.length}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {showNotifications && (
                    <motion.div
                      initial={{ opacity: 0, y: 15, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 15, scale: 0.95 }}
                      className={`absolute top-full mt-3 w-80 bg-white dark:bg-slate-900 border dark:border-slate-800 shadow-2xl rounded-3xl z-[700] overflow-hidden ${isRtl ? 'left-0 origin-top-left' : 'right-0 origin-top-right'}`}
                    >
                      <div className="p-4 border-b dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
                        <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                          <Bell size={14} className="text-indigo-600" />
                          {isRtl ? 'مركز التنبيهات' : 'Notification Center'}
                        </h4>
                        {notifications.length > 0 && onClearNotifications && (
                          <button 
                            onClick={() => { onClearNotifications(); setShowNotifications(false); }}
                            className="text-[10px] font-black text-rose-500 hover:bg-rose-50 px-2 py-1 rounded-lg transition"
                          >
                            {isRtl ? 'مسح الكل' : 'Clear All'}
                          </button>
                        )}
                      </div>
                      <div className="max-h-[350px] overflow-y-auto p-2 space-y-1">
                        {notifications.length === 0 ? (
                          <div className="py-12 text-center text-slate-400">
                             <Bell size={32} className="mx-auto mb-2 opacity-20" />
                             <p className="text-xs font-bold">{isRtl ? 'لا يوجد تنبيهات حالياً' : 'No notifications'}</p>
                          </div>
                        ) : (
                          notifications.map((msg, i) => (
                            <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl flex items-start gap-3 border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900/30 transition-colors">
                              <div className="mt-1 w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0"></div>
                              <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-relaxed">{msg}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
             </div>

             <div className="hidden md:block text-right">
                <p className="text-xs text-slate-700 dark:text-slate-400 font-black">{currentUser?.name}</p>
                <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase tracking-widest">{currentUser?.role}</p>
             </div>
             <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center border dark:border-slate-700 shadow-sm">
                <Users size={20} className="text-indigo-600 dark:text-indigo-500" />
             </div>
          </div>
        </header>

        <section className="flex-1 overflow-y-auto p-8 relative">
          {children}
        </section>
      </main>
      {/* Sync Indicator stays at bottom */}
      <div className="fixed bottom-6 right-6 z-[600] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {isSyncing && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="bg-indigo-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20 pointer-events-auto"
            >
              <Loader2 size={18} className="animate-spin" />
              <span className="font-black text-sm">جـاري مـزامـنـة الـبـيـانـات...</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Layout;
