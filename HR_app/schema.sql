CREATE TABLE Employees_Education_Types (
    EET_ID NUMERIC(1) PRIMARY KEY,
    EET_NAME VARCHAR(50) NOT NULL
);
CREATE TABLE Employees_Contacts_Types (
    ECT_ID NUMERIC(1) PRIMARY KEY,
    ECT_TYPE VARCHAR(50) NOT NULL
);
CREATE TABLE Absences_Types (
    AT_ID NUMERIC(1) PRIMARY KEY,
    AT_TYPE VARCHAR(20) NOT NULL
);
CREATE TABLE Departments (
    D_ID VARCHAR(12) PRIMARY KEY,
    D_NAME VARCHAR(100) NOT NULL,
    D_ID_DIR NUMERIC(4)  -- Foreign key to be added after Employees table
);
CREATE TABLE Departments_Phones (
    DP_ID VARCHAR(12) NOT NULL,
    DP_PHONE VARCHAR(40) NOT NULL,
    PRIMARY KEY (DP_ID, DP_PHONE),
    FOREIGN KEY (DP_ID) REFERENCES Departments(D_ID)
);
CREATE TABLE Positions (
    P_NAME VARCHAR(100) PRIMARY KEY,
    P_SAL NUMERIC(10, 2) NOT NULL CHECK (P_SAL > 0)
);
CREATE TABLE Employees (
    E_ID NUMERIC(4) PRIMARY KEY,
    D_ID VARCHAR(12) NOT NULL,
    E_FNAME VARCHAR(50) NOT NULL,
    E_LNAME VARCHAR(50) NOT NULL,
    E_PASP CHAR(10) NOT NULL UNIQUE,
    E_DATE DATE NOT NULL,
    E_GIVEN VARCHAR(50) NOT NULL,
    E_GENDER CHAR(1) NOT NULL CHECK (E_GENDER IN ('м', 'ж')),
    E_INN CHAR(12) NOT NULL UNIQUE,
    E_SNILS CHAR(11) NOT NULL UNIQUE,
    E_BORN DATE NOT NULL CHECK (E_BORN < CURRENT_DATE - INTERVAL '16 years'),
    E_HIRE DATE NOT NULL CHECK (E_HIRE <= CURRENT_DATE),
    P_NAME VARCHAR(100) NOT NULL,
    FOREIGN KEY (D_ID) REFERENCES Departments(D_ID),
    FOREIGN KEY (P_NAME) REFERENCES Positions(P_NAME)
);
ALTER TABLE Departments
ADD FOREIGN KEY (D_ID_DIR) REFERENCES Employees(E_ID);
CREATE TABLE Employees_Addresses (
    EA_ID_E NUMERIC(4) NOT NULL,
    EA_ADDR VARCHAR(100) NOT NULL,
    PRIMARY KEY (EA_ID_E, EA_ADDR),
    FOREIGN KEY (EA_ID_E) REFERENCES Employees(E_ID)
);
CREATE TABLE Employees_Education (
    EE_ID_E NUMERIC(4) NOT NULL,
    EE_TYPE NUMERIC(1) NOT NULL,
    EE_SPEC VARCHAR(100),
    EE_DIP CHAR(50),
    EE_END DATE NOT NULL CHECK (EE_END <= CURRENT_DATE),
    EE_NAME VARCHAR(100) NOT NULL,
    PRIMARY KEY (EE_ID_E, EE_TYPE, EE_END),
    FOREIGN KEY (EE_ID_E) REFERENCES Employees(E_ID),
    FOREIGN KEY (EE_TYPE) REFERENCES Employees_Education_Types(EET_ID)
);
CREATE TABLE Employees_Contacts (
    EC_ID_E NUMERIC(4) NOT NULL,
    EC_TYPE NUMERIC(1) NOT NULL,
    EC_MEAN VARCHAR(50) NOT NULL,
    PRIMARY KEY (EC_ID_E, EC_TYPE, EC_MEAN),
    FOREIGN KEY (EC_ID_E) REFERENCES Employees(E_ID),
    FOREIGN KEY (EC_TYPE) REFERENCES Employees_Contacts_Types(ECT_ID)
);
CREATE TABLE Staffing (
    S_ID_D VARCHAR(12) NOT NULL,
    S_NAME_P VARCHAR(100) NOT NULL,
    S_COUNT NUMERIC(4) NOT NULL CHECK (S_COUNT >= 0),
    PRIMARY KEY (S_ID_D, S_NAME_P),
    FOREIGN KEY (S_ID_D) REFERENCES Departments(D_ID),
    FOREIGN KEY (S_NAME_P) REFERENCES Positions(P_NAME)
);
CREATE TABLE Absences (
    A_ID NUMERIC(10) PRIMARY KEY,
    A_TYPE NUMERIC(1) NOT NULL,
    A_START DATE NOT NULL,
    A_END DATE,
    A_ID_E NUMERIC(4) NOT NULL,
    A_DOC VARCHAR(200) NOT NULL,
    FOREIGN KEY (A_TYPE) REFERENCES Absences_Types(AT_ID),
    FOREIGN KEY (A_ID_E) REFERENCES Employees(E_ID),
    CHECK (A_END IS NULL OR A_END > A_START)
);
-- Creating table for "Job"
CREATE TABLE Job (
    J_ID_D VARCHAR(12) NOT NULL,
    J_NAME_P VARCHAR(100) NOT NULL,
    J_ID NUMERIC(4) NOT NULL,
    J_START DATE NOT NULL,
    J_END DATE,
    J_DOC VARCHAR(200) NOT NULL,
    PRIMARY KEY (J_ID_D, J_NAME_P, J_ID),
    FOREIGN KEY (J_ID_D, J_NAME_P) REFERENCES Staffing(S_ID_D, S_NAME_P),
    FOREIGN KEY (J_ID) REFERENCES Employees(E_ID),
    CHECK (J_END IS NULL OR J_END > J_START)
);


