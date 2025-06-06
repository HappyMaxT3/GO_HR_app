let currentRole = '';
let currentTableName = ''; // Для read-only просмотра
let editableCurrentTableName = ''; // Для редактируемой таблицы

// Словарь для отображаемых имен
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

// Права доступа
const permissions = {
    'старт': { tables: {}, views: {} },
    'Сотрудник': {
        tables: { 'departments': ['S'], 'departments_phones': ['S'], 'positions': ['S'], 'staffing': ['S*'], 'job': ['S*'], 'employees': ['S*'], 'employees_addresses': ['SU*'], 'employees_education': ['S*'], 'employees_contacts': ['SU*'], 'absences': ['S*'], 'absences_types': ['S'], 'employees_contacts_types': ['S'], 'employees_education_types': ['S'] },
        views: { 'employee_personal_data': ['S'] }
    },
    'HR-менеджер': {
        tables: { 'departments': ['S'], 'departments_phones': ['S'], 'positions': ['S'], 'staffing': ['S'], 'job': ['SUID'], 'employees': ['SUID'], 'employees_addresses': ['SUID'], 'employees_education': ['SUID'], 'employees_contacts': ['SUID'], 'absences': ['SUID'], 'absences_types': ['S'], 'employees_contacts_types': ['S'], 'employees_education_types': ['S'] },
        views: { 'hr_employee_data': ['S'], 'employee_personal_data': ['S'] }
    },
    'Руководитель отдела': {
        tables: { 'departments': ['SU*'], 'departments_phones': ['SU*'], 'positions': ['S'], 'staffing': ['S*'], 'job': ['S*'], 'employees': ['S*'], 'employees_addresses': ['S*'], 'employees_education': ['S*'], 'employees_contacts': ['S*'], 'absences': ['S*'], 'absences_types': ['S'], 'employees_contacts_types': ['S'], 'employees_education_types': ['S'] },
        views: { 'department_employees': ['S'], 'employee_personal_data': ['S'] }
    },
    'Администраторы отделов': {
        tables: { 'departments': ['SUID'], 'departments_phones': ['SUID'], 'positions': ['S'], 'staffing': ['S'], 'job': ['S'], 'employees': ['S'], 'employees_addresses': ['S'], 'employees_education': ['S'], 'employees_contacts': ['S'], 'absences': ['S'], 'absences_types': ['S'], 'employees_contacts_types': ['S'], 'employees_education_types': ['S'] },
        views: { 'department_staffing': ['S'], 'employee_personal_data': ['S'] }
    },
    'Финансовый отдел': {
        tables: { 'departments': ['S'], 'departments_phones': ['S'], 'positions': ['SUID'], 'staffing': ['SUID'], 'job': ['S'], 'employees': ['S'], 'employees_addresses': ['S'], 'employees_education': ['S'], 'employees_contacts': ['S'], 'absences': ['S'], 'absences_types': ['S'], 'employees_contacts_types': ['S'], 'employees_education_types': ['S'] },
        views: { 'positions_staffing': ['S'], 'employee_personal_data': ['S'] }
    },
    'Руководство организации': {
        tables: { 'departments': ['S'], 'departments_phones': ['S'], 'positions': ['S'], 'staffing': ['S'], 'job': ['S'], 'employees': ['S'], 'employees_addresses': ['S'], 'employees_education': ['S'], 'employees_contacts': ['S'], 'absences': ['S'], 'absences_types': ['SUID'], 'employees_contacts_types': ['SUID'], 'employees_education_types': ['SUID'] },
        views: { 'employee_department_status': ['S'], 'position_salary_distribution': ['S'], 'employee_transfer_history': ['S'], 'employee_personal_data': ['S'] }
    }
};

const primaryKeyMapping = {
    'employees': ['e_id'], 'departments': ['d_id'], 'positions': ['p_name'], 'absences_types': ['at_id'],
    'employees_education_types': ['eet_id'], 'employees_contacts_types': ['ect_id'], 'employees_addresses': ['ea_id_e', 'ea_addr'],
    'employees_education': ['ee_id_e', 'ee_type', 'ee_end'], 'employees_contacts': ['ec_id_e', 'ec_type', 'ec_mean'],
    'staffing': ['s_id_d', 's_name_p'], 'job': ['j_id_d', 'j_name_p', 'j_id'], 'absences': ['a_id'], 'departments_phones': ['dp_id', 'dp_phone']
};

// --- ОСНОВНАЯ ЛОГИКА ---

