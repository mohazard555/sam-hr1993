
import React, { useState } from 'react';
import { Employee, CompanySettings } from '../types';
import { UserPlus, Search, Edit2, Trash2, Settings2, Clock, Calculator, CalendarCheck, Printer, X, Phone, User as UserIcon, MapPin, Calendar } from 'lucide-react';

interface Props {
  employees: Employee[];
  departments: string[];
  settings: CompanySettings;
  onAdd: (e: Employee) => void;
  onDelete: (id: string) => void;
  onPrintList?: (list: Employee[]) => void;
}

const Employees: React.FC<Props> = ({ employees, departments, settings, onAdd, onDelete, onPrintList }) => {
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const isWeekly = settings.salaryCycle === 'weekly';
  const defaultWorkDays = isWeekly ? (settings.weeklyCycleDays || 6) : (settings.monthlyCycleDays || 26);

  const [formData, setFormData] = useState<Partial<Employee>>({
    baseSalary: 325000,
    transportAllowance: 25000,
    vacationBalance: 21,
    workDaysPerCycle: defaultWorkDays,
    workingHoursPerDay: 8,
    customOvertimeRate: 1.5,
    customDeductionRate: 1,
    joinDate: new Date().toISOString().split('T')[0],
  });

  const cycleDays = formData.workDaysPerCycle || defaultWorkDays;
  const workingHours = formData.workingHoursPerDay || 8;
  const dailyRate = (formData.baseSalary || 0) / cycleDays;
  const hourlyRate = dailyRate / workingHours;
  const finalOvertimeHourPrice = hourlyRate * (formData.customOvertimeRate || 1.5);
  const finalDeductionHourPrice = hourlyRate * (formData.customDeductionRate || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newEmp: Employee = {
      id: formData.id || Math.random().toString(36).substr(2, 9),
      name: formData.name || '',
      position: formData.position || '',
      department: formData.department || '',
      baseSalary: Number(formData.baseSalary),
      transportAllowance: Number(formData.transportAllowance),
      nationalId: formData.nationalId || '',
      phone: formData.phone || '',
      address: formData.address || '',
      joinDate: formData.joinDate || new Date().toISOString().split('T')[0],
      vacationBalance: Number(formData.vacationBalance),
      workDaysPerCycle: Number(formData.workDaysPerCycle || defaultWorkDays),
      workingHoursPerDay: Number(formData.workingHoursPerDay || 8),
      customOvertimeRate: formData.customOvertimeRate ? Number(formData.customOvertimeRate) : 1.5,
      customDeductionRate: formData.customDeductionRate ? Number(formData.customDeductionRate) : 1,
      customCheckIn: formData.customCheckIn || undefined,
      customCheckOut: formData.customCheckOut || undefined,
    };
    onAdd(newEmp);
    setShowModal(false);
    setFormData({ baseSalary: 325000, transportAllowance: 25000, vacationBalance: 21, workDaysPerCycle: defaultWorkDays, workingHoursPerDay: 8, customOvertimeRate: 1.5, customDeductionRate: 1, joinDate: new Date().toISOString().split('T')[0] });
  };

  const handleEdit = (emp: Employee) => {
    setFormData(emp);
    setShowModal(true);
  };

  const filtered = employees.filter(e => 
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    e.position.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-96">
          <Search className="absolute right-3 top-2.5 text-slate-500" size={18} />
          <input
            type="text"
            placeholder="بحث عن موظف..."
            className="w-full pr-10 pl-4 py-3 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition font-bold text-slate-900 dark:text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {onPrintList && (
            <button 
              onClick={() => onPrintList(filtered)} 
              className="bg-indigo-100 text-indigo-700 px-6 py-3 rounded-2xl font-black flex items-center gap-2 hover:bg-indigo-200 transition"
            >
              <Printer size={20}/> طباعة القائمة
            </button>
          )}
          <button onClick={() => { setFormData({ baseSalary: 325000, transportAllowance: 25000, vacationBalance: 21, workDaysPerCycle: defaultWorkDays, workingHoursPerDay: 8, customOvertimeRate: 1.5, customDeductionRate: 1, joinDate: new Date().toISOString().split('T')[0] }); setShowModal(true); }} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-2xl hover:bg-indigo-700 transition shadow-xl font-black">
            <UserPlus size={20} /> إضافة موظف
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs">الموظف</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs">المنصب / القسم</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs text-center">أيام العمل</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs text-center">الراتب ({isWeekly ? 'أسبوعي' : 'شهري'})</th>
                <th className="px-6 py-5 text-slate-900 dark:text-slate-200 font-black text-xs text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center text-indigo-700 dark:text-indigo-400 font-black">{emp.name[0]}</div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white">{emp.name}</p>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 font-bold">{emp.nationalId || 'بدون رقم وطني'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-slate-900 dark:text-slate-200 font-black">{emp.position}</p>
                    <span className="text-[10px] bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded text-indigo-700 dark:text-indigo-400 font-bold">{emp.department}</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <span className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full font-black text-indigo-600">{emp.workDaysPerCycle || defaultWorkDays} يوم</span>
                  </td>
                  <td className="px-6 py-5 text-center">
                    <p className="font-black text-slate-900 dark:text-white">{emp.baseSalary.toLocaleString()}</p>
                    <p className="text-[10px] text-emerald-700 font-bold">+{emp.transportAllowance.toLocaleString()}</p>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => handleEdit(emp)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50 transition"><Edit2 size={16}/></button>
                      <button onClick={() => { if(confirm('حذف؟')) onDelete(emp.id); }} className="p-2 text-slate-600 dark:text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"><Trash2 size={16}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[95vh] overflow-y-auto border border-slate-200 dark:border-slate-800 animate-in zoom-in duration-300">
            <div className="sticky top-0 p-6 border-b bg-white dark:bg-slate-900 dark:border-slate-800 flex justify-between items-center z-10">
              <h3 className="text-2xl font-black text-indigo-700 dark:text-white flex items-center gap-2">
                <UserPlus size={24}/> {formData.id ? 'تعديل بيانات الموظف' : 'إضافة موظف جديد'}
              </h3>
              <button onClick={() => setShowModal(false)} className="w-10 h-10 flex items-center justify-center bg-rose-50 text-rose-500 dark:bg-slate-800 rounded-full hover:rotate-90 transition-all"><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-10">
              {/* القسم الأول: البيانات الأساسية */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2">الاسم الكامل</label>
                  <input required className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2">المنصب الوظيفي</label>
                  <input required className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" value={formData.position || ''} onChange={e => setFormData({...formData, position: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2">القسم</label>
                  <select required className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                    <option value="">اختر قسم...</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>

              {/* القسم الثاني: بيانات الهوية والتواصل */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2 flex items-center gap-1"><UserIcon size={12}/> الرقم الوطني (الهوية)</label>
                  <input className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" placeholder="مثال: 00000000000" value={formData.nationalId || ''} onChange={e => setFormData({...formData, nationalId: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2 flex items-center gap-1"><Phone size={12}/> رقم الهاتف</label>
                  <input className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" placeholder="مثال: 0988000000" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2 flex items-center gap-1"><Calendar size={12}/> تاريخ التعيين</label>
                  <input type="date" className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" value={formData.joinDate || ''} onChange={e => setFormData({...formData, joinDate: e.target.value})} />
                </div>
                <div className="md:col-span-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2 flex items-center gap-1"><MapPin size={12}/> عنوان السكن الحالي</label>
                  <input className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold focus:border-indigo-600 outline-none transition" placeholder="مثال: دمشق - الميدان - بناء رقم 10" value={formData.address || ''} onChange={e => setFormData({...formData, address: e.target.value})} />
                </div>
              </div>

              {/* القسم الثالث: البيانات المالية */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="p-4 bg-indigo-50/50 dark:bg-slate-800/50 rounded-2xl border-2 border-indigo-100 dark:border-indigo-900">
                  <label className="text-[10px] font-black text-indigo-600 uppercase mb-2 block">الراتب الأساسي</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 rounded-xl font-black text-xl text-indigo-700" value={formData.baseSalary || 0} onChange={e => setFormData({...formData, baseSalary: Number(e.target.value)})} />
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">أيام العمل في الدورة</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 rounded-xl font-black text-xl text-slate-700" placeholder={`مثلاً: ${isWeekly ? '6' : '26'}`} value={formData.workDaysPerCycle || ''} onChange={e => setFormData({...formData, workDaysPerCycle: Number(e.target.value)})} />
                </div>
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl border-2 border-slate-200 dark:border-slate-700">
                  <label className="text-[10px] font-black text-slate-500 uppercase mb-2 block">ساعات العمل يومياً</label>
                  <input type="number" className="w-full p-3 border-2 dark:bg-slate-800 rounded-xl font-black text-xl text-slate-700" placeholder="مثلاً: 8" value={formData.workingHoursPerDay || ''} onChange={e => setFormData({...formData, workingHoursPerDay: Number(e.target.value)})} />
                </div>
                <div><label className="text-[10px] font-black text-slate-500 uppercase mb-2 block mr-2">بدل المواصلات</label><input type="number" className="w-full p-4 border-2 dark:bg-slate-800 rounded-xl font-bold" value={formData.transportAllowance || 0} onChange={e => setFormData({...formData, transportAllowance: Number(e.target.value)})} /></div>
              </div>

              {/* شريط معلومات الحساب التلقائية */}
              <div className="bg-indigo-50 dark:bg-indigo-900/20 p-8 rounded-[2rem] flex flex-wrap gap-10 items-center border-2 border-dashed border-indigo-200 dark:border-indigo-800 relative">
                 <div className="absolute top-4 left-6 flex items-center gap-1 bg-indigo-600 text-white px-3 py-1 rounded-full text-[10px] font-black">
                    <CalendarCheck size={12}/> النظام المعتمد: {isWeekly ? 'أسبوعي' : 'شهري'}
                 </div>
                 <div className="flex items-center gap-3">
                    <Calculator className="text-indigo-600" size={28} />
                    <div><p className="text-[10px] font-black text-indigo-700 uppercase">سعر الساعة</p><p className="text-2xl font-black text-slate-900 dark:text-white">{Math.round(hourlyRate).toLocaleString()}</p></div>
                 </div>
                 <div className="h-12 w-px bg-indigo-200 hidden md:block"></div>
                 <div><p className="text-[10px] font-black text-emerald-700 uppercase">الإضافي (ساعة)</p><p className="text-2xl font-black text-emerald-600">{Math.round(finalOvertimeHourPrice).toLocaleString()}</p></div>
                 <div className="h-12 w-px bg-indigo-200 hidden md:block"></div>
                 <div><p className="text-[10px] font-black text-rose-700 uppercase">الخصم (ساعة)</p><p className="text-2xl font-black text-rose-600">{Math.round(finalDeductionHourPrice).toLocaleString()}</p></div>
              </div>

              {/* إعدادات الدوام المتقدمة */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-4">
                   <h4 className="font-black text-indigo-600 uppercase text-xs mr-2 flex items-center gap-2"><Clock size={14}/> تخصيص ساعات الدوام</h4>
                   <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                      <div><label className="text-[10px] font-black block mb-1">وقت الحضور</label><input type="time" className="w-full p-3 border rounded-xl font-bold" value={formData.customCheckIn || ''} onChange={e => setFormData({...formData, customCheckIn: e.target.value})} /></div>
                      <div><label className="text-[10px] font-black block mb-1">وقت الانصراف</label><input type="time" className="w-full p-3 border rounded-xl font-bold" value={formData.customCheckOut || ''} onChange={e => setFormData({...formData, customCheckOut: e.target.value})} /></div>
                   </div>
                </div>
                <div className="space-y-4">
                   <h4 className="font-black text-emerald-600 uppercase text-xs mr-2 flex items-center gap-2"><Settings2 size={14}/> تخصيص المعاملات</h4>
                   <div className="grid grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl">
                      <div><label className="text-[10px] font-black block mb-1">مضاعف الإضافي</label><input type="number" step="0.1" className="w-full p-3 border rounded-xl font-bold" value={formData.customOvertimeRate || 1.5} onChange={e => setFormData({...formData, customOvertimeRate: Number(e.target.value)})} /></div>
                      <div><label className="text-[10px] font-black block mb-1">مضاعف الخصم</label><input type="number" step="0.1" className="w-full p-3 border rounded-xl font-bold" value={formData.customDeductionRate || 1} onChange={e => setFormData({...formData, customDeductionRate: Number(e.target.value)})} /></div>
                   </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-5 rounded-2xl font-black text-xl shadow-xl hover:bg-indigo-700 active:scale-[0.98] transition-all">حفظ بيانات الموظف</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 dark:bg-slate-800 py-5 rounded-2xl font-black text-xl text-slate-500 hover:bg-slate-200 transition-all">إلغاء الأمر</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;