package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.admin.AdminDoctorUpsertRequest;
import com.medisystem.appointment.dto.publicapi.PublicReviewCreateRequest;
import com.medisystem.appointment.dto.shared.DoctorCardResponse;
import com.medisystem.appointment.dto.shared.DoctorCertificateItem;
import com.medisystem.appointment.dto.shared.DoctorPriceItem;
import com.medisystem.appointment.dto.shared.DoctorReviewItem;
import com.medisystem.appointment.dto.shared.DoctorScheduleItem;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.entity.DoctorCertificate;
import com.medisystem.appointment.entity.DoctorPrice;
import com.medisystem.appointment.entity.DoctorReview;
import com.medisystem.appointment.entity.DoctorSchedule;
import com.medisystem.appointment.entity.ReviewStatus;
import com.medisystem.appointment.exception.DoctorNotFoundException;
import com.medisystem.appointment.exception.ReviewNotFoundException;
import com.medisystem.appointment.repo.DoctorRepository;
import com.medisystem.appointment.repo.DoctorReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
public class DoctorService {

    private final DoctorRepository doctorRepo;
    private final DoctorReviewRepository reviewRepo;

    public DoctorService(DoctorRepository doctorRepo, DoctorReviewRepository reviewRepo) {
        this.doctorRepo = doctorRepo;
        this.reviewRepo = reviewRepo;
    }

