import AuthModal from './AuthModal';

export default function Header() {
  return (
      <header className="header">
        <div className="header-content">
          <a href="/" className="logo">💜 Здоровье</a>
          <form className="search-form">
            <input
                type="text"
                className="search-input"
                placeholder="Поиск врача, услуги, пациента..."
            />
          </form>
          <nav className="nav-links">
            <a href="/">Главная</a>
            <a href="/patients">Пациенты</a>
            <a href="/doctors">Врачи</a>
            <a href="/records">Записи</a>
          </nav>
          <AuthModal />
        </div>
      </header>
  );
}