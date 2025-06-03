-- DDL for Employee Management Database
-- All table and column names are in lowercase for PostgreSQL default behavior

-- Table for Employee Education Types
CREATE TABLE employees_education_types (
    eet_id NUMERIC(1) PRIMARY KEY,
    eet_name VARCHAR(50) NOT NULL
);

-- Table for Employee Contact Types
CREATE TABLE employees_contacts_types (
    ect_id NUMERIC(1) PRIMARY KEY,
    ect_type VARCHAR(50) NOT NULL
);

-- Table for Absence Types
CREATE TABLE absences_types (
    at_id NUMERIC(1) PRIMARY KEY,
    at_type VARCHAR(20) NOT NULL
);

-- Table for Departments
CREATE TABLE departments (
    d_id VARCHAR(12) PRIMARY KEY,
    d_name VARCHAR(100) NOT NULL,
    d_id_dir NUMERIC(4) -- Foreign key to be added after employees table
);

-- Table for Department Phones
CREATE TABLE departments_phones (
    dp_id VARCHAR(12) NOT NULL,
    dp_phone VARCHAR(40) NOT NULL,
    PRIMARY KEY (dp_id, dp_phone),
    FOREIGN KEY (dp_id) REFERENCES departments(d_id)
);

-- Table for Positions
CREATE TABLE positions (
    p_name VARCHAR(100) PRIMARY KEY,
    p_sal NUMERIC(10, 2) NOT NULL CHECK (p_sal > 0)
);

-- Table for Employees
CREATE TABLE employees (
    e_id NUMERIC(4) PRIMARY KEY,
    d_id VARCHAR(12) NOT NULL,
    e_fname VARCHAR(50) NOT NULL,
    e_lname VARCHAR(50) NOT NULL,
    e_pasp CHAR(10) NOT NULL UNIQUE,
    e_date DATE NOT NULL,
    e_given VARCHAR(50) NOT NULL,
    e_gender CHAR(1) NOT NULL CHECK (e_gender IN ('м', 'ж')),
    e_inn CHAR(12) NOT NULL UNIQUE,
    e_snils CHAR(11) NOT NULL UNIQUE,
    e_born DATE NOT NULL, -- Removed CHECK (E_BORN < CURRENT_DATE - INTERVAL '16 years')
    e_hire DATE NOT NULL, -- Removed CHECK (E_HIRE <= CURRENT_DATE)
    p_name VARCHAR(100) NOT NULL,
    FOREIGN KEY (d_id) REFERENCES departments(d_id),
    FOREIGN KEY (p_name) REFERENCES positions(p_name)
);

-- Add Foreign Key to Departments table (after Employees table is created)
ALTER TABLE departments
ADD FOREIGN KEY (d_id_dir) REFERENCES employees(e_id);

-- Table for Employee Addresses
CREATE TABLE employees_addresses (
    ea_id_e NUMERIC(4) NOT NULL,
    ea_addr VARCHAR(100) NOT NULL,
    PRIMARY KEY (ea_id_e, ea_addr),
    FOREIGN KEY (ea_id_e) REFERENCES employees(e_id)
);

-- Table for Employee Education
CREATE TABLE employees_education (
    ee_id_e NUMERIC(4) NOT NULL,
    ee_type NUMERIC(1) NOT NULL,
    ee_spec VARCHAR(100),
    ee_dip CHAR(50),
    ee_end DATE NOT NULL, -- Removed CHECK (EE_END <= CURRENT_DATE)
    ee_name VARCHAR(100) NOT NULL,
    PRIMARY KEY (ee_id_e, ee_type, ee_end),
    FOREIGN KEY (ee_id_e) REFERENCES employees(e_id),
    FOREIGN KEY (ee_type) REFERENCES employees_education_types(eet_id)
);

