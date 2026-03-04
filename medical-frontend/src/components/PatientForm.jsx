import { useState } from "react";
import { createPatient } from "../services/patientService";

function PatientForm({ onAdd }) {
    const [fullName, setFullName] = useState("");
    const [birthDate, setBirthDate] = useState("");

    const submit = async (e) => {
        e.preventDefault();
        await createPatient({ fullName, birthDate });
        setFullName("");
        setBirthDate("");
        onAdd();
    };

    return (
        <form onSubmit={submit}>
            <input
                placeholder="ФИО пациента"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
            />
            <input
                type="date"
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                required
            />
            <button>Добавить</button>
        </form>
    );
}

export default PatientForm;

