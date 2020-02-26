var mongoose   = require('mongoose'),
    bcrypt     = require('bcrypt'),
    validator  = require('validator'),
    jwt        = require('jsonwebtoken');
    JWT_SECRET = process.env.JWT_SECRET;

var profile = {

  // Basic info
  firstName: {
    type: String,
    min: 1,
    max: 100,
  },
  lastName: {
    type: String,
    min: 1,
    max: 100,
  },
  gender: {
    type: String,
    enum : {
      values: 'M F O N'.split(' ')
    }
  },
  race: {
    type: String,
    enum : {
      values: 'AI A B H W O N'.split(' ')
    }
  },
  school: {
    type: String,
    min: 1,
    max: 150,
  },
  level: {
    type: String,
    enum : {
      values: 'M 9 10 11 12 1U 2U 3U 4U 5U 1G 2G 3G'.split(' ')
    }
  },
  major: {
    type: String,
    min: 0,
    max: 100,
  },
  hear: {
    type: String,
    min: 0,
    max: 100,
  },
  hackathons: {
    type: String,
    enum : {
      values: '1 2 3'.split(' ')
    }
  },
  hacknyu: {
    type: String,
    enum : {
      values: 'Y N'.split(' ')
    }
  },
  coc: {
    type: Boolean,
    required: true,
    default: false,
  },
  terms: {
    type: Boolean,
    required: true,
    default: false,
  },
};

// Only after confirmed
var confirmation = {
  phone: String,
  dob: Date,
  shirt: {
    type: String,
    enum: {
      values: 'XS S M L XL XXL'.split(' ')
    }
  },
  gradMonth: String,
  gradYear: String,
  track: String,

  isMinor: Boolean,

  goesToNYU: Boolean,
  netID: String,
  nyuSchool: String,

  isInternational: Boolean,
  internationalCountry: String,

  wantsHardware: Boolean,
  hardware: String,

  hasDietaryRestrictions: Boolean,
  dietaryRestrictions: String,

  hasAccessibilityNeeds: Boolean,
  accessibilityNeeds: String,

  github: String,
  linkedin: String,
  website: String,

  emergencyName: String,
  emergencyRelation: String,
  emergencyPhone: String,

  notes: String,

  apis: Boolean,
  photos: Boolean,
  minor: Boolean,
  nyucoc: Boolean,
  sponsors: Boolean,
  generalRelease: Boolean,
};

var status = {
  /**
   * Whether or not the user's profile has been completed.
   * @type {Object}
   */
  completedProfile: {
    type: Boolean,
    required: true,
    default: false,
  },
  admitted: {
    type: Boolean,
    required: true,
    default: false,
  },
  admittedBy: {
    type: String,
    validate: [
      validator.isEmail,
      'Invalid Email',
    ],
    select: false
  },
  confirmed: {
    type: Boolean,
    required: true,
    default: false,
  },
  declined: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkedIn: {
    type: Boolean,
    required: true,
    default: false,
  },
  checkInTime: {
    type: Number,
  },
  confirmBy: {
    type: Number
  },
  reimbursementGiven: {
    type: Boolean,
    default: false
  }
};

// define the schema for our admin model
var schema = new mongoose.Schema({

  email: {
      type: String,
      required: true,
      unique: true,
      validate: [
        validator.isEmail,
        'Invalid Email',
      ]
  },

  password: {
    type: String,
    required: true,
    select: false
  },

  admin: {
    type: Boolean,
    required: true,
    default: false,
  },

  timestamp: {
    type: Number,
    required: true,
    default: Date.now(),
  },

  lastUpdated: {
    type: Number,
    default: Date.now(),
  },

  teamCode: {
    type: String,
    min: 0,
    max: 140,
  },

  verified: {
    type: Boolean,
    required: true,
    default: false
  },

  salt: {
    type: Number,
    required: true,
    default: Date.now(),
    select: false
  },

  /**
   * User Profile.
   *
   * This is the only part of the user that the user can edit.
   *
   * Profile validation will exist here.
   */
  profile: profile,

  /**
   * Confirmation information
   *
   * Extension of the user model, but can only be edited after acceptance.
   */
  confirmation: confirmation,

  status: status,

});

schema.set('toJSON', {
  virtuals: true
});

schema.set('toObject', {
  virtuals: true
});

//=========================================
// Instance Methods
//=========================================

// checking if this password matches
schema.methods.checkPassword = function(password) {
  return bcrypt.compareSync(password, this.password);
};

// Token stuff
schema.methods.generateEmailVerificationToken = function(){
  return jwt.sign(this.email, JWT_SECRET);
};

