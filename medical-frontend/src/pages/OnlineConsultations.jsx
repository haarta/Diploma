import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { onlineConsultationsApi } from '../api';

function OnlineConsultationCard({ item }) {
  const className = `online-consultation-card${item.imageUrl ? '' : ' online-consultation-card--no-image'}`;
  const style = item.imageUrl
    ? { '--online-consultation-image': `url("${item.imageUrl}")` }
    : undefined;

  return (
    <article className={className} style={style}>
      <span className="online-consultation-card__eyebrow">Онлайн-консультация</span>
      <h2>{item.title}</h2>
      <p className="online-consultation-card__summary">{item.shortDescription}</p>
      {item.description ? <p className="online-consultation-card__description">{item.description}</p> : null}
      <div className="online-consultation-card__actions">
        {item.buttonLink ? (
          <a className="btn btn-success" href={item.buttonLink} target="_blank" rel="noreferrer">
            {item.buttonText || 'Записаться на прием'}
          </a>
        ) : (
          <Link className="btn btn-success" to="/appointments">
            {item.buttonText || 'Записаться на прием'}
          </Link>
        )}
      </div>
    </article>
  );
}

export default function OnlineConsultations() {
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['public-online-consultations'],
    queryFn: async () => {
      const response = await onlineConsultationsApi.getAll();
      return response.data || [];
    },
  });

  return (
    <div className="online-consultations-page">
      <section className="online-consultations-hero">
        <div>
          <span className="online-consultations-hero__badge">Дистанционный формат</span>
          <h1>Онлайн-консультации</h1>
          <p>Получите рекомендации специалиста, не выходя из дома. Содержимое этого раздела настраивается из админ-панели.</p>
        </div>
      </section>

      {isLoading ? (
        <div className="loading">Загрузка онлайн-консультаций...</div>
      ) : items.length === 0 ? (
        <div className="empty-state">
          <h3>Карточек пока нет</h3>
          <p>Добавьте онлайн-консультацию в админ-панели, и она появится здесь.</p>
        </div>
      ) : (
        <>
          <div className="online-consultation-list">
            {items.map((item) => (
              <OnlineConsultationCard key={item.id} item={item} />
            ))}
          </div>

          <section className="online-consultation-steps">
            <h2>Как это работает</h2>
            <div className="online-consultation-steps__grid">
              <article className="online-consultation-step" data-step="1">
                <p>Выберите необходимую консультацию, заполните форму и оплатите.</p>
              </article>
              <article className="online-consultation-step" data-step="2">
                <p>Дождитесь звонка оператора Call-центра и подтвердите запись на консультацию.</p>
              </article>
              <article className="online-consultation-step" data-step="3">
                <p>В назначенное время с Вами свяжется специалист по видео или аудио звонку.</p>
              </article>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