-- Table for Employee Contacts
CREATE TABLE employees_contacts (
    ec_id_e NUMERIC(4) NOT NULL,
    ec_type NUMERIC(1) NOT NULL,
    ec_mean VARCHAR(50) NOT NULL,
    PRIMARY KEY (ec_id_e, ec_type, ec_mean),
    FOREIGN KEY (ec_id_e) REFERENCES employees(e_id),
    FOREIGN KEY (ec_type) REFERENCES employees_contacts_types(ect_id)
);

-- Table for Staffing
CREATE TABLE staffing (
    s_id_d VARCHAR(12) NOT NULL,
    s_name_p VARCHAR(100) NOT NULL,
    s_count NUMERIC(4) NOT NULL CHECK (s_count >= 0),
    PRIMARY KEY (s_id_d, s_name_p),
    FOREIGN KEY (s_id_d) REFERENCES departments(d_id),
    FOREIGN KEY (s_name_p) REFERENCES positions(p_name)
);

-- Table for Absences
CREATE TABLE absences (
    a_id NUMERIC(10) PRIMARY KEY, -- If auto-incrementing, consider SERIAL/BIGSERIAL
    a_type NUMERIC(1) NOT NULL,
    a_start DATE NOT NULL,
    a_end DATE,
    a_id_e NUMERIC(4) NOT NULL,
    a_doc VARCHAR(200) NOT NULL,
    FOREIGN KEY (a_type) REFERENCES absences_types(at_id),
    FOREIGN KEY (a_id_e) REFERENCES employees(e_id),
    CHECK (a_end IS NULL OR a_end > a_start)
);

-- Table for Job History
CREATE TABLE job (
    j_id_d VARCHAR(12) NOT NULL,
    j_name_p VARCHAR(100) NOT NULL,
    j_id NUMERIC(4) NOT NULL,
    j_start DATE NOT NULL,
    j_end DATE,
    j_doc VARCHAR(200) NOT NULL,
    PRIMARY KEY (j_id_d, j_name_p, j_id),
    FOREIGN KEY (j_id_d, j_name_p) REFERENCES staffing(s_id_d, s_name_p),
    FOREIGN KEY (j_id) REFERENCES employees(e_id),
    CHECK (j_end IS NULL OR j_end > j_start)
);

-- Indexes for performance (all lowercase)
CREATE INDEX ix_employees_d_id ON employees (d_id);
CREATE INDEX ix_employees_p_name ON employees (p_name);
CREATE INDEX ix_employees_addresses_ea_id_e ON employees_addresses (ea_id_e);
CREATE INDEX ix_employees_education_ee_id_e ON employees_education (ee_id_e);
CREATE INDEX ix_employees_education_ee_type ON employees_education (ee_type);
CREATE INDEX ix_employees_contacts_ec_id_e ON employees_contacts (ec_id_e);
CREATE INDEX ix_employees_contacts_ec_type ON employees_contacts (ec_type);
CREATE INDEX ix_staffing_s_id_d ON staffing (s_id_d);
CREATE INDEX ix_staffing_s_name_p ON staffing (s_name_p);
CREATE INDEX ix_absences_a_type ON absences (a_type);
CREATE INDEX ix_absences_a_id_e ON absences (a_id_e);
CREATE INDEX ix_absences_dates ON absences (a_start, a_end);
CREATE INDEX ix_job_fk_staffing ON job (j_id_d, j_name_p);
CREATE INDEX ix_job_fk_employees ON job (j_id);
CREATE INDEX ix_job_dates ON job (j_id, j_start, j_end); -- Changed to include j_id first

-- Data Insertion (all lowercase)
-- Employees_Education_Types
INSERT INTO employees_education_types (eet_id, eet_name) VALUES (1, 'начальное') ON CONFLICT (eet_id) DO NOTHING;
INSERT INTO employees_education_types (eet_id, eet_name) VALUES (2, 'среднее') ON CONFLICT (eet_id) DO NOTHING;
INSERT INTO employees_education_types (eet_id, eet_name) VALUES (3, 'среднее специальное') ON CONFLICT (eet_id) DO NOTHING;
INSERT INTO employees_education_types (eet_id, eet_name) VALUES (4, 'среднее профессиональное') ON CONFLICT (eet_id) DO NOTHING;
INSERT INTO employees_education_types (eet_id, eet_name) VALUES (5, 'высшее') ON CONFLICT (eet_id) DO NOTHING;

