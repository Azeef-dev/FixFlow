// Asset Data Model
const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({});

module.exports = mongoose.model('Asset', assetSchema);
