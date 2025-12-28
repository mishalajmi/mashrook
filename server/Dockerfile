FROM maven:3.9-eclipse-temurin-25 AS build
WORKDIR /build
COPY pom.xml .
# First download dependencies separately (for better caching)
RUN mvn dependency:go-offline
COPY src ./src
RUN mvn -DskipTests -e clean package spring-boot:repackage

FROM bellsoft/liberica-runtime-container:jre-25-slim-musl
WORKDIR /app
RUN addgroup -S spring && adduser -S spring -G spring
COPY --from=build /build/target/*.jar app.jar
RUN chown -R spring:spring /app
USER spring:spring

EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]