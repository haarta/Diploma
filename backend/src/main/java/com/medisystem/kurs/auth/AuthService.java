package com.medisystem.kurs.auth;

import dto.AuthResponse;
import dto.LoginRequest;
import dto.RegisterRequest;
import user.User;
import user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;

    public AuthResponse register(RegisterRequest request) {
        AuthResponse response = new AuthResponse();

        // Проверка существует ли email
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            response.setSuccess(false);
            response.setMessage("Email уже зарегистрирован");
            return response;
        }

        // Валидация роли
        if (!isValidRole(request.getRole())) {
            response.setSuccess(false);
            response.setMessage("Неверная роль. Используйте: DOCTOR, PATIENT, RECEPTION");
            return response;
        }

        // Сохрани пользователя
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPassword(request.getPassword());
        user.setFullName(request.getFullName());
        user.setRole(request.getRole());

        User savedUser = userRepository.save(user);

        response.setSuccess(true);
        response.setMessage("Регистрация успешна");
        response.setUserId(savedUser.getId());
        response.setEmail(savedUser.getEmail());

        return response;
    }

    public AuthResponse login(LoginRequest request) {
        AuthResponse response = new AuthResponse();

        // Найди пользователя
        var user = userRepository.findByEmail(request.getEmail());

        if (user.isEmpty()) {
            response.setSuccess(false);
            response.setMessage("Пользователь не найден");
            return response;
        }

        User foundUser = user.get();

        // Простая проверка пароля
        if (!foundUser.getPassword().equals(request.getPassword())) {
            response.setSuccess(false);
            response.setMessage("Неверный пароль");
            return response;
        }

        response.setSuccess(true);
        response.setMessage("Вход успешен");
        response.setUserId(foundUser.getId());
        response.setEmail(foundUser.getEmail());

        return response;
    }

    private boolean isValidRole(String role) {
        return role != null && (role.equals("DOCTOR") || role.equals("PATIENT") || role.equals("RECEPTION"));
    }
}
