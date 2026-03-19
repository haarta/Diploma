import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { doctorsApi } from '../api';
import '../styles/ServicesCatalog.css';

const SECTION_DEFINITIONS = [
  {
    id: 'main',
    title: 'Основные',
    badge: '01',
    description: 'Основные амбулаторные направления клиники и услуги специалистов.',
  },
  {
    id: 'checkups',
    title: 'Профосмотры и справки',
    badge: '02',
    description: 'Профилактические осмотры, медицинские комиссии, справки и заключения.',
  },
  {
    id: 'diagnostics',
    title: 'Диагностика',
    badge: '03',
    description: 'Инструментальные и функциональные методы обследования с подробным прайсом.',
  },
  {
    id: 'labs',
    title: 'Медицинские анализы',
    badge: '04',
    description: 'Лабораторные профили, панели и отдельные исследования с расшифрованным составом.',
  },
];

const STATIC_CATALOG = {
  checkups: [
    {
      id: 'driver-medical',
      title: 'Медицинские справки для водителей',
      summary: 'Комплексный осмотр для получения или замены водительского удостоверения.',
      description:
        'Программа включает консультации обязательных специалистов и оформление итогового заключения в день обращения.',
      highlights: [
        'Подходит для категорий A, B, C и профессионального транспорта',
        'Оформление справки после прохождения всех специалистов',
        'Возможность пройти осмотр в одном визите',
      ],
      services: [
        { name: 'Справка для категорий A и B', price: 1800 },
        { name: 'Справка для категорий C, D, E', price: 2400 },
        { name: 'Осмотр психиатра', price: 700 },
        { name: 'Осмотр нарколога', price: 700 },
      ],
    },
    {
      id: 'school-checkup',
      title: 'Справки для школы и детского сада',
      summary: 'Профилактические формы и допуски для образовательных учреждений.',
      description:
        'Категория объединяет базовые педиатрические осмотры, заполнение справок и заключения для кружков, бассейна и лагеря.',
      highlights: [
        'Справки для школы, детского сада и спортивных секций',
        'Подготовка документов перед поездками и сменами',
        'Осмотры с заполнением формы без повторных визитов',
      ],
      services: [
        { name: 'Справка в бассейн', price: 950 },
        { name: 'Справка для лагеря', price: 1200 },
        { name: 'Справка после болезни', price: 600 },
        { name: 'Профосмотр перед школой', price: 2100 },
      ],
    },
    {
      id: 'employment-checkup',
      title: 'Профосмотры для работы',
      summary: 'Предварительные и периодические осмотры для сотрудников компаний.',
      description:
        'Используется для оформления на работу, продления допуска и прохождения корпоративных медицинских комиссий.',
      highlights: [
        'Подходит для офисных и производственных профессий',
        'Возможна подготовка пакета документов под работодателя',
        'Отдельные тарифы для периодических комиссий',
      ],
      services: [
        { name: 'Предварительный профосмотр', price: 2900 },
        { name: 'Периодический профосмотр', price: 2600 },
        { name: 'Оформление личной медицинской книжки', price: 3200 },
        { name: 'Заключение терапевта для работодателя', price: 900 },
      ],
    },
  ],
  diagnostics: [
    {
      id: 'ultrasound',
      title: 'Ультразвуковая диагностика',
      summary: 'Серия УЗИ-исследований для оценки внутренних органов, сосудов и мягких тканей.',
      description:
        'Категория подходит для первичной диагностики, контроля динамики лечения и плановых обследований.',
      highlights: [
        'Быстрые исследования без специальной подготовки для большинства зон',
        'Заключение врача УЗД выдается после процедуры',
        'Доступны базовые и расширенные протоколы',
      ],
      services: [
        { name: 'УЗИ органов брюшной полости', price: 1650 },
        { name: 'УЗИ щитовидной железы', price: 1300 },
        { name: 'УЗИ почек и надпочечников', price: 1450 },
        { name: 'УЗИ сосудов шеи', price: 2100 },
      ],
    },
    {
      id: 'functional',
      title: 'Функциональная диагностика',
      summary: 'Методы оценки работы сердца, сосудов и дыхательной системы.',
      description:
        'Раздел включает исследования для диагностики аритмии, гипертензии, нарушений дыхания и контроля лечения.',
      highlights: [
        'Исследования проводятся по записи без госпитализации',
        'Подходят для допуска к операциям и наблюдения в динамике',
        'Результаты можно использовать на консультации врача в тот же день',
      ],
      services: [
        { name: 'ЭКГ с расшифровкой', price: 850 },
        { name: 'Холтер-мониторирование 24 часа', price: 2900 },
        { name: 'СМАД', price: 2500 },
        { name: 'Спирометрия', price: 1100 },
      ],
    },
    {
      id: 'endoscopy',
      title: 'Эндоскопические исследования',
      summary: 'Диагностика желудочно-кишечного тракта с возможностью расширенного протокола.',
      description:
        'Категория используется для оценки слизистых оболочек, исключения воспалительных и язвенных изменений, а также наблюдения после лечения.',
      highlights: [
        'Подготовка к исследованию описывается при записи',
        'Можно выполнить обследование под контролем специалиста',
        'Доступны комплексные протоколы с консультацией',
      ],
      services: [
        { name: 'ФГДС', price: 2600 },
        { name: 'Колоноскопия', price: 4200 },
        { name: 'ФГДС + тест на Helicobacter pylori', price: 3200 },
        { name: 'Консультация по подготовке к эндоскопии', price: 700 },
      ],
    },
  ],
  labs: [
    {
      id: 'allergy',
      title: 'Аллергодиагностика',
      summary: 'Лабораторные тесты для выявления аллергических реакций и подбора тактики лечения.',
      description:
        'Категория объединяет исследования иммуноглобулинов, панели аллергенов и расширенные профили для взрослых и детей.',
      highlights: [
        'Подходит для сезонной, бытовой и пищевой аллергии',
        'Позволяет уточнить спектр подозреваемых аллергенов',
        'Используется как стартовый шаг перед консультацией аллерголога',
      ],
      services: [
        { name: 'Общий иммуноглобулин E (IgE)', price: 570 },
        { name: 'Педиатрическая аллергопанель', price: 4670 },
        { name: 'Пищевая аллергопанель', price: 4380 },
        { name: 'Ингаляционная аллергопанель', price: 4520 },
      ],
    },
    {
      id: 'blood-tests',
      title: 'Общеклинические анализы',
      summary: 'Базовые исследования крови и мочи для первичной оценки состояния организма.',
      description:
        'Раздел подходит для профилактики, контроля хронических состояний и подготовки к консультации врача.',
      highlights: [
        'Результаты подходят для большинства амбулаторных приемов',
        'Доступны отдельные анализы и комбинированные профили',
        'Часть исследований выполняется в день сдачи',
      ],
      services: [
        { name: 'Общий анализ крови с лейкоформулой', price: 490 },
        { name: 'Общий анализ мочи', price: 320 },
        { name: 'СОЭ', price: 240 },
        { name: 'Глюкоза крови', price: 260 },
      ],
    },
    {
      id: 'biochemistry',
      title: 'Биохимические панели',
      summary: 'Комплексные профили для оценки обмена веществ, функции печени, почек и липидного обмена.',
      description:
        'Биохимия назначается при профилактических осмотрах, подготовке к терапии и наблюдении хронических заболеваний.',
      highlights: [
        'Есть базовые и расширенные пакеты',
        'Удобно сдавать как единый профиль вместо набора отдельных тестов',
        'Подходит для скрининга перед консультацией терапевта или кардиолога',
      ],
      services: [
        { name: 'Базовая биохимия крови', price: 1450 },
        { name: 'Печеночный профиль', price: 1320 },
        { name: 'Липидный профиль', price: 1180 },
        { name: 'Почечный профиль', price: 990 },
      ],
    },
  ],
};

