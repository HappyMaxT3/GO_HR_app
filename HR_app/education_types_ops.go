package main

import (
	"bufio"
	"database/sql"
)

var educationTypeConfig = SimpleLookupTableConfig{
	TableName:      "Employees_Education_Types",
	IDColumn:       "EET_ID",
	NameColumn:     "EET_NAME",
	DisplayName:    "Тип образования",
	ItemNameSingle: "тип образования",
	ItemNamePlural: "типы образования",
	NameMaxLen:     50,
	IDMaxVal:       9,
	ForeignKeyHint: "Employees_Education", // Таблица Employees_Education ссылается на Employees_Education_Types
}

func viewEducationTypes(db *sql.DB) {
	viewSimpleLookupItems(db, educationTypeConfig)
}

func insertEducationType(db *sql.DB, reader *bufio.Reader) {
	insertSimpleLookupItem(db, reader, educationTypeConfig)
}

func deleteEducationType(db *sql.DB, reader *bufio.Reader) {
	deleteSimpleLookupItem(db, reader, educationTypeConfig)
}
