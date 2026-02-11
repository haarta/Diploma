FROM eclipse-temurin:21-jdk

WORKDIR /app


COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
COPY gradlew ./
RUN chmod +x gradlew

# Копируем исходники
COPY backend/src ./src

# Собираем jar
RUN ./gradlew clean bootJar --no-daemon

EXPOSE 8080

# Запускаем стабильное имя артефакта (см. bootJar archiveFileName)
ENTRYPOINT ["java","-jar","build/libs/app.jar"]
