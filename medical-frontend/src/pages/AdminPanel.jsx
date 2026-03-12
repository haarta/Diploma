import { NavLink, Navigate, Route, Routes } from 'react-router-dom';
import AdminDoctors from './AdminDoctors';
import AdminOnlineConsultations from './AdminOnlineConsultations';
import AdminPromotions from './AdminPromotions';

const getTabClassName = ({ isActive }) => `admin-panel-tab${isActive ? ' admin-panel-tab--active' : ''}`;

export default function AdminPanel() {
  return (
    <div className="admin-panel">
      <section className="admin-panel-shell">
        <div className="admin-panel-header">
          <div>
            <p className="admin-panel-eyebrow">Управление контентом</p>
            <h1>Админ-панель</h1>
          </div>
          <div className="admin-panel-tabs">
            <NavLink end to="/admin/doctors" className={getTabClassName}>
              Врачи
            </NavLink>
            <NavLink to="/admin/online-consultations" className={getTabClassName}>
              Онлайн-консультации
            </NavLink>
            <NavLink to="/admin/promotions" className={getTabClassName}>
              Акции
            </NavLink>
          </div>
        </div>

        <Routes>
          <Route index element={<Navigate to="/admin/doctors" replace />} />
          <Route path="doctors" element={<AdminDoctors />} />
          <Route path="online-consultations" element={<AdminOnlineConsultations />} />
          <Route path="promotions" element={<AdminPromotions />} />
          <Route path="*" element={<Navigate to="/admin/doctors" replace />} />
        </Routes>
      </section>
    </div>
  );
}
