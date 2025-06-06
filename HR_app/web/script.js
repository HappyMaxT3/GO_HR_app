let currentRole = '';
let currentTableName = ''; // Для read-only просмотра
let editableCurrentTableName = ''; // Для редактируемой таблицы

// Словарь для отображаемых имен (остается без изменений)
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
    'employee_personal_data': 'Личные данные (VIEW)',
    'hr_employee_data': 'Данные для HR (VIEW)',
    'department_employees': 'Сотрудники отдела (VIEW)',
    'department_staffing': 'Штат отделов (VIEW)',
    'positions_staffing': 'Штат по должностям (VIEW)',
    'employee_department_status': 'Статус сотрудника (VIEW)',
    'position_salary_distribution': 'Зарплаты по должностям (VIEW)',
    'employee_transfer_history': 'История переводов (VIEW)'
};

// Права доступа (остаются без изменений)
const permissions = {
    'старт': { tables: {}, views: {} },
    'Сотрудник': {
        tables: {
            'departments': ['S'], 'departments_phones': ['S'], 'positions': ['S'], 'staffing': ['S*'],
            'job': ['S*'], 'employees': ['S*'], 'employees_addresses': ['SU*'], 'employees_education': ['S*'],
            'employees_contacts': ['SU*'], 'absences': ['S*'], 'absences_types': ['S'],
            'employees_contacts_types': ['S'], 'employees_education_types': ['S']
        },
        views: { 'employee_personal_data': ['S'] }
    },
    'HR-менеджер': {
        tables: {
            'departments': ['S'], 'departments_phones': ['S'], 'positions': ['S'], 'staffing': ['S'],
            'job': ['SUID'], 'employees': ['SUID'], 'employees_addresses': ['SUID'],
            'employees_education': ['SUID'], 'employees_contacts': ['SUID'], 'absences': ['SUID'],
            'absences_types': ['S'], 'employees_contacts_types': ['S'], 'employees_education_types': ['S']
        },
        views: { 'hr_employee_data': ['S'], 'employee_personal_data': ['S'] }
    },
    'Руководитель отдела': {
        tables: {
            'departments': ['SU*'], 'departments_phones': ['SU*'], 'positions': ['S'], 'staffing': ['S*'],
            'job': ['S*'], 'employees': ['S*'], 'employees_addresses': ['S*'], 'employees_education': ['S*'],
            'employees_contacts': ['S*'], 'absences': ['S*'], 'absences_types': ['S'],
            'employees_contacts_types': ['S'], 'employees_education_types': ['S']
        },
        views: { 'department_employees': ['S'], 'employee_personal_data': ['S'] }
    },
    'Администраторы отделов': {
        tables: {
            'departments': ['SUID'], 'departments_phones': ['SUID'], 'positions': ['S'], 'staffing': ['S'],
            'job': ['S'], 'employees': ['S'], 'employees_addresses': ['S'], 'employees_education': ['S'],
            'employees_contacts': ['S'], 'absences': ['S'], 'absences_types': ['S'],
            'employees_contacts_types': ['S'], 'employees_education_types': ['S']
        },
        views: { 'department_staffing': ['S'], 'employee_personal_data': ['S'] }
    },
    'Финансовый отдел': {
        tables: {
            'departments': ['S'], 'departments_phones': ['S'], 'positions': ['SUID'], 'staffing': ['SUID'],
            'job': ['S'], 'employees': ['S'], 'employees_addresses': ['S'], 'employees_education': ['S'],
            'employees_contacts': ['S'], 'absences': ['S'], 'absences_types': ['S'],
            'employees_contacts_types': ['S'], 'employees_education_types': ['S']
        },
        views: { 'positions_staffing': ['S'], 'employee_personal_data': ['S'] }
    },
    'Руководство организации': {
        tables: {
            'departments': ['S'], 'departments_phones': ['S'], 'positions': ['S'], 'staffing': ['S'],
            'job': ['S'], 'employees': ['S'], 'employees_addresses': ['S'], 'employees_education': ['S'],
            'employees_contacts': ['S'], 'absences': ['S'], 'absences_types': ['SUID'],
            'employees_contacts_types': ['SUID'], 'employees_education_types': ['SUID']
        },
        views: {
            'employee_department_status': ['S'], 'position_salary_distribution': ['S'],
            'employee_transfer_history': ['S'], 'employee_personal_data': ['S']
        }
    }
};

