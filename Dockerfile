FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY build.gradle.kts settings.gradle.kts ./
COPY gradle ./gradle
COPY gradlew ./
RUN chmod +x gradlew

COPY src ./src

RUN ./gradlew bootJar

EXPOSE 8080

ENTRYPOINT ["java","-jar","build/libs/Diploma-1.0.0.jar"]


