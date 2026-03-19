package com.medisystem.appointment.controller;

import com.medisystem.appointment.dto.UserNotificationResponse;
import com.medisystem.appointment.security.UserPrincipal;
import com.medisystem.appointment.service.UserNotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class UserNotificationController {

    private final UserNotificationService userNotificationService;

    public UserNotificationController(UserNotificationService userNotificationService) {
        this.userNotificationService = userNotificationService;
    }

    @GetMapping("/me")
    public List<UserNotificationResponse> getMine(@AuthenticationPrincipal UserPrincipal principal) {
        return userNotificationService.getMine(principal.getUserId());
    }

    @GetMapping("/me/unread-count")
    public Map<String, Long> getUnreadCount(@AuthenticationPrincipal UserPrincipal principal) {
        return Map.of("count", userNotificationService.getUnreadCount(principal.getUserId()));
    }

    @PatchMapping("/me/{id}/read")
    public UserNotificationResponse markAsRead(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Long id
    ) {
        return userNotificationService.markAsRead(principal.getUserId(), id);
    }

    @PostMapping("/me/read-all")
    public void markAllAsRead(@AuthenticationPrincipal UserPrincipal principal) {
        userNotificationService.markAllAsRead(principal.getUserId());
    }
}
