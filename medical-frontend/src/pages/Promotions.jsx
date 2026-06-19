import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { promotionsApi } from '../api';
import PromotionDetailsModal from '../components/PromotionDetailsModal';
import { formatPromotionPeriod } from '../utils/promotions';

export default function Promotions() {
  const [selectedPromotion, setSelectedPromotion] = useState(null);

  const { data: promotions = [], isLoading } = useQuery({
    queryKey: ['public-promotions'],
    queryFn: async () => {
      const response = await promotionsApi.getAll();
      return response.data || [];
    },
  });

  return (
    <div className="promotions-page">
      <section className="promotions-hero">
        <div>
          <span className="promotions-hero__badge">Спецпредложения</span>
          <h1>Акции и специальные предложения</h1>
        </div>
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

      <PromotionDetailsModal promotion={selectedPromotion} onClose={() => setSelectedPromotion(null)} />
    </div>
  );
}
