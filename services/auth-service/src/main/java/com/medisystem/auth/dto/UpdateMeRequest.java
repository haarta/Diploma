package com.medisystem.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UpdateMeRequest {
    @Email
    public String email;

    @Size(min = 8, max = 72)
    public String password;
}
