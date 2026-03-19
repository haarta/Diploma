CREATE TABLE IF NOT EXISTS appointments (
    id BIGSERIAL PRIMARY KEY,
    patient_id BIGINT NOT NULL,
    created_by_user_id BIGINT,
    doctor_id BIGINT NOT NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    status VARCHAR(32) NOT NULL,
    notes TEXT
);

ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_full_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_price NUMERIC(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_currency VARCHAR(16);
UPDATE appointments SET service_name = COALESCE(NULLIF(service_name, ''), 'Консультация');
ALTER TABLE appointments ALTER COLUMN service_name SET NOT NULL;

CREATE TABLE IF NOT EXISTS lab_results (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(255) NOT NULL,
    ordered_at TIMESTAMP NOT NULL,
    ready_at TIMESTAMP NOT NULL,
    status VARCHAR(32) NOT NULL,
    pdf_url VARCHAR(512)
);