document.addEventListener('DOMContentLoaded', () => {
    // 1. Инициализация роли
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole && savedRole !== 'старт') {
        setRole(savedRole); // Попытка восстановления роли с проверкой
    } else {
        applyRoleChange('старт'); // Установка стартовой роли без проверки
    }

    // 2. Привязка обработчиков для кнопок ролей в новом расположении
    const roleButtonsContainer = document.querySelector('#role-menu-bar .role-buttons-container');
    if (roleButtonsContainer) {
        roleButtonsContainer.querySelectorAll('button').forEach(button => {
            // Привязываем обработчик onclick, который уже есть в HTML
            // Нет необходимости в дополнительных addEventListener здесь,
            // так как onclick уже прописан в HTML.
            // Но если бы onclick не было, то делали бы так:
            // const roleName = button.textContent; // или из data-атрибута, если есть
            // button.addEventListener('click', () => setRole(roleName));
        });
    }

    // 3. Привязка обработчика для кнопки переключения темы
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    // Восстановление темы
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // 4. Привязка обработчика для кнопки "Добавить запись" (CRUD)
    document.getElementById('add-button').onclick = () => showForm('add');
});

// Функция для обновления интерфейса после смены роли
function applyRoleChange(newRole) {
    currentRole = newRole;
    localStorage.setItem('selectedRole', newRole);
    document.getElementById('current-role').textContent = tableDisplayNames[newRole] || newRole; // Обновляем отображение текущей роли
    updateUIBasedOnRole(); // Обновляем доступные таблицы и кнопки
    clearAllPanels(); // Очищаем содержимое всех панелей
}

// Асинхронная функция для установки роли с проверкой
async function setRole(newRole) {
    // Если роль не изменилась и это не "старт", ничего не делаем
    if (newRole === currentRole && newRole !== 'старт') {
        return;
    }
    // Для роли "старт" не требуется проверка
    if (newRole === 'старт') {
        applyRoleChange(newRole);
        return;
    }

    // Запрашиваем табельный номер для других ролей
    const employeeId = prompt(`Для доступа к роли "${tableDisplayNames[newRole] || newRole}", введите ваш табельный номер:`);

    // Если пользователь отменил ввод или ввел пустую строку
    if (employeeId === null || employeeId.trim() === "") {
        if (!currentRole) { // Если до этого роль не была выбрана (первый вход)
            applyRoleChange('старт');
        }
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
            if (!currentRole) { // Если до этого роль не была выбрана
                applyRoleChange('старт');
            }
        }
    } catch (error) {
        console.error('Сетевая ошибка при валидации роли:', error);
        alert('Не удалось связаться с сервером для проверки роли. Попробуйте еще раз.');
        if (!currentRole) { // Если до этого роль не была выбрана
            applyRoleChange('старт');
        }
    }
}

// Функция для обновления кнопок таблиц на основе текущей роли
function updateUIBasedOnRole() {
    const tableButtonsContainer = document.getElementById('table-buttons-container');
    const editableTableButtonsContainer = document.getElementById('editable-table-buttons-container');
    tableButtonsContainer.innerHTML = ''; // Очистка предыдущих кнопок
    editableTableButtonsContainer.innerHTML = ''; // Очистка предыдущих кнопок

    const rolePermissions = permissions[currentRole];
    if (!rolePermissions) {
        // Если для роли нет разрешений, отображаем заглушки
        tableButtonsContainer.innerHTML = '<p>Нет таблиц для просмотра.</p>';
        editableTableButtonsContainer.innerHTML = '<p>Нет таблиц для редактирования.</p>';
        return;
    }

    let hasReadOnly = false;
    let hasEditable = false;

    // Объединяем таблицы и представления для перебора
    const allTablesAndViews = { ...rolePermissions.tables, ...rolePermissions.views };

    for (const name in allTablesAndViews) {
        const perms = allTablesAndViews[name];
        const button = document.createElement('button');
        button.textContent = tableDisplayNames[name] || name; // Используем отображаемое имя

        // Проверяем, есть ли права на редактирование (Update, Insert, Delete)
        // Также проверяем, что таблица имеет определенный первичный ключ для редактирования
        const canEdit = perms.some(p => ['U', 'I', 'D', 'SUID'].includes(p) || p.includes('U*'));

        if (canEdit && primaryKeyMapping[name]) {
            button.onclick = () => showEditableTable(name);
            editableTableButtonsContainer.appendChild(button);
            hasEditable = true;
        } else if (perms.includes('S') || perms.includes('S*')) { // Только просмотр
            button.onclick = () => showReadOnlyTable(name);
            tableButtonsContainer.appendChild(button);
            hasReadOnly = true;
        }
    }

    // Если нет таблиц для просмотра
    if (!hasReadOnly) {
        tableButtonsContainer.innerHTML = '<p>Нет таблиц для просмотра.</p>';
    }
    // Если нет таблиц для редактирования
    if (!hasEditable) {
        editableTableButtonsContainer.innerHTML = '<p>Нет таблиц для редактирования.</p>';
    }
}

