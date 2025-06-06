let currentRole = '';
let currentTableName = '';
let editableCurrentTableName = '';

const tableDisplayNames = {
    'старт': 'Стартовая страница',
    'employees': 'Сотрудники',
    'departments': 'Отделы',
    'positions': 'Должности',
    'absences_types': 'Типы периодов отсутствия',
    'employees_education_types': 'Виды образования сотрудников',
    'employees_contacts_types': 'Типы контактных данных сотрудников',
    'employees_addresses': 'Адреса сотрудников',
    'employees_education': 'Образование сотрудников',
    'employees_contacts': 'Контактные данные сотрудников',
    'staffing': 'Штатное расписание',
    'job': 'История должностей',
    'absences': 'Периоды отсутствия',
    'departments_phones': 'Телефоны отделов',
    'employee_personal_data': 'Личные данные сотрудников (VIEW)',
    'hr_employee_data': 'Данные сотрудников для HR (VIEW)',
    'department_employees': 'Сотрудники отдела (VIEW)',
    'department_staffing': 'Штат отделов (VIEW)',
    'positions_staffing': 'Штат по должностям (VIEW)',
    'employee_department_status': 'Статус сотрудника в отделе (VIEW)',
    'position_salary_distribution': 'Распределение зарплат по должностям (VIEW)',
    'employee_transfer_history': 'История переводов сотрудников (VIEW)'
};

const permissions = {
    'старт': {
        tables: {},
        views: {}
    },
    'Сотрудник': {
        tables: {
            'departments': ['S'],
            'departments_phones': ['S'],
            'positions': ['S'],
            'staffing': ['S*'],
            'job': ['S*'],
            'employees': ['S*'],
            'employees_addresses': ['SU*'],
            'employees_education': ['S*'],
            'employees_contacts': ['SU*'],
            'absences': ['S*'],
            'absences_types': ['S'],
            'employees_contacts_types': ['S'],
            'employees_education_types': ['S']
        },
        views: {
            'employee_personal_data': ['SUID']
        }
    },
    'HR-менеджер': {
        tables: {
            'departments': ['S'],
            'departments_phones': ['S'],
            'positions': ['S'],
            'staffing': ['S'],
            'job': ['SUID'],
            'employees': ['SUID'],
            'employees_addresses': ['SUID'],
            'employees_education': ['SUID'],
            'employees_contacts': ['SUID'],
            'absences': ['SUID'],
            'absences_types': ['S'],
            'employees_contacts_types': ['S'],
            'employees_education_types': ['S']
        },
        views: {
            'hr_employee_data': ['SUID'],
            'employee_personal_data': ['SUID']
        }
    },
    'Руководитель отдела': {
        tables: {
            'departments': ['SU*'],
            'departments_phones': ['SU*'],
            'positions': ['S'],
            'staffing': ['S*'],
            'job': ['S*'],
            'employees': ['S*'],
            'employees_addresses': ['S*'],
            'employees_education': ['S*'],
            'employees_contacts': ['S*'],
            'absences': ['S*'],
            'absences_types': ['S'],
            'employees_contacts_types': ['S'],
            'employees_education_types': ['S']
        },
        views: {
            'department_employees': ['S'],
            'employee_personal_data': ['SUID']
        }
    },
    'Администраторы отделов': {
        tables: {
            'departments': ['SUID'],
            'departments_phones': ['SUID'],
            'positions': ['S'],
            'staffing': ['S'],
            'job': ['S'],
            'employees': ['S'],
            'employees_addresses': ['S'],
            'employees_education': ['S'],
            'employees_contacts': ['S'],
            'absences': ['S'],
            'absences_types': ['S'],
            'employees_contacts_types': ['S'],
            'employees_education_types': ['S']
        },
        views: {
            'department_staffing': ['S'],
            'employee_personal_data': ['SUID']
        }
    },
    'Финансовый отдел': {
        tables: {
            'departments': ['S'],
            'departments_phones': ['S'],
            'positions': ['SUID'],
            'staffing': ['SUID'],
            'job': ['S'],
            'employees': ['S'],
            'employees_addresses': ['S'],
            'employees_education': ['S'],
            'employees_contacts': ['S'],
            'absences': ['S'],
            'absences_types': ['S'],
            'employees_contacts_types': ['S'],
            'employees_education_types': ['S']
        },
        views: {
            'positions_staffing': ['S'],
            'employee_personal_data': ['SUID']
        }
    },
    'Руководство организации': {
        tables: {
            'departments': ['S'],
            'departments_phones': ['S'],
            'positions': ['S'],
            'staffing': ['S'],
            'job': ['S'],
            'employees': ['S'],
            'employees_addresses': ['S'],
            'employees_education': ['S'],
            'employees_contacts': ['S'],
            'absences': ['S'],
            'absences_types': ['SUID'],
            'employees_contacts_types': ['SUID'],
            'employees_education_types': ['SUID']
        },
        views: {
            'employee_department_status': ['S'],
            'position_salary_distribution': ['S'],
            'employee_transfer_history': ['S'],
            'employee_personal_data': ['SUID']
        }
    }
};

