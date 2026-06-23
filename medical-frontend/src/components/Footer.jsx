import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <strong>Клиника «Здоровье»</strong>
          <p>Частная медицинская клиника с удобной записью, понятным маршрутом приема и цифровым кабинетом пациента.</p>
        </div>

        <div className="site-footer__meta">
          <div className="site-footer__column">
            <span>Навигация</span>
            <Link to="/appointments">Запись на прием</Link>
            <Link to="/doctors">Врачи</Link>
            <Link to="/contacts">Контакты</Link>
          </div>

          <div className="site-footer__column">
            <span>Контакты</span>
            <a href="tel:+78312004567">+7 (831) 200-45-67</a>
            <a href="mailto:medisystem@yandex.ru">medisystem@yandex.ru</a>
            <p>Нижний Новгород, ул. Студеная, 101</p>
          </div>
        </div>
      </div>

      <div className="site-footer__bottom">
        <span>© {currentYear} Клиника «Здоровье»</span>
        <span>Все права защищены</span>
      </div>
    </footer>
  );
}
