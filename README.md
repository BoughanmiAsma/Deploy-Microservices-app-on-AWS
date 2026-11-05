# Spring Boot Microservices

Ce dépôt contient le code source complet du projet **Spring Boot 3 Microservices**.

## Services inclus

* `product-service`
* `order-service`
* `inventory-service`
* `notification-service`
* `api-gateway` (Spring Cloud Gateway)
* `discovery-service` (Eureka)

---

## Technologies utilisées

* **Spring Boot 3**
* **Spring Cloud**
* **MySQL / MongoDB**
* **Kafka**
* **Keycloak**
* **Testcontainers + WireMock**
* **Grafana / Prometheus / Loki / Tempo**
* **Angular 18** (frontend)
* **Docker / Kubernetes**

---

## Architecture applicative

![Architecture](./img.png)

---

## Lancer l’application frontend (facultatif)

Assure-toi d’avoir installé :

* Node.js
* npm
* Angular CLI

Puis exécute :

```bash
cd frontend
npm install
npm run start
```

---

## Builder les microservices backend

### Étape 1 — Build des JARs

```bash
mvn clean package -DskipTests
```

Chaque service produira un JAR exécutable dans son dossier `target/`.

Exemple :
`api-gateway/target/api-gateway-0.0.1-SNAPSHOT.jar`

---

### Étape 2 — Construire les images Docker manuellement

Crée un fichier `Dockerfile` dans chaque dossier de service (ex: `api-gateway/`) :

```dockerfile
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
```

Puis exécute :

```bash
cd api-gateway
docker build -t <username>/api-gateway:latest .
```

Fais la même chose pour chaque service.

---

### Étape 3 — Pousser sur Docker Hub

```bash
docker login
docker push <username>/api-gateway:latest
```
Fais la même chose pour chaque service.