schema.methods.generateAuthToken = function(){
  return jwt.sign(this._id, JWT_SECRET);
};

/**
 * Generate a temporary authentication token (for changing passwords)
 * @return JWT
 * payload: {
 *   id: userId
 *   iat: issued at ms
 *   exp: expiration ms
 * }
 */
schema.methods.generateTempAuthToken = function(){
  return jwt.sign({
    id: this._id
  }, JWT_SECRET, {
    expiresInMinutes: 60,
  });
};

//=========================================
// Static Methods
//=========================================

schema.statics.generateHash = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
};

/**
 * Verify an an email verification token.
 * @param  {[type]}   token token
 * @param  {Function} cb    args(err, email)
 */
schema.statics.verifyEmailVerificationToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, email) {
    return callback(err, email);
  });
};

/**
 * Verify a temporary authentication token.
 * @param  {[type]}   token    temporary auth token
 * @param  {Function} callback args(err, id)
 */
schema.statics.verifyTempAuthToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, payload){

    if (err || !payload){
      return callback(err);
    }

    if (!payload.exp || Date.now() >= payload.exp * 1000){
      return callback({
        message: 'Token has expired.'
      });
    }

    return callback(null, payload.id);
  });
};

schema.statics.findOneByEmail = function(email){
  return this.findOne({
    email: email.toLowerCase()
  });
};

/**
 * Get a single user using a signed token.
 * @param  {String}   token    User's authentication token.
 * @param  {Function} callback args(err, user)
 */
schema.statics.getByToken = function(token, callback){
  jwt.verify(token, JWT_SECRET, function(err, id){
    if (err) {
      return callback(err);
    }
    this.findOne({_id: id}, callback);
  }.bind(this));
};

schema.statics.validateProfile = function(profile, cb){
  return cb(!(
    profile.firstName.length > 0 &&
    profile.lastName.length > 0 &&
    profile.school.length > 0 &&
    profile.major.length > 0 &&
    profile.hear.length > 0 &&
    profile.coc &&
    profile.terms &&
    ['M', 'F', 'O', 'N'].indexOf(profile.gender) > -1 &&
    ['AI', 'A', 'B', 'H', 'W', 'O', 'N'].indexOf(profile.race) > -1 &&
    ['M', '9', '10', '11', '12', '1U', '2U', '3U', '4U', '5U', '1G', '2G', '3G'].indexOf(profile.level) > -1 &&
    ['1', '2', '3'].indexOf(profile.hackathons) > -1 &&
    ['Y', 'N'].indexOf(profile.hacknyu) > -1
    ));
};

schema.statics.validateConfirmation = function(confirmation, cb){
  return cb(!(
    confirmation.phone.length > 0 &&
    confirmation.dob.length > 0 &&
    confirmation.shirt.length > 0 &&
    confirmation.gradMonth.length > 0 &&
    confirmation.gradYear.length > 0 &&
    (!confirmation.goesToNYU || (confirmation.netID && confirmation.netID.length > 0 && confirmation.nyuSchool && confirmation.nyuSchool.length > 0)) &&
    (!confirmation.isInternational || (confirmation.internationalCountry && confirmation.internationalCountry.length > 0)) &&
    (!confirmation.wantsHardware || (confirmation.hardware && confirmation.hardware.length > 0)) &&
    (!confirmation.hasDietaryRestrictions || (confirmation.dietaryRestrictions && confirmation.dietaryRestrictions.length > 0)) &&
    (!confirmation.hasAccessibilityNeeds || (confirmation.accessibilityNeeds && confirmation.accessibilityNeeds.length > 0)) &&
    confirmation.emergencyName.length > 0 &&
    confirmation.emergencyRelation.length > 0 &&
    confirmation.emergencyPhone.length > 0 &&
    confirmation.apis &&
    confirmation.photos &&
    confirmation.minor &&
    confirmation.nyucoc &&
    confirmation.sponsors &&
    confirmation.generalRelease
    ));
};

//=========================================
// Virtuals
//=========================================

/**
 * Has the user completed their profile?
 * This provides a verbose explanation of their furthest state.
 */
schema.virtual('status.name').get(function(){

  if (this.status.checkedIn) {
    return 'checked in';
  }

  if (this.status.declined) {
    return "declined";
  }

  if (this.status.confirmed) {
    return "confirmed";
  }

  if (this.status.admitted) {
    return "admitted";
  }

  if (this.status.completedProfile){
    return "submitted";
  }

  if (!this.verified){
    return "unverified";
  }

  return "incomplete";

});

module.exports = mongoose.model('User', schema);
