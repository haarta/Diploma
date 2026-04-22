FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/auth-service/build/libs/*.jar /app/app.jar

EXPOSE 8081
ENTRYPOINT ["java","-jar","/app/app.jar"]
