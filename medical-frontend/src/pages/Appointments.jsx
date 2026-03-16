import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { appointmentsApi, doctorsApi, patientsApi } from '../api';
import { getAccessToken, getTokenPayload, subscribeAuthChange } from '../auth';
import '../styles/AppointmentsBooking.css';

const CLINIC = {
  label: 'Клиника "Здоровье"',
  address: 'г. Нижний Новгород, ул. Студёная, 101',
  workHours: [
    'С понедельника по пятницу с 7:00 до 20:00',
    'Суббота, воскресенье с 8:00 до 18:00',
  ],
  procedureHours: [
    'С понедельника по пятницу с 7:00 до 18:30 (кварцевание 12:00-12:30)',
    'Суббота с 8:00 до 16:00 (кварцевание 12:00-12:30)',
    'Воскресенье с 8:00 до 13:30 (кварцевание 10:00-10:30)',
  ],
};

const AUDIENCE_OPTIONS = [
  { value: 'adult', label: 'Взрослое' },
  { value: 'child', label: 'Детское' },
];

const initialFilters = {
  clinic: CLINIC.label,
  audience: 'adult',
  specialty: '',
  doctorId: '',
  service: '',
};

const initialBookingForm = {
  patientId: '',
  appointmentDate: '',
  appointmentTime: '',
  fullName: '',
  phone: '',
  email: '',
  birthDate: '',
  notes: '',
};

const statusLabels = {
  SCHEDULED: 'Запланирован',
  COMPLETED: 'Завершен',
  CANCELLED: 'Отменен',
};

const statusClasses = {
  SCHEDULED: 'status status--warning',
  COMPLETED: 'status status--success',
  CANCELLED: 'status status--error',
};

const WEEKDAY_LABELS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const DAY_NAME_MAP = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 7,
  ПОНЕДЕЛЬНИК: 1,
  ВТОРНИК: 2,
  СРЕДА: 3,
  ЧЕТВЕРГ: 4,
  ПЯТНИЦА: 5,
  СУББОТА: 6,
  ВОСКРЕСЕНЬЕ: 7,
};

