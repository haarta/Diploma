package com.medisystem.kurs.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {

    @NotBlank(message = "Email не может быть пустым")
    @Email(message = "Email должен быть валидным")
    private String email;

    @NotBlank(message = "Пароль не может быть пустым")
    @Size(min = 6, message = "Пароль должен быть минимум 6 символов")
    private String password;

    @NotBlank(message = "Имя не может быть пустым")
    private String fullName;

    @NotBlank(message = "Роль не может быть пустой")
    private String role; // "DOCTOR", "PATIENT", "RECEPTION"
}
