package com.medisystem.auth.config;

import com.medisystem.auth.entity.Role;
import com.medisystem.auth.entity.UserAccount;
import com.medisystem.auth.repo.UserAccountRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminBootstrapConfig {

    @Bean
    CommandLineRunner ensureAdminUser(
            UserAccountRepository users,
            PasswordEncoder encoder,
            @Value("${auth.bootstrap.admin-email:}") String adminEmail,
            @Value("${auth.bootstrap.admin-password:}") String adminPassword
    ) {
        return args -> {
            if (adminEmail == null || adminEmail.isBlank() || adminPassword == null || adminPassword.isBlank()) {
                return;
            }

            if (users.existsByEmailIgnoreCase(adminEmail)) {
                return;
            }

            UserAccount admin = new UserAccount();
            admin.setEmail(adminEmail.toLowerCase());
            admin.setPasswordHash(encoder.encode(adminPassword));
            admin.setRole(Role.ADMIN);
            admin.setEnabled(true);
            users.save(admin);
        };
    }
}
