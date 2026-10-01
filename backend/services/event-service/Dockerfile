FROM maven:3.9.11-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY pom.xml ./pom.xml
COPY backend/services/lead-service/pom.xml backend/services/lead-service/pom.xml
COPY backend/services/event-service/pom.xml backend/services/event-service/pom.xml
COPY backend/services/attendance-service/pom.xml backend/services/attendance-service/pom.xml
COPY backend/services/identity-admin-service/pom.xml backend/services/identity-admin-service/pom.xml
COPY backend/services/identity-bridge-service/pom.xml backend/services/identity-bridge-service/pom.xml
COPY backend/services/hrm-service/pom.xml backend/services/hrm-service/pom.xml
COPY backend/services/event-service/src backend/services/event-service/src
RUN mvn -B -ntp -pl backend/services/event-service -am package
RUN java -Djarmode=tools -jar backend/services/event-service/target/event-service-0.1.0.jar extract --layers --launcher --destination /layers

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S qts && adduser -S qts -G qts
COPY --from=build /layers/dependencies/ ./
COPY --from=build /layers/spring-boot-loader/ ./
COPY --from=build /layers/snapshot-dependencies/ ./
COPY --from=build /layers/application/ ./
USER qts
EXPOSE 8082
ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75", "-XX:+ExitOnOutOfMemoryError", "-Dfile.encoding=UTF-8", "-Dsun.jnu.encoding=UTF-8", "org.springframework.boot.loader.launch.JarLauncher"]
