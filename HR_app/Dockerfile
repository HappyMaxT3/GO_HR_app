# Сборка приложения
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download
RUN go mod verify

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/my_hr_app_binary .

FROM alpine:latest

COPY --from=builder /app/my_hr_app_binary /my_hr_app_binary

COPY --from=builder /app/static /static

CMD ["/my_hr_app_binary"]

EXPOSE 8080