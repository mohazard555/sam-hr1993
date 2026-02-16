
import React, { useState } from 'react';
import { Search, Shield, History, Users, Database } from 'lucide-react';
import { apiClient } from '../utils/api';

const ManagerDashboard: React.FC = () => {
  const [targetKey, setTargetKey] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/api/manager/view/${targetKey}`);
      setData(res);
    } catch (err: any) {
      alert('خطأ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-8 text-right" dir="rtl">
      <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border-4 border-indigo-600">
        <h2 className="text-3xl font-black mb-6 flex items-center gap-3 text-indigo-700">
          <Shield size={32} /> لوحة الإدارة العليا للسحابة
        </h2>
        <div className="flex gap-4">
          <input 
            className="flex-1 p-4 bg-slate-100 rounded-2xl font-black outline-none focus:ring-2 ring-indigo-500"
            placeholder="أدخل مفتاح الترخيص المستهدف..."
            value={targetKey}
            onChange={e => setTargetKey(e.target.value)}
          />
          <button 
            onClick={fetchData}
            disabled={loading}
            className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black hover:bg-indigo-700 transition flex items-center gap-2"
          >
            {loading ? 'جاري الجلب...' : <Search size={20}/>} عرض البيانات
          </button>
        </div>
      </div>

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* عرض الموظفين */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-indigo-600"><Users /> قائمة الموظفين لهذه النسخة</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {data.employees.map((emp: any) => (
                <div key={emp.id} className="p-4 bg-slate-50 rounded-xl flex justify-between items-center">
                  <span className="font-black">{emp.name}</span>
                  <span className="text-xs bg-indigo-100 px-3 py-1 rounded-full">{emp.position}</span>
                </div>
              ))}
            </div>
          </div>

          {/* سجل العمليات */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2 text-rose-600"><History /> سجل العمليات (Logs)</h3>
            <div className="space-y-4 max-h-[500px] overflow-y-auto">
              {data.logs.map((log: any) => (
                <div key={log.id} className="p-4 border-r-4 border-rose-500 bg-rose-50 rounded-xl">
                  <p className="font-black text-sm">عملية: {log.action} على {log.target_table}</p>
                  <p className="text-[10px] text-slate-500">{new Date(log.timestamp).toLocaleString()}</p>
                  <div className="mt-2 text-[10px] bg-white p-2 rounded">
                    <strong>البيانات الجديدة:</strong> {JSON.stringify(log.new_data)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
