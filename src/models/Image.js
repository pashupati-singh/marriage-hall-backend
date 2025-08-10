const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Image title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters'],
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters'],
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required'],
    index: true,
  },
  cloudinaryId: {
    type: String,
    required: [true, 'Cloudinary ID is required'],
    unique: true,
  },
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail URL is required'],
  },
  originalFileName: {
    type: String,
    required: [true, 'Original file name is required'],
  },
  fileSize: {
    type: Number,
    required: [true, 'File size is required'],
    min: [0, 'File size cannot be negative'],
  },
  mimeType: {
    type: String,
    required: [true, 'MIME type is required'],
  },
  dimensions: {
    width: {
      type: Number,
      required: [true, 'Image width is required'],
    },
    height: {
      type: Number,
      required: [true, 'Image height is required'],
    },
  },
  tags: [{
    type: String,
    trim: true,
    maxlength: [30, 'Tag cannot exceed 30 characters'],
  }],
  isActive: {
    type: Boolean,
    default: true,
  },
  isFeatured: {
    type: Boolean,
    default: false,
  },
  viewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes for better performance
imageSchema.index({ category: 1, isActive: 1 });
imageSchema.index({ isFeatured: 1, isActive: 1 });
imageSchema.index({ createdAt: -1 });
imageSchema.index({ viewCount: -1 });
imageSchema.index({ tags: 1 });

// Virtual for formatted file size
imageSchema.virtual('formattedFileSize').get(function() {
  const bytes = this.fileSize;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Bytes';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`;
});

// Virtual for aspect ratio
imageSchema.virtual('aspectRatio').get(function() {
  return this.dimensions.width / this.dimensions.height;
});

// Static method to find featured images
imageSchema.statics.findFeatured = function(limit = 20) {
  return this.find({ isActive: true, isFeatured: true })
    .sort({ createdAt: -1 })
    .limit(limit)
    .populate('category', 'name slug');
};

// Static method to find by category name
imageSchema.statics.findByCategoryName = function(categoryName, limit = null) {
  const query = this.find({ isActive: true })
    .populate({
      path: 'category',
      match: { name: { $regex: new RegExp(categoryName, 'i') }, isActive: true },
    })
    .sort({ createdAt: -1 });

  if (limit) {
    query.limit(limit);
  }

  return query;
};

// Static method to get homepage data
imageSchema.statics.getHomepageData = async function() {
  const Category = mongoose.model('Category');
  const categories = await Category.find({ isActive: true }).sort({ name: 1 });
  
  const homepageData = await Promise.all(
    categories.map(async (category) => {
      const images = await this.find({ 
        category: category._id, 
        isActive: true 
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .select('title imageUrl thumbnailUrl createdAt');

      return {
        category: {
          _id: category._id,
          name: category.name,
          slug: category.slug,
          description: category.description,
        },
        images,
      };
    })
  );

  return homepageData;
};

// Instance method to increment view count
imageSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  return this.save();
};

// Pre-save middleware to update category image count
imageSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('category')) {
    const Category = mongoose.model('Category');
    if (this.category) {
      await Category.findByIdAndUpdate(this.category, { $inc: { imageCount: 1 } });
    }
  }
  next();
});

// Pre-remove middleware to update category image count
imageSchema.pre('remove', async function(next) {
  const Category = mongoose.model('Category');
  if (this.category) {
    await Category.findByIdAndUpdate(this.category, { $inc: { imageCount: -1 } });
  }
  next();
});

module.exports = mongoose.model('Image', imageSchema);
