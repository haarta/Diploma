ALTER TABLE doctor_reviews
    ADD COLUMN IF NOT EXISTS appointment_id BIGINT,
    ADD COLUMN IF NOT EXISTS created_by_user_id BIGINT;

CREATE UNIQUE INDEX IF NOT EXISTS ux_doctor_reviews_appointment_id
    ON doctor_reviews (appointment_id)
    WHERE appointment_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS ix_doctor_reviews_created_by_user_id
    ON doctor_reviews (created_by_user_id);

ALTER TABLE doctor_reviews
    ADD CONSTRAINT fk_doctor_reviews_appointment
    FOREIGN KEY (appointment_id) REFERENCES appointments(id);
