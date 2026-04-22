package com.medisystem.appointment.service;

import com.medisystem.appointment.dto.admin.AdminNewsItemUpsertRequest;
import com.medisystem.appointment.dto.shared.NewsCardResponse;
import com.medisystem.appointment.entity.NewsItem;
import com.medisystem.appointment.exception.NewsItemNotFoundException;
import com.medisystem.appointment.repo.NewsItemRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class NewsService {

    private final NewsItemRepository repository;

    public NewsService(NewsItemRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<NewsCardResponse> getPublicItems() {
        return repository.findAllByPublishedTrueOrderByDisplayOrderAscCreatedAtDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NewsCardResponse getPublicItem(Long id) {
        NewsItem item = getItem(id);
        if (!item.isPublished()) {
            throw new NewsItemNotFoundException("News item not found: " + id);
        }
        return toResponse(item);
    }

    @Transactional(readOnly = true)
    public List<NewsCardResponse> getAdminItems() {
        return repository.findAllByOrderByDisplayOrderAscCreatedAtDescIdDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public NewsCardResponse getAdminItem(Long id) {
        return toResponse(getItem(id));
    }

    @Transactional
    public NewsCardResponse create(AdminNewsItemUpsertRequest req) {
        NewsItem item = new NewsItem();
        applyFields(item, req);
        return toResponse(repository.save(item));
    }

    @Transactional
    public NewsCardResponse update(Long id, AdminNewsItemUpsertRequest req) {
        NewsItem item = getItem(id);
        applyFields(item, req);
        return toResponse(repository.save(item));
    }

    @Transactional
    public void delete(Long id) {
        repository.delete(getItem(id));
    }

    private NewsItem getItem(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new NewsItemNotFoundException("News item not found: " + id));
    }

    private void applyFields(NewsItem item, AdminNewsItemUpsertRequest req) {
        item.setTitle(req.title().trim());
        item.setShortDescription(req.shortDescription().trim());
        item.setCategory(trimToNull(req.category()));
        item.setDescription(trimToNull(req.description()));
        item.setImageUrl(trimToNull(req.imageUrl()));
        item.setDisplayOrder(req.displayOrder() == null ? 0 : req.displayOrder());
        item.setPublished(req.published());
    }

    private NewsCardResponse toResponse(NewsItem item) {
        return new NewsCardResponse(
                item.getId(),
                item.getTitle(),
                item.getShortDescription(),
                item.getCategory(),
                item.getDescription(),
                item.getImageUrl(),
                item.getDisplayOrder(),
                item.isPublished(),
                item.getCreatedAt(),
                item.getUpdatedAt()
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
