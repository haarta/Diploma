# Stage 1: Build с Gradle
FROM eclipse-temurin:21-jdk AS builder

WORKDIR /build

# Копируй Gradle wrapper
COPY gradlew .
COPY gradle ./gradle
COPY build.gradle.kts .
COPY settings.gradle.kts .

# Загружай зависимости
RUN ./gradlew dependencies

# Копируй исходный код
COPY src ./src

# Собери приложение
RUN ./gradlew bootJar -x test

# Stage 2: Runtime с PostgreSQL
FROM eclipse-temurin:21-jre-alpine

# Установи PostgreSQL клиент (для проверки подключения)
RUN apk add --no-cache postgresql-client

WORKDIR /app

# Копируй собранный JAR из builder stage
COPY --from=builder /build/build/libs/*.jar app.jar

EXPOSE 8080

# Health check (опционально)
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

ENTRYPOINT ["java", "-jar", "app.jar"]
