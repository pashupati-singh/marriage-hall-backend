// models/Category.js
const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
  },
  { timestamps: true }
);

categorySchema.pre('validate', function (next) {
  if (!this.displayName && this.name) {
    this.displayName = this.name;
  }
  next();
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;