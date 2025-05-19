package main

import (
	"bufio"
	"database/sql"
	"errors"
	"fmt"
	"log"
	"strconv"
	"strings"

	"github.com/jackc/pgx/v5/pgconn"
)

// SimpleLookupTableConfig описывает метаданные и настройки для простого справочника
type SimpleLookupTableConfig struct {
	TableName      string // Имя таблицы в БД
	IDColumn       string // Имя колонки ID
	NameColumn     string // Имя колонки с наименованием/типом
	DisplayName    string // Человекочитаемое имя типа записи (единственное число, именительный падеж, для меню)
	ItemNameSingle string // Человекочитаемое имя элемента (единственное число, винительный падеж, для сообщений)
	ItemNamePlural string // Человекочитаемое имя элемента (множественное число, именительный падеж, для сообщений)
	NameMaxLen     int    // Максимальная длина наименования
	IDMaxVal       int    // Максимальное значение для ID (для NUMERIC(1) это 9)
	ForeignKeyHint string // Подсказка о связанной таблице для сообщения об ошибке удаления
}

// viewSimpleLookupItems отображает все записи из простого справочника
func viewSimpleLookupItems(db *sql.DB, cfg SimpleLookupTableConfig) {
	fmt.Printf("\n--- Текущие %s ---\n", strings.ToLower(cfg.ItemNamePlural))
	query := fmt.Sprintf("SELECT %s, %s FROM %s ORDER BY %s", cfg.IDColumn, cfg.NameColumn, cfg.TableName, cfg.IDColumn)

	rows, err := db.Query(query)
	if err != nil {
		log.Printf("Ошибка при чтении записей ('%s'): %v\n", cfg.DisplayName, err)
		return
	}
	defer rows.Close()

	found := false
	for rows.Next() {
		found = true
		var id int
		var name string
		if err := rows.Scan(&id, &name); err != nil {
			log.Printf("Ошибка при сканировании строки для '%s': %v\n", cfg.DisplayName, err)
			continue
		}
		fmt.Printf("ID: %d, Название: %s\n", id, name)
	}

	if err = rows.Err(); err != nil {
		log.Printf("Ошибка после итерации по строкам для '%s': %v\n", cfg.DisplayName, err)
		return
	}

	if !found {
		fmt.Printf("В таблице '%s' нет записей.\n", cfg.TableName)
	}
}

// insertSimpleLookupItem добавляет новую запись в простой справочник
func insertSimpleLookupItem(db *sql.DB, reader *bufio.Reader, cfg SimpleLookupTableConfig) {
	fmt.Printf("\n--- Добавление нового %s ---\n", strings.ToLower(cfg.ItemNameSingle))

	fmt.Printf("Введите ID для %s (0-%d): ", strings.ToLower(cfg.ItemNameSingle), cfg.IDMaxVal)
	inputID, _ := reader.ReadString('\n')
	idStr := strings.TrimSpace(inputID)
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Printf("Ошибка: ID должен быть числом. %v\n", err)
		return
	}
	if id < 0 || id > cfg.IDMaxVal {
		fmt.Printf("Ошибка: ID для %s должен быть числом от 0 до %d.\n", strings.ToLower(cfg.ItemNameSingle), cfg.IDMaxVal)
		return
	}

	fmt.Printf("Введите название для %s (макс. %d симв.): ", strings.ToLower(cfg.ItemNameSingle), cfg.NameMaxLen)
	name, _ := reader.ReadString('\n')
	name = strings.TrimSpace(name)
	if name == "" {
		fmt.Printf("Ошибка: Название для %s не может быть пустым.\n", strings.ToLower(cfg.ItemNameSingle))
		return
	}
	if len(name) > cfg.NameMaxLen {
		fmt.Printf("Ошибка: Название для %s слишком длинное (максимум %d символов).\n", strings.ToLower(cfg.ItemNameSingle), cfg.NameMaxLen)
		return
	}

	query := fmt.Sprintf("INSERT INTO %s (%s, %s) VALUES ($1, $2)", cfg.TableName, cfg.IDColumn, cfg.NameColumn)
	result, err := db.Exec(query, id, name)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23505" { // unique_violation
			fmt.Printf("Ошибка: %s с ID %d уже существует.\n", cfg.DisplayName, id)
		} else {
			fmt.Printf("Не удалось добавить %s: %v\n", strings.ToLower(cfg.ItemNameSingle), err)
		}
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("%s '%s' (ID: %d) успешно добавлен.\n", cfg.DisplayName, name, id)
	} else {
		fmt.Printf("%s не был добавлен.\n", cfg.DisplayName)
	}
}

// deleteSimpleLookupItem удаляет запись из простого справочника
func deleteSimpleLookupItem(db *sql.DB, reader *bufio.Reader, cfg SimpleLookupTableConfig) {
	fmt.Printf("\n--- Удаление %s ---\n", strings.ToLower(cfg.ItemNameSingle))
	viewSimpleLookupItems(db, cfg) // Показать текущие для удобства

	if !hasRecordsInTable(db, cfg.TableName) {
		// Сообщение об отсутствии записей уже выведено в viewSimpleLookupItems
		return
	}

	fmt.Printf("Введите ID %s для удаления: ", strings.ToLower(cfg.ItemNameSingle))
	inputID, _ := reader.ReadString('\n')
	idStr := strings.TrimSpace(inputID)
	id, err := strconv.Atoi(idStr)
	if err != nil {
		fmt.Printf("Ошибка: ID должен быть числом. %v\n", err)
		return
	}

	fmt.Printf("Вы уверены, что хотите удалить %s с ID %d? (y/n): ", strings.ToLower(cfg.ItemNameSingle), id)
	confirmInput, _ := reader.ReadString('\n')
	if strings.TrimSpace(strings.ToLower(confirmInput)) != "y" {
		fmt.Println("Удаление отменено.")
		return
	}

	query := fmt.Sprintf("DELETE FROM %s WHERE %s = $1", cfg.TableName, cfg.IDColumn)
	result, err := db.Exec(query, id)
	if err != nil {
		var pgErr *pgconn.PgError
		if errors.As(err, &pgErr) && pgErr.Code == "23503" { // foreign_key_violation
			fmt.Printf("Ошибка: Невозможно удалить %s с ID %d, так как он используется в таблице '%s'.\n", strings.ToLower(cfg.ItemNameSingle), id, cfg.ForeignKeyHint)
			fmt.Printf("Сначала удалите или обновите связанные записи в таблице '%s'.\n", cfg.ForeignKeyHint)
		} else {
			fmt.Printf("Не удалось удалить %s: %v\n", strings.ToLower(cfg.ItemNameSingle), err)
		}
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected > 0 {
		fmt.Printf("%s с ID %d успешно удален.\n", cfg.DisplayName, id)
	} else {
		fmt.Printf("%s с ID %d не найден или не был удален.\n", cfg.DisplayName, id)
	}
}

// hasRecordsInTable проверяет, есть ли записи в указанной таблице
func hasRecordsInTable(db *sql.DB, tableName string) bool {
	var count int
	query := fmt.Sprintf("SELECT COUNT(*) FROM %s", tableName) // Безопасно, т.к. tableName из нашего конфига
	err := db.QueryRow(query).Scan(&count)
	if err != nil {
		log.Printf("Ошибка при подсчете записей в %s: %v", tableName, err)
		return false // Лучше сообщить об ошибке, чем дать удалить из пустой таблицы по ошибке
	}
	return count > 0
}