// Функция для очистки содержимого всех панелей
function clearAllPanels() {
    document.getElementById('table-container').innerHTML = '<p>Выберите таблицу из меню слева для просмотра.</p>';
    document.getElementById('editable-table-container').innerHTML = '<p>Выберите таблицу в секции "Редактирование данных", чтобы начать работу.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('message-container').innerHTML = '';
    document.getElementById('current-table-name').textContent = 'Не выбрана';
    document.getElementById('editable-table-name').textContent = 'Не выбрана';
    document.getElementById('add-button').style.display = 'none'; // Скрываем кнопку "Добавить запись"
    currentTableName = ''; // Сбрасываем текущие таблицы
    editableCurrentTableName = '';
}

// --- ПАНЕЛЬ "ПРОСМОТР ДАННЫХ" (READ-ONLY) ---
async function showReadOnlyTable(tableName) {
    currentTableName = tableName;
    editableCurrentTableName = ''; // Убеждаемся, что редактируемая таблица сброшена
    document.getElementById('current-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('editable-table-name').textContent = 'Не выбрана';
    document.getElementById('editable-table-container').innerHTML = '<p>Только для чтения. Выберите таблицу из секции "Редактирование", чтобы вносить изменения.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('add-button').style.display = 'none'; // Скрываем кнопку "Добавить запись"

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        renderReadOnlyTable(await response.json(), tableName);
    } catch (error) {
        console.error('Ошибка загрузки данных для просмотра:', error);
        document.getElementById('table-container').innerHTML = `<p class="error-message">Ошибка загрузки данных: ${error.message}</p>`;
    }
}

function renderReadOnlyTable(data, tableName) {
    const container = document.getElementById('table-container');
    container.innerHTML = ''; // Очищаем контейнер перед рендерингом

    if (data && data.error) {
        container.innerHTML = `<p class="error-message">Ошибка: ${data.error}</p>`;
        return;
    }
    if (!data || data.length === 0) {
        container.innerHTML = '<p>Нет данных для отображения.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = Object.keys(data[0]); // Получаем заголовки из первого объекта данных
    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);

    data.forEach(rowData => {
        const row = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = formatCell(rowData[h], h);
            row.appendChild(td);
        });
        tbody.appendChild(row);
    });

    table.append(thead, tbody);
    container.appendChild(table);
}

// --- ПАНЕЛЬ "РЕДАКТОР" (EDITABLE) ---
async function showEditableTable(tableName) {
    editableCurrentTableName = tableName;
    currentTableName = ''; // Убеждаемся, что таблица для просмотра сброшена
    document.getElementById('editable-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('current-table-name').textContent = 'Не выбрана';
    document.getElementById('table-container').innerHTML = '<p>Выберите таблицу из секции "Просмотр", чтобы отобразить данные здесь.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('add-button').style.display = 'inline-block'; // Показываем кнопку "Добавить запись"

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        renderEditableTable(await response.json(), tableName);
    } catch (error) {
        console.error('Ошибка загрузки данных для редактирования:', error);
        document.getElementById('editable-table-container').innerHTML = `<p class="error-message">Ошибка загрузки данных: ${error.message}</p>`;
    }
}

