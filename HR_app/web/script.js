let currentTableName = '';
let editableCurrentTableName = '';
let currentRole = '';

const tableDisplayNames = {
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

// Функция для установки активной роли и обновления UI
function setRole(role) {
    currentRole = role;
    document.getElementById('current-role').textContent = role;
    updateUIBasedOnRole();
    clearPanels();
}

// Функция для очистки всех панелей данных и форм
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

// Функция для обновления интерфейса в зависимости от роли
function updateUIBasedOnRole() {
    const tableButtonsContainer = document.getElementById('table-buttons-container');
    const editableTableButtonsContainer = document.getElementById('editable-table-buttons-container');
    tableButtonsContainer.innerHTML = '';
    editableTableButtonsContainer.innerHTML = '';

    const rolePermissions = permissions[currentRole];

    if (!rolePermissions) {
        tableButtonsContainer.innerHTML = '<p class="error-message">Выберите роль для просмотра данных.</p>';
        return;
    }

    for (const sqlTableName in rolePermissions.tables) {
        if (rolePermissions.tables[sqlTableName].includes('S') || rolePermissions.tables[sqlTableName].includes('S*')) {
            const button = document.createElement('button');
            button.textContent = tableDisplayNames[sqlTableName] || sqlTableName;
            button.onclick = () => fetchData(sqlTableName);
            tableButtonsContainer.appendChild(button);
        }
    }

    for (const viewName in rolePermissions.views) {
        if (rolePermissions.views[viewName].includes('S') || rolePermissions.views[viewName].includes('S*') || rolePermissions.views[viewName].includes('SUID')) {
            const button = document.createElement('button');
            button.textContent = tableDisplayNames[viewName] || viewName;
            button.onclick = () => fetchData(viewName);
            tableButtonsContainer.appendChild(button);
        }
    }

    for (const sqlTableName in rolePermissions.tables) {
        if (rolePermissions.tables[sqlTableName].some(p => ['U', 'I', 'D', 'SUID'].includes(p))) {
            const button = document.createElement('button');
            button.textContent = `Редактировать ${tableDisplayNames[sqlTableName] || sqlTableName}`;
            button.onclick = () => showEditableTable(sqlTableName);
            editableTableButtonsContainer.appendChild(button);
        }
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
    const tablePermissions = rolePermissions.tables[currentTableName] || rolePermissions.views[currentTableName];

    if (tablePermissions) {
        if (tablePermissions.includes('I')) {
            addButton.style.display = 'inline-block';
        }
        if (tablePermissions.includes('U')) {
            updateButton.style.display = 'inline-block';
        }
        if (tablePermissions.includes('D')) {
            deleteButton.style.display = 'inline-block';
        }
        if (tablePermissions.includes('SUID')) {
            addButton.style.display = 'inline-block';
            updateButton.style.display = 'inline-block';
            deleteButton.style.display = 'inline-block';
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
            console.error("Ошибка от сервера:", data.error);
            return;
        }

        if (data.length === 0) {
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

function displayMessage(containerId, message, isError = false) {
    const container = document.getElementById(containerId);
    if (!container) return;

    let msgDiv = container.querySelector('.message');
    if (!msgDiv) {
        msgDiv = document.createElement('div');
        msgDiv.classList.add('message');
        container.insertBefore(msgDiv, container.firstChild);
    }

    msgDiv.textContent = message;
    msgDiv.className = 'message';
    msgDiv.classList.add(isError ? 'error-message' : 'success-message');

    setTimeout(() => {
        if (msgDiv.parentNode) {
            msgDiv.parentNode.removeChild(msgDiv);
        }
    }, 5000);
}

function showForm(action) {
    const formContainer = document.getElementById('crud-form-container');
    formContainer.innerHTML = '';

    if (!currentTableName) {
        formContainer.innerHTML = '<p class="error-message">Сначала выберите таблицу для управления.</p>';
        return;
    }

    let formHtml = `<div class="crud-form"><h3>${action === 'add' ? 'Добавить' : action === 'update' ? 'Изменить' : 'Удалить'} запись</h3>`;
    let formFields = getFormFieldsForTable(currentTableName);

    if (!formFields) {
        formContainer.innerHTML = `<p class="error-message">CRUD операции пока не поддерживаются для таблицы "${tableDisplayNames[currentTableName] || currentTableName}".</p>`;
        return;
    }

    const primaryKeyFields = formFields.filter(f => f.isPrimaryKey);

    if (action === 'delete' || action === 'update') {
        if (primaryKeyFields.length === 0) {
            formContainer.innerHTML = `<p class="error-message">Невозможно выполнить ${action === 'delete' ? 'удаление' : 'обновление'}, первичный ключ для таблицы "${tableDisplayNames[currentTableName] || currentTableName}" не определен.</p>`;
            return;
        }
        primaryKeyFields.forEach(field => {
            formHtml += `
                <label for="${field.name}-${action}">${field.label || field.name} (ПК):</label>
                <input type="${field.type || 'text'}" id="${field.name}-${action}" name="${field.name}" ${action === 'delete' ? 'required' : ''}>
            `;
        });
    }

    if (action === 'add' || action === 'update') {
        formFields.forEach(field => {
            let alreadyAdded = false;
            for (let i = 0; i < primaryKeyFields.length; i++) {
                if (primaryKeyFields[i].name === field.name) {
                    alreadyAdded = true;
                    break;
                }
            }
            if (alreadyAdded && (action === 'update' || action === 'delete')) {
                return;
            }
            formHtml += `
                <label for="${field.name}-${action}">${field.label || field.name}:</label>
                <input type="${field.type || 'text'}" id="${field.name}-${action}" name="${field.name}" ${field.required && action === 'add' ? 'required' : ''}>
            `;
        });
    }

    formHtml += `<button onclick="submitCrud('${action}')">${action === 'add' ? 'Добавить' : action === 'update' ? 'Сохранить изменения' : 'Удалить'}</button></div>`;
    formContainer.innerHTML = formHtml;
}

function getFormFieldsForTable(tableName) {
    switch (tableName) {
        case 'employees':
            return [
                { name: 'e_id', label: 'Табельный номер', type: 'number', required: true, isPrimaryKey: true },
                { name: 'd_id', label: 'Аббревиатура отдела', type: 'text', required: true },
                { name: 'e_fname', label: 'Фамилия', type: 'text', required: true },
                { name: 'e_lname', label: 'Имя и отчество', type: 'text', required: true },
                { name: 'e_pasp', label: 'Серия и номер паспорта', type: 'text', required: true },
                { name: 'e_date', label: 'Когда выдан паспорт', type: 'date', required: true },
                { name: 'e_given', label: 'Кем выдан паспорт', type: 'text', required: true },
                { name: 'e_gender', label: 'Пол (м/ж)', type: 'text', required: true },
                { name: 'e_inn', label: 'ИНН', type: 'text', required: true },
                { name: 'e_snils', label: 'СНИЛС', type: 'text', required: true },
                { name: 'e_born', label: 'Дата рождения', type: 'date', required: true },
                { name: 'e_hire', label: 'Дата приема на работу', type: 'date', required: true },
                { name: 'p_name', label: 'Название должности', type: 'text', required: true }
            ];
        case 'departments':
            return [
                { name: 'd_id', label: 'Аббревиатура отдела', type: 'text', required: true, isPrimaryKey: true },
                { name: 'd_name', label: 'Название отдела', type: 'text', required: true },
                { name: 'd_id_dir', label: 'Табельный номер руководителя отдела', type: 'number', required: false }
            ];
        case 'positions':
            return [
                { name: 'p_name', label: 'Название должности', type: 'text', required: true, isPrimaryKey: true },
                { name: 'p_sal', label: 'Оклад', type: 'number', required: true }
            ];
        case 'employees_education_types':
            return [
                { name: 'eet_id', label: 'Идентификатор вида образования', type: 'number', required: true, isPrimaryKey: true },
                { name: 'eet_name', label: 'Название вида образования', type: 'text', required: true }
            ];
        case 'employees_contacts_types':
            return [
                { name: 'ect_id', label: 'Идентификатор типа контакта', type: 'number', required: true, isPrimaryKey: true },
                { name: 'ect_type', label: 'Название типа контакта', type: 'text', required: true }
            ];
        case 'absences_types':
            return [
                { name: 'at_id', label: 'Идентификатор типа периода отсутствия', type: 'number', required: true, isPrimaryKey: true },
                { name: 'at_type', label: 'Название типа периода отсутствия', type: 'text', required: true }
            ];
        case 'employees_addresses':
            return [
                { name: 'ea_id_e', label: 'Табельный номер сотрудника', type: 'number', required: true, isPrimaryKey: true },
                { name: 'ea_addr', label: 'Адрес', type: 'text', required: true, isPrimaryKey: true }
            ];
        case 'employees_education':
            return [
                { name: 'ee_id_e', label: 'Табельный номер сотрудника', type: 'number', required: true, isPrimaryKey: true },
                { name: 'ee_type', label: 'Вид образования', type: 'number', required: true, isPrimaryKey: true },
                { name: 'ee_end', label: 'Дата окончания учебного заведения', type: 'date', required: true, isPrimaryKey: true },
                { name: 'ee_name', label: 'Наименование учебного заведения', type: 'text', required: true },
                { name: 'ee_spec', label: 'Специальность', type: 'text', required: false },
                { name: 'ee_dip', label: 'Номер диплома', type: 'text', required: false }
            ];
        case 'employees_contacts':
            return [
                { name: 'ec_id_e', label: 'Табельный номер сотрудника', type: 'number', required: true, isPrimaryKey: true },
                { name: 'ec_type', label: 'Тип контакта', type: 'number', required: true, isPrimaryKey: true },
                { name: 'ec_mean', label: 'Значение контакта', type: 'text', required: true, isPrimaryKey: true }
            ];
        case 'staffing':
            return [
                { name: 's_id_d', label: 'Аббревиатура отдела', type: 'text', required: true, isPrimaryKey: true },
                { name: 's_name_p', label: 'Название должности', type: 'text', required: true, isPrimaryKey: true },
                { name: 's_count', label: 'Количество сотрудников', type: 'number', required: true }
            ];
        case 'job':
            return [
                { name: 'j_id_d', label: 'Аббревиатура отдела', type: 'text', required: true, isPrimaryKey: true },
                { name: 'j_name_p', label: 'Название должности', type: 'text', required: true, isPrimaryKey: true },
                { name: 'j_id', label: 'Табельный номер сотрудника', type: 'number', required: true, isPrimaryKey: true },
                { name: 'j_start', label: 'Дата начала периода', type: 'date', required: true },
                { name: 'j_end', label: 'Дата окончания периода', type: 'date', required: false },
                { name: 'j_doc', label: 'Данные документа', type: 'text', required: true }
            ];
        case 'absences':
            return [
                { name: 'a_id', label: 'Идентификатор записи', type: 'number', required: true, isPrimaryKey: true },
                { name: 'a_type', label: 'Тип периода', type: 'number', required: true },
                { name: 'a_start', label: 'Дата начала периода', type: 'date', required: true },
                { name: 'a_end', label: 'Дата окончания периода', type: 'date', required: false },
                { name: 'a_id_e', label: 'Табельный номер сотрудника', type: 'number', required: true },
                { name: 'a_doc', label: 'Данные документа', type: 'text', required: true }
            ];
        case 'departments_phones':
            return [
                { name: 'dp_id', label: 'Аббревиатура отдела', type: 'text', required: true, isPrimaryKey: true },
                { name: 'dp_phone', label: 'Телефон отдела', type: 'text', required: true, isPrimaryKey: true }
            ];
        default:
            console.warn(`Поля формы не определены для таблицы/представления: ${tableName}`);
            return null;
    }
}

async function submitCrud(action, dataFromEditableTable = null) {
    let formData = {};
    let targetTableName = currentTableName;
    let formContainerId = 'crud-form-container';

    if (dataFromEditableTable) {
        formData = dataFromEditableTable;
        action = 'update';
        targetTableName = editableCurrentTableName;
        formContainerId = 'editable-table-container';
    } else {
        const formContainer = document.getElementById(formContainerId);
        const form = formContainer.querySelector('.crud-form');
        if (!form) return;

        const formFields = getFormFieldsForTable(targetTableName);
        if (!formFields) {
            displayMessage(formContainerId, `Не удалось получить поля формы для таблицы "${tableDisplayNames[targetTableName] || targetTableName}".`, true);
            return;
        }

        const primaryKeyFields = formFields.filter(f => f.isPrimaryKey);

        for (const field of formFields) {
            const input = document.getElementById(`${field.name}-${action}`);
            if (input) {
                if (!input.value && !field.required) {
                    formData[field.name] = null;
                } else if (input.value) {
                    formData[field.name] = parseValue(input.value, field.type);
                } else if (field.required && !input.value) {
                    displayMessage(formContainerId, `Поле "${field.label || field.name}" обязательно.`, true);
                    return;
                }
            }
        }

        if (action === 'update' || action === 'delete') {
            for (const pkField of primaryKeyFields) {
                if (formData[pkField.name] === undefined || formData[pkField.name] === null || formData[pkField.name] === '') {
                    displayMessage(formContainerId, `Для ${action === 'update' ? 'обновления' : 'удаления'} необходимо указать все части первичного ключа. Отсутствует: "${pkField.label || pkField.name}".`, true);
                    return;
                }
            }
        }
    }

    if (Object.keys(formData).length === 0 && action !== 'delete') {
        displayMessage(formContainerId, 'Нечего отправлять. Заполните поля.', true);
        return;
    }

    let url = `/api/${targetTableName}`;
    let method = '';
    let body = null;
    let queryParams = [];

    if (action === 'add') {
        method = 'POST';
        body = JSON.stringify(formData);
    } else if (action === 'update') {
        method = 'PUT';
        body = JSON.stringify(formData);
    } else if (action === 'delete') {
        method = 'DELETE';
        const primaryKeyFields = getFormFieldsForTable(targetTableName).filter(f => f.isPrimaryKey);
        for (const pkField of primaryKeyFields) {
            if (formData[pkField.name] !== undefined && formData[pkField.name] !== null && formData[pkField.name] !== '') {
                queryParams.push(`${pkField.name}=${encodeURIComponent(formData[pkField.name])}`);
            }
        }
        if (queryParams.length > 0) {
            url += `?${queryParams.join('&')}`;
        } else {
            displayMessage(formContainerId, `Для удаления необходимо указать все части первичного ключа.`, true);
            return;
        }
    }

    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json'
            },
            body: body
        });

        const result = await response.json();

        if (response.ok) {
            displayMessage(formContainerId, result.message || `${action === 'add' ? 'Запись успешно добавлена!' : action === 'update' ? 'Запись успешно обновлена!' : 'Запись успешно удалена!'}`);
            if (dataFromEditableTable) {
                showEditableTable(editableCurrentTableName);
            } else {
                fetchData(currentTableName);
                document.getElementById('crud-form-container').innerHTML = '<p>Выберите действие.</p>';
            }
            clearEditableForm();
        } else {
            displayMessage(formContainerId, `Ошибка: ${result.error || 'Неизвестная ошибка'}`, true);
            console.error('Ошибка от сервера:', result);
        }
    } catch (error) {
        displayMessage(formContainerId, 'Ошибка при выполнении операции. Проверьте консоль.', true);
        console.error('Ошибка сети или обработки:', error);
    }
}

function parseValue(value, type) {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (type === 'number') {
        const num = Number(value);
        return isNaN(num) ? null : num;
    }
    if (type === 'date') {
        const parts = value.split('.');
        if (parts.length === 3) {
            const day = ('0' + parts[0]).slice(-2);
            const month = ('0' + parts[1]).slice(-2);
            const year = parts[2];
            return `${year}-${month}-${day}`;
        }
        if (value.match(/^\d{4}-\d{2}-\d{2}$/)) {
            return value;
        }
    }
    return value;
}

async function showEditableTable(tableName) {
    editableCurrentTableName = tableName;
    document.getElementById('editable-table-name').textContent = tableDisplayNames[tableName] || tableName;

    const editableTableContainer = document.getElementById('editable-table-container');
    editableTableContainer.innerHTML = '<p>Загрузка данных...</p>';

    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        const data = await response.json();

        if (data && data.error) {
            editableTableContainer.innerHTML = `<p class="error-message">Ошибка загрузки редактируемых данных: ${data.error}</p>`;
            console.error("Ошибка от сервера:", data.error);
            return;
        }

        if (data.length === 0) {
            editableTableContainer.innerHTML = '<p>Нет данных для редактирования.</p>';
            const formSection = document.createElement('div');
            formSection.id = 'editable-data-panel-form-section';
            formSection.innerHTML = '<h3>Добавить запись</h3><div class="edit-form-content"></div>';
            editableTableContainer.appendChild(formSection);
            populateAddForm(tableName);
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
        const actionTh = document.createElement('th');
        actionTh.textContent = 'Действия';
        headerRow.appendChild(actionTh);
        thead.appendChild(headerRow);
        table.appendChild(thead);

        const formFields = getFormFieldsForTable(tableName);
        if (!formFields || formFields.filter(f => f.isPrimaryKey).length === 0) {
            editableTableContainer.innerHTML = `<p class="error-message">Для таблицы "${tableDisplayNames[tableName] || tableName}" не определены поля формы или первичный ключ для редактирования.</p>`;
            return;
        }
        const primaryKeyNames = formFields.filter(f => f.isPrimaryKey).map(f => f.name);

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

            const actionTd = document.createElement('td');
            const editButton = document.createElement('button');
            editButton.textContent = 'Редактировать';
            editButton.onclick = () => populateEditForm(rowData, primaryKeyNames, tableName);
            actionTd.appendChild(editButton);

            const deleteButton = document.createElement('button');
            deleteButton.textContent = 'Удалить';
            deleteButton.classList.add('delete-button-row');
            deleteButton.onclick = () => {
                if (confirm(`Вы уверены, что хотите удалить эту запись?`)) {
                    const pkData = {};
                    primaryKeyNames.forEach(pkName => {
                        pkData[pkName] = rowData[pkName];
                    });
                    submitCrud('delete', pkData);
                }
            };
            actionTd.appendChild(deleteButton);

            row.appendChild(actionTd);
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        editableTableContainer.appendChild(table);

        const formSection = document.createElement('div');
        formSection.id = 'editable-data-panel-form-section';
        formSection.innerHTML = '<h3>Редактировать / Добавить запись</h3><div class="edit-form-content"></div>';
        editableTableContainer.appendChild(formSection);
        populateAddForm(tableName);

    } catch (error) {
        console.error('Ошибка при получении или обработке данных для редактируемой таблицы:', error);
        editableTableContainer.innerHTML =
            '<p class="error-message">Произошла ошибка при загрузке редактируемых данных. Проверьте консоль.</p>';
    }
}

function populateEditForm(rowData, primaryKeyNames, tableName) {
    const editFormContent = document.querySelector('#editable-data-panel-form-section .edit-form-content');
    if (!editFormContent) return; // Проверка на существование элемента
    editFormContent.innerHTML = '';

    const formFields = getFormFieldsForTable(tableName);
    if (!formFields) {
        editFormContent.innerHTML = `<p class="error-message">Не удалось получить поля формы для таблицы "${tableDisplayNames[tableName] || tableName}".</p>`;
        return;
    }

    let formHtml = '';
    formFields.forEach(field => {
        const value = rowData[field.name];
        let inputValue = '';

        if (value !== null) {
            if (field.type === 'date' || field.name.includes('_date') || field.name.includes('_born') || field.name.includes('_hire') || field.name.includes('_end') || field.name.includes('_start')) {
                inputValue = formatForDateInput(value);
            } else {
                inputValue = value;
            }
        }
        if (field.type === 'number' && (inputValue === null || inputValue === undefined)) {
            inputValue = '';
        }

        formHtml += `
            <label for="edit-${field.name}">${field.label || field.name}:</label>
            <input type="${field.type || 'text'}" id="edit-${field.name}" name="${field.name}" value="${inputValue}" ${primaryKeyNames.includes(field.name) ? 'readonly' : ''} ${field.required ? 'required' : ''}>
        `;
    });

    formHtml += `<button onclick="submitEditableData('${tableName}', 'update')">Сохранить изменения</button>`;
    formHtml += `<button onclick="populateAddForm('${tableName}')">Добавить новую запись</button>`;
    formHtml += `<button onclick="clearEditableForm()">Очистить форму</button>`;

    editFormContent.innerHTML = formHtml;
}

function populateAddForm(tableName) {
    const editFormContent = document.querySelector('#editable-data-panel-form-section .edit-form-content');
    if (!editFormContent) return; // Проверка на существование элемента
    editFormContent.innerHTML = '';

    const formFields = getFormFieldsForTable(tableName);
    if (!formFields) {
        editFormContent.innerHTML = `<p class="error-message">Не удалось получить поля формы для таблицы "${tableDisplayNames[tableName] || tableName}".</p>`;
        return;
    }

    let formHtml = '';
    formFields.forEach(field => {
        formHtml += `
            <label for="edit-${field.name}">${field.label || field.name}:</label>
            <input type="${field.type || 'text'}" id="edit-${field.name}" name="${field.name}" value="" ${field.isPrimaryKey ? 'readonly' : ''} ${field.required ? 'required' : ''}>
        `;
    });

    formHtml += `<button onclick="submitEditableData('${tableName}', 'add')">Добавить запись</button>`;
    formHtml += `<button onclick="clearEditableForm()">Очистить форму</button>`;

    editFormContent.innerHTML = formHtml;
}

function clearEditableForm() {
    const editFormContent = document.querySelector('#editable-data-panel-form-section .edit-form-content');
    if (editFormContent) {
        editFormContent.innerHTML = '';
    }
}

function submitEditableData(tableName, action) {
    const editFormContent = document.querySelector('#editable-data-panel-form-section .edit-form-content');
    if (!editFormContent) return;

    const formFields = getFormFieldsForTable(tableName);

    let rowData = {};
    for (const field of formFields) {
        const input = document.getElementById(`edit-${field.name}`);
        if (input) {
            if (!input.value && !field.required) {
                rowData[field.name] = null;
            } else if (input.value) {
                rowData[field.name] = parseValue(input.value, field.type);
            } else if (field.required && !input.value) {
                displayMessage('editable-data-panel', `Поле "${field.label || field.name}" обязательно.`, true);
                return;
            }
        }
    }

    if (action === 'update') {
        const primaryKeyFields = formFields.filter(f => f.isPrimaryKey);
        for (const pkField of primaryKeyFields) {
            if (rowData[pkField.name] === undefined || rowData[pkField.name] === null || rowData[pkField.name] === '') {
                displayMessage('editable-data-panel', `Поле первичного ключа "${pkField.label || pkField.name}" не может быть пустым для обновления.`, true);
                return;
            }
        }
    }

    submitCrud(action, rowData, true); // Передаем true, чтобы указать, что это из editable-таблицы
}

function formatForDateInput(dateString) {
    if (!dateString) return '';
    try {
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
    } catch (e) {
        console.warn('Could not format date for input type="date":', dateString, e);
    }
    return '';
}

// --- Функции для ТЕМНОЙ ТЕМЫ ---
function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-theme'); // Переключаем класс 'dark-theme'
    const isDarkTheme = body.classList.contains('dark-theme');
    localStorage.setItem('theme', isDarkTheme ? 'dark' : 'light'); // Сохраняем выбор в localStorage
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    const savedRole = localStorage.getItem('selectedRole');
    if (savedRole) {
        setRole(savedRole);
    } else {
        setRole('Сотрудник'); // Устанавливаем роль по умолчанию
    }

    // Привязываем обработчики событий для кнопок CRUD
    document.getElementById('add-button').onclick = () => showForm('add');
    document.getElementById('update-button').onclick = () => showForm('update');
    document.getElementById('delete-button').onclick = () => showForm('delete');

    // Загрузка темы из localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-theme');
    }

    // Привязка обработчика к кнопке переключения темы
    const themeToggleButton = document.getElementById('theme-toggle');
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    clearPanels();
});