-- INSERTS TESTS!!!!!
-- Вставка данных в таблицу "Типы образования сотрудников" (Employees_Education_Types)
INSERT INTO Employees_Education_Types (EET_ID, EET_NAME) VALUES (1, 'начальное') ON CONFLICT (EET_ID) DO NOTHING;
INSERT INTO Employees_Education_Types (EET_ID, EET_NAME) VALUES (2, 'среднее') ON CONFLICT (EET_ID) DO NOTHING;
INSERT INTO Employees_Education_Types (EET_ID, EET_NAME) VALUES (3, 'среднее специальное') ON CONFLICT (EET_ID) DO NOTHING;
INSERT INTO Employees_Education_Types (EET_ID, EET_NAME) VALUES (4, 'среднее профессиональное') ON CONFLICT (EET_ID) DO NOTHING;
INSERT INTO Employees_Education_Types (EET_ID, EET_NAME) VALUES (5, 'высшее') ON CONFLICT (EET_ID) DO NOTHING;

-- Вставка данных в таблицу "Типы контактов сотрудников" (Employees_Contacts_Types)
INSERT INTO Employees_Contacts_Types (ECT_ID, ECT_TYPE) VALUES (1, 'телефон') ON CONFLICT (ECT_ID) DO NOTHING;
INSERT INTO Employees_Contacts_Types (ECT_ID, ECT_TYPE) VALUES (2, 'email') ON CONFLICT (ECT_ID) DO NOTHING;
INSERT INTO Employees_Contacts_Types (ECT_ID, ECT_TYPE) VALUES (3, 'мессенджер') ON CONFLICT (ECT_ID) DO NOTHING;
INSERT INTO Employees_Contacts_Types (ECT_ID, ECT_TYPE) VALUES (4, 'соцсети') ON CONFLICT (ECT_ID) DO NOTHING;

-- Вставка данных в таблицу "Типы отсутствий" (Absences_Types)
INSERT INTO Absences_Types (AT_ID, AT_TYPE) VALUES (1, 'отпуск') ON CONFLICT (AT_ID) DO NOTHING;
INSERT INTO Absences_Types (AT_ID, AT_TYPE) VALUES (2, 'больничный') ON CONFLICT (AT_ID) DO NOTHING;
INSERT INTO Absences_Types (AT_ID, AT_TYPE) VALUES (3, 'командировка') ON CONFLICT (AT_ID) DO NOTHING;
INSERT INTO Absences_Types (AT_ID, AT_TYPE) VALUES (4, 'учебный отпуск') ON CONFLICT (AT_ID) DO NOTHING;
INSERT INTO Absences_Types (AT_ID, AT_TYPE) VALUES (5, 'отгул') ON CONFLICT (AT_ID) DO NOTHING;

