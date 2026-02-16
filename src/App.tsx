
import React, { useState, useEffect, useMemo } from 'react';
import Layout from './components/Layout';
import Dashboard from './views/Dashboard';
import Employees from './views/Employees';
import Departments from './views/Departments';
import Attendance from './views/Attendance';
import SettingsView from './views/Settings';
import ReportsView from './views/Reports';
import Production from './views/Production';
import PrintForms from './views/PrintForms';
import ManagerDashboard from './views/ManagerDashboard'; // استيراد اللوحة الجديدة
import { loadDB, saveDB, DB } from './db/store';
import { User, Employee, PayrollRecord } from './types';
import { generatePayrollForRange } from './utils/calculations';
import { Lock, HelpCircle } from 'lucide-react';

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(loadDB());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [showHint, setShowHint] = useState(false);
  
  const [payrollDateFrom, setPayrollDateFrom] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
  const [payrollDateTo, setPayrollDateTo] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    saveDB(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = db.users.find(u => u.username === loginForm.username && u.password === loginForm.password);
    if (user) {
      setCurrentUser(user);
      setShowHint(false);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  const currentPayrolls = useMemo(() => generatePayrollForRange(
    payrollDateFrom, 
    payrollDateTo, 
    db.employees || [], 
    db.attendance || [], 
    db.loans || [], 
    db.financials || [], 
    db.production || [], 
    db.settings,
    db.leaves || []
  ), [payrollDateFrom, payrollDateTo, db]);

  const updateList = (key: keyof DB, item: any) => {
    setDb(prev => {
      const list = Array.isArray(prev[key]) ? [...(prev[key] as any[])] : [];
      const index = list.findIndex((i: any) => i.id === item.id);
      if (index !== -1) list[index] = item; else list.push(item);
      return { ...prev, [key]: list };
    });
  };

  const deleteFromList = (key: keyof DB, id: string) => {
    if(!confirm('هل أنت متأكد من الحذف؟')) return;
    setDb(prev => ({ ...prev, [key]: (prev[key] as any[]).filter((i:any) => id !== i.id) }));
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard employeesCount={db.employees.length} todayAttendance={0} totalLoans={0} totalSalaryBudget={0} />;
      case 'employees': return <Employees employees={db.employees} departments={db.departments} settings={db.settings} onAdd={e => updateList('employees', e)} onDelete={id => deleteFromList('employees', id)} />;
      case 'departments': return <Departments departments={db.departments} employees={db.employees} onUpdate={d => setDb(p => ({...p, departments: d}))} onUpdateEmployee={e => updateList('employees', e)} />;
      case 'attendance': return <Attendance employees={db.employees} records={db.attendance} settings={db.settings} onSaveRecord={r => updateList('attendance', r)} onDeleteRecord={id => deleteFromList('attendance', id)} lang="ar" onPrint={() => {}} />;
      case 'manager': return <ManagerDashboard />;
      case 'settings': return <SettingsView settings={db.settings} admin={db.users[0]} db={db} onUpdateSettings={s => setDb(p => ({...p, settings: {...p.settings, ...s}}))} onUpdateAdmin={u => {}} onImport={d => {}} onRunArchive={() => {}} onClearData={() => {}} />;
      default: return <div className="p-20 text-center font-black">قريباً...</div>;
    }
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 font-cairo" dir="rtl">
         <div className="w-full max-w-lg bg-white rounded-[3.5rem] p-12 shadow-2xl relative overflow-hidden">
            <div className="text-center mb-12">
               <div className="w-24 h-24 bg-indigo-600 rounded-[2rem] mx-auto flex items-center justify-center text-white text-5xl font-black mb-6">S</div>
               <h2 className="text-4xl font-black text-slate-900 tracking-tighter">نظام SAM Pro</h2>
            </div>
            <form onSubmit={handleLogin} className="space-y-8">
               <input 
                 className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black outline-none text-xl" 
                 placeholder="اسم المستخدم"
                 value={loginForm.username} 
                 onChange={e => setLoginForm({...loginForm, username: e.target.value})} 
               />
               <input 
                 type="password" 
                 className="w-full p-6 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-[2rem] font-black outline-none text-xl" 
                 placeholder="كلمة المرور"
                 value={loginForm.password} 
                 onChange={e => setLoginForm({...loginForm, password: e.target.value})} 
               />
               <button type="submit" className="w-full bg-indigo-600 text-white py-6 rounded-[2.2rem] font-black text-2xl shadow-xl hover:bg-indigo-700 transition-all">
                  دخـول
               </button>
            </form>
         </div>
      </div>
    );
  }

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang={db.settings.language} theme={db.settings.theme} toggleTheme={() => setDb(p => ({...p, settings: {...p.settings, theme: p.settings.theme === 'light' ? 'dark' : 'light'}}))} currentUser={currentUser} onLogout={() => setCurrentUser(null)}>
      {renderActiveTab()}
    </Layout>
  );
};

export default App;
