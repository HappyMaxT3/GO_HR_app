package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"

	_ "github.com/jackc/pgx/v5/stdlib" // Драйвер PostgreSQL
)

func main() {
	cfg := LoadConfig() // Загрузка конфигурации

	db, err := InitDB(cfg) // Инициализация БД
	if err != nil {
		log.Fatalf("Ошибка инициализации БД: %v", err)
	}
	defer db.Close()
	fmt.Println("Успешно подключено к БД!")

	setupRoutes(db) // Настройка HTTP-маршрутов

	fmt.Printf("Сервер запущен на :%s. Откройте http://localhost:%s.\n", cfg.AppPort, cfg.AppPort)
	log.Fatal(http.ListenAndServe(":"+cfg.AppPort, nil))
}

// setupRoutes настраивает HTTP-маршруты.
func setupRoutes(db *sql.DB) {
	http.Handle("/", http.FileServer(http.Dir("./web"))) // Обслуживание статики

	http.HandleFunc("/api/data", getDataHandler(db))               // API для чтения
	http.HandleFunc("/api/validate-role", validateRoleHandler(db)) // API для проверки роли

	// API для CRUD операций
	http.HandleFunc("/api/employees", crudHandler(db, "employees"))
	http.HandleFunc("/api/departments", crudHandler(db, "departments"))
	http.HandleFunc("/api/positions", crudHandler(db, "positions"))
	http.HandleFunc("/api/absences_types", crudHandler(db, "absences_types"))
	http.HandleFunc("/api/employees_education_types", crudHandler(db, "employees_education_types"))
	http.HandleFunc("/api/employees_contacts_types", crudHandler(db, "employees_contacts_types"))
	http.HandleFunc("/api/employees_addresses", crudHandler(db, "employees_addresses"))
	http.HandleFunc("/api/employees_education", crudHandler(db, "employees_education"))
	http.HandleFunc("/api/employees_contacts", crudHandler(db, "employees_contacts"))
	http.HandleFunc("/api/staffing", crudHandler(db, "staffing"))
	http.HandleFunc("/api/job", crudHandler(db, "job"))
	http.HandleFunc("/api/absences", crudHandler(db, "absences"))
}
