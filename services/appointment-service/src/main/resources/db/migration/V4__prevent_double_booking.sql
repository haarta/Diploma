CREATE UNIQUE INDEX IF NOT EXISTS ux_appointments_active_slot
    ON appointments (doctor_id, appointment_date, appointment_time)
    WHERE status <> 'CANCELLED';
