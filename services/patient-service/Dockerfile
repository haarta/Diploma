FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/patient-service/build/libs/docker-app.jar /app/app.jar

EXPOSE 8082
ENTRYPOINT ["java","-jar","/app/app.jar"]
