
## Prérequis
Java 21+, Node.js LTS, Docker

## Lancer le projet
```bash
docker compose up -d          # base PostgreSQL
cd backend && ./mvnw spring-boot:run
cd frontend && npm install && ng serve
```

Back : http://localhost:8080/actuator/health  
Front : http://localhost:4200
=======
# GreenRAN
Monitor yor 5G antennas to save energy
