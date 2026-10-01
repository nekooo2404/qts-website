# Backend

QTS backend services are Spring Boot microservices under `backend/services`.
The root `pom.xml` is the Maven reactor; each service owns its API, Flyway
migrations, persistence adapters and service-level security.

| Service | Port | Responsibility |
| --- | ---: | --- |
| `lead-service` | 8081 | Consultation and CRM lead APIs |
| `event-service` | 8082 | Outbox/event delivery |
| `attendance-service` | 8083 | Device and attendance APIs |
| `identity-admin-service` | 8084 | Identity/session/admin APIs |
| `identity-bridge-service` | 8085 | Hydra login/consent/logout bridge |
| `hrm-service` | 8086 | Employee and organization APIs |

Run the complete backend verification from the repository root:

```powershell
powershell -ExecutionPolicy Bypass -File scripts/spring-production-gate.ps1
```

