import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';
import { isAdmin, isDoctor } from '../auth';

export default function Header() {
  const admin = isAdmin();
  const doctor = isDoctor();

  return (
    <header className="header">
      <div className="header-content">
        <Link className="logo" to="/">
          Здоровье
        </Link>

        <form className="search-form">
          <input className="search-input" type="search" placeholder="Поиск по сайту" />
        </form>

        <nav>
          <ul className="nav-links">
            <li><Link to="/">Главная</Link></li>
            <li><Link to="/doctors">Врачи</Link></li>
            <li><Link to="/appointments">Записи</Link></li>
            {admin ? <li><Link to="/patients">Пациенты</Link></li> : null}
            {admin ? <li><Link to="/admin/doctors">Админ-панель</Link></li> : null}
            {doctor ? <li><Link to="/doctor/cabinet">Кабинет врача</Link></li> : null}
          </ul>
        </nav>

        <AuthModal />
      </div>
    </header>
  );
}
