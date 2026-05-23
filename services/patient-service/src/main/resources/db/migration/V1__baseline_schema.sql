CREATE TABLE IF NOT EXISTS patients (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT,
    full_name VARCHAR(255) NOT NULL,
    birth_date DATE,
    phone VARCHAR(255),
    email VARCHAR(255),
    gender VARCHAR(255),
    address VARCHAR(255),
    allergies TEXT,
    chronic_conditions TEXT,
    blood_group VARCHAR(3),
    rh_factor VARCHAR(8),
    height_cm INTEGER,
    weight_kg NUMERIC(5,2),
    emergency_contact_name VARCHAR(255),
    emergency_contact_phone VARCHAR(255),
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_patients_user_id ON patients (user_id);
CREATE INDEX IF NOT EXISTS ix_patients_full_name ON patients (full_name);
CREATE INDEX IF NOT EXISTS ix_patients_phone ON patients (phone);
CREATE INDEX IF NOT EXISTS ix_patients_active ON patients (active);