    @Transactional(readOnly = true)
    public List<DoctorCardResponse> getPublicDoctors() {
        return doctorRepo.findAllByPublishedTrueOrderByFullNameAsc().stream()
                .map(d -> toCardResponse(d, false))
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorCardResponse getPublicDoctor(Long id) {
        Doctor doctor = getDoctor(id);
        if (!doctor.isPublished()) {
            throw new DoctorNotFoundException("Doctor not found: " + id);
        }
        return toCardResponse(doctor, false);
    }

    @Transactional(readOnly = true)
    public List<DoctorCardResponse> getAdminDoctors() {
        return doctorRepo.findAllByOrderByFullNameAsc().stream()
                .map(d -> toCardResponse(d, true))
                .toList();
    }

    @Transactional(readOnly = true)
    public DoctorCardResponse getAdminDoctor(Long id) {
        return toCardResponse(getDoctor(id), true);
    }

    @Transactional
    public DoctorCardResponse createDoctor(AdminDoctorUpsertRequest req) {
        Doctor doctor = new Doctor();
        applyDoctorFields(doctor, req);
        return toCardResponse(doctorRepo.save(doctor), true);
    }

    @Transactional
    public DoctorCardResponse updateDoctor(Long id, AdminDoctorUpsertRequest req) {
        Doctor doctor = getDoctor(id);
        applyDoctorFields(doctor, req);
        return toCardResponse(doctorRepo.save(doctor), true);
    }

    @Transactional
    public void deleteDoctor(Long id) {
        Doctor doctor = getDoctor(id);
        doctorRepo.delete(doctor);
    }

    @Transactional
    public void createReview(Long doctorId, PublicReviewCreateRequest req) {
        Doctor doctor = getDoctor(doctorId);
        if (!doctor.isPublished()) {
            throw new DoctorNotFoundException("Doctor not found: " + doctorId);
        }

        DoctorReview review = new DoctorReview();
        review.setDoctor(doctor);
        review.setAuthorName(req.authorName());
        review.setRating(req.rating());
        review.setText(req.text());
        review.setStatus(ReviewStatus.PENDING);
        reviewRepo.save(review);
    }

    @Transactional(readOnly = true)
    public List<DoctorReviewItem> getReviewsByStatus(ReviewStatus status) {
        return reviewRepo.findAllByStatusOrderByCreatedAtDesc(status).stream()
                .map(this::toReviewItem)
                .toList();
    }

    @Transactional
    public DoctorReviewItem updateReviewStatus(Long reviewId, ReviewStatus status) {
        DoctorReview review = reviewRepo.findById(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Review not found: " + reviewId));
        review.setStatus(status);
        return toReviewItem(reviewRepo.save(review));
    }

    private void applyDoctorFields(Doctor doctor, AdminDoctorUpsertRequest req) {
        doctor.setFullName(req.fullName().trim());
        doctor.setSpecialty(req.specialty().trim());
        doctor.setExperienceYears(req.experienceYears());
        doctor.setPhotoUrl(trimToNull(req.photoUrl()));
        doctor.setDescription(trimToNull(req.description()));
        doctor.setBranch(trimToNull(req.branch()));
        doctor.setPublished(req.published());

        doctor.getPrices().clear();
        if (req.prices() != null) {
            for (DoctorPriceItem item : req.prices()) {
                if (item == null || item.serviceName() == null || item.serviceName().isBlank() || item.amount() == null) {
                    continue;
                }
                DoctorPrice price = new DoctorPrice();
                price.setDoctor(doctor);
                price.setServiceName(item.serviceName().trim());
                price.setAmount(item.amount());
                String currency = trimToNull(item.currency());
                price.setCurrency(currency == null ? "RUB" : currency.toUpperCase(Locale.ROOT));
                doctor.getPrices().add(price);
            }
        }

        doctor.getSchedules().clear();
        if (req.schedules() != null) {
            for (DoctorScheduleItem item : req.schedules()) {
                if (item == null || isBlank(item.dayOfWeek()) || isBlank(item.startTime()) || isBlank(item.endTime())) {
                    continue;
                }
                DoctorSchedule schedule = new DoctorSchedule();
                schedule.setDoctor(doctor);
                schedule.setDayOfWeek(item.dayOfWeek().trim());
                schedule.setStartTime(item.startTime().trim());
                schedule.setEndTime(item.endTime().trim());
                doctor.getSchedules().add(schedule);
            }
        }

        doctor.getCertificates().clear();
        if (req.certificates() != null) {
            for (DoctorCertificateItem item : req.certificates()) {
                if (item == null || isBlank(item.title())) {
                    continue;
                }
                DoctorCertificate cert = new DoctorCertificate();
                cert.setDoctor(doctor);
                cert.setTitle(item.title().trim());
                cert.setIssuer(trimToNull(item.issuer()));
                cert.setIssuedAt(item.issuedAt());
                cert.setFileUrl(trimToNull(item.fileUrl()));
                doctor.getCertificates().add(cert);
            }
        }
    }

    private Doctor getDoctor(Long id) {
        return doctorRepo.findById(id)
                .orElseThrow(() -> new DoctorNotFoundException("Doctor not found: " + id));
    }

    private DoctorCardResponse toCardResponse(Doctor doctor, boolean includeAllReviews) {
        List<DoctorReviewItem> reviews = doctor.getReviews().stream()
                .filter(r -> includeAllReviews || r.getStatus() == ReviewStatus.APPROVED)
                .sorted(Comparator.comparing(DoctorReview::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toReviewItem)
                .toList();

        List<DoctorPriceItem> prices = doctor.getPrices().stream()
                .map(p -> new DoctorPriceItem(p.getServiceName(), p.getAmount(), p.getCurrency()))
                .toList();

        List<DoctorScheduleItem> schedules = doctor.getSchedules().stream()
                .map(s -> new DoctorScheduleItem(s.getDayOfWeek(), s.getStartTime(), s.getEndTime()))
                .toList();

        List<DoctorCertificateItem> certificates = doctor.getCertificates().stream()
                .map(c -> new DoctorCertificateItem(c.getTitle(), c.getIssuer(), c.getIssuedAt(), c.getFileUrl()))
                .toList();

        return new DoctorCardResponse(
                doctor.getId(),
                doctor.getFullName(),
                doctor.getSpecialty(),
                doctor.getExperienceYears(),
                doctor.getPhotoUrl(),
                doctor.getDescription(),
                doctor.getBranch(),
                doctor.isPublished(),
                prices,
                schedules,
                certificates,
                reviews
        );
    }

    private DoctorReviewItem toReviewItem(DoctorReview review) {
        return new DoctorReviewItem(
                review.getId(),
                review.getDoctor().getId(),
                review.getAuthorName(),
                review.getRating(),
                review.getText(),
                review.getStatus().name(),
                review.getCreatedAt()
        );
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
