package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.admin.AdminOnlineConsultationUpsertRequest;
import com.medisystem.appointment.dto.shared.OnlineConsultationCardResponse;
import com.medisystem.appointment.entity.OnlineConsultation;
import com.medisystem.appointment.exception.OnlineConsultationNotFoundException;
import com.medisystem.appointment.repo.OnlineConsultationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class OnlineConsultationService {

    private final OnlineConsultationRepository repository;

    public OnlineConsultationService(OnlineConsultationRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<OnlineConsultationCardResponse> getPublicItems() {
        return repository.findAllByPublishedTrueOrderByDisplayOrderAscCreatedAtDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OnlineConsultationCardResponse getPublicItem(Long id) {
        OnlineConsultation item = getItem(id);
        if (!item.isPublished()) {
            throw new OnlineConsultationNotFoundException("Online consultation not found: " + id);
        }
        return toResponse(item);
    }

    @Transactional(readOnly = true)
    public List<OnlineConsultationCardResponse> getAdminItems() {
        return repository.findAllByOrderByDisplayOrderAscCreatedAtDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public OnlineConsultationCardResponse getAdminItem(Long id) {
        return toResponse(getItem(id));
    }

    @Transactional
    public OnlineConsultationCardResponse create(AdminOnlineConsultationUpsertRequest req) {
        OnlineConsultation item = new OnlineConsultation();
        applyFields(item, req);
        return toResponse(repository.save(item));
    }

    @Transactional
    public OnlineConsultationCardResponse update(Long id, AdminOnlineConsultationUpsertRequest req) {
        OnlineConsultation item = getItem(id);
        applyFields(item, req);
        return toResponse(repository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getItem(id));
    }

    private OnlineConsultation getItem(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new OnlineConsultationNotFoundException("Online consultation not found: " + id));
    }

    private void applyFields(OnlineConsultation item, AdminOnlineConsultationUpsertRequest req) {
        item.setTitle(req.title().trim());
        item.setShortDescription(req.shortDescription().trim());
        item.setDescription(trimToNull(req.description()));
        item.setImageUrl(trimToNull(req.imageUrl()));
        item.setButtonText(trimToNull(req.buttonText()));
        item.setButtonLink(trimToNull(req.buttonLink()));
        item.setDisplayOrder(req.displayOrder() == null ? 0 : req.displayOrder());
        item.setPublished(req.published());
    }

    private OnlineConsultationCardResponse toResponse(OnlineConsultation item) {
        return new OnlineConsultationCardResponse(
                item.getId(),
                item.getTitle(),
                item.getShortDescription(),
                item.getDescription(),
                item.getImageUrl(),
                item.getButtonText(),
                item.getButtonLink(),
                item.getDisplayOrder(),
                item.isPublished()
        );
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
