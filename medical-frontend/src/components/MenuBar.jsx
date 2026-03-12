import { Link, NavLink } from 'react-router-dom';

const getMenuItemClassName = ({ isActive }) => `menu-item${isActive ? ' menu-item-primary' : ''}`;

export default function MenuBar() {
  return (
    <nav className="menu-bar">
      <div className="menu-bar-content">
        <NavLink to="/appointments" className={getMenuItemClassName}>
          Услуги и цены
        </NavLink>
        <NavLink to="/doctors" className={getMenuItemClassName}>
          Врачи
        </NavLink>
        <NavLink to="/promotions" className={getMenuItemClassName}>
          Акции
        </NavLink>
        <NavLink to="/cabinet/labs" className={getMenuItemClassName}>
          Результаты анализов
        </NavLink>
        <NavLink to="/online-consultations" className={getMenuItemClassName}>
          Онлайн-консультация
        </NavLink>
        <Link to="/" className="menu-item">
          Контакты
        </Link>
      </div>
    </nav>
  );
}
