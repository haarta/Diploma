const promotionDateFormatter = new Intl.DateTimeFormat('ru-RU', {
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

  return promotionDateFormatter.format(date);
};

export const formatPromotionPeriod = (promotion = {}) => {
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