function renderEditableTable(data, tableName) {
    const container = document.getElementById('editable-table-container');
    container.innerHTML = ''; // Очищаем контейнер

    if (data && data.error) {
        container.innerHTML = `<p class="error-message">Ошибка: ${data.error}</p>`;
        return;
    }
    if (!data || data.length === 0) {
        // Если данных нет, мы все равно хотим отобразить пустую таблицу с заголовками для добавления
        // Или просто сообщение, если таблица пустая
        container.innerHTML = '<p>Нет данных для редактирования. Вы можете добавить новую запись.</p>';
        return;
    }

    const table = document.createElement('table');
    const thead = document.createElement('thead');
    const tbody = document.createElement('tbody');

    const headers = Object.keys(data[0]); // Получаем заголовки
    const pkKeys = primaryKeyMapping[tableName] || []; // Получаем ключевые поля для таблицы

    const headerRow = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        headerRow.appendChild(th);
    });
    const thActions = document.createElement('th');
    thActions.textContent = 'Действия';
    headerRow.appendChild(thActions); // Добавляем столбец "Действия"
    thead.appendChild(headerRow);

    data.forEach(rowData => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = formatCell(rowData[header], header);
            td.dataset.column = header; // Сохраняем имя столбца в dataset

            // Разрешаем редактировать только неключевые поля
            if (pkKeys.includes(header)) {
                td.contentEditable = false;
                td.classList.add('pk-cell'); // Добавляем класс для стилизации ключевых полей
            } else {
                // Проверяем разрешение на изменение (U) для текущей роли
                const rolePerms = permissions[currentRole]?.tables[tableName];
                const canUpdate = rolePerms && (rolePerms.includes('U') || rolePerms.includes('SUID') || rolePerms.includes('U*'));
                td.contentEditable = canUpdate ? 'true' : 'false';
            }
            row.appendChild(td);
        });

        const tdActions = document.createElement('td');
        const rolePerms = permissions[currentRole]?.tables[tableName];

        // Кнопка "Сохранить" (для PUT)
        const canUpdateRow = rolePerms && (rolePerms.includes('U') || rolePerms.includes('SUID') || rolePerms.includes('U*'));
        if (canUpdateRow) {
            const saveButton = document.createElement('button');
            saveButton.textContent = 'Сохранить';
            saveButton.className = 'save-button-row';
            saveButton.onclick = () => {
                // Собираем данные из всей строки, включая ключевые поля
                const rowDataToSend = getRowData(row);
                submitCrud('PUT', rowDataToSend);
            };
            tdActions.appendChild(saveButton);
        }

        // Кнопка "Удалить" (для DELETE)
        const canDeleteRow = rolePerms && (rolePerms.includes('D') || rolePerms.includes('SUID'));
        if (canDeleteRow) {
            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.className = 'delete-button-row';
            deleteButton.onclick = () => {
                if (confirm('Вы уверены, что хотите удалить эту запись?')) {
                    // Передаем только первичные ключи для удаления
                    submitCrud('DELETE', getPrimaryKeys(rowData, tableName));
                }
            };
            tdActions.appendChild(deleteButton);
        }

        row.appendChild(tdActions);
        tbody.appendChild(row);
    });

    table.append(thead, tbody);
    container.appendChild(table);
}

// --- CRUD-ОПЕРАЦИИ И ФОРМЫ ---
function showForm(action) {
    if (!editableCurrentTableName) {
        alert("Сначала выберите таблицу для редактирования.");
        return;
    }

    const rolePerms = permissions[currentRole]?.tables[editableCurrentTableName];
    const canInsert = rolePerms && (rolePerms.includes('I') || rolePerms.includes('SUID'));

    if (!canInsert) {
        alert("У вас нет прав для добавления записей в эту таблицу.");
        document.getElementById('crud-form-container').innerHTML = ''; // Очистить форму, если нет прав
        return;
    }

    const container = document.getElementById('crud-form-container');
    container.innerHTML = `<h3>Добавление новой записи в "${tableDisplayNames[editableCurrentTableName]}"</h3>`;

    // Получаем заголовки (имена колонок) для построения формы
    // Можно получить их из primaryKeyMapping, если таблица может быть пустой,
    // или сделать запрос к API, чтобы получить структуру.
    // Для простоты пока запросим данные, чтобы получить заголовки.
    fetch(`/api/data?table=${editableCurrentTableName}`)
        .then(res => res.json())
        .then(data => {
            const headers = (data && data.length > 0) ? Object.keys(data[0]) : (primaryKeyMapping[editableCurrentTableName] || []);
            if (headers.length > 0) {
                container.appendChild(createFormFields(headers, editableCurrentTableName));
            } else {
                container.innerHTML += '<p class="error-message">Не удалось получить структуру таблицы для формы.</p>';
            }
        })
        .catch(error => {
            console.error('Ошибка получения структуры таблицы для формы:', error);
            container.innerHTML += `<p class="error-message">Ошибка загрузки структуры: ${error.message}</p>`;
        });
}

