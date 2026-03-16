import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminDoctorsApi, doctorVerificationApi } from '../api';

const statuses = [
  { value: 'PENDING_VERIFICATION', label: 'На проверке' },
  { value: 'REJECTED', label: 'Отклоненные' },
  { value: 'APPROVED', label: 'Одобренные' },
];

function toDoctorUpdatePayload(doctor, userId) {
  return {
    userId,
    fullName: doctor.fullName,
    specialty: doctor.specialty,
    experienceYears: doctor.experienceYears,
    photoUrl: doctor.photoUrl,
    description: doctor.description,
    branch: doctor.branch,
    published: doctor.published,
    prices: doctor.prices || [],
    schedules: doctor.schedules || [],
    certificates: doctor.certificates || [],
  };
}

export default function AdminDoctorVerifications() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('PENDING_VERIFICATION');
  const [doctorIdByApp, setDoctorIdByApp] = useState({});

  const { data: applications = [] } = useQuery({
    queryKey: ['admin-doctor-verifications', status],
    queryFn: async () => {
      const response = await doctorVerificationApi.adminList(status);
      return response.data || [];
    },
  });

  const { data: doctors = [] } = useQuery({
    queryKey: ['admin-doctors'],
    queryFn: async () => {
      const response = await adminDoctorsApi.getAll();
      return response.data || [];
    },
  });

  const doctorsById = useMemo(() => new Map(doctors.map((d) => [String(d.id), d])), [doctors]);

  const reviewMutation = useMutation({
    mutationFn: ({ id, payload }) => doctorVerificationApi.adminReview(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-doctor-verifications'] });
    },
  });

  const approve = async (application) => {
    const selectedDoctorId = String(doctorIdByApp[application.id] || '').trim();

    if (!selectedDoctorId) {
      window.alert('Укажите Doctor ID для привязки к карточке врача.');
      return;
    }

    const doctor = doctorsById.get(selectedDoctorId);
    if (!doctor) {
      window.alert('Карточка врача не найдена.');
      return;
    }

    await adminDoctorsApi.update(doctor.id, toDoctorUpdatePayload(doctor, application.userId));

    reviewMutation.mutate({
      id: application.id,
      payload: { status: 'APPROVED', reviewComment: 'Заявка одобрена администратором.' },
    });
  };

  const reject = (application) => {
    const reviewComment = window.prompt('Комментарий причины отказа:', 'Недостаточно данных для подтверждения.');
    reviewMutation.mutate({
      id: application.id,
      payload: { status: 'REJECTED', reviewComment: reviewComment || null },
    });
  };

  return (
    <div className="card">
      <div className="card-header page-toolbar">
        <h2>Заявки на роль врача</h2>
        <div className="page-row-actions">
          <label htmlFor="verification-status">Статус:</label>
          <select
            id="verification-status"
            className="form-control"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {statuses.map((item) => (
              <option key={item.value} value={item.value}>{item.label}</option>
            ))}
          </select>
        </div>
      </div>

      {applications.length === 0 ? (
        <p>Заявок с выбранным статусом нет.</p>
      ) : (
        <div className="page-table-wrap">
          <table>
            <thead>
              <tr>
                <th>Пользователь</th>
                <th>ФИО</th>
                <th>Специальность</th>
                <th>Лицензия</th>
                <th>Файлы</th>
                <th>Комментарий</th>
                <th>Действия</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((item) => (
                <tr key={item.id}>
                  <td>
                    #{item.userId}
                    <br />
                    {item.email}
                  </td>
                  <td>{item.fullName}</td>
                  <td>{item.specialty}</td>
                  <td>{item.licenseNumber || '—'}</td>
                  <td style={{ maxWidth: 320 }}>
                    <div style={{ display: 'grid', gap: 6 }}>
                      <a href={item.licenseFileUrl} target="_blank" rel="noreferrer">Лицензия</a>
                      <a href={item.diplomaFileUrl} target="_blank" rel="noreferrer">Диплом</a>
                      <a href={item.specialtyCertificateFileUrl} target="_blank" rel="noreferrer">Сертификат</a>
                      {item.identityDocumentFileUrl ? (
                        <a href={item.identityDocumentFileUrl} target="_blank" rel="noreferrer">Удостоверение</a>
                      ) : (
                        <span>Удостоверение: —</span>
                      )}
                    </div>
                  </td>
                  <td>{item.reviewComment || '—'}</td>
                  <td>
                    <div className="page-row-actions">
                      <input
                        className="form-control"
                        type="number"
                        placeholder="Doctor ID для привязки"
                        value={doctorIdByApp[item.id] || ''}
                        onChange={(event) =>
                          setDoctorIdByApp((prev) => ({ ...prev, [item.id]: event.target.value }))
                        }
                      />
                      {item.status === 'PENDING_VERIFICATION' ? (
                        <>
                          <button className="btn btn-success btn-small" type="button" onClick={() => approve(item)}>
                            Одобрить
                          </button>
                          <button className="btn btn-danger btn-small" type="button" onClick={() => reject(item)}>
                            Отклонить
                          </button>
                        </>
                      ) : (
                        <span>{item.status}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
