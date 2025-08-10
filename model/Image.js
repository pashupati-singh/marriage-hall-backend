// models/Image.js
const mongoose = require('mongoose');
const { Schema } = mongoose;

const imageSchema = new Schema(
  {
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true},
    image: { type: String, required: true },
  },
  { timestamps: true }
);

const Image = mongoose.model('Image', imageSchema);

module.exports = Image;