function getMonthStart(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function getMonthLabel(date) {
  return new Intl.DateTimeFormat('ru-RU', {
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function toDateInputValue(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseTimeToMinutes(value) {
  const [hours, minutes] = String(value || '00:00')
    .split(':')
    .map((item) => Number(item));
  return hours * 60 + minutes;
}

function formatMinutesToTime(totalMinutes) {
  const hours = String(Math.floor(totalMinutes / 60)).padStart(2, '0');
  const minutes = String(totalMinutes % 60).padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getDoctorWeekdaySchedule(doctor, isoDate) {
  if (!doctor?.schedules?.length || !isoDate) {
    return null;
  }

  const dayIndex = new Date(isoDate).getDay() || 7;
  return (
    doctor.schedules.find((schedule) => DAY_NAME_MAP[String(schedule.dayOfWeek || '').toUpperCase()] === dayIndex) ||
    null
  );
}

function getAvailableSlotsForDate(doctor, isoDate, busySlots) {
  if (!doctor || !isoDate) {
    return [];
  }

  const schedule = getDoctorWeekdaySchedule(doctor, isoDate);
  if (!schedule?.startTime || !schedule?.endTime) {
    return [];
  }

  const bookedTimes = new Set(
    busySlots
      .filter(
        (appointment) =>
          appointment.appointmentDate === isoDate &&
          appointment.status !== 'CANCELLED'
      )
      .map((appointment) => appointment.appointmentTime)
  );

  const slots = [];
  let current = parseTimeToMinutes(schedule.startTime);
  const end = parseTimeToMinutes(schedule.endTime);

  while (current + 20 <= end) {
    const time = formatMinutesToTime(current);
    slots.push({
      time,
      busy: bookedTimes.has(time),
    });
    current += 20;
  }

  return slots;
}

function getDoctorName(doctor) {
  return doctor?.fullName || 'Неизвестный врач';
}

export default function Appointments() {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(initialFilters);
  const [bookingForm, setBookingForm] = useState(initialBookingForm);
  const [showSchedule, setShowSchedule] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => getMonthStart(new Date()));
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [sessionToken, setSessionToken] = useState(() => getAccessToken());

  const tokenPayload = useMemo(() => getTokenPayload(), [sessionToken]);

  const selectedDoctorIdFromUrl = searchParams.get('doctorId') || '';

  useEffect(() => {
    const unsubscribe = subscribeAuthChange(() => {
      setSessionToken(getAccessToken());
    });

    return unsubscribe;
  }, []);

  const { data: currentPatient = null } = useQuery({
    queryKey: ['current-patient'],
    enabled: Boolean(tokenPayload?.userId),
    retry: false,
    queryFn: async () => {
      const response = await patientsApi.getMe();
      return response.data || null;
    },
  });

  const { data: myAppointments = [] } = useQuery({
    queryKey: ['my-appointments'],
    enabled: Boolean(tokenPayload?.userId),
    queryFn: async () => {
      const response = await appointmentsApi.getMine();
      return response.data || [];
    },
  });

  const { data: doctors = [], isLoading: doctorsLoading } = useQuery({
    queryKey: ['doctors-for-appointments'],
    queryFn: async () => {
      const response = await doctorsApi.getAll();
      return response.data || [];
    },
  });

  const monthRange = useMemo(() => {
    const monthStart = getMonthStart(currentMonth);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    return {
      dateFrom: toDateInputValue(monthStart),
      dateTo: toDateInputValue(monthEnd),
    };
  }, [currentMonth]);

  const { data: busySlots = [] } = useQuery({
    queryKey: ['doctor-busy-slots', filters.doctorId, monthRange.dateFrom, monthRange.dateTo],
    enabled: Boolean(filters.doctorId),
    queryFn: async () => {
      const response = await appointmentsApi.getBusySlots(filters.doctorId, monthRange.dateFrom, monthRange.dateTo);
      return response.data || [];
    },
  });

  const specialties = useMemo(() => {
    const values = doctors
      .map((doctor) => (doctor.specialty || '').trim())
      .filter(Boolean);

    return [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'));
  }, [doctors]);

  const filteredDoctors = useMemo(() => {
    if (!filters.specialty) {
      return doctors;
    }
    return doctors.filter((doctor) => doctor.specialty === filters.specialty);
  }, [doctors, filters.specialty]);

  const selectedDoctor = useMemo(
    () => doctors.find((doctor) => String(doctor.id) === String(filters.doctorId)) || null,
    [doctors, filters.doctorId]
  );

  const selectedService = useMemo(
    () => (selectedDoctor?.prices || []).find((_, index) => `${selectedDoctor.prices[index].serviceName}-${index}` === filters.service) || null,
    [filters.service, selectedDoctor]
  );

  const services = useMemo(() => {
    if (!selectedDoctor?.prices?.length) {
      return [];
    }

    return selectedDoctor.prices
      .filter((price) => price?.serviceName)
      .map((price, index) => ({
        value: `${price.serviceName}-${index}`,
        label: `${price.serviceName}${price.amount ? ` · ${price.amount} ${price.currency || 'RUB'}` : ''}`,
        serviceName: price.serviceName,
      }));
  }, [selectedDoctor]);

  const availableSlots = useMemo(() => {
    return getAvailableSlotsForDate(selectedDoctor, bookingForm.appointmentDate, busySlots);
  }, [bookingForm.appointmentDate, busySlots, selectedDoctor]);

  const calendarDays = useMemo(() => {
    const monthStart = getMonthStart(currentMonth);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const days = [];
    const firstWeekday = monthStart.getDay() === 0 ? 7 : monthStart.getDay();

    for (let i = 1; i < firstWeekday; i += 1) {
      days.push({ id: `empty-start-${i}`, empty: true });
    }

    for (let day = 1; day <= monthEnd.getDate(); day += 1) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const iso = toDateInputValue(date);
      days.push({
        id: iso,
        iso,
        dayNumber: day,
        weekdayLabel: WEEKDAY_LABELS[(date.getDay() + 6) % 7],
        available:
          getAvailableSlotsForDate(selectedDoctor, iso, busySlots).some((slot) => !slot.busy),
      });
    }

    while (days.length % 7 !== 0) {
      days.push({ id: `empty-end-${days.length}`, empty: true });
    }

    return days;
  }, [busySlots, currentMonth, selectedDoctor]);

  useEffect(() => {
    if (!selectedDoctorIdFromUrl || !doctors.length) {
      return;
    }

    const doctorFromUrl = doctors.find((doctor) => String(doctor.id) === String(selectedDoctorIdFromUrl));
    if (!doctorFromUrl) {
      return;
    }

    setFilters((prev) => ({
      ...prev,
      specialty: doctorFromUrl.specialty || '',
      doctorId: String(doctorFromUrl.id),
      service: '',
    }));
  }, [selectedDoctorIdFromUrl, doctors]);

  useEffect(() => {
    if (!tokenPayload?.email) {
      return;
    }

    setBookingForm((prev) => ({
      ...prev,
      email: prev.email || tokenPayload.email,
    }));
  }, [tokenPayload]);

  useEffect(() => {
    if (!currentPatient) {
      return;
    }

    setBookingForm((prev) => ({
      ...prev,
      patientId: currentPatient.id ? String(currentPatient.id) : prev.patientId,
      fullName: currentPatient.fullName || prev.fullName,
      phone: currentPatient.phone || prev.phone,
      email: currentPatient.email || prev.email,
      birthDate: currentPatient.birthDate || prev.birthDate,
    }));
  }, [currentPatient]);

  const createMutation = useMutation({
    mutationFn: async () => {
      const liveTokenPayload = getTokenPayload();
      if (!liveTokenPayload?.userId) {
        throw new Error('Для записи на прием необходимо войти в аккаунт.');
      }

      let patientId = currentPatient?.id || (bookingForm.patientId ? Number(bookingForm.patientId) : null);

      if (!patientId) {
        const patientResponse = await patientsApi.createMe({
          fullName: bookingForm.fullName.trim(),
          birthDate: bookingForm.birthDate || null,
          phone: bookingForm.phone.trim(),
          email: bookingForm.email.trim() || null,
          gender: null,
          address: null,
          allergies: null,
          chronicConditions: null,
          bloodGroup: null,
          rhFactor: null,
          emergencyContactName: null,
          emergencyContactPhone: null,
        });

        patientId = patientResponse.data?.id;
      }

      const notesParts = [];
      if (selectedService?.serviceName) {
        notesParts.push(`Услуга: ${selectedService.serviceName}`);
      }
      if (bookingForm.notes.trim()) {
        notesParts.push(bookingForm.notes.trim());
      }

      return appointmentsApi.createMine({
        patientId: Number(patientId),
        doctorId: Number(selectedDoctor.id),
        appointmentDate: bookingForm.appointmentDate,
        appointmentTime: bookingForm.appointmentTime,
        status: 'SCHEDULED',
        notes: notesParts.join('\n') || null,
        patientFullName: bookingForm.fullName.trim() || currentPatient?.fullName || '',
        patientEmail: bookingForm.email.trim() || currentPatient?.email || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['doctor-busy-slots'] });
      queryClient.invalidateQueries({ queryKey: ['current-patient'] });
      setBookingForm(initialBookingForm);
      setShowSchedule(false);
      setIsBookingModalOpen(false);
      window.alert('Запись успешно создана.');
    },
    onError: (error) => {
      const serverMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.message ||
        'Не удалось оформить запись.';
      window.alert(serverMessage);
    },
  });

  const handleFilterChange = (name, value) => {
    setFilters((prev) => {
      if (name === 'specialty') {
        return { ...prev, specialty: value, doctorId: '', service: '' };
      }
      if (name === 'doctorId') {
        return { ...prev, doctorId: value, service: '' };
      }
      return { ...prev, [name]: value };
    });

    if (name === 'doctorId') {
      if (value) {
        setSearchParams({ doctorId: value });
      } else {
        setSearchParams({});
      }
    }
  };

  const handleBookingFieldChange = (name, value) => {
    setBookingForm((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setBookingForm(initialBookingForm);
    setShowSchedule(false);
    setIsBookingModalOpen(false);
    setSearchParams({});
  };

  const handleShowSchedule = () => {
    if (!filters.specialty || !filters.doctorId || !filters.service) {
      window.alert('Выберите специальность, специалиста и услугу.');
      return;
    }

    setShowSchedule(true);
  };

  const handlePickDate = (day) => {
    if (!day.available) {
      return;
    }

    setBookingForm((prev) => ({ ...prev, appointmentDate: day.iso, appointmentTime: '' }));
    setIsBookingModalOpen(false);
  };

  const openBookingModal = (time) => {
    setBookingForm((prev) => ({ ...prev, appointmentTime: time }));
    setIsBookingModalOpen(true);
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!bookingForm.appointmentDate || !bookingForm.appointmentTime || !selectedDoctor) {
      window.alert('Выберите дату и время приема.');
      return;
    }

    if (!bookingForm.patientId && (!bookingForm.fullName.trim() || !bookingForm.phone.trim())) {
      window.alert('Заполните ФИО и телефон пациента.');
      return;
    }

    if (!bookingForm.email.trim()) {
      window.alert('Укажите e-mail для получения подтверждения записи.');
      return;
    }

    createMutation.mutate();
  };

  if (doctorsLoading) {
    return <div className="loading">Загрузка записи на прием...</div>;
  }

  return (
    <div className="appointments-booking-page">
      <section className="appointments-booking-hero">
        <div>
          <p className="appointments-booking-eyebrow">Онлайн-запись</p>
          <h1>
            {selectedDoctor?.specialty || 'Записаться на прием'}
            {selectedDoctor ? ' - записаться на прием' : ''}
          </h1>
          <p>Для записи к специалисту выберите в фильтре важные для вас параметры приема.</p>
        </div>
      </section>

      <section className="appointments-booking-layout">
        <div className="appointments-booking-main">
          <div className="appointments-filter-panel">
            <label className="appointments-filter-field">
              <span>Клиника</span>
              <select value={filters.clinic} onChange={(event) => handleFilterChange('clinic', event.target.value)}>
                <option value={CLINIC.label}>{CLINIC.label}</option>
              </select>
            </label>

            <label className="appointments-filter-field">
              <span>Категория</span>
              <select value={filters.audience} onChange={(event) => handleFilterChange('audience', event.target.value)}>
                {AUDIENCE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="appointments-filter-field">
              <span>Специальность</span>
              <select value={filters.specialty} onChange={(event) => handleFilterChange('specialty', event.target.value)}>
                <option value="">Выберите специальность</option>
                {specialties.map((specialty) => (
                  <option key={specialty} value={specialty}>
                    {specialty}
                  </option>
                ))}
              </select>
            </label>

            <label className="appointments-filter-field">
              <span>Специалист</span>
              <select value={filters.doctorId} onChange={(event) => handleFilterChange('doctorId', event.target.value)}>
                <option value="">Выберите специалиста</option>
                {filteredDoctors.map((doctor) => (
                  <option key={doctor.id} value={doctor.id}>
                    {doctor.fullName}
                  </option>
                ))}
              </select>
            </label>

            <label className={`appointments-filter-field${!filters.service && showSchedule ? ' appointments-filter-field--error' : ''}`}>
              <span>Услуга</span>
              <select value={filters.service} onChange={(event) => handleFilterChange('service', event.target.value)}>
                <option value="">Выберите услугу</option>
                {services.map((service) => (
                  <option key={service.value} value={service.value}>
                    {service.label}
                  </option>
                ))}
              </select>
              {!filters.service && showSchedule ? <small>* Для записи необходимо выбрать услугу</small> : null}
            </label>

            <div className="appointments-filter-actions">
              <button type="button" className="appointments-primary-action" onClick={handleShowSchedule}>
                Показать расписание
              </button>
              <button type="button" className="appointments-secondary-action" onClick={clearFilters}>
                Очистить фильтр
              </button>
            </div>
          </div>

          {showSchedule ? (
            <section className="appointments-schedule-card">
              <div className="appointments-schedule-card__head">
                <div>
                  <h2>Выберите подходящую дату для записи</h2>
                  <p>Зеленый индикатор означает, что запись доступна. Серый индикатор означает, что время нужно уточнить у оператора.</p>
                </div>
                <div className="appointments-schedule-legend">
                  <span>
                    <i className="appointments-schedule-dot appointments-schedule-dot--available" />
                    Есть время для записи
                  </span>
                  <span>
                    <i className="appointments-schedule-dot appointments-schedule-dot--unavailable" />
                    Уточните у оператора по телефону 8 (8332) 255-100
                  </span>
                </div>
              </div>

              <div className="appointments-schedule-card__toolbar">
                <button
                  type="button"
                  className="appointments-month-nav"
                  onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                >
                  Назад
                </button>
                <div className="appointments-month-label">{getMonthLabel(currentMonth)}</div>
                <button
                  type="button"
                  className="appointments-month-nav"
                  onClick={() => setCurrentMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                >
                  Вперед
                </button>
              </div>

              <div className="appointments-calendar">
                {WEEKDAY_LABELS.map((label) => (
                  <div key={label} className="appointments-calendar__weekday">
                    {label}
                  </div>
                ))}

                {calendarDays.map((day) => {
                  if (day.empty) {
                    return <div key={day.id} className="appointments-calendar__cell appointments-calendar__cell--empty" />;
                  }

                  const isSelected = bookingForm.appointmentDate === day.iso;

                  return (
                    <button
                      key={day.id}
                      type="button"
                      className={`appointments-calendar__cell${day.available ? '' : ' appointments-calendar__cell--unavailable'}${isSelected ? ' appointments-calendar__cell--selected' : ''}`}
                      onClick={() => handlePickDate(day)}
                    >
                      <span className="appointments-calendar__day">{day.dayNumber}</span>
                      <span className="appointments-calendar__weekday-label">{day.weekdayLabel}</span>
                      <i
                        className={`appointments-schedule-dot ${day.available ? 'appointments-schedule-dot--available' : 'appointments-schedule-dot--unavailable'}`}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="appointments-schedule-card__footer">
                {bookingForm.appointmentDate ? (
                  <p>Выбрана дата: <strong>{bookingForm.appointmentDate}</strong></p>
                ) : (
                  <p>Выберите день в календаре, чтобы перейти к выбору времени приема.</p>
                )}
              </div>
            </section>
          ) : null}

          {showSchedule && bookingForm.appointmentDate ? (
            <section className="appointments-slots-card">
              <div className="appointments-slots-card__head">
                <div>
                  <h2>{selectedDoctor ? getDoctorName(selectedDoctor) : 'Специалист'}</h2>
                  <p>
                    {selectedDoctor?.specialty || 'Специалист'}
                    {selectedService?.serviceName ? ` · ${selectedService.serviceName}` : ''}
                  </p>
                </div>
                <div className="appointments-slots-card__meta">
                  <span>Дата приема</span>
                  <strong>{bookingForm.appointmentDate}</strong>
                </div>
              </div>

              {availableSlots.length > 0 ? (
                <div className="appointments-slots-grid">
                  {availableSlots.map((slot) => (
                    <button
                      key={slot.time}
                      type="button"
                      className={`appointments-slot${slot.busy ? ' appointments-slot--busy' : ''}${bookingForm.appointmentTime === slot.time ? ' appointments-slot--selected' : ''}`}
                      onClick={() => {
                        if (!slot.busy) {
                          openBookingModal(slot.time);
                        }
                      }}
                      disabled={slot.busy}
                    >
                      <span>{slot.time}</span>
                      <small>{slot.busy ? 'занято' : '20 мин'}</small>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="appointments-slots-empty">
                  <h3>На выбранную дату слоты не найдены</h3>
                  <p>Попробуйте выбрать другой день в календаре.</p>
                </div>
              )}

              <div className="appointments-slots-card__hint">
                {bookingForm.appointmentTime ? (
                  <p>Выбрано время: <strong>{bookingForm.appointmentTime}</strong>. Теперь заполните данные пациента в открывшемся окне.</p>
                ) : (
                  <p>Выберите свободный временной слот. После этого откроется окно для заполнения данных пациента.</p>
                )}
              </div>
            </section>
          ) : null}
        </div>

        <aside className="appointments-booking-sidebar">
          <section className="appointments-info-card">
            <h3>
              {CLINIC.label}, {CLINIC.address}
            </h3>
            <div className="appointments-info-card__block">
              <strong>Время работы:</strong>
              {CLINIC.workHours.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
            <div className="appointments-info-card__block">
              <strong>Процедурный кабинет:</strong>
              {CLINIC.procedureHours.map((item) => (
                <p key={item}>{item}</p>
              ))}
            </div>
          </section>

          {selectedDoctor ? (
            <section className="appointments-doctor-preview">
              <div className="appointments-doctor-preview__photo">
                {selectedDoctor.photoUrl ? (
                  <img src={selectedDoctor.photoUrl} alt={selectedDoctor.fullName} />
                ) : (
                  <div className="appointments-doctor-preview__placeholder">Фото</div>
                )}
              </div>
              <div className="appointments-doctor-preview__content">
                <h3>{getDoctorName(selectedDoctor)}</h3>
                <p>{selectedDoctor.specialty || 'Специалист'}</p>
                <span>Стаж: {selectedDoctor.experienceYears ?? 'не указан'} лет</span>
              </div>
            </section>
          ) : (
            <section className="appointments-doctor-preview appointments-doctor-preview--empty">
              <div className="appointments-doctor-preview__content">
                <h3>Специалист не выбран</h3>
                <p>Выберите врача слева, чтобы увидеть карточку специалиста и завершить запись.</p>
              </div>
            </section>
          )}
        </aside>
      </section>

      <section className="appointments-history card">
        <div className="card-header">
          <h2>Текущие записи</h2>
        </div>

        {myAppointments.length === 0 ? (
          <div className="empty-state">
            <h3>Записей пока нет</h3>
            <p>После создания записи она появится в этой таблице.</p>
          </div>
        ) : (
          <div className="page-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Пациент</th>
                  <th>Врач</th>
                  <th>Дата</th>
                  <th>Время</th>
                  <th>Статус</th>
                </tr>
              </thead>
              <tbody>
                {myAppointments.map((appointment) => {
                  const doctor = doctors.find((item) => String(item.id) === String(appointment.doctorId));

                  return (
                    <tr key={appointment.id}>
                      <td>{currentPatient?.fullName || bookingForm.fullName || 'Пациент'}</td>
                      <td>{doctor?.fullName || 'Неизвестный врач'}</td>
                      <td>{appointment.appointmentDate || '—'}</td>
                      <td>{appointment.appointmentTime || '—'}</td>
                      <td>
                        <span className={statusClasses[appointment.status] || 'status status--info'}>
                          {statusLabels[appointment.status] || appointment.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isBookingModalOpen ? (
        <div className="appointments-modal" onClick={() => setIsBookingModalOpen(false)}>
          <div className="appointments-modal__dialog" onClick={(event) => event.stopPropagation()}>
            <div className="appointments-modal__head">
              <div>
                <p className="appointments-booking-eyebrow">Шаг 2</p>
                <h2>Данные пациента для записи</h2>
                <p className="appointments-modal__subtitle">
                  {selectedDoctor ? `${getDoctorName(selectedDoctor)}, ${selectedDoctor.specialty || 'специалист'}` : 'Запись на прием'}
                  {bookingForm.appointmentDate && bookingForm.appointmentTime
                    ? ` · ${bookingForm.appointmentDate} в ${bookingForm.appointmentTime}`
                    : ''}
                </p>
              </div>
              <button type="button" className="appointments-modal__close" onClick={() => setIsBookingModalOpen(false)}>
                ×
              </button>
            </div>

            <form className="appointments-modal__form" onSubmit={handleSubmit}>
              <div className="appointments-booking-form__grid">
                <label className="appointments-filter-field">
                  <span>ФИО</span>
                  <input
                    type="text"
                    value={bookingForm.fullName}
                    onChange={(event) => handleBookingFieldChange('fullName', event.target.value)}
                    placeholder="Введите ФИО пациента"
                  />
                </label>

                <label className="appointments-filter-field">
                  <span>Телефон</span>
                  <input
                    type="tel"
                    value={bookingForm.phone}
                    onChange={(event) => handleBookingFieldChange('phone', event.target.value)}
                    placeholder="+7 (___) ___-__-__"
                  />
                </label>

                <label className="appointments-filter-field">
                  <span>E-mail</span>
                  <input
                    type="email"
                    value={bookingForm.email}
                    onChange={(event) => handleBookingFieldChange('email', event.target.value)}
                    placeholder="you@example.com"
                    required
                  />
                </label>

                <label className="appointments-filter-field">
                  <span>Дата рождения</span>
                  <input
                    type="date"
                    value={bookingForm.birthDate}
                    onChange={(event) => handleBookingFieldChange('birthDate', event.target.value)}
                  />
                </label>

                <label className="appointments-filter-field appointments-filter-field--full">
                  <span>Комментарий</span>
                  <textarea
                    rows="4"
                    value={bookingForm.notes}
                    onChange={(event) => handleBookingFieldChange('notes', event.target.value)}
                    placeholder="Дополнительная информация для записи"
                  />
                </label>
              </div>

              {currentPatient ? (
                <div className="appointments-modal__note">
                  Данные подставлены из вашего аккаунта и будут использованы для записи.
                </div>
              ) : null}

              <div className="appointments-modal__note">
                На указанный e-mail будет отправлено подтверждение записи.
              </div>

              <div className="appointments-modal__actions">
                <button type="button" className="appointments-secondary-action" onClick={() => setIsBookingModalOpen(false)}>
                  Назад
                </button>
                <button className="appointments-submit-action" type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Создаем запись...' : 'Подтвердить запись'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
