# Сборка приложения
FROM golang:1.24.2-alpine AS builder

WORKDIR /app

# Копируем файлы модулей и скачиваем зависимости
COPY go.mod go.sum ./
RUN go mod download
RUN go mod verify

# Копируем остальной исходный код приложения
COPY . .

# Собираем приложение
# -o /app/my_hr_app_binary - имя выходного бинарного файла
RUN CGO_ENABLED=0 GOOS=linux go build -a -installsuffix cgo -o /app/my_hr_app_binary .

# Запуск приложения
FROM alpine:latest

# Копируем скомпилированный бинарник из стадии сборки (builder)
COPY --from=builder /app/my_hr_app_binary /my_hr_app_binary

# Указываем команду для запуска приложения при старте контейнера
CMD ["/my_hr_app_binary"]