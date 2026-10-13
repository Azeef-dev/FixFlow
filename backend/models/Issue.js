// Issue Data Model
const mongoose = require('mongoose');

const issueSchema = new mongoose.Schema({});

module.exports = mongoose.model('Issue', issueSchema);
