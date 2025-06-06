package main

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config хранит настройки приложения.
type Config struct {
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	DBSslMode  string
	AppPort    string
}

// LoadConfig загружает конфигурацию из .env или переменных окружения.
func LoadConfig() *Config {
	err := godotenv.Load()
	if err != nil {
		log.Println("Предупреждение: .env не найден. Используются переменные окружения.")
	}

	cfg := &Config{
		DBHost:     os.Getenv("DB_HOST"),
		DBPort:     5432, // Порт БД по умолчанию
		DBUser:     os.Getenv("DB_USER"),
		DBPassword: os.Getenv("DB_PASSWORD"),
		DBName:     os.Getenv("DB_NAME"),
		DBSslMode:  os.Getenv("DB_SSLMODE"),
		AppPort:    "8080", // Порт приложения по умолчанию
	}

	// Парсинг порта БД из переменной окружения.
	if dbPortStr := os.Getenv("DB_PORT"); dbPortStr != "" {
		if port, err := strconv.Atoi(dbPortStr); err == nil {
			cfg.DBPort = port
		} else {
			log.Printf("Предупреждение: неверный формат порта БД. Используется 5432.")
		}
	}

	// Применение порта приложения из переменной окружения.
	if appPort := os.Getenv("APP_PORT"); appPort != "" {
		cfg.AppPort = appPort
	}

	// Проверка обязательных переменных БД.
	if cfg.DBHost == "" || cfg.DBUser == "" || cfg.DBName == "" {
		log.Fatal("Ошибка: не все обязательные переменные БД определены (DB_HOST, DB_USER, DB_NAME).")
	}
	if cfg.DBSslMode == "" {
		cfg.DBSslMode = "disable"
	}

	return cfg
}
