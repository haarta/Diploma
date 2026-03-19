ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_full_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS patient_email VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_name VARCHAR(255);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_price NUMERIC(10,2);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_currency VARCHAR(16);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completion_summary TEXT;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_24h_sent_at TIMESTAMPTZ;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS reminder_2h_sent_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS user_notifications (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL,
    appointment_id BIGINT,
    type VARCHAR(64) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link_path VARCHAR(255),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    read_at TIMESTAMPTZ
);
