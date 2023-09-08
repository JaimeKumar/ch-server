const express = require('express');
const app = express();
const { Client } = require('pg');
const dotenv = require('dotenv');
const bodyParser = require("body-parser");
const cors = require("cors");
dotenv.config({path: './server/.env'});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public'));

const getClient = () => {
    return new Client({
        user: process.env.PGUSER,
        host: process.env.PGHOST,
        database: process.env.PGDATABASE,
        password: process.env.PGPASSWORD,
        port: process.env.PGPORT,
        ssl: true
    })
};

app.post('/book', async (req, res) => {
  const { name, number, time, email } = req.body;

  try {
    const query = `
      INSERT INTO public.appointments(name, number, timeslot, email)
      VALUES ($1, $2, $3, $4)
      RETURNING *;`;

    const client = getClient();
    await client.connect();
    const result = await client.query(query, [name, number, time, email]);
    await client.end();
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/getBookings', async (req, res) => {
  const {name, pw, auth} = req.body;
  if (name !== process.env.ADMINUSER && !auth) {
    res.status(500).json({error: 'name'})
  } else if (pw !== process.env.ADMINPW && !auth) {
    res.status(500).json({error: 'pw'})
  } else {
    try {
        const query = `SELECT * FROM public.appointments;`;
        let client = getClient();
        await client.connect();
        const result = await client.query(query);
        await client.end();
        res.status(201).json(result.rows);
      } catch (err) {
        res.status(500).json({error: 'Internal server error'});
      }
  }
})

app.post('/deleteBooking', async (req, res) => {
  let id = req.body.id;
  try {
    const deletequery = `
    DELETE FROM public.appointments
    WHERE id = ${id};
    `;
    const retrievequery = `SELECT * FROM public.appointments;`;

    let client = getClient();
    await client.connect();
    await client.query(deletequery);
    const result = await client.query(retrievequery);
    await client.end();
    res.status(201).json(result.rows);
  } catch (err) {
    res.status(500).json({error: 'Internal server error'});
  }
})

app.listen(process.env.PORT || 4000, () => {
    console.log("server is listen");
});