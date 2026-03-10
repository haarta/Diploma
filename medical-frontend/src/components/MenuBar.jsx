import { Link } from 'react-router-dom';

export default function MenuBar() {
  return (
    <nav className="menu-bar">
      <div className="menu-bar-content">
        <Link to="#" className="menu-item menu-item-primary">
          Услуги и цены
        </Link>
        <Link to="/doctors" className="menu-item">
          Врачи
        </Link>
        <Link to="#" className="menu-item">
          Акции
        </Link>
        <Link to="/cabinet/labs" className="menu-item">
          Результаты анализов
        </Link>
        <Link to="#" className="menu-item">
          Онлайн-консультация
        </Link>
        <Link to="#" className="menu-item">
          Контакты
        </Link>
      </div>
    </nav>
  );
}
