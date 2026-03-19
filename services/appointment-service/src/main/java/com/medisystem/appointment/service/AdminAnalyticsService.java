package com.medisystem.appointment.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.medisystem.appointment.dto.admin.AdminAnalyticsResponse;
import com.medisystem.appointment.entity.Appointment;
import com.medisystem.appointment.entity.AppointmentStatus;
import com.medisystem.appointment.entity.Doctor;
import com.medisystem.appointment.repo.AppointmentRepository;
import com.medisystem.appointment.repo.DoctorRepository;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.xssf.usermodel.XSSFSheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AdminAnalyticsService {

    private final AppointmentRepository appointmentRepository;
    private final DoctorRepository doctorRepository;

    public AdminAnalyticsService(AppointmentRepository appointmentRepository, DoctorRepository doctorRepository) {
        this.appointmentRepository = appointmentRepository;
        this.doctorRepository = doctorRepository;
    }

    @Transactional(readOnly = true)
    public AdminAnalyticsResponse getDashboard(Integer days, Long doctorId, String specialty, String status) {
        DashboardContext context = loadContext(days, doctorId, specialty, status);
        List<Appointment> appointments = context.filteredAppointments();
        Map<Long, Doctor> doctorsById = context.doctorsById();

        return new AdminAnalyticsResponse(
                context.fromDate(),
                context.toDate(),
                buildSummary(appointments),
                buildDailyStats(appointments, context.fromDate(), context.toDate()),
                buildStatusStats(appointments),
                buildSpecialtyBreakdown(appointments, doctorsById),
                buildDoctorLoad(appointments, doctorsById),
                buildTopServices(appointments)
        );
    }

    @Transactional(readOnly = true)
    public byte[] exportExcel(Integer days, Long doctorId, String specialty, String status) {
        AdminAnalyticsResponse dashboard = getDashboard(days, doctorId, specialty, status);
        try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            XSSFSheet summarySheet = workbook.createSheet("Сводка");
            writeSummary(summarySheet, dashboard);

            XSSFSheet doctorsSheet = workbook.createSheet("Врачи");
            writeDoctors(doctorsSheet, dashboard);

            XSSFSheet servicesSheet = workbook.createSheet("Услуги");
            writeServices(servicesSheet, dashboard);

            workbook.write(outputStream);
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to build Excel export", exception);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportPdf(Integer days, Long doctorId, String specialty, String status) {
        AdminAnalyticsResponse dashboard = getDashboard(days, doctorId, specialty, status);
        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document();
            PdfWriter.getInstance(document, outputStream);
            document.open();
            document.add(new Paragraph("Отчёт по клинике"));
            document.add(new Paragraph("Период: " + dashboard.fromDate() + " - " + dashboard.toDate()));
            document.add(new Paragraph("Всего записей: " + dashboard.summary().totalAppointments()));
            document.add(new Paragraph("Активные: " + dashboard.summary().scheduledAppointments()));
            document.add(new Paragraph("Подтверждённые и завершённые: " + (dashboard.summary().completedAppointments())));
            document.add(new Paragraph("Отменённые: " + dashboard.summary().cancelledAppointments()));
            document.add(new Paragraph("Выручка: " + dashboard.summary().totalRevenue()));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(4);
            addCell(table, "Услуга");
            addCell(table, "Количество");
            addCell(table, "Выручка");
            addCell(table, "Доля");
            for (AdminAnalyticsResponse.TopServiceStat item : dashboard.topServices()) {
                addCell(table, item.serviceName());
                addCell(table, String.valueOf(item.count()));
                addCell(table, item.totalRevenue().toPlainString());
                addCell(table, item.sharePercent().toPlainString() + "%");
            }
            document.add(table);
            document.close();
            return outputStream.toByteArray();
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("Failed to build PDF export", exception);
        }
    }

    private DashboardContext loadContext(Integer days, Long doctorId, String specialty, String status) {
        int safeDays = days == null ? 30 : Math.max(7, Math.min(days, 365));
        LocalDate toDate = LocalDate.now();
        LocalDate fromDate = toDate.minusDays(safeDays - 1L);

        List<Appointment> allAppointments =
                appointmentRepository.findAllByAppointmentDateBetweenOrderByAppointmentDateAscAppointmentTimeAsc(fromDate, toDate);
        Map<Long, Doctor> doctorsById = loadDoctors(allAppointments);
        AppointmentStatus requestedStatus = parseStatus(status);
        String normalizedSpecialty = normalize(specialty);

        List<Appointment> filteredAppointments = allAppointments.stream()
                .filter(item -> doctorId == null || Objects.equals(item.getDoctorId(), doctorId))
                .filter(item -> requestedStatus == null || item.getStatus() == requestedStatus)
                .filter(item -> {
                    if (normalizedSpecialty == null) {
                        return true;
                    }
                    Doctor doctor = doctorsById.get(item.getDoctorId());
                    return doctor != null
                            && doctor.getSpecialty() != null
                            && doctor.getSpecialty().trim().equalsIgnoreCase(normalizedSpecialty);
                })
                .toList();

        return new DashboardContext(fromDate, toDate, filteredAppointments, doctorsById);
    }

    private Map<Long, Doctor> loadDoctors(List<Appointment> appointments) {
        Set<Long> doctorIds = appointments.stream()
                .map(Appointment::getDoctorId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        if (doctorIds.isEmpty()) {
            return Map.of();
        }
        return doctorRepository.findAllById(doctorIds).stream()
                .collect(Collectors.toMap(Doctor::getId, doctor -> doctor));
    }

    private AdminAnalyticsResponse.Summary buildSummary(List<Appointment> appointments) {
        long totalAppointments = appointments.size();
        long scheduledAppointments = countByStatuses(appointments, Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED));
        long completedAppointments = countByStatuses(appointments, Set.of(AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW));
        long cancelledAppointments = countByStatuses(appointments, Set.of(AppointmentStatus.CANCELLED));
        long uniquePatients = appointments.stream()
                .map(Appointment::getPatientId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        long activeDoctors = appointments.stream()
                .map(Appointment::getDoctorId)
                .filter(Objects::nonNull)
                .distinct()
                .count();
        BigDecimal totalRevenue = appointments.stream()
                .filter(item -> item.getStatus() == AppointmentStatus.COMPLETED)
                .map(Appointment::getServicePrice)
                .filter(Objects::nonNull)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        return new AdminAnalyticsResponse.Summary(
                totalAppointments,
                scheduledAppointments,
                completedAppointments,
                cancelledAppointments,
                uniquePatients,
                activeDoctors,
                percentage(cancelledAppointments, totalAppointments),
                totalRevenue
        );
    }

    private List<AdminAnalyticsResponse.DailyStat> buildDailyStats(List<Appointment> appointments, LocalDate fromDate, LocalDate toDate) {
        Map<LocalDate, List<Appointment>> appointmentsByDate = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getAppointmentDate));

        List<AdminAnalyticsResponse.DailyStat> result = new ArrayList<>();
        for (LocalDate date = fromDate; !date.isAfter(toDate); date = date.plusDays(1)) {
            List<Appointment> dailyAppointments = appointmentsByDate.getOrDefault(date, List.of());
            result.add(new AdminAnalyticsResponse.DailyStat(
                    date,
                    dailyAppointments.size(),
                    countByStatuses(dailyAppointments, Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)),
                    countByStatuses(dailyAppointments, Set.of(AppointmentStatus.COMPLETED, AppointmentStatus.NO_SHOW)),
                    countByStatuses(dailyAppointments, Set.of(AppointmentStatus.CANCELLED))
            ));
        }
        return result;
    }

    private List<AdminAnalyticsResponse.StatusStat> buildStatusStats(List<Appointment> appointments) {
        Map<AppointmentStatus, Long> counts = appointments.stream()
                .collect(Collectors.groupingBy(Appointment::getStatus, () -> new EnumMap<>(AppointmentStatus.class), Collectors.counting()));

        List<AdminAnalyticsResponse.StatusStat> result = new ArrayList<>();
        for (AppointmentStatus item : AppointmentStatus.values()) {
            result.add(new AdminAnalyticsResponse.StatusStat(item.name(), counts.getOrDefault(item, 0L)));
        }
        return result;
    }

    private List<AdminAnalyticsResponse.SpecialtyStat> buildSpecialtyBreakdown(
            List<Appointment> appointments,
            Map<Long, Doctor> doctorsById
    ) {
        Map<String, Long> counts = new HashMap<>();
        for (Appointment appointment : appointments) {
            Doctor doctor = doctorsById.get(appointment.getDoctorId());
            String specialty = doctor == null || doctor.getSpecialty() == null || doctor.getSpecialty().isBlank()
                    ? "Без специальности"
                    : doctor.getSpecialty().trim();
            counts.merge(specialty, 1L, Long::sum);
        }

        long totalAppointments = appointments.size();
        return counts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .map(entry -> new AdminAnalyticsResponse.SpecialtyStat(
                        entry.getKey(),
                        entry.getValue(),
                        percentage(entry.getValue(), totalAppointments)
                ))
                .toList();
    }

    private List<AdminAnalyticsResponse.DoctorLoadStat> buildDoctorLoad(
            List<Appointment> appointments,
            Map<Long, Doctor> doctorsById
    ) {
        Map<Long, List<Appointment>> byDoctorId = appointments.stream()
                .filter(item -> item.getDoctorId() != null)
                .collect(Collectors.groupingBy(Appointment::getDoctorId, LinkedHashMap::new, Collectors.toList()));

        long totalAppointments = appointments.size();
        return byDoctorId.entrySet().stream()
                .map(entry -> {
                    Long currentDoctorId = entry.getKey();
                    List<Appointment> doctorAppointments = entry.getValue();
                    Doctor doctor = doctorsById.get(currentDoctorId);
                    String doctorName = doctor == null || doctor.getFullName() == null || doctor.getFullName().isBlank()
                            ? "Неизвестный врач"
                            : doctor.getFullName().trim();
                    String specialty = doctor == null || doctor.getSpecialty() == null || doctor.getSpecialty().isBlank()
                            ? "Без специальности"
                            : doctor.getSpecialty().trim();

                    long doctorTotal = doctorAppointments.size();
                    return new AdminAnalyticsResponse.DoctorLoadStat(
                            currentDoctorId,
                            doctorName,
                            specialty,
                            doctorTotal,
                            countByStatuses(doctorAppointments, Set.of(AppointmentStatus.SCHEDULED, AppointmentStatus.CONFIRMED)),
                            countByStatuses(doctorAppointments, Set.of(AppointmentStatus.COMPLETED)),
                            countByStatuses(doctorAppointments, Set.of(AppointmentStatus.CANCELLED, AppointmentStatus.NO_SHOW)),
                            percentage(doctorTotal, totalAppointments)
                    );
                })
                .sorted(Comparator
                        .comparingLong(AdminAnalyticsResponse.DoctorLoadStat::totalAppointments).reversed()
                        .thenComparing(AdminAnalyticsResponse.DoctorLoadStat::doctorName))
                .toList();
    }

    private List<AdminAnalyticsResponse.TopServiceStat> buildTopServices(List<Appointment> appointments) {
        Map<String, ServiceAggregate> byService = new HashMap<>();
        for (Appointment appointment : appointments) {
            String serviceName = normalizeServiceName(appointment.getServiceName());
            ServiceAggregate aggregate = byService.computeIfAbsent(serviceName, ignored -> new ServiceAggregate());
            aggregate.count++;
            if (appointment.getStatus() == AppointmentStatus.COMPLETED && appointment.getServicePrice() != null) {
                aggregate.revenue = aggregate.revenue.add(appointment.getServicePrice());
            }
        }

        long totalAppointments = appointments.size();
        return byService.entrySet().stream()
                .sorted((left, right) -> {
                    int byCount = Long.compare(right.getValue().count, left.getValue().count);
                    if (byCount != 0) {
                        return byCount;
                    }
                    int byRevenue = right.getValue().revenue.compareTo(left.getValue().revenue);
                    if (byRevenue != 0) {
                        return byRevenue;
                    }
                    return left.getKey().compareTo(right.getKey());
                })
                .limit(7)
                .map(entry -> new AdminAnalyticsResponse.TopServiceStat(
                        entry.getKey(),
                        entry.getValue().count,
                        entry.getValue().revenue.setScale(2, RoundingMode.HALF_UP),
                        percentage(entry.getValue().count, totalAppointments)
                ))
                .toList();
    }

    private void writeSummary(XSSFSheet sheet, AdminAnalyticsResponse dashboard) {
        int rowIndex = 0;
        rowIndex = writeRow(sheet, rowIndex, "Период", dashboard.fromDate() + " - " + dashboard.toDate());
        rowIndex = writeRow(sheet, rowIndex, "Всего записей", dashboard.summary().totalAppointments());
        rowIndex = writeRow(sheet, rowIndex, "Активные", dashboard.summary().scheduledAppointments());
        rowIndex = writeRow(sheet, rowIndex, "Завершённые", dashboard.summary().completedAppointments());
        rowIndex = writeRow(sheet, rowIndex, "Отменённые", dashboard.summary().cancelledAppointments());
        writeRow(sheet, rowIndex, "Выручка", dashboard.summary().totalRevenue().toPlainString());
    }

    private void writeDoctors(XSSFSheet sheet, AdminAnalyticsResponse dashboard) {
        int rowIndex = 0;
        rowIndex = writeHeader(sheet, rowIndex, "Врач", "Специальность", "Всего", "Активные", "Завершённые", "Отменённые");
        for (AdminAnalyticsResponse.DoctorLoadStat item : dashboard.doctorLoad()) {
            rowIndex = writeRow(sheet, rowIndex,
                    item.doctorName(),
                    item.specialty(),
                    item.totalAppointments(),
                    item.scheduledAppointments(),
                    item.completedAppointments(),
                    item.cancelledAppointments());
        }
    }

    private void writeServices(XSSFSheet sheet, AdminAnalyticsResponse dashboard) {
        int rowIndex = 0;
        rowIndex = writeHeader(sheet, rowIndex, "Услуга", "Количество", "Выручка", "Доля");
        for (AdminAnalyticsResponse.TopServiceStat item : dashboard.topServices()) {
            rowIndex = writeRow(sheet, rowIndex,
                    item.serviceName(),
                    item.count(),
                    item.totalRevenue().toPlainString(),
                    item.sharePercent().toPlainString() + "%");
        }
    }

    private int writeHeader(XSSFSheet sheet, int rowIndex, Object... values) {
        return writeRow(sheet, rowIndex, values);
    }

    private int writeRow(XSSFSheet sheet, int rowIndex, Object... values) {
        Row row = sheet.createRow(rowIndex++);
        for (int i = 0; i < values.length; i++) {
            row.createCell(i).setCellValue(String.valueOf(values[i]));
        }
        return rowIndex;
    }

    private void addCell(PdfPTable table, String value) {
        table.addCell(new PdfPCell(new Phrase(value)));
    }

    private long countByStatuses(List<Appointment> appointments, Set<AppointmentStatus> statuses) {
        return appointments.stream()
                .filter(item -> statuses.contains(item.getStatus()))
                .count();
    }

    private BigDecimal percentage(long part, long whole) {
        if (whole <= 0) {
            return BigDecimal.ZERO.setScale(1, RoundingMode.HALF_UP);
        }
        return BigDecimal.valueOf(part)
                .multiply(BigDecimal.valueOf(100))
                .divide(BigDecimal.valueOf(whole), 1, RoundingMode.HALF_UP);
    }

    private AppointmentStatus parseStatus(String value) {
        String normalized = normalize(value);
        if (normalized == null) {
            return null;
        }
        return AppointmentStatus.valueOf(normalized.toUpperCase());
    }

    private String normalize(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private String normalizeServiceName(String serviceName) {
        return normalize(serviceName) == null ? "Консультация" : serviceName.trim();
    }

    private record DashboardContext(
            LocalDate fromDate,
            LocalDate toDate,
            List<Appointment> filteredAppointments,
            Map<Long, Doctor> doctorsById
    ) {
    }

    private static final class ServiceAggregate {
        private long count;
        private BigDecimal revenue = BigDecimal.ZERO;
    }
}
