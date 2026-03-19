# ---- Build stage ----
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

COPY pom.xml .
# Download dependencies first (cached layer)
RUN mvn dependency:go-offline -q

COPY src src
RUN mvn package -DskipTests -q

# ---- Runtime stage ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build /app/target/nivah-backend-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
