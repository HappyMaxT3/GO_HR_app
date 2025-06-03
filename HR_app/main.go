package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	_ "github.com/jackc/pgx/v5/stdlib" // PostgreSQL driver
)

func main() {
	// Загрузка конфигурации
	cfg := LoadConfig()

	// Инициализация подключения к БД
	db, err := InitDB(cfg)
	if err != nil {
		log.Fatalf("Не удалось инициализировать базу данных: %v", err)
	}
	defer db.Close()
	fmt.Println("Успешно подключено к базе данных PostgreSQL!")

	// Настройка HTTP-сервера
	setupRoutes(db)

	fmt.Printf("Сервер запущен на :%s. Откройте http://localhost:%s в браузере.\n", cfg.AppPort, cfg.AppPort)
	log.Fatal(http.ListenAndServe(":"+cfg.AppPort, nil))
}

// setupRoutes настраивает все маршруты HTTP
func setupRoutes(db *sql.DB) {
	// Обслуживание статических файлов
	fs := http.FileServer(http.Dir("./web"))
	http.Handle("/", fs)

	// API для чтения данных (GET)
	http.HandleFunc("/api/data", getDataHandler(db))

	// API для CRUD операций (POST, PUT, DELETE)
	http.HandleFunc("/api/employees", crudHandler(db, "employees"))
	http.HandleFunc("/api/departments", crudHandler(db, "departments"))
	http.HandleFunc("/api/positions", crudHandler(db, "positions"))
	http.HandleFunc("/api/absences_types", crudHandler(db, "absences_types"))
	http.HandleFunc("/api/employees_education_types", crudHandler(db, "employees_education_types"))
	http.HandleFunc("/api/employees_contacts_types", crudHandler(db, "employees_contacts_types"))
	// ... добавьте остальные таблицы, для которых нужен CRUD
	http.HandleFunc("/api/employees_addresses", crudHandler(db, "employees_addresses"))
	http.HandleFunc("/api/employees_education", crudHandler(db, "employees_education"))
	http.HandleFunc("/api/employees_contacts", crudHandler(db, "employees_contacts"))
	http.HandleFunc("/api/staffing", crudHandler(db, "staffing"))
	http.HandleFunc("/api/job", crudHandler(db, "job"))
	http.HandleFunc("/api/absences", crudHandler(db, "absences"))
}
