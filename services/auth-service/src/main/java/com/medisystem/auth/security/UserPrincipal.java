package com.medisystem.auth.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;

public class UserPrincipal implements UserDetails {

    private final long userId;
    private final String email;
    private final String role;

    public UserPrincipal(long userId, String email, String role) {
        this.userId = userId;
        this.email = email;
        this.role = role;
    }

    public long getUserId() {
        return userId;
    }

    public String getRole() {
        return role;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        // Возвращаем ROLE_..., чтобы Spring нормально понимал роли
        return List.of((GrantedAuthority) () -> "ROLE_" + role);
    }

    @Override
    public String getPassword() {
        return ""; // мы не используем password из UserDetails
    }

    @Override
    public String getUsername() {
        return email;
    }

    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
