package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
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
