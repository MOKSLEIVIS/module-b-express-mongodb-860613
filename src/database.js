require('dotenv').config();

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 50
});

process.on('exit', () => {
    pool.end();
});

async function insertPlaceData(name, address, latitude, longitude, description, rating, created_at) {
    const client = await pool.connect();

    try {
        await client.query(`INSERT INTO place (name, address, latitude, longitude, description, rating, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7)`, [name, address, latitude, longitude, description, rating, created_at]);
    } catch (err) {
        console.log(err);
    } finally {
        client.release();
    }
};

async function fetchPlaceById(id) {
    const client = await pool.connect();

    try {
        const res = await client.query(`SELECT * FROM place WHERE id = $1`, [id]);

        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (err) {
        console.log(err);

        return null;
    } finally {
        client.release();
    }
};

async function fetchPlaceWithFilters(q, rating_from, rating_to, sort_by, per_page, page) {
    const client = await pool.connect();

    try {
        let sortBy;

        if (sort_by === 'popularity' || sort_by === 'rating_desc') sortBy = 'ORDER BY rating DESC';

        if (sort_by === 'rating_asc') sortBy = 'ORDER BY rating ASC';

        if (sort_by === 'newest') sortBy = 'ORDER BY created_at DESC';

        let perPage = per_page || 15;
        let page2 = page * perPage || 0;

        const res = await client.query(`SELECT * FROM place ${q ? `WHERE LOWER(name) LIKE LOWER('%${q}%')` : ``} ${rating_from ? `${q ? 'AND' : 'WHERE'}  rating >= ${rating_from}` : ``} ${rating_to ? `${rating_from ? 'AND' : 'WHERE'} rating <= ${rating_to}` : ``} ${sort_by ? sortBy : ``} LIMIT ${perPage} OFFSET ${page2}`, []);

        return res.rows.length > 0 ? res.rows : null;
    } catch (err) {
        console.log(err);

        return null;
    } finally {
        client.release();
    }
};

async function fetchNearestPlacesWithFilters(latitude, longtitude, radius, category) {
    const client = await pool.connect();

    try {
        const res = await client.query(`SELECT * FROM place ${category ? `WHERE LOWER(description) LIKE LOWER('%${category}%')` : ``} ${latitude ? `ORDER BY abs(latitude - ${latitude})` : ``}${longtitude ? `${latitude ? ', ' : 'ORDER BY '}abs(longitude - ${longtitude})` : ``} LIMIT 1`, []);

        return res.rows.length > 0 ? res.rows[0] : null;
    } catch (err) {
        console.log(err);

        return null;
    } finally {
        client.release();
    }
};

async function insertReview(id, username, comment, rating) {
    const client = await pool.connect();

    try {
        const created_at = new Date().toUTCString();

        await client.query(`INSERT INTO review (place_id, user_name, comment, rating, created_at) VALUES ($1, $2, $3, $4, $5)`, [id, username, comment, rating, created_at]);

        return true;
    } catch (err) {
        console.log(err);

        return false;
    } finally {
        client.release();
    }
};

async function fetchPlaceReviewsById(id) {
    const client = await pool.connect();

    try {
        const res = await client.query(`SELECT * FROM review WHERE place_id = $1`, [id]);

        return res.rows.length > 0 ? res.rows : null;
    } catch (err) {
        console.log(err);

        return null;
    } finally {
        client.release();
    }
};

module.exports = { insertPlaceData, fetchPlaceById, fetchPlaceWithFilters, fetchNearestPlacesWithFilters, insertReview, fetchPlaceReviewsById };