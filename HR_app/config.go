package main

import (
	"log"
	"os"
	"strconv"

	"github.com/joho/godotenv"
)

// Config holds application configuration.
type Config struct {
	DBHost     string
	DBPort     int
	DBUser     string
	DBPassword string
	DBName     string
	DBSslMode  string
	AppPort    string
}

// LoadConfig loads configuration from .env file or environment variables.
func LoadConfig() *Config {
	// Загружаем .env файл. Если его нет, используются системные переменные окружения.
	err := godotenv.Load()
	if err != nil {
		log.Println("Предупреждение: не удалось загрузить .env файл. Используются переменные окружения.")
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

	// Парсим порт БД из переменной окружения
	if dbPortStr := os.Getenv("DB_PORT"); dbPortStr != "" {
		if port, err := strconv.Atoi(dbPortStr); err == nil {
			cfg.DBPort = port
		} else {
			log.Printf("Предупреждение: неверный формат порта БД: %v. Используется значение по умолчанию 5432.", err)
		}
	}

	// Применяем порт приложения из переменной окружения
	if appPort := os.Getenv("APP_PORT"); appPort != "" {
		cfg.AppPort = appPort
	}

	// Проверяем наличие обязательных переменных для подключения к БД.
	if cfg.DBHost == "" || cfg.DBUser == "" || cfg.DBName == "" {
		log.Fatal("Ошибка: не все обязательные переменные для подключения к БД определены (DB_HOST, DB_USER, DB_NAME).")
	}
	// Устанавливаем режим SSL по умолчанию, если не указан.
	if cfg.DBSslMode == "" {
		cfg.DBSslMode = "disable"
	}

	return cfg
}
