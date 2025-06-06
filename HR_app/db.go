package main

import (
	"database/sql"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5"
	_ "github.com/jackc/pgx/v5/stdlib" // Импорт pgx driver для sql.Open
)

// TableSchema определяет схему для таблицы, включая первичные ключи и типы колонок.
type TableSchema struct {
	PrimaryKeyColumns []string          // Список имен колонок первичного ключа
	ColumnTypes       map[string]string // Карта: имя колонки (нижний регистр) -> упрощенный тип ("int", "string", "date", "float")
}

// tableSchemas содержит определения схем для всех таблиц.
// Все имена таблиц и колонок приведены к нижнему регистру,
// чтобы соответствовать схеме базы данных PostgreSQL по умолчанию.
var tableSchemas = map[string]TableSchema{
	"employees": {
		PrimaryKeyColumns: []string{"e_id"},
		ColumnTypes: map[string]string{
			"e_id": "int", "d_id": "string", "e_fname": "string", "e_lname": "string",
			"e_pasp": "string", "e_date": "date", "e_given": "string", "e_gender": "string",
			"e_inn": "string", "e_snils": "string", "e_born": "date", "e_hire": "date",
			"p_name": "string",
		},
	},
	"departments": {
		PrimaryKeyColumns: []string{"d_id"},
		ColumnTypes: map[string]string{
			"d_id": "string", "d_name": "string", "d_id_dir": "int",
		},
	},
	"positions": {
		PrimaryKeyColumns: []string{"p_name"},
		ColumnTypes: map[string]string{
			"p_name": "string", "p_sal": "float",
		},
	},
	"absences_types": {
		PrimaryKeyColumns: []string{"at_id"},
		ColumnTypes: map[string]string{
			"at_id": "int", "at_type": "string",
		},
	},
	"employees_education_types": {
		PrimaryKeyColumns: []string{"eet_id"},
		ColumnTypes: map[string]string{
			"eet_id": "int", "eet_name": "string",
		},
	},
	"employees_contacts_types": {
		PrimaryKeyColumns: []string{"ect_id"},
		ColumnTypes: map[string]string{
			"ect_id": "int", "ect_type": "string",
		},
	},
	"employees_addresses": {
		PrimaryKeyColumns: []string{"ea_id_e", "ea_addr"},
		ColumnTypes: map[string]string{
			"ea_id_e": "int", "ea_addr": "string",
		},
	},
	"employees_education": {
		PrimaryKeyColumns: []string{"ee_id_e", "ee_type", "ee_end"},
		ColumnTypes: map[string]string{
			"ee_id_e": "int", "ee_type": "int", "ee_end": "date",
			"ee_spec": "string", "ee_dip": "string", "ee_name": "string",
		},
	},
	"employees_contacts": {
		PrimaryKeyColumns: []string{"ec_id_e", "ec_type", "ec_mean"},
		ColumnTypes: map[string]string{
			"ec_id_e": "int", "ec_type": "int", "ec_mean": "string",
		},
	},
	"staffing": {
		PrimaryKeyColumns: []string{"s_id_d", "s_name_p"},
		ColumnTypes: map[string]string{
			"s_id_d": "string", "s_name_p": "string", "s_count": "int",
		},
	},
	"job": {
		PrimaryKeyColumns: []string{"j_id_d", "j_name_p", "j_id"},
		ColumnTypes: map[string]string{
			"j_id_d": "string", "j_name_p": "string", "j_id": "int",
			"j_start": "date", "j_end": "date", "j_doc": "string",
		},
	},
	"absences": {
		PrimaryKeyColumns: []string{"a_id"}, // Соответствует schema.sql
		ColumnTypes: map[string]string{
			"a_id": "int", "a_type": "int", "a_start": "date", "a_end": "date",
			"a_id_e": "int", "a_doc": "string",
		},
	},
	"departments_phones": {
		PrimaryKeyColumns: []string{"dp_id", "dp_phone"},
		ColumnTypes: map[string]string{
			"dp_id": "string", "dp_phone": "string",
		},
	},
	// Представления (VIEWs) - обычно только для чтения.
	// PrimaryKeyColumns пуст, если нет INSTEAD OF триггеров для CRUD.
	"employee_personal_data":       {PrimaryKeyColumns: []string{}},
	"hr_employee_data":             {PrimaryKeyColumns: []string{}},
	"department_employees":         {PrimaryKeyColumns: []string{}},
	"department_staffing":          {PrimaryKeyColumns: []string{}},
	"positions_staffing":           {PrimaryKeyColumns: []string{}},
	"employee_department_status":   {PrimaryKeyColumns: []string{}},
	"position_salary_distribution": {PrimaryKeyColumns: []string{}},
	"employee_transfer_history":    {PrimaryKeyColumns: []string{}},
}

