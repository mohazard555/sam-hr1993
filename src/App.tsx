
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import { apiClient } from './utils/api';
import ManagerDashboard from './views/ManagerDashboard';
// استيراد باقي الـ Views...

const App: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // جلب البيانات عند التشغيل
  useEffect(() => {
    const fetchEmployees = async () => {
      setLoading(true);
      try {
        const data = await apiClient('/api/employees');
        setEmployees(data);
      } catch (err) {
        console.error('Failed to sync data');
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const handleAddEmployee = async (newEmp: any) => {
    try {
      const savedEmp = await apiClient('/api/employees', {
        method: 'POST',
        body: JSON.stringify(newEmp),
      });
      setEmployees([...employees, savedEmp]);
      alert('تم حفظ البيانات بنجاح على السيرفر');
    } catch (err: any) {
      alert('فشل الحفظ: ' + err.message);
    }
  };

  // تعديل التبويبات لتشمل لوحة المدير (اختياري للمسؤول فقط)
  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} lang="ar" theme="light" toggleTheme={() => {}} currentUser={null} onLogout={() => {}}>
      {activeTab === 'manager' && <ManagerDashboard />}
      {/* باقي منطق التبويبات مع تمرير الدوال المعدلة التي تستخدم الـ API */}
    </Layout>
  );
};

export default App;
