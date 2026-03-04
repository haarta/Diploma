FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY settings.gradle.kts settings.gradle.kts
COPY build.gradle.kts build.gradle.kts

COPY services/patient-service/build.gradle.kts services/patient-service/build.gradle.kts
COPY services/patient-service/src services/patient-service/src

RUN chmod +x gradlew
RUN ./gradlew :services:patient-service:bootJar -x test
RUN cp services/patient-service/build/libs/*.jar app.jar

EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]