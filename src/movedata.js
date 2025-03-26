const jsonFile = require('./Places.json');

const { insertPlaceData } = require('./database');

jsonFile.forEach(async (item) => {
    const created_at = new Date().toUTCString();

    await insertPlaceData(item["name"], item["address"], item["latitude"], item["longitude"], item["description"], item["rating"], created_at);
});