
import React from 'react';
import { Users, Clock, CreditCard, Banknote } from 'lucide-react';

interface StatsProps {
  employeesCount: number;
  todayAttendance: number;
  totalLoans: number;
  totalSalaryBudget: number;
}

const Dashboard: React.FC<StatsProps> = ({ employeesCount, todayAttendance, totalLoans, totalSalaryBudget }) => {
  const cards = [
    { title: 'إجمالي الموظفين', value: employeesCount, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' },
    { title: 'حضور اليوم', value: todayAttendance, icon: Clock, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' },
    { title: 'السلف القائمة', value: totalLoans.toLocaleString(), icon: CreditCard, color: 'text-orange-600', bg: 'bg-orange-100 dark:bg-orange-900/20' },
    { title: 'ميزانية الرواتب', value: totalSalaryBudget.toLocaleString(), icon: Banknote, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900/20' },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] shadow-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between hover:scale-105 transition-all">
            <div>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-black uppercase mb-2">{card.title}</p>
              <p className="text-3xl font-black text-slate-900 dark:text-white">{card.value}</p>
            </div>
            <div className={`p-4 rounded-2xl ${card.bg}`}>
              <card.icon className={card.color} size={28} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black mb-6 text-indigo-600">آخر النشاطات</h3>
          <div className="space-y-4">
             {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl transition">
                  <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                    <Clock size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-black dark:text-slate-200">تسجيل حضور نظامي</p>
                    <p className="text-xs text-slate-400">تحديث أوتوماتيكي للبيانات</p>
                  </div>
                </div>
             ))}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800">
          <h3 className="text-xl font-black mb-6 text-rose-600">تنبيهات النظام</h3>
          <div className="space-y-4">
             <div className="p-5 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 rounded-3xl border border-rose-100 dark:border-rose-900/50">
               <p className="font-black text-lg">تجاوزات الوقت</p>
               <p className="text-sm font-bold opacity-80">يرجى مراجعة سجلات التأخير لشهر الجاري واعتماد الخصومات.</p>
             </div>
             <div className="p-5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded-3xl border border-amber-100 dark:border-amber-900/50">
               <p className="font-black text-lg">تأمين البيانات</p>
               <p className="text-sm font-bold opacity-80">ينصح بتصدير نسخة JSON من الإعدادات بشكل أسبوعي.</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