-- Вставка данных в таблицу "Должности" (Positions)
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Генеральный директор', 150000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Руководитель отдела IT', 100000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Руководитель отдела HR', 95000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Бухгалтер', 60000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Разработчик', 80000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Младший разработчик', 50000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('HR-специалист', 70000.00) ON CONFLICT (P_NAME) DO NOTHING;
INSERT INTO Positions (P_NAME, P_SAL) VALUES ('Секретарь', 45000.00) ON CONFLICT (P_NAME) DO NOTHING;

-- Вставка данных в таблицу "Отделы" (Departments)
INSERT INTO Departments (D_ID, D_NAME, D_ID_DIR) VALUES ('IT', 'Отдел информационных технологий', NULL) ON CONFLICT (D_ID) DO NOTHING;
INSERT INTO Departments (D_ID, D_NAME, D_ID_DIR) VALUES ('HR', 'Отдел кадров', NULL) ON CONFLICT (D_ID) DO NOTHING;
INSERT INTO Departments (D_ID, D_NAME, D_ID_DIR) VALUES ('ACC', 'Бухгалтерия', NULL) ON CONFLICT (D_ID) DO NOTHING;
INSERT INTO Departments (D_ID, D_NAME, D_ID_DIR) VALUES ('MGMT', 'Руководство', NULL) ON CONFLICT (D_ID) DO NOTHING;

-- Вставка данных в таблицу "Сотрудники" (Employees)
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1001, 'MGMT', 'Иван', 'Петров', '1234567890', '2010-01-15', 'ОВД по г.Москва', 'м', '123456789012', '12345678901', '1980-05-10', '2020-03-01', 'Генеральный директор') ON CONFLICT (E_ID) DO NOTHING;
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1002, 'IT', 'Анна', 'Смирнова', '0987654321', '2012-03-20', 'ОВД г.Санкт-Петербург', 'ж', '098765432109', '98765432109', '1985-11-22', '2021-06-15', 'Руководитель отдела IT') ON CONFLICT (E_ID) DO NOTHING;
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1003, 'HR', 'Ольга', 'Иванова', '1122334455', '2015-07-01', 'ОВД по г.Казань', 'ж', '112233445566', '11223344556', '1990-01-01', '2022-01-10', 'Руководитель отдела HR') ON CONFLICT (E_ID) DO NOTHING;
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1004, 'ACC', 'Дмитрий', 'Сидоров', '5566778899', '2018-09-05', 'ОВД г.Екатеринбург', 'м', '556677889900', '55667788990', '1988-03-25', '2020-04-01', 'Бухгалтер') ON CONFLICT (E_ID) DO NOTHING;
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1005, 'IT', 'Елена', 'Козлова', '9988776655', '2020-11-11', 'ГУ МВД по г.Москва', 'ж', '998877665544', '99887766554', '1995-07-07', '2023-02-20', 'Разработчик') ON CONFLICT (E_ID) DO NOTHING;
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1006, 'IT', 'Сергей', 'Павлов', '1020304050', '2021-01-01', 'ОВД по г.Новосибирск', 'м', '102030405060', '10203040506', '1998-09-15', '2024-05-01', 'Младший разработчик') ON CONFLICT (E_ID) DO NOTHING;
INSERT INTO Employees (E_ID, D_ID, E_FNAME, E_LNAME, E_PASP, E_DATE, E_GIVEN, E_GENDER, E_INN, E_SNILS, E_BORN, E_HIRE, P_NAME) VALUES (1007, 'HR', 'Мария', 'Васильева', '0011223344', '2019-04-22', 'ОВД по г.Волгоград', 'ж', '001122334455', '00112233445', '1992-12-03', '2023-07-01', 'HR-специалист') ON CONFLICT (E_ID) DO NOTHING;

-- Обновление D_ID_DIR в таблице Departments после вставки сотрудников
UPDATE Departments SET D_ID_DIR = 1002 WHERE D_ID = 'IT' AND D_ID_DIR IS NULL;
UPDATE Departments SET D_ID_DIR = 1003 WHERE D_ID = 'HR' AND D_ID_DIR IS NULL;
UPDATE Departments SET D_ID_DIR = 1004 WHERE D_ID = 'ACC' AND D_ID_DIR IS NULL;
UPDATE Departments SET D_ID_DIR = 1001 WHERE D_ID = 'MGMT' AND D_ID_DIR IS NULL;

