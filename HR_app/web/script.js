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
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole && savedRole !== 'старт') { setRole(savedRole); } else { setRole('старт'); }
    document.getElementById('theme-toggle')?.addEventListener('click', toggleTheme);
    if (localStorage.getItem('theme') === 'dark') { document.body.classList.add('dark-theme'); }
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
    if (newRole === 'старт') { applyRoleChange(newRole); return; }

    const employeeId = prompt(`Для доступа к роли "${tableDisplayNames[newRole] || newRole}", введите ваш табельный номер:`);
    if (employeeId === null || employeeId.trim() === "") { if (!currentRole) applyRoleChange('старт'); return; }

    try {
        const response = await fetch('/api/validate-role', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ employee_id: employeeId.trim(), role: newRole }),
        });
        if (response.ok) { alert('Доступ разрешен!'); applyRoleChange(newRole); }
        else { const errorData = await response.json(); alert(`Ошибка доступа: ${errorData.error}`); if (!currentRole) applyRoleChange('старт'); }
    } catch (error) {
        console.error('Сетевая ошибка:', error); alert('Не удалось связаться с сервером.'); if (!currentRole) applyRoleChange('старт');
    }
}

function updateUIBasedOnRole() {
    const tableButtonsContainer = document.getElementById('table-buttons-container');
    const editableTableButtonsContainer = document.getElementById('editable-table-buttons-container');
    tableButtonsContainer.innerHTML = ''; editableTableButtonsContainer.innerHTML = '';

    const rolePermissions = permissions[currentRole];
    if (!rolePermissions) return;

    let hasReadOnly = false, hasEditable = false;
    const allTablesAndViews = {...rolePermissions.tables, ...rolePermissions.views};

    for (const name in allTablesAndViews) {
        const perms = allTablesAndViews[name];
        const button = document.createElement('button');
        button.textContent = tableDisplayNames[name] || name;
        const canEdit = perms.some(p => ['U', 'I', 'D', 'SUID'].includes(p) || p.includes('U*'));

        if (canEdit && primaryKeyMapping[name]) { // Редактировать можно только таблицы с известными PK
            button.onclick = () => showEditableTable(name);
            editableTableButtonsContainer.appendChild(button);
            hasEditable = true;
        } else {
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
    currentTableName = ''; editableCurrentTableName = '';
}

// --- ПАНЕЛЬ "ПРОСМОТР ДАННЫХ" (READ-ONLY) ---
async function showReadOnlyTable(tableName) {
    currentTableName = tableName; editableCurrentTableName = '';
    document.getElementById('current-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('editable-table-name').textContent = 'Не выбрана';
    document.getElementById('editable-table-container').innerHTML = '<p>Только для чтения. Выберите таблицу из секции "Редактирование", чтобы вносить изменения.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('add-button').style.display = 'none';

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        renderReadOnlyTable(await response.json(), tableName);
    } catch (error) {
        document.getElementById('table-container').innerHTML = `<p class="error-message">Ошибка загрузки.</p>`;
    }
}

function renderReadOnlyTable(data, tableName) {
    const container = document.getElementById('table-container');
    container.innerHTML = '';
    if (data && data.error) { container.innerHTML = `<p class="error-message">Ошибка: ${data.error}</p>`; return; }
    if (!data || data.length === 0) { container.innerHTML = '<p>Нет данных.</p>'; return; }

    const table = document.createElement('table'), thead = document.createElement('thead'), tbody = document.createElement('tbody');
    const headers = Object.keys(data[0]);
    const headerRow = document.createElement('tr');
    headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
    thead.appendChild(headerRow);

    data.forEach(rowData => {
        const row = document.createElement('tr');
        headers.forEach(h => { const td = document.createElement('td'); td.textContent = formatCell(rowData[h], h); row.appendChild(td); });
        tbody.appendChild(row);
    });
    table.append(thead, tbody); container.appendChild(table);
}

// --- ПАНЕЛЬ "РЕДАКТОР" (EDITABLE) ---
async function showEditableTable(tableName) {
    editableCurrentTableName = tableName; currentTableName = '';
    document.getElementById('editable-table-name').textContent = tableDisplayNames[tableName] || tableName;
    document.getElementById('current-table-name').textContent = 'Не выбрана';
    document.getElementById('table-container').innerHTML = '<p>Выберите таблицу из секции "Просмотр", чтобы отобразить данные здесь.</p>';
    document.getElementById('crud-form-container').innerHTML = '';
    document.getElementById('add-button').style.display = 'inline-block';

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        renderEditableTable(await response.json(), tableName);
    } catch (error) {
        document.getElementById('editable-table-container').innerHTML = `<p class="error-message">Ошибка загрузки.</p>`;
    }
}

function renderEditableTable(data, tableName) {
    const container = document.getElementById('editable-table-container');
    container.innerHTML = '';
    if (data && data.error) { container.innerHTML = `<p class="error-message">Ошибка: ${data.error}</p>`; return; }
    if (!data || data.length === 0) { container.innerHTML = '<p>Нет данных для редактирования.</p>'; return; }

    const table = document.createElement('table'), thead = document.createElement('thead'), tbody = document.createElement('tbody');
    const headers = Object.keys(data[0]);
    const pkKeys = primaryKeyMapping[tableName] || [];

    const headerRow = document.createElement('tr');
    headers.forEach(h => { const th = document.createElement('th'); th.textContent = h; headerRow.appendChild(th); });
    const thActions = document.createElement('th'); thActions.textContent = 'Действия'; headerRow.appendChild(thActions);
    thead.appendChild(headerRow);

    data.forEach(rowData => {
        const row = document.createElement('tr');
        headers.forEach(header => {
            const td = document.createElement('td');
            td.textContent = formatCell(rowData[header], header);
            td.dataset.column = header;

            // *** ИСПРАВЛЕНИЕ #1: Разрешаем редактировать только неключевые поля ***
            if (pkKeys.includes(header)) {
                td.contentEditable = false;
                td.classList.add('pk-cell'); // Добавляем класс для стилизации
            } else {
                td.contentEditable = true;
            }
            row.appendChild(td);
        });
        
        const tdActions = document.createElement('td');
        const saveButton = document.createElement('button');
        saveButton.textContent = 'Сохранить'; saveButton.className = 'save-button-row';
        saveButton.onclick = () => submitCrud('PUT', getRowData(row));
        
        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'Удалить'; deleteButton.className = 'delete-button-row';
        deleteButton.onclick = () => { if(confirm('Вы уверены?')) { submitCrud('DELETE', getPrimaryKeys(rowData, tableName)); } };

        tdActions.append(saveButton, deleteButton);
        row.appendChild(tdActions); tbody.appendChild(row);
    });
    table.append(thead, tbody); container.appendChild(table);
}

// --- CRUD-ОПЕРАЦИИ И ФОРМЫ ---
function showForm(action) {
    if (!editableCurrentTableName) { alert("Сначала выберите таблицу."); return; }
    const container = document.getElementById('crud-form-container');
    container.innerHTML = `<h3>Добавление в "${tableDisplayNames[editableCurrentTableName]}"</h3>`;
    
    fetch(`/api/data?table=${editableCurrentTableName}`).then(res => res.json()).then(data => {
        const headers = (data && data.length > 0) ? Object.keys(data[0]) : (primaryKeyMapping[editableCurrentTableName] || []);
        if (headers.length > 0) container.appendChild(createFormFields(headers));
    });
}

function createFormFields(headers) {
    const form = document.createElement('form');
    form.onsubmit = e => { e.preventDefault(); submitCrud('POST', Object.fromEntries(new FormData(e.target).entries())); };
    headers.forEach(header => {
        const label = document.createElement('label'); label.textContent = header;
        const input = document.createElement('input'); input.name = header;
        input.type = header.includes('date') || header.includes('born') ? 'date' : 'text';
        form.append(label, input);
    });
    const submitButton = document.createElement('button'); submitButton.type = 'submit'; submitButton.textContent = 'Добавить';
    form.appendChild(submitButton);
    return form;
}

async function submitCrud(method, data) {
    const tableName = editableCurrentTableName; if (!tableName) return;
    let url = `/api/${tableName}`, body = null, headers = { 'Content-Type': 'application/json' };
    if (method === 'POST' || method === 'PUT') { body = JSON.stringify(data); }
    else if (method === 'DELETE') { url += `?${new URLSearchParams(data).toString()}`; }

    try {
        const response = await fetch(url, { method, headers, body });
        const result = await response.json();
        if (response.ok) {
            displayMessage(result.message || 'Успешно!', 'success');
            showEditableTable(tableName);
            document.getElementById('crud-form-container').innerHTML = '';
        } else { displayMessage(result.error || 'Ошибка.', 'error'); }
    } catch (error) { displayMessage('Ошибка сети.', 'error'); }
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
       try { if (!isNaN(new Date(value).getTime())) return new Date(value).toISOString().split('T')[0]; } catch (e) {}
    }
    return value;
}

function getRowData(rowElement) {
    const data = {};
    rowElement.querySelectorAll('td[data-column]').forEach(td => { data[td.dataset.column] = td.textContent; });
    return data;
}

function getPrimaryKeys(rowData, tableName) {
    const pk = {};
    const pkKeys = primaryKeyMapping[tableName] || [Object.keys(rowData)[0]];
    pkKeys.forEach(key => { if (rowData[key] !== undefined) pk[key] = rowData[key]; });
    return pk;
}

function toggleTheme() {
    document.body.classList.toggle('dark-theme');
    localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
}