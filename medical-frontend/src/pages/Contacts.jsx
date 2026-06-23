import { Link } from 'react-router-dom';
import '../styles/Contacts.css';

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
    label: 'call-центр',
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
          <span className="contacts-card__eyebrow">call-центр</span>
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

    </div>
  );
}
