import { Link } from 'react-router-dom';
import AuthModal from './AuthModal';

export default function Header() {
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
            <li><Link to="/patients">Пациенты</Link></li>
            <li><Link to="/doctors">Врачи</Link></li>
            <li><Link to="/appointments">Записи</Link></li>
          </ul>
        </nav>

        <AuthModal />
      </div>
    </header>
  );
}