-- Employees_Contacts_Types
INSERT INTO employees_contacts_types (ect_id, ect_type) VALUES (1, 'телефон') ON CONFLICT (ect_id) DO NOTHING;
INSERT INTO employees_contacts_types (ect_id, ect_type) VALUES (2, 'email') ON CONFLICT (ect_id) DO NOTHING;
INSERT INTO employees_contacts_types (ect_id, ect_type) VALUES (3, 'мессенджер') ON CONFLICT (ect_id) DO NOTHING;
INSERT INTO employees_contacts_types (ect_id, ect_type) VALUES (4, 'соцсети') ON CONFLICT (ect_id) DO NOTHING;

-- Absences_Types
INSERT INTO absences_types (at_id, at_type) VALUES (1, 'отпуск') ON CONFLICT (at_id) DO NOTHING;
INSERT INTO absences_types (at_id, at_type) VALUES (2, 'больничный') ON CONFLICT (at_id) DO NOTHING;
INSERT INTO absences_types (at_id, at_type) VALUES (3, 'командировка') ON CONFLICT (at_id) DO NOTHING;
INSERT INTO absences_types (at_id, at_type) VALUES (4, 'учебный отпуск') ON CONFLICT (at_id) DO NOTHING;
INSERT INTO absences_types (at_id, at_type) VALUES (5, 'отгул') ON CONFLICT (at_id) DO NOTHING;

-- Positions
INSERT INTO positions (p_name, p_sal) VALUES ('Генеральный директор', 150000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('Руководитель отдела IT', 100000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('Руководитель отдела HR', 95000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('Бухгалтер', 60000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('Разработчик', 80000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('Младший разработчик', 50000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('HR-специалист', 70000.00) ON CONFLICT (p_name) DO NOTHING;
INSERT INTO positions (p_name, p_sal) VALUES ('Секретарь', 45000.00) ON CONFLICT (p_name) DO NOTHING;

-- Departments
INSERT INTO departments (d_id, d_name, d_id_dir) VALUES ('IT', 'Отдел информационных технологий', NULL) ON CONFLICT (d_id) DO NOTHING;
INSERT INTO departments (d_id, d_name, d_id_dir) VALUES ('HR', 'Отдел кадров', NULL) ON CONFLICT (d_id) DO NOTHING;
INSERT INTO departments (d_id, d_name, d_id_dir) VALUES ('ACC', 'Бухгалтерия', NULL) ON CONFLICT (d_id) DO NOTHING;
INSERT INTO departments (d_id, d_name, d_id_dir) VALUES ('MGMT', 'Руководство', NULL) ON CONFLICT (d_id) DO NOTHING;

-- Employees
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1001, 'MGMT', 'Иван', 'Петров', '1234567890', '2010-01-15', 'ОВД по г.Москва', 'м', '123456789012', '12345678901', '1980-05-10', '2020-03-01', 'Генеральный директор') ON CONFLICT (e_id) DO NOTHING;
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1002, 'IT', 'Анна', 'Смирнова', '0987654321', '2012-03-20', 'ОВД г.Санкт-Петербург', 'ж', '098765432109', '98765432109', '1985-11-22', '2021-06-15', 'Руководитель отдела IT') ON CONFLICT (e_id) DO NOTHING;
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1003, 'HR', 'Ольга', 'Иванова', '1122334455', '2015-07-01', 'ОВД по г.Казань', 'ж', '112233445566', '11223344556', '1990-01-01', '2022-01-10', 'Руководитель отдела HR') ON CONFLICT (e_id) DO NOTHING;
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1004, 'ACC', 'Дмитрий', 'Сидоров', '5566778899', '2018-09-05', 'ОВД г.Екатеринбург', 'м', '556677889900', '55667788990', '1988-03-25', '2020-04-01', 'Бухгалтер') ON CONFLICT (e_id) DO NOTHING;
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1005, 'IT', 'Елена', 'Козлова', '9988776655', '2020-11-11', 'ГУ МВД по г.Москва', 'ж', '998877665544', '99887766554', '1995-07-07', '2023-02-20', 'Разработчик') ON CONFLICT (e_id) DO NOTHING;
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1006, 'IT', 'Сергей', 'Павлов', '1020304050', '2021-01-01', 'ОВД по г.Новосибирск', 'м', '102030405060', '10203040506', '1998-09-15', '2024-05-01', 'Младший разработчик') ON CONFLICT (e_id) DO NOTHING;
INSERT INTO employees (e_id, d_id, e_fname, e_lname, e_pasp, e_date, e_given, e_gender, e_inn, e_snils, e_born, e_hire, p_name) VALUES (1007, 'HR', 'Мария', 'Васильева', '0011223344', '2019-04-22', 'ОВД по г.Волгоград', 'ж', '001122334455', '00112233445', '1992-12-03', '2023-07-01', 'HR-специалист') ON CONFLICT (e_id) DO NOTHING;

