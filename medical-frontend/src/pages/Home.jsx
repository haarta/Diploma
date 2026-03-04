import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <div className="hero-content">
          <h1>Медицинская клиника «Здоровье»</h1>
          <p>Современное медицинское обслуживание высочайшего качества</p>
          <Link to="/appointments" className="btn btn-primary" style={{ marginTop: '20px', display: 'inline-block' }}>
            Записаться на приём
          </Link>
        </div>
      </section>

      <section className="features">
        <div className="feature-card">
          <div className="feature-icon">👨‍⚕️</div>
          <h3>Опытные врачи</h3>
          <p>Специалисты высокой квалификации с многолетним опытом</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🏥</div>
          <h3>Современное оборудование</h3>
          <p>Диагностика и лечение на новейшем медицинском оборудовании</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <h3>Быстрое обслуживание</h3>
          <p>Удобная запись и минимальное время ожидания</p>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💊</div>
          <h3>Полный спектр услуг</h3>
          <p>От диагностики до лечения и реабилитации</p>
        </div>
      </section>

      <section className="services">
        <h2>Основные сервисы</h2>
        <div className="services-grid">
          <div className="service-item">
            <h4>Управление пациентами</h4>
            <p>Ведение медицинских карт, история болезни</p>
            <Link to="/patients" className="btn btn-secondary btn-small">Перейти</Link>
          </div>
          <div className="service-item">
            <h4>Справочник врачей</h4>
            <p>Информация о врачах и их специальностях</p>
            <Link to="/doctors" className="btn btn-secondary btn-small">Перейти</Link>
          </div>
          <div className="service-item">
            <h4>Запись на приём</h4>
            <p>Бронирование времени у врача онлайн</p>
            <Link to="/appointments" className="btn btn-secondary btn-small">Перейти</Link>
          </div>
        </div>
      </section>

      <style>{`
        .hero {
          background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
          color: white;
          padding: 60px 20px;
          border-radius: 8px;
          text-align: center;
          margin-bottom: 40px;
        }

        .hero-content h1 {
          font-size: 2.5em;
          margin-bottom: 10px;
        }

        .hero-content p {
          font-size: 1.2em;
          margin-bottom: 20px;
        }

        .features {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .feature-card {
          background: white;
          padding: 30px;
          border-radius: 8px;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          transition: transform 0.3s;
        }

        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .feature-icon {
          font-size: 3em;
          margin-bottom: 16px;
        }

        .feature-card h3 {
          color: #0066cc;
          margin-bottom: 10px;
        }

        .services {
          margin-bottom: 40px;
        }

        .services h2 {
          text-align: center;
          color: #0066cc;
          margin-bottom: 30px;
          font-size: 1.8em;
        }

        .services-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
        }

        .service-item {
          background: white;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #0066cc;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .service-item h4 {
          color: #0066cc;
          margin-bottom: 10px;
        }

        .service-item p {
          color: #666;
          margin-bottom: 15px;
          font-size: 0.95em;
        }
      `}</style>
    </div>
  );
}
