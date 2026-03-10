import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Медицинская клиника «Здоровье»</h1>
          <p>Современное медицинское обслуживание высокого качества для пациентов любого возраста</p>
          <Link to="/appointments" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Записаться на прием
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">👨‍⚕️</div>
          <h3>Опытные врачи</h3>
          <p>Специалисты высокой квалификации с практическим опытом и внимательным подходом</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏥</div>
          <h3>Современное оборудование</h3>
          <p>Диагностика и лечение на актуальном медицинском оборудовании с точными результатами</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Быстрое обслуживание</h3>
          <p>Удобная запись на прием, понятный личный кабинет и минимальное время ожидания</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💊</div>
          <h3>Полный спектр услуг</h3>
          <p>От первичной консультации и анализов до лечения, наблюдения и восстановления</p>
        </div>
      </section>

      <section className="services">
        <h2>Основные сервисы</h2>
        <div className="services-grid">
          <div className="service-item">
            <h4>Карточки пациентов</h4>
            <p>Ведение профилей пациентов, контактных данных и базовой медицинской информации</p>
            <Link to="/patients" className="btn btn-secondary btn-small">Перейти</Link>
          </div>
          <div className="service-item">
            <h4>Справочник врачей</h4>
            <p>Информация о врачах, их специальностях, лицензиях и доступности для записи</p>
            <Link to="/doctors" className="btn btn-secondary btn-small">Перейти</Link>
          </div>
          <div className="service-item">
            <h4>Запись на прием</h4>
            <p>Бронирование времени у врача, управление статусами записи и история обращений</p>
            <Link to="/appointments" className="btn btn-secondary btn-small">Перейти</Link>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          background:
            radial-gradient(circle at top left, rgba(255, 255, 255, 0.9), transparent 35%),
            linear-gradient(135deg, #f6efff 0%, #efe5ff 48%, #e6d9ff 100%);
          color: #352b4e;
          padding: 72px 24px;
          border-radius: 24px;
          text-align: center;
          margin-bottom: 40px;
          border: 1px solid rgba(155, 122, 232, 0.16);
          box-shadow: 0 24px 60px rgba(155, 122, 232, 0.14);
        }

        .hero-content h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }

        .hero-content p {
          font-size: 1.2em;
          margin-bottom: 20px;
          color: #6b6280;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .feature-card {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(248, 243, 255, 0.95));
          padding: 30px;
          border-radius: 18px;
          text-align: center;
          border: 1px solid rgba(155, 122, 232, 0.12);
          box-shadow: 0 10px 30px rgba(123, 109, 156, 0.08);
          transition: transform 0.3s, box-shadow 0.3s, border-color 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 18px 32px rgba(155, 122, 232, 0.14);
          border-color: rgba(155, 122, 232, 0.24);
        }

        .feature-icon {
          font-size: 3em;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          color: #7f62c9;
          margin-bottom: 10px;
        }

        .services {
          margin-bottom: 40px;
        }

        .services h2 {
          text-align: center;
          color: #7f62c9;
          margin-bottom: 30px;
          font-size: 1.8em;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .service-item {
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(246, 239, 255, 0.96));
          padding: 20px;
          border-radius: 18px;
          border-left: 4px solid #9b7ae8;
          box-shadow: 0 10px 24px rgba(123, 109, 156, 0.08);
        }

        .service-item h4 {
          color: #7f62c9;
          margin-bottom: 10px;
        }

        .service-item p {
          color: #6b6280;
          margin-bottom: 15px;
          font-size: 0.95em;
        }
      `}</style>
    </div>
  );
}
