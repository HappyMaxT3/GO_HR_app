package main

// docker compose run -it app /my_hr_app_binary - запуск

import (
	"bufio"
	"database/sql"
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	_ "github.com/jackc/pgx/v5/stdlib" // Драйвер PostgreSQL
	"github.com/joho/godotenv"         // Для загрузки .env файла
)

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Предупреждение: не удалось загрузить .env файл. Используются переменные окружения системы/контейнера.")
	}

	dbHost := os.Getenv("DB_HOST")
	dbPortStr := os.Getenv("DB_PORT")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")
	dbSslMode := os.Getenv("DB_SSLMODE")

	if dbHost == "" || dbPortStr == "" || dbUser == "" || dbName == "" {
		log.Fatal("Ошибка: не все переменные для подключения к БД определены (DB_HOST, DB_PORT, DB_USER, DB_NAME). Проверьте переменные окружения.")
	}
	dbPort, err := strconv.Atoi(dbPortStr)
	if err != nil {
		log.Fatalf("Ошибка: неверный формат порта БД: %v", err)
	}

	dsn := fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		dbUser, dbPassword, dbHost, dbPort, dbName, dbSslMode)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		log.Fatalf("Не удалось настроить подключение к базе данных: %v", err)
	}
	defer db.Close()

	err = db.Ping()
	if err != nil {
		log.Fatalf("Не удалось подключиться к базе данных: %v. DSN: %s", err, dsn)
	}
	fmt.Println("Успешно подключено к базе данных PostgreSQL!")

	reader := bufio.NewReader(os.Stdin)
	mainMenuLoop(db, reader)
}

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

// genericSimpleLookupSubMenu создает общее подменю для простых справочников
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
		fmt.Printf("2. Добавить новый %s\n", strings.ToLower(singularForm(menuTitle))) // Пытаемся получить единственное число
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
			return // Возврат в главное меню
		default:
			fmt.Println("Неверный выбор. Пожалуйста, попробуйте снова.")
		}
	}
}

// Простая вспомогательная функция для получения "единственного числа" из названия меню (очень упрощенно)
func singularForm(pluralTitle string) string {
	// Это очень упрощенная логика, для реального приложения нужны более сложные правила или передача явно.
	if strings.HasSuffix(strings.ToLower(pluralTitle), "ы") && len(pluralTitle) > 1 {
		return pluralTitle[:len(pluralTitle)-1]
	}
	if strings.HasSuffix(strings.ToLower(pluralTitle), "ия") && len(pluralTitle) > 2 { // образования -> образование
		return pluralTitle[:len(pluralTitle)-1]
	}
	// Можно добавить другие правила или просто использовать cfg.ItemNameSingle из SimpleLookupTableConfig, если передавать конфиг в subMenu
	return pluralTitle
}
