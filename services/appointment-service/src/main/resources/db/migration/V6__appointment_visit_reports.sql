alter table appointments
    add column if not exists complaints text,
    add column if not exists anamnesis text,
    add column if not exists objective_findings text,
    add column if not exists diagnosis text,
    add column if not exists prescriptions text,
    add column if not exists treatment_plan text;
