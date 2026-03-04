FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY gradlew gradlew
COPY gradle gradle
COPY settings.gradle.kts settings.gradle.kts
COPY build.gradle.kts build.gradle.kts

COPY services/auth-service/build.gradle.kts services/auth-service/build.gradle.kts
COPY services/auth-service/src services/auth-service/src

RUN chmod +x gradlew
RUN ./gradlew :services:auth-service:bootJar -x test

RUN cp services/auth-service/build/libs/*.jar app.jar

EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]
