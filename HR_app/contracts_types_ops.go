package main

import (
	"bufio"
	"database/sql"
)

var contactsTypeConfig = SimpleLookupTableConfig{
	TableName:      "Employees_Contacts_Types",
	IDColumn:       "ECT_ID",
	NameColumn:     "ECT_TYPE",
	DisplayName:    "Тип контакта сотрудника",
	ItemNameSingle: "тип контакта",
	ItemNamePlural: "типы контактов",
	NameMaxLen:     50,
	IDMaxVal:       9,
	ForeignKeyHint: "Employees_Contacts", // Таблица Employees_Contacts ссылается на Employees_Contacts_Types
}

func viewContactsTypes(db *sql.DB) {
	viewSimpleLookupItems(db, contactsTypeConfig)
}

func insertContactsType(db *sql.DB, reader *bufio.Reader) {
	insertSimpleLookupItem(db, reader, contactsTypeConfig)
}

func deleteContactsType(db *sql.DB, reader *bufio.Reader) {
	deleteSimpleLookupItem(db, reader, contactsTypeConfig)
}
