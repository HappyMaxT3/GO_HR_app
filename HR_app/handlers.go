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

// getDataHandler handles GET requests for table data.
func getDataHandler(db *sql.DB) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		tableName := r.URL.Query().Get("table")
		if tableName == "" {
			log.Printf("Error: 'table' parameter is missing.")
			http.Error(w, `{"error": "Параметр 'table' не указан."}`, http.StatusBadRequest)
			return
		}

		results, err := GenericGetTableData(db, tableName)
		if err != nil {
			log.Printf("Error getting data for table %s: %v", tableName, err)
			http.Error(w, fmt.Sprintf(`{"error": "Ошибка при получении данных: %v"}`, err.Error()), http.StatusInternalServerError)
			return
		}

		jsonBytes, err := json.Marshal(results)
		if err != nil {
			log.Printf("Error marshalling JSON: %v", err)
			http.Error(w, `{"error": "Ошибка при форматировании данных в JSON."}`, http.StatusInternalServerError)
			return
		}

		w.Write(jsonBytes)
	}
}

// crudHandler handles POST, PUT, DELETE requests for a specific table.
func crudHandler(db *sql.DB, tableName string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")

		var data map[string]interface{}
		// For DELETE requests, primary keys are in URL query parameters.
		// For POST/PUT, data (including primary keys for PUT) is in the JSON body.
		if r.Method == "DELETE" {
			data = make(map[string]interface{})
			for k, v := range r.URL.Query() {
				if len(v) > 0 {
					data[k] = v[0] // Take the first value for each query parameter
				}
			}
			if len(data) == 0 {
				log.Printf("Error: Primary key parameters missing for DELETE request to table %s.", tableName)
				http.Error(w, `{"error": "Для удаления не указаны параметры первичного ключа."}`, http.StatusBadRequest)
				return
			}
		} else { // POST, PUT
			if err := json.NewDecoder(r.Body).Decode(&data); err != nil {
				log.Printf("Error decoding JSON for %s %s: %v", r.Method, tableName, err)
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
			log.Printf("CRUD operation error for %s %s: %v", r.Method, tableName, err)
			http.Error(w, fmt.Sprintf(`{"error": "Ошибка выполнения операции: %v"}`, err.Error()), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"message": message})
	}
}

// roleToPositionMap сопоставляет роли интерфейса с должностями в БД.
var roleToPositionMap = map[string][]string{
	"HR-менеджер":             {"Руководитель отдела HR", "HR-специалист"},
	"Руководитель отдела":       {"Руководитель отдела IT", "Руководитель отдела HR", "Генеральный директор"}, // Добавим сюда и CEO
	"Администраторы отделов":    {"Руководитель отдела IT", "Руководитель отдела HR"},                       // Предположим, что это руководители
	"Финансовый отдел":        {"Бухгалтер"},
	"Руководство организации": {"Генеральный директор"},
}

// checkRolePermission проверяет, имеет ли сотрудник с данной должностью доступ к запрашиваемой роли.
func checkRolePermission(requestedRole, userPosition string) bool {
	// Роль "Сотрудник" доступна любому вошедшему в систему сотруднику.
	if requestedRole == "Сотрудник" {
		return true
	}

	allowedPositions, ok := roleToPositionMap[requestedRole]
	if !ok {
		// Если роль не найдена в карте, доступ запрещен.
		return false
	}

	// Проверяем прямое соответствие должности.
	for _, position := range allowedPositions {
		if userPosition == position {
			return true
		}
	}

	// Дополнительная логика для составных ролей, например, "Руководитель отдела".
	// Если должность пользователя начинается с "Руководитель отдела", даем доступ к этой роли.
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
			http.Error(w, `{"error": "Поддерживается только метод POST"}`, http.StatusMethodNotAllowed)
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

		// Валидация входных данных
		if req.EmployeeID == "" || req.Role == "" {
			http.Error(w, `{"error": "Параметры 'employee_id' и 'role' обязательны"}`, http.StatusBadRequest)
			return
		}

		employeeID, err := strconv.Atoi(req.EmployeeID)
		if err != nil {
			http.Error(w, `{"error": "Табельный номер должен быть числом"}`, http.StatusBadRequest)
			return
		}

		// Получаем данные сотрудника из БД
		employee, err := GetEmployeeByID(db, employeeID)
		if err != nil {
			// Логируем ошибку, но пользователю отдаем общее сообщение
			log.Printf("Ошибка при поиске сотрудника: %v", err)
			http.Error(w, `{"error": "Внутренняя ошибка сервера"}`, http.StatusInternalServerError)
			return
		}

		// Проверяем, найден ли сотрудник
		if employee == nil {
			http.Error(w, `{"error": "Сотрудника с таким табельным номером не существует."}`, http.StatusNotFound)
			return
		}

		// Проверяем права на основе должности
		if !checkRolePermission(req.Role, employee.P_NAME) {
			http.Error(w, `{"error": "У вас недостаточно прав для доступа к этой роли."}`, http.StatusForbidden)
			return
		}

		// Если все проверки пройдены
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"message": "Доступ разрешен.",
		})
	}
}