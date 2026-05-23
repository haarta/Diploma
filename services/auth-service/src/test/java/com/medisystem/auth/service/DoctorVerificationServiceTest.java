package com.medisystem.auth.service;

import com.medisystem.auth.dto.DoctorVerificationApplicationResponse;
import com.medisystem.auth.dto.DoctorVerificationReviewRequest;
import com.medisystem.auth.entity.DoctorVerificationApplication;
import com.medisystem.auth.entity.DoctorVerificationStatus;
import com.medisystem.auth.entity.Role;
import com.medisystem.auth.entity.UserAccount;
import com.medisystem.auth.repo.DoctorVerificationApplicationRepository;
import com.medisystem.auth.repo.UserAccountRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DoctorVerificationServiceTest {

    @Mock
    private DoctorVerificationApplicationRepository applicationRepository;

    @Mock
    private UserAccountRepository userAccountRepository;

    @InjectMocks
    private DoctorVerificationService doctorVerificationService;

    @Test
    void reviewShouldPromoteUserWhenApplicationApproved() {
        DoctorVerificationApplication application = new DoctorVerificationApplication();
        application.setUserId(10L);
        application.setFullName("Dr. Test");
        application.setSpecialty("Cardiology");
        application.setStatus(DoctorVerificationStatus.PENDING_VERIFICATION);

        UserAccount user = new UserAccount();
        user.setEmail("doctor@example.com");
        user.setRole(Role.USER);

        DoctorVerificationReviewRequest request = new DoctorVerificationReviewRequest();
        request.status = "APPROVED";
        request.reviewComment = "Looks good";

        when(applicationRepository.findById(1L)).thenReturn(Optional.of(application));
        when(userAccountRepository.findById(10L)).thenReturn(Optional.of(user));
        when(userAccountRepository.save(any(UserAccount.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(applicationRepository.save(any(DoctorVerificationApplication.class))).thenAnswer(invocation -> invocation.getArgument(0));

        DoctorVerificationApplicationResponse response = doctorVerificationService.review(1L, request);

        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(response.reviewComment()).isEqualTo("Looks good");
        assertThat(user.getRole()).isEqualTo(Role.DOCTOR);
        verify(userAccountRepository).save(user);
        verify(applicationRepository).save(application);
    }
}