-- Вставка данных в таблицу "Телефоны отделов" (Departments_Phones)
INSERT INTO Departments_Phones (DP_ID, DP_PHONE) VALUES ('IT', '+7 (495) 111-22-33') ON CONFLICT (DP_ID, DP_PHONE) DO NOTHING;
INSERT INTO Departments_Phones (DP_ID, DP_PHONE) VALUES ('IT', '+7 (495) 111-22-34') ON CONFLICT (DP_ID, DP_PHONE) DO NOTHING;
INSERT INTO Departments_Phones (DP_ID, DP_PHONE) VALUES ('HR', '+7 (495) 333-44-55') ON CONFLICT (DP_ID, DP_PHONE) DO NOTHING;
INSERT INTO Departments_Phones (DP_ID, DP_PHONE) VALUES ('ACC', '+7 (495) 666-77-88') ON CONFLICT (DP_ID, DP_PHONE) DO NOTHING;

-- Вставка данных в таблицу "Адреса сотрудников" (Employees_Addresses)
INSERT INTO Employees_Addresses (EA_ID_E, EA_ADDR) VALUES (1001, 'г. Москва, ул. Ленина, д. 10, кв. 1') ON CONFLICT (EA_ID_E, EA_ADDR) DO NOTHING;
INSERT INTO Employees_Addresses (EA_ID_E, EA_ADDR) VALUES (1002, 'г. Санкт-Петербург, Невский пр., д. 25, кв. 5') ON CONFLICT (EA_ID_E, EA_ADDR) DO NOTHING;
INSERT INTO Employees_Addresses (EA_ID_E, EA_ADDR) VALUES (1005, 'г. Москва, ул. Пушкина, д. 15, кв. 3') ON CONFLICT (EA_ID_E, EA_ADDR) DO NOTHING;
INSERT INTO Employees_Addresses (EA_ID_E, EA_ADDR) VALUES (1006, 'г. Новосибирск, ул. Советская, д. 30, кв. 2') ON CONFLICT (EA_ID_E, EA_ADDR) DO NOTHING;

-- Вставка данных в таблицу "Образование сотрудников" (Employees_Education)
INSERT INTO Employees_Education (EE_ID_E, EE_TYPE, EE_SPEC, EE_DIP, EE_END, EE_NAME) VALUES (1001, 5, 'Менеджмент', 'ВШЭ-001', '2002-06-30', 'ВШЭ') ON CONFLICT (EE_ID_E, EE_TYPE, EE_END) DO NOTHING;
INSERT INTO Employees_Education (EE_ID_E, EE_TYPE, EE_SPEC, EE_DIP, EE_END, EE_NAME) VALUES (1002, 5, 'Информатика', 'СПБГУ-002', '2007-06-25', 'СПБГУ') ON CONFLICT (EE_ID_E, EE_TYPE, EE_END) DO NOTHING;
INSERT INTO Employees_Education (EE_ID_E, EE_TYPE, EE_SPEC, EE_DIP, EE_END, EE_NAME) VALUES (1005, 5, 'Программная инженерия', 'МГТУ-003', '2017-06-28', 'МГТУ им. Баумана') ON CONFLICT (EE_ID_E, EE_TYPE, EE_END) DO NOTHING;
INSERT INTO Employees_Education (EE_ID_E, EE_TYPE, EE_SPEC, EE_DIP, EE_END, EE_NAME) VALUES (1006, 3, 'Прикладная информатика', 'КЖТ-001', '2018-06-20', 'Колледж информационных технологий') ON CONFLICT (EE_ID_E, EE_TYPE, EE_END) DO NOTHING;

