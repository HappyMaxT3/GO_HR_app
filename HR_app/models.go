package main

// AbsenceType представляет запись из таблицы Absences_Types
type AbsenceType struct {
	ID   int
	Type string
}

// EducationType представляет запись из таблицы Employees_Education_Types
type EducationType struct {
	ID   int
	Name string
}