// Функция для фактической смены роли в UI после успешной проверки
function applyRoleChange(newRole) {
    currentRole = newRole;
    localStorage.setItem('selectedRole', newRole);
    document.getElementById('current-role').textContent = tableDisplayNames[newRole] || newRole;
    updateUIBasedOnRole();
    clearPanels();
}

// Главная функция для установки роли
async function setRole(newRole) {
    if (newRole === currentRole) {
        return; // Ничего не делаем, если роль не изменилась
    }

    // Для роли "старт" не нужна проверка
    if (newRole === 'старт') {
        applyRoleChange(newRole);
        return;
    }

    // Для остальных ролей запрашиваем табельный номер
    const employeeId = prompt(`Для доступа к роли "${tableDisplayNames[newRole] || newRole}", введите ваш табельный номер:`);

    if (employeeId === null || employeeId.trim() === "") {
        alert("Вход отменен. Роль не изменена.");
        // Если это была первая загрузка, принудительно ставим роль "старт"
        if (!currentRole) {
            applyRoleChange('старт');
        }
        return;
    }

    // Отправляем запрос на бэкенд для валидации
    try {
        const response = await fetch('/api/validate-role', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                employee_id: employeeId.trim(),
                role: newRole,
            }),
        });

        if (response.ok) {
            // Если сервер ответил успехом (2xx)
            const result = await response.json();
            if (result.success) {
                alert('Доступ разрешен!');
                applyRoleChange(newRole);
            }
        } else {
            // Если сервер ответил ошибкой (4xx, 5xx)
            const errorData = await response.json();
            alert(`Ошибка доступа: ${errorData.error}`);
            // Если это была первая загрузка, принудительно ставим роль "старт"
            if (!currentRole) {
                applyRoleChange('старт');
            }
        }
    } catch (error) {
        console.error('Сетевая ошибка или ошибка при проверке роли:', error);
        alert('Не удалось связаться с сервером для проверки роли. Попробуйте позже.');
        if (!currentRole) {
            applyRoleChange('старт');
        }
    }
}


// --- ВСЕ ОСТАЛЬНЫЕ ФУНКЦИИ (без изменений) ---
function clearPanels() {
    document.getElementById('table-container').innerHTML = '<p>Выберите опцию выше, чтобы увидеть данные.</p>';
    document.getElementById('crud-form-container').innerHTML = '<p>Выберите действие.</p>';
    document.getElementById('crud-table-name').textContent = 'Не выбрана';
    document.getElementById('current-table-name').textContent = 'Не выбрана';
    document.getElementById('editable-table-container').innerHTML = '<p>Выберите таблицу для редактирования.</p>';
    document.getElementById('editable-table-name').textContent = 'Не выбрана';
    document.getElementById('add-button').style.display = 'none';
    document.getElementById('update-button').style.display = 'none';
    document.getElementById('delete-button').style.display = 'none';
}

function updateUIBasedOnRole() {
    const tableButtonsContainer = document.getElementById('table-buttons-container');
    const editableTableButtonsContainer = document.getElementById('editable-table-buttons-container');
    tableButtonsContainer.innerHTML = ''; // Clear previous buttons
    editableTableButtonsContainer.innerHTML = ''; // Clear previous buttons

    const roleToUpdate = currentRole || 'старт';
    const rolePermissions = permissions[roleToUpdate];

    if (!rolePermissions) {
        tableButtonsContainer.innerHTML = '<p class="error-message">Роль не определена или не имеет прав.</p>';
        editableTableButtonsContainer.innerHTML = ''; // Ensure this is also cleared
        return;
    }
    
    let foundSelectableTables = false;
    for (const sqlTableName in rolePermissions.tables) {
        if (rolePermissions.tables[sqlTableName].includes('S') || rolePermissions.tables[sqlTableName].includes('S*')) {
            const button = document.createElement('button');
            button.textContent = tableDisplayNames[sqlTableName] || sqlTableName;
            button.onclick = () => fetchData(sqlTableName);
            tableButtonsContainer.appendChild(button);
            foundSelectableTables = true;
        }
    }

    for (const viewName in rolePermissions.views) {
        if (rolePermissions.views[viewName].includes('S') || rolePermissions.views[viewName].includes('S*') || rolePermissions.views[viewName].includes('SUID')) {
            const button = document.createElement('button');
            button.textContent = tableDisplayNames[viewName] || viewName;
            button.onclick = () => fetchData(viewName);
            tableButtonsContainer.appendChild(button);
            foundSelectableTables = true;
        }
    }
    if (!foundSelectableTables) {
         tableButtonsContainer.innerHTML = '<p>Для данной роли таблицы не доступны.</p>';
    }

    let foundEditableTables = false;
    for (const sqlTableName in rolePermissions.tables) {
        if (rolePermissions.tables[sqlTableName].some(p => ['U', 'I', 'D', 'SUID'].includes(p) || p.includes('U*'))) {
            const button = document.createElement('button');
            button.textContent = `Редактировать ${tableDisplayNames[sqlTableName] || sqlTableName}`;
            button.onclick = () => showEditableTable(sqlTableName);
            editableTableButtonsContainer.appendChild(button);
            foundEditableTables = true;
        }
    }
     if (!foundEditableTables) {
         editableTableButtonsContainer.innerHTML = '<p>Для данной роли редактирование не доступно.</p>';
    }

    updateCrudButtonsVisibility();
}

