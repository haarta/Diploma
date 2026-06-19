import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminReportsApi } from '../api';

const periodOptions = [
  { value: 7, label: '7 дней' },
  { value: 30, label: '30 дней' },
  { value: 90, label: '90 дней' },
];

const statusOptions = [
  { value: '', label: 'Все статусы' },
  { value: 'SCHEDULED', label: 'Запланированные' },
  { value: 'CONFIRMED', label: 'Подтверждённые' },
  { value: 'COMPLETED', label: 'Завершённые' },
  { value: 'CANCELLED', label: 'Отменённые' },
  { value: 'NO_SHOW', label: 'Неявка' },
];

const summaryMeta = [
  { key: 'totalAppointments', label: 'Всего записей', accent: 'violet' },
  { key: 'scheduledAppointments', label: 'Активные записи', accent: 'blue' },
  { key: 'completedAppointments', label: 'Завершённые / неявки', accent: 'green' },
  { key: 'cancelledAppointments', label: 'Отменённые', accent: 'rose' },
];

const statusLabels = {
  SCHEDULED: 'Запланированные',
  CONFIRMED: 'Подтверждённые',
  COMPLETED: 'Завершённые',
  CANCELLED: 'Отменённые',
  NO_SHOW: 'Неявка',
};

const formatCount = (value) => new Intl.NumberFormat('ru-RU').format(value || 0);
const formatPercent = (value) => `${Number(value || 0).toFixed(1)}%`;
const formatDate = (value) =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit' }).format(new Date(value));
const formatFullDate = (value) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' }).format(new Date(value));
const formatMoney = (value) =>
  new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}

