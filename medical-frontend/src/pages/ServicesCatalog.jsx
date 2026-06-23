import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { doctorsApi } from '../api';
import {
  buildSections,
  formatCountLabel,
  formatPrice,
  SECTION_DEFINITIONS,
} from '../data/servicesCatalog';
import '../styles/ServicesCatalog.css';

export default function ServicesCatalog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSectionId = SECTION_DEFINITIONS.some((section) => section.id === searchParams.get('section'))
    ? searchParams.get('section')
    : SECTION_DEFINITIONS[0].id;
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['services-catalog-doctors'],
    queryFn: async () => {
      const response = await doctorsApi.getAll();
      return response.data || [];
    },
  });

  const sections = useMemo(() => buildSections(doctors), [doctors]);
  const [activeSectionId, setActiveSectionId] = useState(initialSectionId);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState({});

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0] || SECTION_DEFINITIONS[0],
    [sections, activeSectionId]
  );

  useEffect(() => {
    const sectionParam = searchParams.get('section');
    if (!sectionParam) {
      return;
    }

    const matchedSection = sections.find((section) => section.id === sectionParam);

    if (!matchedSection) {
      return;
    }

    if (matchedSection.id !== activeSectionId) {
      setActiveSectionId(matchedSection.id);
    }

    if (!matchedSection.items.length) {
      return;
    }

    const categoryParam = searchParams.get('category');
    const matchedCategory =
      matchedSection.items.find((item) => item.id === categoryParam) || matchedSection.items[0];

    setSelectedCategoryIds((prev) => {
      if (prev[matchedSection.id] === matchedCategory.id) {
        return prev;
      }

      return {
        ...prev,
        [matchedSection.id]: matchedCategory.id,
      };
    });
  }, [activeSectionId, searchParams, sections]);

  useEffect(() => {
    if (!activeSection?.items?.length) {
      return;
    }

    setSelectedCategoryIds((prev) => ({
      ...prev,
      [activeSection.id]: prev[activeSection.id] || activeSection.items[0].id,
    }));
  }, [activeSection]);

  const selectedCategory = useMemo(() => {
    if (!activeSection?.items?.length) {
      return null;
    }

    const selectedId = selectedCategoryIds[activeSection.id] || activeSection.items[0].id;
    return activeSection.items.find((item) => item.id === selectedId) || activeSection.items[0];
  }, [activeSection, selectedCategoryIds]);

  const handleSectionSelect = (sectionId) => {
    const nextSection = sections.find((section) => section.id === sectionId);
    if (!nextSection) {
      return;
    }

    setActiveSectionId(sectionId);

    const nextCategoryId = selectedCategoryIds[sectionId] || nextSection.items[0]?.id || null;

    if (nextCategoryId) {
      setSelectedCategoryIds((prev) => ({
        ...prev,
        [sectionId]: nextCategoryId,
      }));
    }

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('section', sectionId);
    if (nextCategoryId) {
      nextParams.set('category', nextCategoryId);
    } else {
      nextParams.delete('category');
    }
    setSearchParams(nextParams);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryIds((prev) => ({
      ...prev,
      [activeSection.id]: categoryId,
    }));

    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('section', activeSection.id);
    nextParams.set('category', categoryId);
    setSearchParams(nextParams);
  };

  if (isLoading) {
    return <div className="loading">Загрузка каталога услуг...</div>;
  }

  return (
    <div className="services-catalog-page">
      <section className="services-catalog-hero">
        <p className="services-catalog-eyebrow">Услуги и цены</p>
        <h1>Каталог услуг клиники</h1>
        <p>
          Выберите раздел слева, затем категорию услуги или анализа. Справа откроется подробная карточка
          с описанием и полным списком услуг с ценами.
        </p>
      </section>

      <section className="services-catalog-window">
        <aside className="services-catalog-sidebar" aria-label="Разделы услуг">
          {sections.map((section) => (
            <button
              key={section.id}
              type="button"
              className={`services-catalog-option${section.id === activeSection.id ? ' services-catalog-option--active' : ''}`}
              onClick={() => handleSectionSelect(section.id)}
            >
              <span className="services-catalog-option__badge">{section.badge}</span>
              <span className="services-catalog-option__body">
                <span className="services-catalog-option__title">{section.title}</span>
                <span className="services-catalog-option__meta">
                  {formatCountLabel(section.items.length, 'категория', 'категории', 'категорий')}
                </span>
              </span>
              <span className="services-catalog-option__arrow">›</span>
            </button>
          ))}
        </aside>

        <div className="services-catalog-content">
          <div className="services-catalog-card">
            <span className="services-catalog-card__label">Выбранный раздел</span>
            <h2>{activeSection.title}</h2>
            <p>{activeSection.description}</p>
          </div>

          {!activeSection.items.length ? (
            <div className="services-catalog-empty">
              <h3>Категории пока не добавлены</h3>
              <p>Для этого раздела пока нет данных. Можно позже дополнить каталог вручную.</p>
            </div>
          ) : (
            <div className="services-browser">
              <div className="services-browser__menu">
                {activeSection.items.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`services-browser__item${selectedCategory?.id === item.id ? ' services-browser__item--active' : ''}`}
                    onClick={() => handleCategorySelect(item.id)}
                  >
                    <span className="services-browser__item-title">{item.title}</span>
                    <span className="services-browser__item-meta">
                      {formatCountLabel(item.services.length, 'услуга', 'услуги', 'услуг', 'в категории')}
                    </span>
                  </button>
                ))}
              </div>

              {selectedCategory ? (
                <article className="service-detail-card">
                  <div className="service-detail-card__hero">
                    <div>
                      <p className="service-detail-card__eyebrow">{activeSection.title}</p>
                      <h3>{selectedCategory.title}</h3>
                      <p className="service-detail-card__summary">{selectedCategory.summary}</p>
                    </div>
                  </div>

                  <div className="service-detail-card__body">
                    <p className="service-detail-card__description">{selectedCategory.description}</p>

                    <ul className="service-detail-card__highlights">
                      {selectedCategory.highlights.map((highlight) => (
                        <li key={highlight}>{highlight}</li>
                      ))}
                    </ul>

                    <div className="service-detail-card__prices">
                      <h4>Стоимость услуг</h4>
                      <div className="service-price-table">
                        {selectedCategory.services.map((service) => (
                          <div key={service.name} className="service-price-row">
                            <div className="service-price-row__name">{service.name}</div>
                            <div className="service-price-row__price">{formatPrice(service.price)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {activeSection.id === 'main' ? (
                      <div className="service-detail-card__actions">
                        <Link
                          className="btn btn-primary service-detail-card__action"
                          to={`/appointments?specialty=${encodeURIComponent(selectedCategory.title)}`}
                        >
                          Оформить
                        </Link>
                      </div>
                    ) : null}
                  </div>
                </article>
              ) : null}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