-- Update D_ID_DIR in Departments table after Employees insertion
UPDATE departments SET d_id_dir = 1002 WHERE d_id = 'IT' AND d_id_dir IS NULL;
UPDATE departments SET d_id_dir = 1003 WHERE d_id = 'HR' AND d_id_dir IS NULL;
UPDATE departments SET d_id_dir = 1004 WHERE d_id = 'ACC' AND d_id_dir IS NULL;
UPDATE departments SET d_id_dir = 1001 WHERE d_id = 'MGMT' AND d_id_dir IS NULL;

-- Departments_Phones
INSERT INTO departments_phones (dp_id, dp_phone) VALUES ('IT', '+7 (495) 111-22-33') ON CONFLICT (dp_id, dp_phone) DO NOTHING;
INSERT INTO departments_phones (dp_id, dp_phone) VALUES ('IT', '+7 (495) 111-22-34') ON CONFLICT (dp_id, dp_phone) DO NOTHING;
INSERT INTO departments_phones (dp_id, dp_phone) VALUES ('HR', '+7 (495) 333-44-55') ON CONFLICT (dp_id, dp_phone) DO NOTHING;
INSERT INTO departments_phones (dp_id, dp_phone) VALUES ('ACC', '+7 (495) 666-77-88') ON CONFLICT (dp_id, dp_phone) DO NOTHING;

-- Employees_Addresses
INSERT INTO employees_addresses (ea_id_e, ea_addr) VALUES (1001, 'г. Москва, ул. Ленина, д. 10, кв. 1') ON CONFLICT (ea_id_e, ea_addr) DO NOTHING;
INSERT INTO employees_addresses (ea_id_e, ea_addr) VALUES (1002, 'г. Санкт-Петербург, Невский пр., д. 25, кв. 5') ON CONFLICT (ea_id_e, ea_addr) DO NOTHING;
INSERT INTO employees_addresses (ea_id_e, ea_addr) VALUES (1005, 'г. Москва, ул. Пушкина, д. 15, кв. 3') ON CONFLICT (ea_id_e, ea_addr) DO NOTHING;
INSERT INTO employees_addresses (ea_id_e, ea_addr) VALUES (1006, 'г. Новосибирск, ул. Советская, д. 30, кв. 2') ON CONFLICT (ea_id_e, ea_addr) DO NOTHING;