// --- ОСНОВНАЯ ЛОГИКА ---

document.addEventListener('DOMContentLoaded', () => {
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole && savedRole !== 'старт') {
        setRole(savedRole);
    } else {
        setRole('старт');
    }

    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }
     const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    document.getElementById('add-button').onclick = () => showForm('add');
});

function applyRoleChange(newRole) {
    currentRole = newRole;
    localStorage.setItem('selectedRole', newRole);
    document.getElementById('current-role').textContent = tableDisplayNames[newRole] || newRole;
    updateUIBasedOnRole();
    clearAllPanels();
}

async function setRole(newRole) {
    if (newRole === currentRole && newRole !== 'старт') return;

    if (newRole === 'старт') {
        applyRoleChange(newRole);
        return;
    }

    const employeeId = prompt(`Для доступа к роли "${tableDisplayNames[newRole] || newRole}", введите ваш табельный номер:`);
    if (employeeId === null || employeeId.trim() === "") {
        if (!currentRole) applyRoleChange('старт');
        return;
    }

    try {
        const response = await fetch('/api/validate-role', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: employeeId.trim(), role: newRole }),
        });

        if (response.ok) {
            alert('Доступ разрешен!');
            applyRoleChange(newRole);
        } else {
            const errorData = await response.json();
            alert(`Ошибка доступа: ${errorData.error}`);
            if (!currentRole) applyRoleChange('старт');
        }
    } catch (error) {
        console.error('Сетевая ошибка или ошибка при проверке роли:', error);
        alert('Не удалось связаться с сервером для проверки роли.');
        if (!currentRole) applyRoleChange('старт');
    }
}

function updateUIBasedOnRole() {
    const tableButtonsContainer = document.getElementById('table-buttons-container');
    const editableTableButtonsContainer = document.getElementById('editable-table-buttons-container');
    tableButtonsContainer.innerHTML = '';
    editableTableButtonsContainer.innerHTML = '';

    const rolePermissions = permissions[currentRole];
    if (!rolePermissions) return;

    let hasReadOnly = false;
    let hasEditable = false;

    const allTablesAndViews = {...rolePermissions.tables, ...rolePermissions.views};

    for (const name in allTablesAndViews) {
        const perms = allTablesAndViews[name];
        const button = document.createElement('button');
        button.textContent = tableDisplayNames[name] || name;

        // Определяем, есть ли права на редактирование
        const canEdit = perms.some(p => ['U', 'I', 'D', 'SUID'].includes(p) || p.includes('U*'));

        if (canEdit) {
            button.onclick = () => showEditableTable(name);
            editableTableButtonsContainer.appendChild(button);
            hasEditable = true;
        } else { // Только просмотр
            button.onclick = () => showReadOnlyTable(name);
            tableButtonsContainer.appendChild(button);
            hasReadOnly = true;
        }
    }

    if (!hasReadOnly) tableButtonsContainer.innerHTML = '<p>Нет таблиц для просмотра.</p>';
    if (!hasEditable) editableTableButtonsContainer.innerHTML = '<p>Нет таблиц для редактирования.</p>';
}

function clearAllPanels() {
    document.getElementById('table-container').innerHTML = '<p>Выберите таблицу из меню слева для просмотра.</p>';
    document.getElementById('editable-table-container').innerHTML = '<p>Выберите таблицу в секции "Редактирование данных", чтобы начать работу.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('message-container').innerHTML = '';
    document.getElementById('current-table-name').textContent = 'Не выбрана';
    document.getElementById('editable-table-name').textContent = 'Не выбрана';
    document.getElementById('add-button').style.display = 'none';
    currentTableName = '';
    editableCurrentTableName = '';
}

// --- ФУНКЦИИ ДЛЯ ПАНЕЛИ "ПРОСМОТР ДАННЫХ" (READ-ONLY) ---

