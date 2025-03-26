const express = require('express');
const router = express.Router();
const { fetchPlaceById, fetchPlaceWithFilters, insertReview, fetchPlaceReviewsById, fetchNearestPlacesWithFilters } = require('../../../../database');

router.get('/', async (req, res) => {
    try {
        const { q, rating_from, rating_to, sort_by, per_page, page } = req.query;

        const query = await fetchPlaceWithFilters(q, rating_from, rating_to, sort_by, per_page, page);

        if (query === null) return res.status(404).send({ error: `No data` });

        const resp = {
            total: query.length,
            per_page: per_page ? per_page : 15,
            current_page: page ? page : 1,
            data: query.map((item) => ({
                id : item.id,
                name: item.name,
                address: item.address,
                latitude: item.latitude,
                longitude: item.longitude,
                rating: item.rating
            }))
        };

        return res.status(200).send(resp);
    } catch (err) {
        console.log(err);

        return res.status(500).send({ error: `Internal server error` });
    }
});

router.get('/nearby', async (req, res) => {
    try {
        const { latitude, longitude, radius, category } = req.query;

        if (!latitude || latitude === null) return res.status(400).send({ error: `Missing latitude` });

        if (!longitude || longitude === null) return res.status(400).send({ error: 'Missing longitude' });

        const query = await fetchNearestPlacesWithFilters(latitude, longitude, radius, category);

        if (query === null) return res.status(404).send({ error: `Lankytina vieta neegzistuoja` });

        const resp = {
            id: query.id,
            name: query.name,
            address: query.address,
            latitude: query.latitude,
            longitude: query.longitude,
            rating: query.rating
        };

        res.status(200).send(resp);
    } catch (err) {
        console.log(err);

        return res.status(500).send({ error: `Internal server error` });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        if (!id || id === null || id === undefined) return res.status(404).send({ error: `Lankytina vieta neegzistuoja` });

        const query = await fetchPlaceById(id);

        if (query === null) return res.status(404).send({ error: `Lankytina vieta neegzistuoja` });

        const resp = {
            id: query.id,
            name: query.name,
            address: query.address,
            latitude: query.latitude,
            longitude: query.longitude,
            rating: query.rating
        };

        res.status(200).send(resp);
    } catch (err) {
        console.log(err);

        return res.status(500).send({ error: `Internal server error` });
    }
});

router.post('/:id/reviews', async (req, res) => {
    try {
        const id = req.params.id;

        if (!id || id === null || id === undefined) return res.status(422).send({ error: 'Missing id' });

        const user_name = req.body.user_name;
        const comment = req.body.comment;
        const rating = req.body.rating;

        let errorArr = [];

        if (!user_name || user_name === null || user_name === undefined) {
            errorArr.push({ type: 'name', message: 'The name field is required.' });
        }

        if (!comment || comment === null || comment === undefined) {
            errorArr.push({ type: 'comment', message: 'The comment field is required.' });
        }

        if (!rating || rating === null || rating === undefined) {
            errorArr.push({ type: 'rating', message: 'The rating field is required.' });
        }

        if (errorArr.length > 0) {
            let dictionary = Object.fromEntries(errorArr.map(x => [x.type, x.message]));

            const resp = {
                error: 'Validation failed',
                fields: dictionary
            };

            return res.status(422).send(resp);
        }

        const placeExists = await fetchPlaceById(id);

        if (placeExists === null) return res.status(404).send({ error: `Lankytina vieta neegzistuoja` });

        const query = await insertReview(id, user_name, comment, rating);

        if (!query) return res.status(500).send({ error: `Internal server error` });

        const resp = {
            message: 'Review created successfully',
            data: {
                user_name: user_name,
                comment: comment,
                rating: rating
            }
        };

        return res.status(201).send(resp);
    } catch (err) {
        console.log(err);

        return res.status(500).send({ error: `Internal server error` });
    }
});

router.get('/:id/reviews', async (req, res) => {
    try {
        const id = req.params.id;

        if (!id || id === null || id === undefined) return res.status(404).send({ error: 'Missing id' });

        const query = await fetchPlaceReviewsById(id);

        if (query === null) return res.status(404).send({ error: `No reviews` });

        const resp = {
            total: query.length,
            data: query.map((item) => ({
                id: item.id,
                place_id: item.place_id,
                user_name: item.user_name,
                comment: item.comment,
                rating: item.rating,
                created_at: item.created_at,
                updated_at: item.updated_at
            }))
        };

        return res.status(200).send(resp);
    } catch (err) {
        console.log(err);

        return res.status(500).send({ error: `Internal server error` });
    }
});

module.exports = router;