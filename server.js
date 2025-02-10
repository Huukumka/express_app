const express = require('express');
const { Pool } = require("pg");
const cors = require("cors");

const port = 5555;  


const app = express();
app.use(cors());

// Подключение к базе данных postgres
// const pool = new Pool({
//     user: "postgres",
//     host: "localhost", //95.174.95.144 - sbercloud
//     database: "app",
//     password: "qwerty",
//     port: 5432, // Порт PostgreSQL
//   });

const pool = new Pool({
    user: "postgres",         // Замените на имя пользователя Cloud.ru
    host: "95.174.95.144",        // Замените на адрес сервера Cloud.ru
    database: "app",     // Замените на имя базы данных Cloud.ru
    password: "qwerty",   // Замените на пароль Cloud.ru
    port: 5432,                         // Порт PostgreSQL (проверьте в Cloud.ru)
    ssl: {
        rejectUnauthorized: false // Внимание: не рекомендуется для production, лучше настроить доверенный сертификат
        }
    });



// Тестовый запрос для проверки подключения
pool.query('SELECT 1').then(() => {
    console.log('Успешное подключение к базе данных');
  }).catch(err => {
    console.error('Ошибка подключения к базе данных:', err);
  });



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get("/api/employees/entries", async (req, res) => {
    const selectedDate = req.query.date;
    try {
      const query = `
      SELECT
        ete.id AS entry_id,
        e.id AS employee_id,
        ete.entry,
        e.surname || ' ' || SUBSTR(e.name, 1, 1) || '.' || SUBSTR(e.patronymic, 1, 1) AS fio,
        TO_CHAR(ete.entry, 'DD.MM.YY') AS entry_date,
        TO_CHAR(ete.entry, 'HH24:MI') AS entry_time,
        TO_CHAR(ete."exit", 'HH24:MI') AS exit_time,
        ROUND((EXTRACT(EPOCH FROM (ete."exit" - ete.entry)) / 3600)::numeric, 2) AS hours_worked,
        ep.id AS photoId,  -- Include ep.id to get the photo id
        CASE
          WHEN ep.photo IS NOT NULL THEN encode(ep.photo, 'base64')
          ELSE NULL
        END AS photo  -- Include ep.photo encoded or NULL
      FROM
        employees e
      INNER JOIN
        employee_time_entries ete ON e.id = ete.employees_id
      LEFT JOIN
        employee_photos ep ON e.id = ep.id_employee   -- Correct JOIN condition
        WHERE
        DATE(ete.entry) = $1
      ORDER BY
      entry_id DESC;
      `;
      const result = await pool.query(query, [selectedDate]);
      res.json(result.rows);
    } catch (error) {
      console.error("Error in /api/employees/entries:", error);
      res.status(500).json({ error: "Ошибка на сервере" });
    }
  });

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})