function updateCrudButtonsVisibility() {
    const addButton = document.getElementById('add-button');
    const updateButton = document.getElementById('update-button');
    const deleteButton = document.getElementById('delete-button');

    addButton.style.display = 'none';
    updateButton.style.display = 'none';
    deleteButton.style.display = 'none';

    if (!currentRole || !currentTableName) {
        return;
    }

    const rolePermissions = permissions[currentRole];
    if (!rolePermissions) return;

    let tableOrViewPermissions = null;
    if (rolePermissions.tables && rolePermissions.tables[currentTableName]) {
        tableOrViewPermissions = rolePermissions.tables[currentTableName];
    } else if (rolePermissions.views && rolePermissions.views[currentTableName]) {
        tableOrViewPermissions = rolePermissions.views[currentTableName];
    }

    if (tableOrViewPermissions) {
        if (tableOrViewPermissions.includes('SUID')) {
            addButton.style.display = 'inline-block';
            updateButton.style.display = 'inline-block';
            deleteButton.style.display = 'inline-block';
        } else {
            if (tableOrViewPermissions.includes('I')) {
                addButton.style.display = 'inline-block';
            }
            if (tableOrViewPermissions.includes('U') || tableOrViewPermissions.includes('U*') ) {
                updateButton.style.display = 'inline-block';
            }
            if (tableOrViewPermissions.includes('D')) {
                deleteButton.style.display = 'inline-block';
            }
        }
    }
}

async function fetchData(tableName) {
    currentTableName = tableName;
    document.getElementById('current-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('crud-table-name').textContent = tableDisplayNames[tableName] || tableName;

    updateCrudButtonsVisibility();

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        const data = await response.json();

        const tableContainer = document.getElementById('table-container');
        tableContainer.innerHTML = '';

        if (data && data.error) {
            tableContainer.innerHTML = `<p class="error-message">Ошибка сервера: ${data.error}</p>`;
            return;
        }

        if (!data || data.length === 0) {
            tableContainer.innerHTML = '<p>Нет данных для отображения.</p>';
            return;
        }

        const table = document.createElement('table');
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        const headers = Object.keys(data[0]);
        const headerRow = document.createElement('tr');
        headers.forEach(headerText => {
            const th = document.createElement('th');
            th.textContent = headerText;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        data.forEach(rowData => {
            const row = document.createElement('tr');
            headers.forEach(header => {
                const td = document.createElement('td');
                if (rowData[header] !== null && (header.includes('_date') || header.includes('_born') || header.includes('_hire') || header.includes('_end') || header.includes('_start'))) {
                    try {
                        const date = new Date(rowData[header]);
                        if (!isNaN(date.getTime())) {
                            td.textContent = `${('0' + date.getDate()).slice(-2)}.${('0' + (date.getMonth() + 1)).slice(-2)}.${date.getFullYear()}`;
                        } else {
                            td.textContent = rowData[header];
                        }
                    } catch (e) {
                        td.textContent = rowData[header];
                    }
                } else if (rowData[header] === null) {
                    td.textContent = 'NULL';
                } else {
                    td.textContent = rowData[header];
                }
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        tableContainer.appendChild(table);

    } catch (error) {
        console.error('Ошибка при получении или обработке данных:', error);
        document.getElementById('table-container').innerHTML =
            '<p class="error-message">Произошла ошибка при загрузке данных. Проверьте консоль.</p>';
    }
}
//... (остальные функции: displayMessage, showForm, getFormFieldsForTable, submitCrud, и т.д. остаются без изменений)
// Просто скопируйте их из вашего файла, чтобы не дублировать здесь.


// --- Функции для ТЕМНОЙ ТЕМЫ ---
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme');
    const isDarkTheme = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    // 1. Установка роли
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole && savedRole !== 'старт') {
        // Пытаемся восстановить сохраненную роль, что вызовет проверку
        setRole(savedRole);
    } else {
        // По умолчанию или если сохранена роль "старт", устанавливаем ее без проверки
        setRole('старт');
    }

    // 2. Привязка обработчиков для кнопок CRUD
    document.getElementById('add-button').onclick = () => showForm('add');
    document.getElementById('update-button').onclick = () => showForm('update');
    document.getElementById('delete-button').onclick = () => showForm('delete');

    // 3. Восстановление и привязка логики ТЕМНОЙ ТЕМЫ
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
});