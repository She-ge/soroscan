# Deploy Self Hosted

## Goal

Deploy your own instance of the SoroScan indexer and API using Docker Compose for local development or production.

## Prerequisites

- Docker and Docker Compose installed.
- Access to a Stellar/Soroban RPC URL.

## Code

```yaml
# docker-compose.yml excerpt
version: "3.8"
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: soroscan
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
  backend:
    build: ./django-backend
    environment:
      - DATABASE_URL=postgres://user:password@db:5432/soroscan
      - SOROBAN_RPC_URL=https://soroban-rpc.stellar.org
    ports:
      - "8000:8000"
    depends_on:
      - db
```

Run `docker-compose up -d` to start the stack.

## Expected Output

```text
Creating network "soroscan_default"
Creating db ... done
Creating backend ... done
```

## Error Handling

If the backend fails to start, ensure that the database has fully initialized and that `python manage.py migrate` has
been run. Check the container logs `docker logs <container_name>` for tracebacks.
