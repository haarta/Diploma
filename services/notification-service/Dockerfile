FROM eclipse-temurin:21-jre
WORKDIR /app
COPY services/notification-service/build/libs/*.jar /app/app.jar
EXPOSE 8084
ENTRYPOINT ["java","-jar","/app/app.jar"]