// InitDB инициализирует и возвращает подключение к базе данных.
func InitDB(cfg *Config) (*sql.DB, error) {
	dsn := fmt.Sprintf("postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName, cfg.DBSslMode)

	db, err := sql.Open("pgx", dsn)
	if err != nil {
		return nil, fmt.Errorf("не удалось настроить подключение к базе данных: %w", err)
	}

	err = db.Ping()
	if err != nil {
		db.Close()
		return nil, fmt.Errorf("не удалось подключиться к базе данных: %w", err)
	}

	log.Println("Успешно подключено к базе данных!")
	return db, nil
}

// Возвращает (nil, nil), если сотрудник не найден.
func GetEmployeeByID(db *sql.DB, employeeID int) (*Employee, error) {
	query := "SELECT e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name FROM employees WHERE e_id = $1"
	row := db.QueryRow(query, employeeID)

	var emp Employee
	// Используем sql.NullString и т.д. для полей, которые могут быть NULL, если это применимо
	err := row.Scan(
		&emp.E_ID, &emp.D_ID, &emp.E_FNAME, &emp.E_LNAME, &emp.E_PASP,
		&emp.E_DATE, &emp.E_GIVEN, &emp.E_GENDER, &emp.E_INN, &emp.E_SNILS,
		&emp.E_BORN, &emp.E_HIRE, &emp.P_NAME,
	)

	if err != nil {
		if err == sql.ErrNoRows {
			// Это не ошибка приложения, а ожидаемый результат "не найдено"
			return nil, nil
		}
		// Это настоящая ошибка (проблема с БД, и т.д.)
		return nil, fmt.Errorf("ошибка при поиске сотрудника с ID %d: %w", employeeID, err)
	}

	return &emp, nil
}

// GenericGetTableData получает данные из любой таблицы (или представления).
func GenericGetTableData(db *sql.DB, tableName string) ([]map[string]interface{}, error) {
	// Экранируем имя таблицы с помощью pgx.Identifier для безопасности.
	quotedTableName := pgx.Identifier{tableName}.Sanitize()
	query := fmt.Sprintf("SELECT * FROM %s", quotedTableName)

	rows, err := db.Query(query)
	if err != nil {
		return nil, fmt.Errorf("ошибка выполнения запроса к таблице %s: %w", tableName, err)
	}
	defer rows.Close()

	columns, err := rows.Columns()
	if err != nil {
		return nil, fmt.Errorf("ошибка получения имен колонок: %w", err)
	}

	var results []map[string]interface{}

	for rows.Next() {
		values := make([]interface{}, len(columns))
		pointers := make([]interface{}, len(columns))

		for i := range values {
			pointers[i] = &values[i]
		}

		if err := rows.Scan(pointers...); err != nil {
			return nil, fmt.Errorf("ошибка сканирования строки: %w", err)
		}

		rowMap := make(map[string]interface{})
		for i, colName := range columns {
			val := values[i]
			colNameLower := strings.ToLower(colName) // Приводим имя колонки к нижнему регистру
			switch v := val.(type) {
			case []byte:
				rowMap[colNameLower] = string(v)
			case time.Time:
				rowMap[colNameLower] = v.Format("2006-01-02") // Форматируем дату
			case int64:
				rowMap[colNameLower] = int(v)
			case float64:
				rowMap[colNameLower] = v
			case nil:
				rowMap[colNameLower] = nil
			default:
				rowMap[colNameLower] = v
			}
		}
		results = append(results, rowMap)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("ошибка после итерации по строкам: %w", err)
	}

	return results, nil
}

// parseAndConvertData преобразует JSON-данные в Go-типы на основе схемы таблицы.
func parseAndConvertData(tableName string, rawData map[string]interface{}) (map[string]interface{}, error) {
	schema, exists := tableSchemas[tableName]
	if !exists {
		return nil, fmt.Errorf("схема для таблицы %s не найдена", tableName)
	}

	convertedData := make(map[string]interface{})
	for colName, rawValue := range rawData {
		colNameLower := strings.ToLower(colName) // Приводим имя колонки к нижнему регистру

		colType, typeExists := schema.ColumnTypes[colNameLower]
		if !typeExists {
			convertedData[colNameLower] = rawValue
			continue
		}

		switch colType {
		case "int":
			if rawValue == nil || rawValue == "" { // Обрабатываем nil и пустую строку как nil для int
				convertedData[colNameLower] = nil
				continue
			}
			if num, ok := rawValue.(float64); ok {
				convertedData[colNameLower] = int(num)
			} else if str, ok := rawValue.(string); ok {
				parsedInt, err := strconv.Atoi(str)
				if err != nil {
					return nil, fmt.Errorf("неверный тип для колонки %s (ожидался int): %v", colNameLower, rawValue)
				}
				convertedData[colNameLower] = parsedInt
			} else {
				return nil, fmt.Errorf("неверный тип для колонки %s (ожидался int): %T %v", colNameLower, rawValue, rawValue)
			}
		case "float":
			if rawValue == nil || rawValue == "" { // Обрабатываем nil и пустую строку как nil для float
				convertedData[colNameLower] = nil
				continue
			}
			if num, ok := rawValue.(float64); ok {
				convertedData[colNameLower] = num
			} else if str, ok := rawValue.(string); ok {
				parsedFloat, err := strconv.ParseFloat(str, 64)
				if err != nil {
					return nil, fmt.Errorf("неверный тип для колонки %s (ожидался float): %v", colNameLower, rawValue)
				}
				convertedData[colNameLower] = parsedFloat
			} else {
				return nil, fmt.Errorf("неверный тип для колонки %s (ожидался float): %T %v", colNameLower, rawValue, rawValue)
			}
		case "date":
			if rawValue == nil || rawValue == "" {
				convertedData[colNameLower] = nil // Обрабатываем nil или пустую строку как nil дату
				continue
			}
			if dateStr, ok := rawValue.(string); ok {
				t, err := time.Parse("2006-01-02", dateStr) // Ожидаем YYYY-MM-DD
				if err != nil {
					return nil, fmt.Errorf("неверный формат даты для колонки %s: %w", colNameLower, err)
				}
				convertedData[colNameLower] = t
			} else {
				return nil, fmt.Errorf("неверный тип для колонки %s (ожидалась строка даты): %T %v", colNameLower, rawValue, rawValue)
			}
		case "string":
			if rawValue == nil {
				convertedData[colNameLower] = nil
				continue
			}
			if str, ok := rawValue.(string); ok {
				convertedData[colNameLower] = str
			} else {
				convertedData[colNameLower] = fmt.Sprintf("%v", rawValue) // Конвертируем другие типы в строку
			}
		default:
			convertedData[colNameLower] = rawValue
		}
	}
	return convertedData, nil
}

// GenericCRUDOperations выполняет операции CREATE, UPDATE, DELETE.
func GenericCRUDOperations(db *sql.DB, tableName string, method string, data map[string]interface{}) error {
	schema, exists := tableSchemas[tableName]
	if !exists {
		return fmt.Errorf("операции CRUD не поддерживаются для таблицы: %s", tableName)
	}

	if len(schema.PrimaryKeyColumns) == 0 && (method == "PUT" || method == "DELETE") {
		return fmt.Errorf("CRUD операции (UPDATE/DELETE) не поддерживаются для %s, так как не определен первичный ключ.", tableName)
	}

	convertedData, err := parseAndConvertData(tableName, data)
	if err != nil {
		return fmt.Errorf("ошибка парсинга данных для таблицы %s: %w", tableName, err)
	}

	quotedTableName := pgx.Identifier{tableName}.Sanitize() // Экранируем имя таблицы

	var query string
	var args []interface{}

	switch method {
	case "POST": // INSERT
		columns := []string{}
		placeholders := []string{}
		paramCount := 1

		for k, v := range convertedData {
			if v != nil { // Исключаем nil значения из INSERT, если колонки не NULLABLE
				columns = append(columns, pgx.Identifier{k}.Sanitize())
				placeholders = append(placeholders, fmt.Sprintf("$%d", paramCount))
				args = append(args, v)
				paramCount++
			}
		}

		query = fmt.Sprintf("INSERT INTO %s (%s) VALUES (%s)",
			quotedTableName, strings.Join(columns, ", "), strings.Join(placeholders, ", "))

	case "PUT": // UPDATE
		sets := []string{}
		paramCount := 1

		for k, v := range convertedData {
			isPrimaryKey := false
			for _, pkCol := range schema.PrimaryKeyColumns {
				if k == strings.ToLower(pkCol) { // Сравнение имен колонок в нижнем регистре
					isPrimaryKey = true
					break
				}
			}
			if !isPrimaryKey {
				sets = append(sets, fmt.Sprintf("%s = $%d", pgx.Identifier{k}.Sanitize(), paramCount))
				args = append(args, v)
				paramCount++
			}
		}

		if len(sets) == 0 {
			return fmt.Errorf("нет полей для обновления в таблице %s", tableName)
		}

		whereClauses := []string{}
		for _, pkCol := range schema.PrimaryKeyColumns {
			pkValue, pkExists := convertedData[strings.ToLower(pkCol)]
			if !pkExists || pkValue == nil {
				return fmt.Errorf("не указано значение для первичного ключа %s для UPDATE", pkCol)
			}
			whereClauses = append(whereClauses, fmt.Sprintf("%s = $%d", pgx.Identifier{strings.ToLower(pkCol)}.Sanitize(), paramCount))
			args = append(args, pkValue)
			paramCount++
		}

		query = fmt.Sprintf("UPDATE %s SET %s WHERE %s",
			quotedTableName, strings.Join(sets, ", "), strings.Join(whereClauses, " AND "))

	case "DELETE": // DELETE
		whereClauses := []string{}
		paramCount := 1

		for _, pkCol := range schema.PrimaryKeyColumns {
			pkValue, pkExists := convertedData[strings.ToLower(pkCol)]
			if !pkExists || pkValue == nil {
				return fmt.Errorf("не указано значение для первичного ключа %s для DELETE", pkCol)
			}
			whereClauses = append(whereClauses, fmt.Sprintf("%s = $%d", pgx.Identifier{strings.ToLower(pkCol)}.Sanitize(), paramCount))
			args = append(args, pkValue)
			paramCount++
		}

		query = fmt.Sprintf("DELETE FROM %s WHERE %s",
			quotedTableName, strings.Join(whereClauses, " AND "))

	default:
		return fmt.Errorf("неподдерживаемый HTTP метод: %s", method)
	}

	log.Printf("Выполняется запрос для %s (%s): %s с аргументами %v", tableName, method, query, args)
	_, err = db.Exec(query, args...)
	if err != nil {
		return fmt.Errorf("ошибка базы данных при %s операции для таблицы %s: %w", method, tableName, err)
	}

	return nil
}