export default function AdminAnalytics() {
  const [days, setDays] = useState(30);
  const [doctorId, setDoctorId] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [status, setStatus] = useState('');

  const filters = useMemo(
    () => ({
      days,
      doctorId: doctorId ? Number(doctorId) : undefined,
      specialty: specialty || undefined,
      status: status || undefined,
    }),
    [days, doctorId, specialty, status]
  );

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-analytics', filters],
    queryFn: async () => {
      const response = await adminReportsApi.getDashboard(filters);
      return response.data;
    },
  });

  const doctors = data?.doctorLoad || [];
  const specialties = [...new Set(doctors.map((item) => item.specialty).filter(Boolean))];

  const handleExport = async (type) => {
    const response = type === 'excel'
      ? await adminReportsApi.exportExcel(filters)
      : await adminReportsApi.exportPdf(filters);
    downloadBlob(response.data, type === 'excel' ? 'analytics.xlsx' : 'analytics.pdf');
  };

  if (isLoading) {
    return (
      <div className="card">
        <div className="card-header page-toolbar">
          <h2>Аналитика</h2>
        </div>
        <p>Загрузка данных...</p>
      </div>
    );
  }

  if (isError) {
    const message = error?.response?.data?.error || error?.message || 'Не удалось загрузить аналитику.';
    return (
      <div className="card">
        <div className="card-header page-toolbar">
          <h2>Аналитика</h2>
        </div>
        <p>{message}</p>
      </div>
    );
  }

  const summary = data?.summary || {};
  const appointmentsByDay = data?.appointmentsByDay || [];
  const appointmentsByStatus = data?.appointmentsByStatus || [];
  const specialtyBreakdown = data?.specialtyBreakdown || [];
  const doctorLoad = data?.doctorLoad || [];
  const topServices = data?.topServices || [];
  const statusCounts = Object.fromEntries(
    appointmentsByStatus.map((item) => [item.status, Number(item.count || 0)])
  );
  const completedOnlyCount = Number(statusCounts.COMPLETED || 0);
  const disruptionCount = Number(statusCounts.CANCELLED || 0) + Number(statusCounts.NO_SHOW || 0);
  const topDoctorLoad = doctorLoad.slice(0, 6);
  const doctorLoadMax = Math.max(...topDoctorLoad.map((item) => item.totalAppointments), 1);
  const averageCheck =
    completedOnlyCount > 0
      ? Number(summary.totalRevenue || 0) / completedOnlyCount
      : 0;
  const averageDoctorLoad =
    summary.activeDoctors && Number(summary.activeDoctors) > 0
      ? Number(summary.totalAppointments || 0) / Number(summary.activeDoctors)
      : 0;
  const completionRate =
    summary.totalAppointments && Number(summary.totalAppointments) > 0
      ? (completedOnlyCount / Number(summary.totalAppointments)) * 100
      : 0;
  const disruptionRate =
    summary.totalAppointments && Number(summary.totalAppointments) > 0
      ? (disruptionCount / Number(summary.totalAppointments)) * 100
      : 0;
  const busiestDay = appointmentsByDay.reduce(
    (current, item) => (item.totalAppointments > (current?.totalAppointments || 0) ? item : current),
    null
  );

  return (
    <div className="admin-analytics">
      <section className="admin-analytics-panel admin-analytics-panel--hero">
        <div>
          <p className="admin-panel-eyebrow">Отчёты и аналитика</p>
          <h2>Статистика клиники</h2>
          <p className="admin-analytics-lead">
            Фильтруйте записи по врачу, специальности и статусу, а затем выгружайте отчёт в PDF или Excel.
          </p>
        </div>

        <div className="admin-analytics-controls">
          <label className="admin-analytics-filter" htmlFor="analytics-period">
            <span>Период</span>
            <select id="analytics-period" className="form-control" value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {periodOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="admin-analytics-filter" htmlFor="analytics-doctor">
            <span>Врач</span>
            <select id="analytics-doctor" className="form-control" value={doctorId} onChange={(e) => setDoctorId(e.target.value)}>
              <option value="">Все врачи</option>
              {doctorLoad.map((item) => <option key={item.doctorId} value={item.doctorId}>{item.doctorName}</option>)}
            </select>
          </label>
          <label className="admin-analytics-filter" htmlFor="analytics-specialty">
            <span>Специальность</span>
            <select id="analytics-specialty" className="form-control" value={specialty} onChange={(e) => setSpecialty(e.target.value)}>
              <option value="">Все специальности</option>
              {specialties.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
          <label className="admin-analytics-filter" htmlFor="analytics-status">
            <span>Статус</span>
            <select id="analytics-status" className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
              {statusOptions.map((item) => <option key={item.value || 'all'} value={item.value}>{item.label}</option>)}
            </select>
          </label>
          <div className="admin-analytics-export">
            <button type="button" className="btn btn--outline" onClick={() => handleExport('pdf')}>PDF</button>
            <button type="button" className="btn btn--primary" onClick={() => handleExport('excel')}>Excel</button>
          </div>
        </div>
      </section>

      <section className="admin-analytics-summary">
        {summaryMeta.map((item) => (
          <article key={item.key} className={`admin-analytics-kpi admin-analytics-kpi--${item.accent}`}>
            <p>{item.label}</p>
            <strong>{formatCount(summary[item.key])}</strong>
          </article>
        ))}
      </section>

      <section className="admin-analytics-grid">
        <article className="admin-analytics-panel">
          <div className="admin-analytics-heading">
            <div>
              <p className="admin-panel-eyebrow">Услуги</p>
              <h3>Топ услуг за период</h3>
            </div>
          </div>
          <div className="admin-analytics-list">
            {topServices.length === 0 ? (
              <p>Пока нет записей с указанными услугами.</p>
            ) : topServices.map((item) => (
              <div key={item.serviceName} className="admin-analytics-list-row">
                <div>
                  <strong>{item.serviceName}</strong>
                  <span>{formatCount(item.count)} записей</span>
                </div>
                <div className="admin-analytics-metric">
                  <b>{formatMoney(item.totalRevenue)}</b>
                  <span>{formatPercent(item.sharePercent)}</span>
                </div>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-analytics-panel">
          <div className="admin-analytics-heading">
            <div>
              <p className="admin-panel-eyebrow">Выручка</p>
              <h3>Денежная сводка</h3>
            </div>
          </div>
          <div className="admin-analytics-facts">
            <div>
              <span>Сумма по завершённым приёмам</span>
              <strong>{formatMoney(summary.totalRevenue)}</strong>
            </div>
            <div>
              <span>Средний чек</span>
              <strong>{formatMoney(averageCheck)}</strong>
            </div>
            <div>
              <span>Уникальные пациенты</span>
              <strong>{formatCount(summary.uniquePatients)}</strong>
            </div>
            <div>
              <span>Срывы записи</span>
              <strong>{formatPercent(disruptionRate)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-analytics-grid">
        <article className="admin-analytics-panel admin-analytics-panel--wide">
          <div className="admin-analytics-heading">
            <div>
              <p className="admin-panel-eyebrow">Загрузка</p>
              <h3>Нагрузка по врачам</h3>
            </div>
            <div className="admin-analytics-heading-meta">
              <span>Средняя нагрузка: {averageDoctorLoad.toFixed(1)} записи на врача</span>
              <span>Завершение: {formatPercent(completionRate)}</span>
              <span>Потери: {formatPercent(disruptionRate)}</span>
            </div>
          </div>
          {topDoctorLoad.length === 0 ? (
            <p>Нет данных по врачам за выбранный период.</p>
          ) : (
            <>
              <div className="admin-analytics-workload">
                {topDoctorLoad.map((item) => {
                  const total = Math.max(Number(item.totalAppointments || 0), 1);
                  const activePercent = (Number(item.scheduledAppointments || 0) / total) * 100;
                  const completedPercent = (Number(item.completedAppointments || 0) / total) * 100;
                  const cancelledPercent = Math.max(0, 100 - activePercent - completedPercent);
                  const trackWidth = Math.max((Number(item.totalAppointments || 0) / doctorLoadMax) * 100, 16);

                  return (
                    <div key={item.doctorId} className="admin-analytics-workload-row">
                      <div className="admin-analytics-workload-info">
                        <strong>{item.doctorName}</strong>
                        <span>{item.specialty}</span>
                      </div>
                      <div className="admin-analytics-workload-track">
                        <div
                          className="admin-analytics-workload-track__inner"
                          style={{ width: `${trackWidth}%` }}
                          title={`${item.doctorName}: ${formatCount(item.totalAppointments)} записей`}
                        >
                          <span
                            className="admin-analytics-workload-segment admin-analytics-workload-segment--active"
                            style={{ width: `${activePercent}%` }}
                          />
                          <span
                            className="admin-analytics-workload-segment admin-analytics-workload-segment--completed"
                            style={{ width: `${completedPercent}%` }}
                          />
                          <span
                            className="admin-analytics-workload-segment admin-analytics-workload-segment--cancelled"
                            style={{ width: `${cancelledPercent}%` }}
                          />
                        </div>
                      </div>
                      <div className="admin-analytics-workload-metric">
                        <strong>{formatCount(item.totalAppointments)}</strong>
                        <span>{formatPercent(item.sharePercent)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="admin-analytics-legend">
                <span><i className="admin-analytics-workload-segment admin-analytics-workload-segment--active" />Активные</span>
                <span><i className="admin-analytics-workload-segment admin-analytics-workload-segment--completed" />Завершённые</span>
                <span><i className="admin-analytics-workload-segment admin-analytics-workload-segment--cancelled" />Отменённые и неявки</span>
              </div>

              {doctorLoad.length > topDoctorLoad.length ? (
                <p className="admin-analytics-hint">
                  В графике показаны самые загруженные врачи. Полная детализация остаётся в таблице ниже.
                </p>
              ) : null}
            </>
          )}
        </article>

        <article className="admin-analytics-panel">
          <div className="admin-analytics-heading">
            <div>
              <p className="admin-panel-eyebrow">Структура</p>
              <h3>Статусы записей</h3>
            </div>
          </div>
          <div className="admin-analytics-statuses">
            {appointmentsByStatus.map((item) => (
              <div key={item.status} className="admin-analytics-status">
                <div>
                  <strong>{statusLabels[item.status] || item.status}</strong>
                  <span>{formatPercent(summary.totalAppointments ? (item.count / summary.totalAppointments) * 100 : 0)}</span>
                </div>
                <b>{formatCount(item.count)}</b>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-analytics-grid">
        <article className="admin-analytics-panel">
          <div className="admin-analytics-heading">
            <div>
              <p className="admin-panel-eyebrow">Направления</p>
              <h3>Популярные специальности</h3>
            </div>
          </div>
          <div className="admin-analytics-list">
            {specialtyBreakdown.length === 0 ? (
              <p>За выбранный период записей пока нет.</p>
            ) : specialtyBreakdown.map((item) => (
              <div key={item.specialty} className="admin-analytics-list-row">
                <div>
                  <strong>{item.specialty}</strong>
                  <span>{formatCount(item.count)} записей</span>
                </div>
                <b>{formatPercent(item.sharePercent)}</b>
              </div>
            ))}
          </div>
        </article>

        <article className="admin-analytics-panel">
          <div className="admin-analytics-heading">
            <div>
              <p className="admin-panel-eyebrow">Итоги периода</p>
              <h3>Краткая сводка</h3>
            </div>
          </div>
          <div className="admin-analytics-facts">
            <div>
              <span>Период отчёта</span>
              <strong>{formatDate(data.fromDate)} - {formatDate(data.toDate)}</strong>
            </div>
            <div>
              <span>Пиковый день</span>
              <strong>
                {busiestDay && busiestDay.totalAppointments > 0
                  ? `${formatFullDate(busiestDay.date)} (${formatCount(busiestDay.totalAppointments)})`
                  : 'Нет данных'}
              </strong>
            </div>
            <div>
              <span>Активные врачи</span>
              <strong>{formatCount(summary.activeDoctors)}</strong>
            </div>
            <div>
              <span>Общая сумма</span>
              <strong>{formatMoney(summary.totalRevenue)}</strong>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-analytics-panel">
        <div className="admin-analytics-heading">
          <div>
            <p className="admin-panel-eyebrow">Загрузка</p>
            <h3>Детализация по врачам</h3>
          </div>
        </div>
        {doctorLoad.length === 0 ? (
          <p>Нет данных по врачам за выбранный период.</p>
        ) : (
          <div className="page-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Врач</th>
                  <th>Специальность</th>
                  <th>Всего</th>
                  <th>Активные</th>
                  <th>Завершённые</th>
                  <th>Отменённые</th>
                  <th>Доля</th>
                </tr>
              </thead>
              <tbody>
                {doctorLoad.map((item) => (
                  <tr key={item.doctorId}>
                    <td>{item.doctorName}</td>
                    <td>{item.specialty}</td>
                    <td>{formatCount(item.totalAppointments)}</td>
                    <td>{formatCount(item.scheduledAppointments)}</td>
                    <td>{formatCount(item.completedAppointments)}</td>
                    <td>{formatCount(item.cancelledAppointments)}</td>
                    <td>{formatPercent(item.sharePercent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
