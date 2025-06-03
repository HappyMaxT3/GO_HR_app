async function fetchData(tableName) {
    try {
        const response = await fetch(`/api/data?table=${tableName}`);
        const data = await response.json(); 

        const tableContainer = document.getElementById('table-container');
        tableContainer.innerHTML = '';

        if (data && data.error) { 
            tableContainer.innerHTML = `<p style="color: red;">Ошибка сервера: ${data.error}</p>`;
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
                td.textContent = rowData[header]; 
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });
        table.appendChild(tbody);
        tableContainer.appendChild(table);

    } catch (error) {
        console.error('Ошибка при получении или обработке данных:', error);
        document.getElementById('table-container').innerHTML =
            '<p style="color: red;">Произошла ошибка при загрузке данных. Проверьте консоль.</p>';
    }
}