async function showReadOnlyTable(tableName) {
    currentTableName = tableName;
    editableCurrentTableName = ''; // Сбрасываем редактируемую таблицу

    document.getElementById('current-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('editable-table-name').textContent = 'Не выбрана';
    document.getElementById('editable-table-container').innerHTML = '<p>Только для чтения. Выберите таблицу из секции "Редактирование", чтобы вносить изменения.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('add-button').style.display = 'none';

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        const data = await response.json();
        renderReadOnlyTable(data, tableName);
    } catch (error) {
        console.error('Ошибка при получении данных:', error);
        document.getElementById('table-container').innerHTML = `<p class="error-message">Ошибка загрузки данных для ${tableName}.</p>`;
    }
}

function renderReadOnlyTable(data, tableName) {
    const container = document.getElementById('table-container');
    container.innerHTML = '';

    if (data && data.error) {
        container.innerHTML = `<p class="error-message">Ошибка сервера: ${data.error}</p>`;
        return;
    }
    if (!data || data.length === 0) {
        container.innerHTML = '<p>В этой таблице нет данных.</p>';
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

    data.forEach(rowData => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = formatCell(rowData[header], header);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
}


// --- ФУНКЦИИ ДЛЯ ПАНЕЛИ "РЕДАКТОР" (EDITABLE) ---

async function showEditableTable(tableName) {
    editableCurrentTableName = tableName;
    currentTableName = ''; // Сбрасываем read-only таблицу

    document.getElementById('editable-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('current-table-name').textContent = 'Не выбрана';
    document.getElementById('table-container').innerHTML = '<p>Выберите таблицу из секции "Просмотр", чтобы отобразить данные здесь.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('add-button').style.display = 'inline-block';

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        const data = await response.json();
        renderEditableTable(data, tableName);
    } catch (error) {
        console.error('Ошибка при получении данных для редактирования:', error);
        document.getElementById('editable-table-container').innerHTML = `<p class="error-message">Ошибка загрузки данных для ${tableName}.</p>`;
    }
}

function renderEditableTable(data, tableName) {
    const container = document.getElementById('editable-table-container');
    container.innerHTML = '';

     if (data && data.error) {
        container.innerHTML = `<p class="error-message">Ошибка сервера: ${data.error}</p>`;
        return;
    }
    if (!data || data.length === 0) {
        container.innerHTML = '<p>В этой таблице нет данных для редактирования.</p>';
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
    const thActions = document.createElement('th');
    thActions.textContent = 'Действия';
    headerRow.appendChild(thActions);
    thead.appendChild(headerRow);

    data.forEach(rowData => {
        const row = document.createElement('tr');
        row.dataset.pk = JSON.stringify(getPrimaryKeys(rowData, tableName));

        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = formatCell(rowData[header], header);
            td.dataset.column = header;
            td.contentEditable = true; // Делаем ячейку редактируемой
            row.appendChild(td);
        });
        
        const tdActions = document.createElement('td');
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить';
        saveButton.className = 'save-button-row';
        saveButton.onclick = () => submitCrud('PUT', getRowData(row, tableName));
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить';
        deleteButton.className = 'delete-button-row';
        deleteButton.onclick = () => {
            if(confirm('Вы уверены, что хотите удалить эту запись?')) {
                submitCrud('DELETE', getPrimaryKeys(rowData, tableName));
            }
        };

        tdActions.appendChild(saveButton);
        tdActions.appendChild(deleteButton);
        row.appendChild(tdActions);
        tbody.appendChild(row);
    });

    table.appendChild(thead);
    table.appendChild(tbody);
    container.appendChild(table);
}

// --- CRUD-ОПЕРАЦИИ И ФОРМЫ ---

function showForm(action) {
    if (!editableCurrentTableName) {
        alert("Сначала выберите таблицу для редактирования.");
        return;
    }

    const container = document.getElementById('crud-form-container');
    container.innerHTML = `<h3>Добавление новой записи в "${tableDisplayNames[editableCurrentTableName]}"</h3>`;
    
    fetch(`/api/data?table=${editableCurrentTableName}`).then(res => res.json()).then(data => {
        if (!data || data.length === 0) {
            // Если данных нет, пытаемся получить структуру из `information_schema` или просто показать пустые поля
            // Для простоты пока просто выведем сообщение.
             fetch(`/api/data?table=employees`).then(res => res.json()).then(empData => {
                 const headers = Object.keys(empData[0]);
                 const form = createFormFields(headers);
                 container.appendChild(form);
            });
            return;
        }
        const headers = Object.keys(data[0]);
        const form = createFormFields(headers);
        container.appendChild(form);
    });
}

function createFormFields(headers) {
    const form = document.createElement('form');
    form.onsubmit = (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData.entries());
        submitCrud('POST', data);
    };

    headers.forEach(header => {
        const label = document.createElement('label');
        label.textContent = header;
        const input = document.createElement('input');
        input.name = header;
        input.type = header.includes('date') || header.includes('born') ? 'date' : 'text';
        form.appendChild(label);
        form.appendChild(input);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Добавить';
    form.appendChild(submitButton);
    return form;
}


async function submitCrud(method, data) {
    const tableName = editableCurrentTableName;
    if (!tableName) return;

    let url = `/api/${tableName}`;
    let body = null;
    let headers = { 'Content-Type': 'application/json' };

    if (method === 'POST' || method === 'PUT') {
        body = JSON.stringify(data);
    } else if (method === 'DELETE') {
        const params = new URLSearchParams(data);
        url += `?${params.toString()}`;
    }

    try {
        const response = await fetch(url, { method, headers, body });
        const result = await response.json();

        if (response.ok) {
            displayMessage(result.message || 'Операция выполнена успешно!', 'success');
            showEditableTable(tableName); // Обновляем таблицу
            document.getElementById('crud-form-container').innerHTML = ''; // Скрываем форму
        } else {
            displayMessage(result.error || 'Произошла ошибка.', 'error');
        }
    } catch (error) {
        console.error('Ошибка CRUD:', error);
        displayMessage('Ошибка сети. Не удалось выполнить операцию.', 'error');
    }
}


// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function displayMessage(message, type) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<p class="${type}-message">${message}</p>`;
    setTimeout(() => container.innerHTML = '', 4000);
}

function formatCell(value, header) {
    if (value === null || typeof value === 'undefined') return 'NULL';
    if (typeof value === 'string' && (header.includes('_date') || header.includes('_born') || header.includes('_hire') || header.includes('_end') || header.includes('_start'))) {
       try {
           const date = new Date(value);
           if (!isNaN(date.getTime())) {
               // Форматируем в YYYY-MM-DD для единообразия, особенно для contentEditable
               return date.toISOString().split('T')[0];
           }
       } catch (e) { /* ignore */ }
    }
    return value;
}

// Получение данных из редактируемой строки
function getRowData(rowElement, tableName) {
    const data = {};
    rowElement.querySelectorAll('td[data-column]').forEach(td => {
        data[td.dataset.column] = td.textContent;
    });
    return data;
}

// Заглушка для получения первичных ключей (нужно адаптировать под вашу схему)
// В реальном проекте эта информация должна приходить с бэкенда или быть жестко закодирована
function getPrimaryKeys(rowData, tableName) {
    const pkMapping = {
        'employees': ['e_id'],
        'departments': ['d_id'],
        'positions': ['p_name'],
        'absences_types': ['at_id'],
        'employees_education_types': ['eet_id'],
        'employees_contacts_types': ['ect_id'],
        'employees_addresses': ['ea_id_e', 'ea_addr'],
        'employees_education': ['ee_id_e', 'ee_type', 'ee_end'],
        'employees_contacts': ['ec_id_e', 'ec_type', 'ec_mean'],
        'staffing': ['s_id_d', 's_name_p'],
        'job': ['j_id_d', 'j_name_p', 'j_id'],
        'absences': ['a_id'],
        'departments_phones': ['dp_id', 'dp_phone']
    };
    const pk = {};
    const pkKeys = pkMapping[tableName] || [Object.keys(rowData)[0]]; // Fallback
    pkKeys.forEach(key => {
        if (rowData[key] !== undefined) {
            pk[key] = rowData[key];
        }
    });
    return pk;
}

// --- Функции для ТЕМНОЙ ТЕМЫ ---
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme');
    const isDarkTheme = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}