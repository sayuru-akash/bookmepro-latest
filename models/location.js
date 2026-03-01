import mongoose from 'mongoose';

const locationSchema = new mongoose.Schema({
  coachId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true,
    unique: true,
    index: true
  },
  locations: [{
    type: String,
    trim: true,
    maxlength: 200
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Custom validation for locations array
locationSchema.path('locations').validate(function(locations) {
  return locations.length <= 5;
}, 'Maximum 5 locations allowed');

// Pre-save middleware to prevent duplicates
locationSchema.pre('save', function(next) {
  if (this.locations) {
    // Remove duplicates (case-insensitive)
    const uniqueLocations = [];
    const seen = new Set();
    
    for (const location of this.locations) {
      const normalized = location.toLowerCase().trim();
      if (!seen.has(normalized) && location.trim()) {
        seen.add(normalized);
        uniqueLocations.push(location.trim());
      }
    }
    
    this.locations = uniqueLocations;
  }
  next();
});

// Static method to find locations by coach ID
locationSchema.statics.findByCoachId = function(coachId) {
  return this.findOne({ coachId, isActive: true });
};

// Instance method to add location
locationSchema.methods.addLocation = function(location) {
  if (this.locations.length >= 5) {
    throw new Error('Maximum 5 locations allowed');
  }
  
  const locationStr = location.trim();
  const exists = this.locations.some(
    loc => loc.toLowerCase() === locationStr.toLowerCase()
  );
  
  if (exists) {
    throw new Error('Location already exists');
  }
  
  this.locations.push(locationStr);
  return this.save();
};

// Instance method to remove location
locationSchema.methods.removeLocation = function(locationToRemove) {
  this.locations = this.locations.filter(
    loc => loc.toLowerCase() !== locationToRemove.toLowerCase()
  );
  return this.save();
};

// Instance method to update all locations
locationSchema.methods.updateLocations = function(newLocations) {
  if (newLocations.length > 5) {
    throw new Error('Maximum 5 locations allowed');
  }
  
  this.locations = newLocations.filter(loc => loc && loc.trim()).map(loc => loc.trim());
  return this.save();
};

// Create compound index
locationSchema.index({ coachId: 1, isActive: 1 });

// Clear any existing model to avoid conflicts
if (mongoose.models.Location) {
  delete mongoose.models.Location;
}

const Location = mongoose.model('Location', locationSchema);

export default Location;