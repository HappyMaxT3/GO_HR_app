package main

import (
	"bufio"
	"database/sql"
)

var absenceTypeConfig = SimpleLookupTableConfig{
	TableName:      "Absences_Types",
	IDColumn:       "AT_ID",
	NameColumn:     "AT_TYPE",
	DisplayName:    "Тип отсутствия",
	ItemNameSingle: "тип отсутствия",
	ItemNamePlural: "типы отсутствий",
	NameMaxLen:     20,
	IDMaxVal:       9,
	ForeignKeyHint: "Absences", // Таблица Absences ссылается на Absences_Types
}

func viewAbsenceTypes(db *sql.DB) {
	viewSimpleLookupItems(db, absenceTypeConfig)
}

func insertAbsenceType(db *sql.DB, reader *bufio.Reader) {
	insertSimpleLookupItem(db, reader, absenceTypeConfig)
}

func deleteAbsenceType(db *sql.DB, reader *bufio.Reader) {
	deleteSimpleLookupItem(db, reader, absenceTypeConfig)
}
