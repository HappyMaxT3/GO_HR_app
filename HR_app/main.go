package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
)

func main() {
	// Загрузка переменных окружения из .env файла
	err := godotenv.Load()
	if err != nil {
		log.Println("Предупреждение: не удалось загрузить .env файл. Используются переменные окружения системы/контейнера.")
	}

	// Получение данных для подключения к БД из переменных окружения
	dbHost := os.Getenv("DB_HOST")
	dbPortStr := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSslMode := os.Getenv("DB_SSLMODE")

	// Проверка наличия обязательных переменных
	if dbHost == "" || dbPortStr == "" || dbUser == "" || dbName == "" {
		log.Fatal("Ошибка: не все переменные для подключения к БД определены (DB_HOST, DB_PORT, DB_USER, DB_NAME). Проверьте переменные окружения.")
	}
	dbPort, err := strconv.Atoi(dbPortStr)
	if err != nil {
		log.Fatalf("Ошибка: неверный формат порта БД: %v", err)
	}

	// Формирование DSN (Data Source Name) для подключения к PostgreSQL
	dsn := fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, dbSslMode)

	// Открытие подключения к базе данных
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Не удалось настроить подключение к базе данных: %v", err)
	}
	defer db.Close() // Закрытие подключения при завершении работы main

	// Проверка подключения к базе данных
	err = db.Ping()
	if err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v. DSN: %s", err, dsn)
	}
	fmt.Println("Успешно подключено к базе данных PostgreSQL!")

	// --- Настройка HTTP-сервера ---

	fs := http.FileServer(http.Dir("static"))
	http.Handle("/", fs)

	http.HandleFunc("/api/data", getDataHandler(db))

	fmt.Println("Сервер запущен на :8080. Откройте http://localhost:8080 в браузере.")
	log.Fatal(http.ListenAndServe(":8080", nil))

	// --- Закомментированный код консольного меню ---
	// reader := bufio.NewReader(os.Stdin)
	// mainMenuLoop(db, reader)
}

func getDataHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Получен запрос к /api/data с параметрами: %v", r.URL.Query())
		w.Header().Set("Content-Type", "application/json")

		tableName := r.URL.Query().Get("table")
		if tableName == "" {
			log.Printf("Ошибка: Параметр 'table' не указан.")
			http.Error(w, `{"error": "Параметр 'table' не указан."}`, http.StatusBadRequest)
			return
		}
		log.Printf("Запрашивается таблица: %s", tableName)

		var rows *sql.Rows
		var err error

		query := fmt.Sprintf("SELECT * FROM %s", tableName)

		rows, err = db.Query(query)
		if err != nil {
			log.Printf("Ошибка выполнения запроса к таблице %s: %v", tableName, err)
			http.Error(w, fmt.Sprintf(`{"error": "Ошибка при получении данных: %v"}`, err), http.StatusInternalServerError)
			return
		}
		defer rows.Close()

		columns, err := rows.Columns()
		if err != nil {
			log.Printf("Ошибка получения имен колонок: %v", err)
			http.Error(w, `{"error": "Ошибка при обработке данных (получение колонок)."}`, http.StatusInternalServerError)
			return
		}

		var results []map[string]interface{}

		for rows.Next() {
			values := make([]interface{}, len(columns))
			pointers := make([]interface{}, len(columns))

			for i := range values {
				pointers[i] = &values[i]
			}

			if err := rows.Scan(pointers...); err != nil {
				log.Printf("Ошибка сканирования строки: %v", err)
				http.Error(w, `{"error": "Ошибка при сканировании данных."}`, http.StatusInternalServerError)
				return
			}

			rowMap := make(map[string]interface{})
			for i, colName := range columns {
				val := values[i]
				if b, ok := val.([]byte); ok {
					rowMap[colName] = string(b)
				} else {
					rowMap[colName] = val
				}
			}
			results = append(results, rowMap)
		}

		if err := rows.Err(); err != nil {
			log.Printf("Ошибка после итерации по строкам: %v", err)
			http.Error(w, `{"error": "Ошибка после получения данных."}`, http.StatusInternalServerError)
			return
		}

		jsonBytes, err := json.Marshal(results)
		if err != nil {
			log.Printf("Ошибка маршалинга JSON: %v", err)
			http.Error(w, `{"error": "Ошибка при форматировании данных в JSON."}`, http.StatusInternalServerError)
			return
		}

		w.Write(jsonBytes)
	}
}

// Закомментированные функции старого консольного меню
/*
func mainMenuLoop(db *sql.DB, reader *bufio.Reader) {
    for {
        fmt.Println("\n=========================================")
        fmt.Println("             ГЛАВНОЕ МЕНЮ")
        fmt.Println("=========================================")
        fmt.Println("1. Управление типами отсутствий")
        fmt.Println("2. Управление типами образования")
        fmt.Println("3. Управление типами контактов сотрудников")
        fmt.Println("0. Выход")
        fmt.Print("Ваш выбор: ")

        input, _ := reader.ReadString('\n')
        choiceStr := strings.TrimSpace(input)

        switch choiceStr {
        case "1":
            simpleLookupSubMenu(db, reader, "Типы отсутствий", viewAbsenceTypes, insertAbsenceType, deleteAbsenceType)
        case "2":
            simpleLookupSubMenu(db, reader, "Типы образования", viewEducationTypes, insertEducationType, deleteEducationType)
        case "3":
            simpleLookupSubMenu(db, reader, "Типы контактов сотрудников", viewContactsTypes, insertContactsType, deleteContactsType)
        case "0":
            fmt.Println("Завершение работы программы.")
            return
        default:
            fmt.Println("Неверный выбор. Пожалуйста, попробуйте снова.")
        }
    }
}

func simpleLookupSubMenu(
    db *sql.DB,
    reader *bufio.Reader,
    menuTitle string,
    viewFunc func(*sql.DB),
    insertFunc func(*sql.DB, *bufio.Reader),
    deleteFunc func(*sql.DB, *bufio.Reader),
) {
    for {
        fmt.Printf("\n--- Меню: %s ---\n", menuTitle)
        fmt.Printf("1. Показать все %s\n", strings.ToLower(menuTitle))
        fmt.Printf("2. Добавить новый %s\n", strings.ToLower(singularForm(menuTitle)))
        fmt.Printf("3. Удалить %s\n", strings.ToLower(singularForm(menuTitle)))
        fmt.Println("0. Назад в главное меню")
        fmt.Print("Ваш выбор: ")

        input, _ := reader.ReadString('\n')
        choiceStr := strings.TrimSpace(input)

        switch choiceStr {
        case "1":
            viewFunc(db)
        case "2":
            insertFunc(db, reader)
        case "3":
            deleteFunc(db, reader)
        case "0":
            return
        default:
            fmt.Println("Неверный выбор. Пожалуйста, попробуйте снова.")
        }
    }
}

func singularForm(pluralTitle string) string {
    if strings.HasSuffix(strings.ToLower(pluralTitle), "ы") && len(pluralTitle) > 1 {
        return pluralTitle[:len(pluralTitle)-1]
    }
    if strings.HasSuffix(strings.ToLower(pluralTitle), "ия") && len(pluralTitle) > 2 {
        return pluralTitle[:len(pluralTitle)-1]
    }
    return pluralTitle
}
*/
