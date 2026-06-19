import { Link } from 'react-router-dom';

const clinicAddress = 'г. Нижний Новгород, ул. Студеная, 101';
const mapCoordinates = '43.999862,56.313633';
const mapWidgetUrl = `https://yandex.ru/map-widget/v1/?ll=${encodeURIComponent(mapCoordinates)}&z=16&pt=${encodeURIComponent(`${mapCoordinates},pm2rdm`)}&lang=ru_RU`;
const fullMapUrl = `https://yandex.ru/maps/?ll=${encodeURIComponent(mapCoordinates)}&z=16&pt=${encodeURIComponent(`${mapCoordinates},pm2rdm`)}`;

const contactPhones = [
  '+7 (831) 200-45-67',
  '+7 (831) 200-45-68',
];

const quickFacts = [
  {
    label: 'Адрес',
    value: clinicAddress,
  },
  {
    label: 'Метро',
    value: 'ст. «Горьковская» — 5 минут пешком',
  },
  {
    label: 'Call-центр',
    value: 'Ежедневно с 07:30 до 20:00',
  },
];

export default function Contacts() {
  return (
    <div className="contacts-page">
      <section className="contacts-hero">
        <div className="contacts-hero__content">
          <span className="contacts-hero__badge">Контакты клиники</span>
          <h1>Как найти клинику и связаться с call-центром</h1>
          <p className="contacts-hero__lead">
            Клиника расположена в центре Нижнего Новгорода рядом со станцией метро
            {' '}
            «Горьковская». На этой странице собраны рабочие телефоны, электронная почта
            и схема проезда.
          </p>

          <div className="contacts-hero__actions">
            <Link to="/appointments" className="btn btn-primary">
              Записаться на прием
            </Link>
            <a className="btn btn-secondary" href={fullMapUrl} target="_blank" rel="noreferrer">
              Открыть в Яндекс Картах
            </a>
          </div>

          <div className="contacts-hero__facts" aria-label="Ключевая информация о клинике">
            {quickFacts.map((fact) => (
              <div className="contacts-hero__fact" key={fact.label}>
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>

          <div className="contacts-hero__channels">
            <div className="contacts-hero__channel">
              <span>Телефоны call-центра</span>
              <div className="contacts-hero__links">
                {contactPhones.map((phone) => (
                  <a key={phone} href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
                ))}
              </div>
            </div>

            <div className="contacts-hero__channel">
              <span>Вопросы и предложения</span>
              <div className="contacts-hero__links">
                <a href="mailto:medisystem@yandex.ru">medisystem@yandex.ru</a>
              </div>
            </div>
          </div>
        </div>

        <aside className="contacts-map-panel" aria-label="Карта и схема проезда">
          <div className="contacts-map-panel__header">
            <div>
              <span className="contacts-card__eyebrow">Схема проезда</span>
              <h2>Карта Яндекса</h2>
            </div>
            <a href={fullMapUrl} target="_blank" rel="noreferrer">
              Открыть полностью
            </a>
          </div>

          <div className="contacts-map-frame-wrap">
            <iframe
              className="contacts-map-frame"
              title="Карта клиники"
              src={mapWidgetUrl}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>

          <div className="contacts-map-panel__details">
            <div>
              <span>Ориентир</span>
              <strong>ул. Студеная, 101</strong>
            </div>
            <div>
              <span>Ближайшее метро</span>
              <strong>Горьковская, 5 минут пешком</strong>
            </div>
            <div>
              <span>Город</span>
              <strong>Нижний Новгород</strong>
            </div>
          </div>
        </aside>
      </section>

      <section className="contacts-grid" aria-label="Контактные данные">
        <article className="contacts-card">
          <span className="contacts-card__eyebrow">Call-центр</span>
          <h3>Телефоны для записи</h3>
          <ul className="contacts-list">
            {contactPhones.map((phone) => (
              <li className="contacts-list__item" key={phone}>
                <span>Запись и подтверждение приема</span>
                <a href={`tel:${phone.replace(/[^\d+]/g, '')}`}>{phone}</a>
              </li>
            ))}
          </ul>
        </article>

        <article className="contacts-card">
          <span className="contacts-card__eyebrow">Обратная связь</span>
          <h3>Вопросы и предложения</h3>
          <p className="contacts-mail">
            Рабочая почта для обращений пациентов и организационных вопросов:
            {' '}
            <a href="mailto:medisystem@yandex.ru">medisystem@yandex.ru</a>
          </p>
          <p className="contacts-card__hint">
            На этот адрес можно направить вопросы по записи, справкам, документам и качеству обслуживания.
          </p>
        </article>

        <article className="contacts-card">
          <span className="contacts-card__eyebrow">Режим работы</span>
          <h3>Часы работы call-центра</h3>
          <div className="contacts-schedule">
            <div>
              <span>Понедельник - пятница</span>
              <strong>07:30 - 20:00</strong>
            </div>
            <div>
              <span>Суббота</span>
              <strong>08:00 - 18:00</strong>
            </div>
            <div>
              <span>Воскресенье</span>
              <strong>09:00 - 17:00</strong>
            </div>
          </div>
        </article>
      </section>

      <style>{`
        .contacts-page {
          display: flex;
          flex-direction: column;
          gap: 32px;
          color: #102542;
        }

        .contacts-hero {
          display: grid;
          grid-template-columns: minmax(0, 1.02fr) minmax(420px, 0.98fr);
          gap: 24px;
          align-items: stretch;
        }

        .contacts-hero__content,
        .contacts-map-panel,
        .contacts-card {
          background: #ffffff;
          border: 1px solid rgba(16, 37, 66, 0.08);
          border-radius: 8px;
          box-shadow: 0 18px 36px rgba(16, 37, 66, 0.08);
        }

        .contacts-hero__content {
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .contacts-hero__badge,
        .contacts-card__eyebrow {
          display: inline-flex;
          align-items: center;
          width: fit-content;
          padding: 6px 10px;
          border-radius: 999px;
          background: rgba(24, 114, 182, 0.1);
          color: #0f5695;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0;
          text-transform: uppercase;
        }

        .contacts-hero__content h1,
        .contacts-map-panel h2,
        .contacts-card h3 {
          margin: 0;
          color: #102542;
        }

        .contacts-hero__content h1 {
          font-size: 40px;
          line-height: 1.1;
          max-width: 12ch;
        }

        .contacts-hero__lead {
          margin: 0;
          max-width: 66ch;
          color: #486581;
          line-height: 1.7;
          font-size: 16px;
        }

        .contacts-hero__actions {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }

        .contacts-hero__facts {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .contacts-hero__fact {
          padding: 16px 18px;
          border-radius: 8px;
          background: #f6fbff;
          border: 1px solid rgba(24, 114, 182, 0.12);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .contacts-hero__fact span,
        .contacts-hero__channel span,
        .contacts-map-panel__details span,
        .contacts-list__item span,
        .contacts-schedule span {
          font-size: 13px;
          color: #6a7f95;
        }

        .contacts-hero__fact strong,
        .contacts-map-panel__details strong,
        .contacts-list__item a,
        .contacts-schedule strong {
          color: #102542;
          font-size: 15px;
          line-height: 1.5;
        }

        .contacts-hero__channels {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 16px;
        }

        .contacts-hero__channel {
          padding: 18px;
          border-radius: 8px;
          background: #fbfdff;
          border: 1px solid rgba(16, 37, 66, 0.08);
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .contacts-hero__links {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .contacts-hero__links a,
        .contacts-list__item a,
        .contacts-mail a,
        .contacts-map-panel__header a {
          color: #0f5695;
          text-decoration: none;
          font-weight: 600;
        }

        .contacts-hero__links a:hover,
        .contacts-list__item a:hover,
        .contacts-mail a:hover,
        .contacts-map-panel__header a:hover {
          text-decoration: underline;
        }

        .contacts-map-panel {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 18px;
          min-width: 0;
        }

        .contacts-map-panel__header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 16px;
        }

        .contacts-map-panel__header h2 {
          font-size: 28px;
          margin-top: 6px;
        }

        .contacts-map-frame-wrap {
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(16, 37, 66, 0.08);
          background: #edf4fb;
          min-height: 420px;
        }

        .contacts-map-frame {
          display: block;
          width: 100%;
          height: 420px;
          border: 0;
        }

        .contacts-map-panel__details {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 12px;
        }

        .contacts-map-panel__details > div {
          padding: 14px 16px;
          border-radius: 8px;
          background: #f8fbfe;
          border: 1px solid rgba(16, 37, 66, 0.08);
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .contacts-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 20px;
        }

        .contacts-card {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .contacts-card__hint,
        .contacts-mail {
          margin: 0;
          color: #486581;
          line-height: 1.7;
        }

        .contacts-list,
        .contacts-schedule {
          display: flex;
          flex-direction: column;
          gap: 14px;
          margin: 0;
          padding: 0;
          list-style: none;
        }

        .contacts-list__item,
        .contacts-schedule > div {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 14px 16px;
          border-radius: 8px;
          background: #f8fbfe;
          border: 1px solid rgba(16, 37, 66, 0.08);
        }

        @media (max-width: 1180px) {
          .contacts-hero {
            grid-template-columns: 1fr;
          }

          .contacts-map-panel__details,
          .contacts-grid,
          .contacts-hero__facts {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }

        @media (max-width: 760px) {
          .contacts-hero__content,
          .contacts-map-panel,
          .contacts-card {
            padding: 20px;
          }

          .contacts-hero__content h1 {
            font-size: 32px;
          }

          .contacts-hero__channels,
          .contacts-map-panel__details,
          .contacts-grid,
          .contacts-hero__facts {
            grid-template-columns: 1fr;
          }

          .contacts-map-frame-wrap,
          .contacts-map-frame {
            min-height: 320px;
            height: 320px;
          }

          .contacts-map-panel__header {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
}
