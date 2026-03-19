package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.UserNotificationResponse;
import com.medisystem.appointment.entity.UserNotification;
import com.medisystem.appointment.repo.UserNotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

@Service
public class UserNotificationService {

    private final UserNotificationRepository userNotificationRepository;

    public UserNotificationService(UserNotificationRepository userNotificationRepository) {
        this.userNotificationRepository = userNotificationRepository;
    }

    @Transactional(readOnly = true)
    public List<UserNotificationResponse> getMine(long userId) {
        return userNotificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(long userId) {
        return userNotificationRepository.countByUserIdAndReadFalse(userId);
    }

    @Transactional
    public UserNotificationResponse markAsRead(long userId, Long notificationId) {
        UserNotification notification = userNotificationRepository.findById(notificationId)
                .orElseThrow(() -> new IllegalArgumentException("Notification not found: " + notificationId));
        if (!notification.getUserId().equals(userId)) {
            throw new IllegalArgumentException("Notification does not belong to current user");
        }
        if (!notification.isRead()) {
            notification.setRead(true);
            notification.setReadAt(OffsetDateTime.now());
        }
        return toResponse(userNotificationRepository.save(notification));
    }

    @Transactional
    public void markAllAsRead(long userId) {
        List<UserNotification> notifications = userNotificationRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
        OffsetDateTime now = OffsetDateTime.now();
        for (UserNotification notification : notifications) {
            if (!notification.isRead()) {
                notification.setRead(true);
                notification.setReadAt(now);
            }
        }
        userNotificationRepository.saveAll(notifications);
    }

    @Transactional
    public void createNotification(long userId, Long appointmentId, String type, String title, String message, String linkPath) {
        if (userId <= 0) {
            return;
        }
        UserNotification notification = new UserNotification();
        notification.setUserId(userId);
        notification.setAppointmentId(appointmentId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setLinkPath(linkPath);
        notification.setRead(false);
        userNotificationRepository.save(notification);
    }

    private UserNotificationResponse toResponse(UserNotification item) {
        return new UserNotificationResponse(
                item.getId(),
                item.getAppointmentId(),
                item.getType(),
                item.getTitle(),
                item.getMessage(),
                item.getLinkPath(),
                item.isRead(),
                item.getCreatedAt(),
                item.getReadAt()
        );
    }
}
