package dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class PatientRequest {

    @NotBlank(message = "ФИО не может быть пустым")
    private String fullName;

    @NotBlank(message = "Номер телефона не может быть пустым")
    @Size(min = 10, max = 20, message = "Номер телефона должен быть от 10 до 20 символов")
    private String phoneNumber;

    @NotBlank(message = "Дата рождения не может быть пустой")
    private String dateOfBirth;

    private String medicalHistory;
}