-- Вставка данных в таблицу "Контактные данные сотрудников" (Employees_Contacts)
INSERT INTO Employees_Contacts (EC_ID_E, EC_TYPE, EC_MEAN) VALUES (1001, 1, '+79001234567') ON CONFLICT (EC_ID_E, EC_TYPE, EC_MEAN) DO NOTHING;
INSERT INTO Employees_Contacts (EC_ID_E, EC_TYPE, EC_MEAN) VALUES (1001, 2, 'ivan.petrov@example.com') ON CONFLICT (EC_ID_E, EC_TYPE, EC_MEAN) DO NOTHING; -- Эта строка уже была, я её повторил для ясности
INSERT INTO Employees_Contacts (EC_ID_E, EC_TYPE, EC_MEAN) VALUES (1002, 1, '+79109876543') ON CONFLICT (EC_ID_E, EC_TYPE, EC_MEAN) DO NOTHING;
INSERT INTO Employees_Contacts (EC_ID_E, EC_TYPE, EC_MEAN) VALUES (1003, 2, 'olga.ivanova@example.com') ON CONFLICT (EC_ID_E, EC_TYPE, EC_MEAN) DO NOTHING;
INSERT INTO Employees_Contacts (EC_ID_E, EC_TYPE, EC_MEAN) VALUES (1005, 3, '@elenakozlova') ON CONFLICT (EC_ID_E, EC_TYPE, EC_MEAN) DO NOTHING;

-- Вставка данных в таблицу "Штатное расписание" (Staffing)
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('IT', 'Руководитель отдела IT', 1) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('IT', 'Разработчик', 5) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('IT', 'Младший разработчик', 3) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('HR', 'Руководитель отдела HR', 1) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('HR', 'HR-специалист', 2) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('ACC', 'Бухгалтер', 3) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('MGMT', 'Генеральный директор', 1) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;
INSERT INTO Staffing (S_ID_D, S_NAME_P, S_COUNT) VALUES ('MGMT', 'Секретарь', 1) ON CONFLICT (S_ID_D, S_NAME_P) DO NOTHING;

-- Вставка данных в таблицу "Работа (история должностей)" (Job)
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('MGMT', 'Генеральный директор', 1001, '2020-03-01', NULL, 'Приказ о назначении 001') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('IT', 'Руководитель отдела IT', 1002, '2021-06-15', NULL, 'Приказ о назначении 002') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('HR', 'Руководитель отдела HR', 1003, '2022-01-10', NULL, 'Приказ о назначении 003') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('ACC', 'Бухгалтер', 1004, '2020-04-01', NULL, 'Приказ о приеме 004') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('IT', 'Разработчик', 1005, '2023-02-20', NULL, 'Приказ о приеме 005') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('IT', 'Младший разработчик', 1006, '2024-05-01', NULL, 'Приказ о приеме 006') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('HR', 'HR-специалист', 1007, '2023-07-01', NULL, 'Приказ о приеме 007') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;
INSERT INTO Job (J_ID_D, J_NAME_P, J_ID, J_START, J_END, J_DOC) VALUES ('IT', 'Младший разработчик', 1005, '2022-01-01', '2023-02-19', 'Приказ о переводе 008') ON CONFLICT (J_ID_D, J_NAME_P, J_ID) DO NOTHING;

-- Вставка данных в таблицу "Периоды отсутствия" (Absences)
INSERT INTO Absences (A_ID, A_TYPE, A_START, A_END, A_ID_E, A_DOC) VALUES (1, 1, '2025-07-01', '2025-07-14', 1002, 'Заявление на отпуск №123') ON CONFLICT (A_ID) DO NOTHING;
INSERT INTO Absences (A_ID, A_TYPE, A_START, A_END, A_ID_E, A_DOC) VALUES (2, 2, '2025-05-20', '2025-05-27', 1004, 'Больничный лист №987') ON CONFLICT (A_ID) DO NOTHING;
INSERT INTO Absences (A_ID, A_TYPE, A_START, A_END, A_ID_E, A_DOC) VALUES (3, 3, '2025-06-01', '2025-06-05', 1005, 'Приказ о командировке №456') ON CONFLICT (A_ID) DO NOTHING;
INSERT INTO Absences (A_ID, A_TYPE, A_START, A_END, A_ID_E, A_DOC) VALUES (4, 1, '2024-08-01', '2024-08-14', 1001, 'Заявление на отпуск №124') ON CONFLICT (A_ID) DO NOTHING;
INSERT INTO Absences (A_ID, A_TYPE, A_START, A_END, A_ID_E, A_DOC) VALUES (5, 2, '2025-05-20', NULL, 1003, 'Больничный лист №999 (действует)') ON CONFLICT (A_ID) DO NOTHING;