-- Employees_Education
INSERT INTO employees_education (ee_id_e, ee_type, ee_spec, ee_dip, ee_end, ee_name) VALUES (1001, 5, 'Менеджмент', 'ВШЭ-001', '2002-06-30', 'ВШЭ') ON CONFLICT (ee_id_e, ee_type, ee_end) DO NOTHING;
INSERT INTO employees_education (ee_id_e, ee_type, ee_spec, ee_dip, ee_end, ee_name) VALUES (1002, 5, 'Информатика', 'СПБГУ-002', '2007-06-25', 'СПБГУ') ON CONFLICT (ee_id_e, ee_type, ee_end) DO NOTHING;
INSERT INTO employees_education (ee_id_e, ee_type, ee_spec, ee_dip, ee_end, ee_name) VALUES (1005, 5, 'Программная инженерия', 'МГТУ-003', '2017-06-28', 'МГТУ им. Баумана') ON CONFLICT (ee_id_e, ee_type, ee_end) DO NOTHING;
INSERT INTO employees_education (ee_id_e, ee_type, ee_spec, ee_dip, ee_end, ee_name) VALUES (1006, 3, 'Прикладная информатика', 'КЖТ-001', '2018-06-20', 'Колледж информационных технологий') ON CONFLICT (ee_id_e, ee_type, ee_end) DO NOTHING;

-- Employees_Contacts
INSERT INTO employees_contacts (ec_id_e, ec_type, ec_mean) VALUES (1001, 1, '+79001234567') ON CONFLICT (ec_id_e, ec_type, ec_mean) DO NOTHING;
INSERT INTO employees_contacts (ec_id_e, ec_type, ec_mean) VALUES (1001, 2, 'ivan.petrov@example.com') ON CONFLICT (ec_id_e, ec_type, ec_mean) DO NOTHING;
INSERT INTO employees_contacts (ec_id_e, ec_type, ec_mean) VALUES (1002, 1, '+79109876543') ON CONFLICT (ec_id_e, ec_type, ec_mean) DO NOTHING;
INSERT INTO employees_contacts (ec_id_e, ec_type, ec_mean) VALUES (1003, 2, 'olga.ivanova@example.com') ON CONFLICT (ec_id_e, ec_type, ec_mean) DO NOTHING;
INSERT INTO employees_contacts (ec_id_e, ec_type, ec_mean) VALUES (1005, 3, '@elenakozlova') ON CONFLICT (ec_id_e, ec_type, ec_mean) DO NOTHING;

-- Staffing
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('IT', 'Руководитель отдела IT', 1) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('IT', 'Разработчик', 5) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('IT', 'Младший разработчик', 3) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('HR', 'Руководитель отдела HR', 1) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('HR', 'HR-специалист', 2) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('ACC', 'Бухгалтер', 3) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('MGMT', 'Генеральный директор', 1) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;
INSERT INTO staffing (s_id_d, s_name_p, s_count) VALUES ('MGMT', 'Секретарь', 1) ON CONFLICT (s_id_d, s_name_p) DO NOTHING;

-- Job
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('MGMT', 'Генеральный директор', 1001, '2020-03-01', NULL, 'Приказ о назначении 001') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('IT', 'Руководитель отдела IT', 1002, '2021-06-15', NULL, 'Приказ о назначении 002') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('HR', 'Руководитель отдела HR', 1003, '2022-01-10', NULL, 'Приказ о назначении 003') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('ACC', 'Бухгалтер', 1004, '2020-04-01', NULL, 'Приказ о приеме 004') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('IT', 'Разработчик', 1005, '2023-02-20', NULL, 'Приказ о приеме 005') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('IT', 'Младший разработчик', 1006, '2024-05-01', NULL, 'Приказ о приеме 006') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('HR', 'HR-специалист', 1007, '2023-07-01', NULL, 'Приказ о приеме 007') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;
INSERT INTO job (j_id_d, j_name_p, j_id, j_start, j_end, j_doc) VALUES ('IT', 'Младший разработчик', 1005, '2022-01-01', '2023-02-19', 'Приказ о переводе 008') ON CONFLICT (j_id_d, j_name_p, j_id) DO NOTHING;

