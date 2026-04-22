import { useId, useState } from 'react';
import '../styles/NewsCards.css';
import { formatNewsDate, getNewsFallbackLabel, getNewsPresentation } from '../utils/newsPresentation';

const getNewsDetails = (item) => {
  const shortDescription = item?.shortDescription?.trim() || '';
  const description = item?.description?.trim() || '';

  if (!description || description === shortDescription) {
    return {
      shortDescription,
      fullDescription: '',
      hasExtraContent: false,
    };
  }

  return {
    shortDescription,
    fullDescription: description,
    hasExtraContent: true,
  };
};

export default function ExpandableNewsCard({ item, variant = 'page' }) {
  const [expanded, setExpanded] = useState(false);
  const detailsId = useId();
  const presentation = getNewsPresentation(item.category || item.title);
  const { shortDescription, fullDescription, hasExtraContent } = getNewsDetails(item);
  const TitleTag = variant === 'ribbon' ? 'h3' : 'h2';

  return (
    <article
      className={`news-card news-card--${variant}${expanded ? ' news-card--expanded' : ''}`}
      style={{
        '--news-card-background': presentation.background,
        '--news-card-accent': presentation.accent,
      }}
    >
      <button
        type="button"
        className="news-card__button"
        onClick={() => setExpanded((currentValue) => !currentValue)}
        aria-expanded={expanded}
        aria-controls={hasExtraContent ? detailsId : undefined}
      >
        <div className={`news-card__media${item.imageUrl ? '' : ' news-card__media--fallback'}`} aria-hidden="true">
          {item.imageUrl ? (
            <img className="news-card__image" src={item.imageUrl} alt={item.title} />
          ) : (
            <span className="news-card__visual">{getNewsFallbackLabel(item)}</span>
          )}
        </div>

        <div className="news-card__content">
          <div className="news-card__meta">
            <time className="news-card__date" dateTime={item.createdAt}>
              {formatNewsDate(item.createdAt)}
            </time>
            {item.category ? <span className="news-card__category">{item.category}</span> : null}
          </div>

          <TitleTag className="news-card__title">{item.title}</TitleTag>
          {shortDescription ? <p className="news-card__summary">{shortDescription}</p> : null}

          {hasExtraContent && expanded ? (
            <div className="news-card__details" id={detailsId}>
              <p>{fullDescription}</p>
            </div>
          ) : null}

          <span className="news-card__action">
            {hasExtraContent ? (expanded ? 'Свернуть' : 'Читать полностью') : 'Новость'}
          </span>
        </div>
      </button>
    </article>
  );
}