function createFormFields(headers, tableName) {
    const form = document.createElement('form');
    form.onsubmit = e => {
        e.preventDefault();
        const formData = Object.fromEntries(new FormData(e.target).entries());
        // Очищаем пустые строки из formData, чтобы они не отправлялись как пустые строки в БД,
        // где ожидается NULL.
        for (const key in formData) {
            if (formData[key] === '') {
                delete formData[key];
            }
        }
        submitCrud('POST', formData);
    };

    const pkKeys = primaryKeyMapping[tableName] || [];

    headers.forEach(header => {
        const label = document.createElement('label');
        label.textContent = header;

        const input = document.createElement('input');
        input.name = header;

        // Определяем тип инпута для даты
        if (header.includes('date') || header.includes('born') || header.includes('start') || header.includes('end')) {
            input.type = 'date';
        } else {
            input.type = 'text';
        }

        if (pkKeys.includes(header)) { 
            // input.readOnly = true;

        }

        form.append(label, input);
    });

    const submitButton = document.createElement('button');
    submitButton.type = 'submit';
    submitButton.textContent = 'Добавить';
    form.appendChild(submitButton);

    return form;
}


async function submitCrud(method, data) {
    const tableName = editableCurrentTableName;
    if (!tableName) {
        displayMessage('Ошибка: Таблица не выбрана для операции.', 'error');
        return;
    }

    let url = `/api/${tableName}`;
    let body = null;
    const headers = { 'Content-Type': 'application/json' };

    // Проверка прав на операцию
    const rolePerms = permissions[currentRole]?.tables[tableName];
    let hasPermission = false;
    if (method === 'POST') hasPermission = rolePerms && (rolePerms.includes('I') || rolePerms.includes('SUID'));
    else if (method === 'PUT') hasPermission = rolePerms && (rolePerms.includes('U') || rolePerms.includes('SUID') || rolePerms.includes('U*'));
    else if (method === 'DELETE') hasPermission = rolePerms && (rolePerms.includes('D') || rolePerms.includes('SUID'));

    if (!hasPermission) {
        displayMessage(`У вас нет прав для выполнения операции "${method}" в таблице "${tableDisplayNames[tableName]}".`, 'error');
        return;
    }

    if (method === 'POST' || method === 'PUT') {
        body = JSON.stringify(data);
    } else if (method === 'DELETE') {
        // Для DELETE параметры передаются в URL
        url += `?${new URLSearchParams(data).toString()}`;
    }

    try {
        const response = await fetch(url, { method, headers, body });
        const result = await response.json();

        if (response.ok) {
            displayMessage(result.message || 'Операция успешно выполнена!', 'success');
            showEditableTable(tableName);
            document.getElementById('crud-form-container').innerHTML = '';
        } else {
            displayMessage(result.error || 'Ошибка выполнения операции.', 'error');
        }
    } catch (error) {
        console.error('Сетевая ошибка при выполнении CRUD операции:', error);
        displayMessage('Не удалось связаться с сервером. Проверьте подключение.', 'error');
    }
}

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function displayMessage(message, type) {
    const container = document.getElementById('message-container');
    container.innerHTML = `<p class="${type}-message">${message}</p>`;
    // Автоматически скрываем сообщение через 4 секунды
    setTimeout(() => container.innerHTML = '', 4000);
}

// Форматирование содержимого ячейки (например, дат)
function formatCell(value, header) {
    if (value === null || typeof value === 'undefined') {
        return 'NULL';
    }
    // Проверка на дату/время по заголовку
    if (typeof value === 'string' && (header.includes('date') || header.includes('born') || header.includes('hire') || header.includes('end') || header.includes('start'))) {
       try {
           const date = new Date(value);
           if (!isNaN(date.getTime())) { // Проверяем, является ли дата валидной
               return date.toISOString().split('T')[0]; // Формат YYYY-MM-DD
           }
       } catch (e) {
           console.warn(`Не удалось отформатировать дату для поля ${header}: ${value}`, e);
       }
    }
    return value;
}

function getRowData(rowElement) {
    const data = {};
    rowElement.querySelectorAll('td[data-column]').forEach(td => {
        data[td.dataset.column] = td.textContent;
    });
    return data;
}

function getPrimaryKeys(rowData, tableName) {
    const pk = {};
    const pkKeys = primaryKeyMapping[tableName] || []; 

    if (pkKeys.length === 0) {
        console.warn(`Primary key not defined for table ${tableName}. Using first column as fallback.`);
        const firstKey = Object.keys(rowData)[0];
        if (firstKey) {
            pk[firstKey] = rowData[firstKey];
        } else {
            console.error('Cannot determine primary key for deletion.');
            return {};
        }
    } else {
        pkKeys.forEach(key => {
            if (rowData[key] !== undefined) {
                pk[key] = rowData[key];
            } else {
                console.error(`Primary key column "${key}" not found in row data for table "${tableName}".`, rowData);
            }
        });
    }
    return pk;
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme'); 
    const isDarkTheme = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light');
}