import { formatPromotionPeriod } from '../utils/promotions';

export default function PromotionDetailsModal({ promotion, onClose }) {
  if (!promotion) {
    return null;
  }

  return (
    <div className="promotion-modal" role="dialog" aria-modal="true">
      <div className="promotion-modal__backdrop" onClick={onClose} />
      <div className="promotion-modal__card">
        <button className="promotion-modal__close" type="button" onClick={onClose} aria-label="Закрыть окно акции">
          x
        </button>
        {promotion.imageUrl ? (
          <img className="promotion-modal__image" src={promotion.imageUrl} alt={promotion.title} />
        ) : null}
        <h2>{promotion.title}</h2>
        <p className="promotion-card__period">{formatPromotionPeriod(promotion)}</p>
        <p>{promotion.shortDescription}</p>
        {promotion.description ? <p>{promotion.description}</p> : null}
        {promotion.buttonLink ? (
          <a className="btn btn-primary" href={promotion.buttonLink} target="_blank" rel="noreferrer">
            Перейти
          </a>
        ) : null}
      </div>
    </div>
  );
}