const normalize = (value) => String(value || '').trim().toLowerCase();

const pluralize = (count, one, few, many) => {
  const value = Math.abs(Number(count)) % 100;
  const last = value % 10;

  if (value > 10 && value < 20) {
    return many;
  }
  if (last > 1 && last < 5) {
    return few;
  }
  if (last === 1) {
    return one;
  }
  return many;
};

const formatCountLabel = (count, one, few, many, suffix = '') => {
  const base = `${count} ${pluralize(count, one, few, many)}`;
  return suffix ? `${base} ${suffix}` : base;
};

const titleCase = (value) => {
  const text = String(value || '').trim();
  if (!text) {
    return '';
  }
  return text.charAt(0).toUpperCase() + text.slice(1);
};

function buildMainCatalog(doctors) {
  const groups = new Map();

  doctors.forEach((doctor) => {
    const specialty = titleCase(doctor.specialty || 'Без специализации');
    const prices = Array.isArray(doctor.prices) ? doctor.prices : [];

    if (!groups.has(specialty)) {
      groups.set(specialty, {
        id: specialty.toLowerCase().replace(/\s+/g, '-'),
        title: specialty,
        summary: `Консультации и услуги по направлению "${specialty}".`,
        description:
          'Категория формируется автоматически по данным врачей и показывает только те услуги, которые уже заведены в системе.',
        highlights: [
          'Услуги собраны из карточек действующих врачей',
          'Цены берутся из текущего прайса специалистов',
          'Состав категории обновляется автоматически',
        ],
        doctorNames: new Set(),
        services: new Map(),
      });
    }

    const group = groups.get(specialty);
    if (doctor.fullName) {
      group.doctorNames.add(doctor.fullName);
    }

    prices.forEach((price) => {
      const serviceName = titleCase(price?.serviceName);
      if (!serviceName) {
        return;
      }
      const amount = Number(price?.amount);
      const current = group.services.get(serviceName);
      if (!current || (Number.isFinite(amount) && amount < current.price)) {
        group.services.set(serviceName, {
          name: serviceName,
          price: Number.isFinite(amount) ? amount : null,
        });
      }
    });
  });

  return [...groups.values()]
    .map((group) => ({
      id: group.id,
      title: group.title,
      summary: group.summary,
      description: group.description,
      highlights: [
        ...group.highlights,
        `Специалистов в категории: ${formatCountLabel(group.doctorNames.size || 1, 'врач', 'врача', 'врачей')}`,
      ],
      services: [...group.services.values()].sort((a, b) => a.name.localeCompare(b.name, 'ru')),
    }))
    .sort((a, b) => a.title.localeCompare(b.title, 'ru'));
}

function buildSections(doctors) {
  const mainItems = buildMainCatalog(doctors);

  return SECTION_DEFINITIONS.map((section) => ({
    ...section,
    items: section.id === 'main' ? mainItems : STATIC_CATALOG[section.id] || [],
  }));
}

const formatPrice = (value) => (value == null ? 'По запросу' : `${value.toLocaleString('ru-RU')} руб.`);

export default function ServicesCatalog() {
  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ['services-catalog-doctors'],
    queryFn: async () => {
      const response = await doctorsApi.getAll();
      return response.data || [];
    },
  });

  const sections = useMemo(() => buildSections(doctors), [doctors]);
  const [activeSectionId, setActiveSectionId] = useState(SECTION_DEFINITIONS[0].id);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState({});

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) || sections[0] || SECTION_DEFINITIONS[0],
    [sections, activeSectionId]
  );

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
    setActiveSectionId(sectionId);
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryIds((prev) => ({
      ...prev,
      [activeSection.id]: categoryId,
    }));
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