-- Absences
INSERT INTO absences (a_id, a_type, a_start, a_end, a_id_e, a_doc) VALUES (1, 1, '2025-07-01', '2025-07-14', 1002, 'Заявление на отпуск №123') ON CONFLICT (a_id) DO NOTHING;
INSERT INTO absences (a_id, a_type, a_start, a_end, a_id_e, a_doc) VALUES (2, 2, '2025-05-20', '2025-05-27', 1004, 'Больничный лист №987') ON CONFLICT (a_id) DO NOTHING;
INSERT INTO absences (a_id, a_type, a_start, a_end, a_id_e, a_doc) VALUES (3, 3, '2025-06-01', '2025-06-05', 1005, 'Приказ о командировке №456') ON CONFLICT (a_id) DO NOTHING;
INSERT INTO absences (a_id, a_type, a_start, a_end, a_id_e, a_doc) VALUES (4, 1, '2024-08-01', '2024-08-14', 1001, 'Заявление на отпуск №124') ON CONFLICT (a_id) DO NOTHING;
INSERT INTO absences (a_id, a_type, a_start, a_end, a_id_e, a_doc) VALUES (5, 2, '2025-05-20', NULL, 1003, 'Больничный лист №999 (действует)') ON CONFLICT (a_id) DO NOTHING;

-- *****************************************************************************
-- Views
-- *****************************************************************************

-- 1. employee_personal_data - Личные данные сотрудника
CREATE OR REPLACE VIEW employee_personal_data AS
SELECT
    e.e_id,
    e.e_fname,
    e.e_lname,
    e.e_pasp,
    e.e_date AS passport_issue_date,
    e.e_given AS passport_issued_by,
    e.e_gender,
    e.e_inn,
    e.e_snils,
    e.e_born AS birth_date,
    e.e_hire AS hire_date,
    d.d_name AS department_name,
    p.p_name AS position_name,
    ea.ea_addr AS address,
    STRING_AGG(DISTINCT ec.ec_mean || ' (' || ect.ect_type || ')', '; ') AS contacts,
    STRING_AGG(DISTINCT eet.eet_name || ': ' || ee.ee_name || ' (' || ee.ee_end || ')', '; ') AS education_details
FROM
    employees e
JOIN
    departments d ON e.d_id = d.d_id
JOIN
    positions p ON e.p_name = p.p_name
LEFT JOIN
    employees_addresses ea ON e.e_id = ea.ea_id_e
LEFT JOIN
    employees_contacts ec ON e.e_id = ec.ec_id_e
LEFT JOIN
    employees_contacts_types ect ON ec.ec_type = ect.ect_id
LEFT JOIN
    employees_education ee ON e.e_id = ee.ee_id_e
LEFT JOIN
    employees_education_types eet ON ee.ee_type = eet.eet_id
GROUP BY
    e.e_id, d.d_name, p.p_name, ea.ea_addr
ORDER BY e.e_id;


-- 2. hr_employee_data - Данные сотрудников для HR-отдела
CREATE OR REPLACE VIEW hr_employee_data AS
SELECT
    e.e_id,
    e.e_fname,
    e.e_lname,
    e.e_gender,
    e.e_born AS birth_date,
    e.e_hire AS hire_date,
    d.d_name AS department_name,
    p.p_name AS current_position,
    p.p_sal AS current_salary,
    STRING_AGG(DISTINCT j.j_name_p || ' в ' || j.j_id_d || ' с ' || j.j_start || ' по ' || COALESCE(j.j_end::VARCHAR, 'наст. вр.'), '; ') AS job_history,
    STRING_AGG(DISTINCT at.at_type || ' с ' || a.a_start || ' по ' || COALESCE(a.a_end::VARCHAR, 'наст. вр.'), '; ') AS absence_records
FROM
    employees e
LEFT JOIN
    departments d ON e.d_id = d.d_id
LEFT JOIN
    positions p ON e.p_name = p.p_name
LEFT JOIN
    job j ON e.e_id = j.j_id
LEFT JOIN
    absences a ON e.e_id = a.a_id_e
LEFT JOIN
    absences_types at ON a.a_type = at.at_id
GROUP BY
    e.e_id, d.d_name, p.p_name, e.e_fname, e.e_lname, e.e_gender, e.e_born, e.e_hire, p.p_sal
ORDER BY e.e_id;


-- 3. department_employees - Сотрудники отдела
CREATE OR REPLACE VIEW department_employees AS
SELECT
    d.d_id AS department_id,
    d.d_name AS department_name,
    e.e_id AS employee_id,
    e.e_fname,
    e.e_lname,
    p.p_name AS position
