FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY settings.gradle.kts settings.gradle.kts
COPY build.gradle.kts build.gradle.kts

COPY services/appointment-service/build.gradle.kts services/appointment-service/build.gradle.kts
COPY services/appointment-service/src services/appointment-service/src

RUN chmod +x gradlew
RUN ./gradlew :services:appointment-service:bootJar -x test
RUN cp services/appointment-service/build/libs/*.jar app.jar

EXPOSE 8083
ENTRYPOINT ["java","-jar","/app/app.jar"]
