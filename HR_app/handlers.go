package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
)

// getDataHandler обрабатывает GET-запросы данных таблицы.
func getDataHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		tableName := r.URL.Query().Get("table")
		if tableName == "" {
			log.Printf("Ошибка: параметр 'table' отсутствует.")
			http.Error(w, `{"error": "Параметр 'table' не указан."}`, http.StatusBadRequest)
			return
		}

		results, err := GenericGetTableData(db, tableName)
		if err != nil {
			log.Printf("Ошибка получения данных для таблицы %s: %v", tableName, err)
			http.Error(w, fmt.Sprintf(`{"error": "Ошибка при получении данных: %v"}`, err.Error()), http.StatusInternalServerError)
			return
		}

		jsonBytes, err := json.Marshal(results)
		if err != nil {
			log.Printf("Ошибка маршалинга JSON: %v", err)
			http.Error(w, `{"error": "Ошибка форматирования данных в JSON."}`, http.StatusInternalServerError)
			return
		}

		w.Write(jsonBytes)
	}
}

// crudHandler обрабатывает POST, PUT, DELETE запросы для таблицы.
func crudHandler(db *sql.DB, tableName string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var data map[string]interface{}
		// Для DELETE ключи в URL, для POST/PUT - JSON-тело.
		if r.Method == "DELETE" {
			data = make(map[string]interface{})
			for k, v := range r.URL.Query() {
				if len(v) > 0 {
					data[k] = v[0]
				}
			}
			if len(data) == 0 {
				log.Printf("Ошибка: для DELETE не указаны ключи для таблицы %s.", tableName)
				http.Error(w, `{"error": "Для удаления не указаны параметры первичного ключа."}`, http.StatusBadRequest)
				return
			}
		} else { // POST, PUT
			if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
				log.Printf("Ошибка декодирования JSON для %s %s: %v", r.Method, tableName, err)
				http.Error(w, `{"error": "Неверный формат JSON"}`, http.StatusBadRequest)
				return
			}
		}

		var err error
		var message string

		switch r.Method {
		case "POST":
			err = GenericCRUDOperations(db, tableName, "POST", data)
			message = "Запись успешно добавлена!"
		case "PUT":
			err = GenericCRUDOperations(db, tableName, "PUT", data)
			message = "Запись успешно обновлена!"
		case "DELETE":
			err = GenericCRUDOperations(db, tableName, "DELETE", data)
			message = "Запись успешно удалена!"
		default:
			http.Error(w, `{"error": "Метод не поддерживается"}`, http.StatusMethodNotAllowed)
			return
		}

		if err != nil {
			log.Printf("Ошибка CRUD-операции для %s %s: %v", r.Method, tableName, err)
			http.Error(w, fmt.Sprintf(`{"error": "Ошибка выполнения операции: %v"}`, err.Error()), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": message})
	}
}

// roleToPositionMap сопоставляет роли интерфейса с должностями в БД.
var roleToPositionMap = map[string][]string{
	"HR-менеджер":             {"Руководитель отдела HR", "HR-специалист"},
	"Руководитель отдела":     {"Руководитель отдела IT", "Руководитель отдела HR", "Генеральный директор"},
	"Администраторы отделов":  {"Руководитель отдела IT", "Руководитель отдела HR"},
	"Финансовый отдел":        {"Бухгалтер"},
	"Руководство организации": {"Генеральный директор"},
}

// checkRolePermission проверяет доступ сотрудника к запрашиваемой роли.
func checkRolePermission(requestedRole, userPosition string) bool {
	// "Сотрудник" доступен любому.
	if requestedRole == "Сотрудник" {
		return true
	}

	allowedPositions, ok := roleToPositionMap[requestedRole]
	if !ok {
		return false // Роль не найдена.
	}

	// Проверка соответствия должности.
	for _, position := range allowedPositions {
		if userPosition == position {
			return true
		}
	}

	// Дополнительная логика для "Руководитель отдела".
	if requestedRole == "Руководитель отдела" && strings.HasPrefix(userPosition, "Руководитель отдела") {
		return true
	}

	return false
}

// validateRoleHandler обрабатывает запросы на проверку прав доступа к роли.
func validateRoleHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		if r.Method != "POST" {
			http.Error(w, `{"error": "Поддерживается только POST"}`, http.StatusMethodNotAllowed)
			return
		}

		var req struct {
			EmployeeID string `json:"employee_id"`
			Role       string `json:"role"`
		}

		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, `{"error": "Неверный формат запроса"}`, http.StatusBadRequest)
			return
		}

		if req.EmployeeID == "" || req.Role == "" {
			http.Error(w, `{"error": "Параметры 'employee_id' и 'role' обязательны"}`, http.StatusBadRequest)
			return
		}

		employeeID, err := strconv.Atoi(req.EmployeeID)
		if err != nil {
			http.Error(w, `{"error": "Табельный номер должен быть числом"}`, http.StatusBadRequest)
			return
		}

		employee, err := GetEmployeeByID(db, employeeID) // Получение данных сотрудника.
		if err != nil {
			log.Printf("Ошибка поиска сотрудника: %v", err)
			http.Error(w, `{"error": "Внутренняя ошибка сервера"}`, http.StatusInternalServerError)
			return
		}

		if employee == nil {
			http.Error(w, `{"error": "Сотрудника с таким табельным номером не существует."}`, http.StatusNotFound)
			return
		}

		if !checkRolePermission(req.Role, employee.P_NAME) { // Проверка прав по должности.
			http.Error(w, `{"error": "Недостаточно прав для доступа к этой роли."}`, http.StatusForbidden)
			return
		}

		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Доступ разрешен.",
		})
	}
}