FROM
    departments d
JOIN
    employees e ON d.d_id = e.d_id
JOIN
    positions p ON e.p_name = p.p_name
ORDER BY
    d.d_name, e.e_lname, e.e_fname;


-- 4. department_staffing - Штат отделов
CREATE OR REPLACE VIEW department_staffing AS
SELECT
    d.d_id AS department_id,
    d.d_name AS department_name,
    p.p_name AS position_name,
    s.s_count AS required_count,
    COUNT(e.e_id) FILTER (WHERE e.e_id IS NOT NULL) AS actual_count -- Количество фактически занятых мест
FROM
    departments d
JOIN
    staffing s ON d.d_id = s.s_id_d
JOIN
    positions p ON s.s_name_p = p.p_name
LEFT JOIN
    employees e ON e.d_id = d.d_id AND e.p_name = p.p_name
GROUP BY
    d.d_id, d.d_name, p.p_name, s.s_count
ORDER BY
    d.d_name, p.p_name;


-- 5. positions_staffing - Штат по должностям
CREATE OR REPLACE VIEW positions_staffing AS
SELECT
    p.p_name AS position_name,
    p.p_sal AS salary,
    SUM(s.s_count) AS total_required_count,
    COUNT(e.e_id) AS total_actual_employees,
    SUM(p.p_sal * s.s_count) AS estimated_payroll_cost
FROM
    positions p
LEFT JOIN
    staffing s ON p.p_name = s.s_name_p
LEFT JOIN
    employees e ON p.p_name = e.p_name
GROUP BY
    p.p_name, p.p_sal
ORDER BY
    p.p_name;


-- 6. employee_department_status - Статус сотрудника в отделе
CREATE OR REPLACE VIEW employee_department_status AS
SELECT
    e.e_id,
    e.e_fname,
    e.e_lname,
    d.d_name AS department_name,
    p.p_name AS position_name,
    e.e_hire AS hire_date,
    COALESCE(MAX(j.j_end), e.e_hire) AS last_job_end_date,
    (CASE WHEN e.e_id NOT IN (SELECT DISTINCT j_id FROM job WHERE j_end IS NULL) THEN 'Уволен' ELSE 'Активен' END) AS current_status
FROM
    employees e
JOIN
    departments d ON e.d_id = d.d_id
JOIN
    positions p ON e.p_name = p.p_name
LEFT JOIN
    job j ON e.e_id = j.j_id
GROUP BY
    e.e_id, e.e_fname, e.e_lname, d.d_name, p.p_name, e.e_hire
ORDER BY
    d.d_name, e.e_lname, e.e_fname;


-- 7. position_salary_distribution - Распределение зарплат по должностям
CREATE OR REPLACE VIEW position_salary_distribution AS
SELECT
    p.p_name AS position_name,
    p.p_sal AS standard_salary,
    p.p_sal AS min_employee_salary, -- Assuming p_sal is the standard, min/max would be actual if employee table had salary
    p.p_sal AS max_employee_salary, -- Assuming p_sal is the standard
    COUNT(e.e_id) AS number_of_employees
FROM
    positions p
LEFT JOIN
    employees e ON p.p_name = e.p_name
GROUP BY
    p.p_name, p.p_sal
ORDER BY
    p.p_name;


-- 8. employee_transfer_history - История переводов сотрудников
CREATE OR REPLACE VIEW employee_transfer_history AS
SELECT
    e.e_id AS employee_id,
    e.e_fname,
    e.e_lname,
    j.j_id_d AS department_id,
    d.d_name AS department_name,
    j.j_name_p AS position_name,
    j.j_start AS start_date,
    j.j_end AS end_date,
    j.j_doc AS document_info
FROM
    job j
JOIN
    employees e ON j.j_id = e.e_id
LEFT JOIN
    departments d ON j.j_id_d = d.d_id
ORDER BY
    e.e_id, j.j_start;