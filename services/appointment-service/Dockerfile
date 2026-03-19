FROM eclipse-temurin:21-jre

WORKDIR /app

COPY services/appointment-service/build/libs/*.jar /app/app.jar

EXPOSE 8083
ENTRYPOINT ["java","-jar","/app/app.jar"]
