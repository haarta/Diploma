package com.medisystem.kurs.dto;

import lombok.Data;

@Data
public class AuthResponse {
    private boolean success;
    private String message;
    private Long userId;
    private String email;
}
