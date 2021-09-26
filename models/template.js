const mongoose = require('mongoose');

const { Schema, model } = mongoose;

const templateScheme = new Schema({
  __v: { type: Number, select: false },
  npmName: { type: String, required: true },
  version: { type: String, required: true },
  templateType: { type: String },
  description: { type: String },
}, { timestamps: true });

module.exports = model('Template', templateScheme, 'templates');
