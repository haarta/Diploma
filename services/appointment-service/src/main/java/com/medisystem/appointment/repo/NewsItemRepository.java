package com.medisystem.appointment.repo;

import com.medisystem.appointment.entity.NewsItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface NewsItemRepository extends JpaRepository<NewsItem, Long> {

    List<NewsItem> findAllByPublishedTrueOrderByDisplayOrderAscCreatedAtDescIdDesc();

    List<NewsItem> findAllByOrderByDisplayOrderAscCreatedAtDescIdDesc();
}
