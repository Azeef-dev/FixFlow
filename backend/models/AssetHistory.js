// Asset History Timeline Model
const mongoose = require('mongoose');

const assetHistorySchema = new mongoose.Schema({});

module.exports = mongoose.model('AssetHistory', assetHistorySchema);
