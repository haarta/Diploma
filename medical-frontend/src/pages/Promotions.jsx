import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '../api';

const dateFormatter = new Intl.DateTimeFormat('ru-RU', {
  day: 'numeric',
  month: 'long',
});

const formatDate = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return dateFormatter.format(date);
};

const formatPromotionPeriod = (promotion) => {
  const { activeFrom, activeTo } = promotion;

  if (!activeFrom && !activeTo) {
    return 'Срок действия уточняйте у администратора';
  }
  if (activeFrom && activeTo) {
    return `Действует с ${formatDate(activeFrom)} по ${formatDate(activeTo)}`;
  }
  if (activeFrom) {
    return `Действует с ${formatDate(activeFrom)}`;
  }
  return `Действует до ${formatDate(activeTo)}`;
};

export default function Promotions() {
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['public-promotions'],
    queryFn: async () => {
      const response = await promotionsApi.getAll();
      return response.data || [];
    },
  });

  const heroPromotion = useMemo(() => promotions[0] || null, [promotions]);

  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="promotions-hero__badge">Спецпредложения</span>
          <h1>Акции и специальные предложения</h1>
          <p>Публикуем актуальные предложения клиники в удобном формате карточек.</p>
        </div>
        {heroPromotion ? (
          <button className="btn btn-primary" type="button" onClick={() => setSelectedPromotion(heroPromotion)}>
            Подробнее о главной акции
          </button>
        ) : null}
      </section>

      {isLoading ? (
        <div className="loading">Загрузка акций...</div>
      ) : promotions.length === 0 ? (
        <div className="empty-state">
          <h3>Сейчас нет опубликованных акций</h3>
          <p>Добавьте акцию в админке и включите публикацию.</p>
        </div>
      ) : (
        <div className="promotion-card-list">
          {promotions.map((promotion) => (
            <article className="promotion-card" key={promotion.id}>
              <div className="promotion-card__media">
                {promotion.imageUrl ? (
                  <img src={promotion.imageUrl} alt={promotion.title} />
                ) : (
                  <div className="promotion-card__placeholder">АКЦИЯ</div>
                )}
              </div>

              <div className="promotion-card__body">
                <div className="promotion-card__meta">Акция</div>
                <h2>{promotion.title}</h2>
                <p className="promotion-card__summary">{promotion.shortDescription}</p>
                <p className="promotion-card__period">{formatPromotionPeriod(promotion)}</p>
                <div className="promotion-card__actions">
                  <button className="btn btn-secondary" type="button" onClick={() => setSelectedPromotion(promotion)}>
                    {promotion.buttonText || 'Подробнее'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {selectedPromotion ? (
        <div className="promotion-modal" role="dialog" aria-modal="true">
          <div className="promotion-modal__backdrop" onClick={() => setSelectedPromotion(null)} />
          <div className="promotion-modal__card">
            <button className="promotion-modal__close" type="button" onClick={() => setSelectedPromotion(null)}>x</button>
            {selectedPromotion.imageUrl ? (
              <img className="promotion-modal__image" src={selectedPromotion.imageUrl} alt={selectedPromotion.title} />
            ) : null}
            <h2>{selectedPromotion.title}</h2>
            <p className="promotion-card__period">{formatPromotionPeriod(selectedPromotion)}</p>
            <p>{selectedPromotion.shortDescription}</p>
            {selectedPromotion.description ? <p>{selectedPromotion.description}</p> : null}
            {selectedPromotion.buttonLink ? (
              <a className="btn btn-primary" href={selectedPromotion.buttonLink} target="_blank" rel="noreferrer">
                Перейти
              </a>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
