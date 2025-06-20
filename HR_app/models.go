package main

import (
	"database/sql"
	"time"
)

// Employee представляет таблицу "employees".
type Employee struct {
	E_ID     int       `json:"e_id"`
	D_ID     string    `json:"d_id"`
	E_FNAME  string    `json:"e_fname"`
	E_LNAME  string    `json:"e_lname"`
	E_PASP   string    `json:"e_pasp"`
	E_DATE   time.Time `json:"e_date"`
	E_GIVEN  string    `json:"e_given"`
	E_GENDER string    `json:"e_gender"`
	E_INN    string    `json:"e_inn"`
	E_SNILS  string    `json:"e_snils"`
	E_BORN   time.Time `json:"e_born"`
	E_HIRE   time.Time `json:"e_hire"`
	P_NAME   string    `json:"p_name"`
}

// Department представляет таблицу "departments".
type Department struct {
	D_ID     string        `json:"d_id"`
	D_NAME   string        `json:"d_name"`
	D_ID_DIR sql.NullInt64 `json:"d_id_dir"`
}

// Position представляет таблицу "positions".
type Position struct {
	P_NAME string  `json:"p_name"`
	P_SAL  float64 `json:"p_sal"`
}

// AbsenceType представляет таблицу "absences_types".
type AbsenceType struct {
	AT_ID   int    `json:"at_id"`
	AT_TYPE string `json:"at_type"`
}

// EmployeesEducationType представляет таблицу "employees_education_types".
type EmployeesEducationType struct {
	EET_ID   int    `json:"eet_id"`
	EET_NAME string `json:"eet_name"`
}

// EmployeeContactType представляет таблицу "employees_contacts_types".
type EmployeeContactType struct {
	ECT_ID   int    `json:"ect_id"`
	ECT_TYPE string `json:"ect_type"`
}

// EmployeeAddress представляет таблицу "employees_addresses".
type EmployeeAddress struct {
	EA_ID_E int    `json:"ea_id_e"`
	EA_ADDR string `json:"ea_addr"`
}

// EmployeeEducation представляет таблицу "employees_education".
type EmployeeEducation struct {
	EE_ID_E int       `json:"ee_id_e"`
	EE_TYPE int       `json:"ee_type"`
	EE_END  time.Time `json:"ee_end"`
	EE_NAME string    `json:"ee_name"`
	EE_SPEC string    `json:"ee_spec"`
	EE_DIP  string    `json:"ee_dip"`
}

// EmployeeContact представляет таблицу "employees_contacts".
type EmployeeContact struct {
	EC_ID_E int    `json:"ec_id_e"`
	EC_TYPE int    `json:"ec_type"`
	EC_MEAN string `json:"ec_mean"`
}

// Staffing представляет таблицу "staffing".
type Staffing struct {
	S_ID_D   string `json:"s_id_d"`
	S_NAME_P string `json:"s_name_p"`
	S_COUNT  int    `json:"s_count"`
}

// Job представляет таблицу "job".
type Job struct {
	J_ID_D   string       `json:"j_id_d"`
	J_NAME_P string       `json:"j_name_p"`
	J_ID     int          `json:"j_id"`
	J_START  time.Time    `json:"j_start"`
	J_END    sql.NullTime `json:"j_end"`
	J_DOC    string       `json:"j_doc"`
}

// Absence представляет таблицу "absences".
type Absence struct {
	A_ID    int          `json:"a_id"`
	A_TYPE  int          `json:"a_type"`
	A_START time.Time    `json:"a_start"`
	A_END   sql.NullTime `json:"a_end"`
	A_ID_E  int          `json:"a_id_e"`
	A_DOC   string       `json:"a_doc"`
}

// DepartmentPhone представляет таблицу "departments_phones".
type DepartmentPhone struct {
	DP_ID    string `json:"dp_id"`
	DP_PHONE string `json:"dp_phone"`
}
