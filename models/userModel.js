const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); 
const { threadId } = require('worker_threads');

//Schema for users
const userSchema = mongoose.Schema({
    email: {
        type: String, 
        required: [true, 'Please enter your email'],
        unique: [true, 'Account with this email exists'],
        lowercase: true,
        validate: [validator.isEmail, 'Please enter valid emial']
    },
    password: {
        type: String, 
        required: [true, 'Please enter your password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String, 
        required: [true, 'Please confirm the password'],
        validate: {
            //Working only on save and creating new object using CREATE OR SAVE!!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    name: { 
        type: String, 
        required: [true, 'Please provide your name']
    },
    surename: {
        type: String, 
        required: [true, 'Please provide your surename']
    },
    gender: {
        type: String,
        enum: 'male' || 'female',
        required: [true, 'Please choose your gender']
    },
    dateOfBirth: {
        type: String,
        required: [true, 'Please provide your date of birth']
    },
    state: {
        type: String,
        required: [true, 'Please provide your state']
    },
    city: {
        type: String,
        required: [true, 'Please tell use where you live']
    },
    postalCode: {
        type: String,
        required: [true, 'Please tell us your postal code']
    },
    streetName: {
        type: String,
        required: [true, 'Please tell us your street name']
    },
    streetNumber: {
        type: String,
        required: [true, 'Please tell us your street number']
    },
    apartmentNumber: {
        type: String, 
        required: false
    },
    createdAt:{
        type: Date,
        default: Date.now(),
        select: false
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date
});


//PASSWORD ENCRYPTION
userSchema.pre('save', async function(next){
    //Only run this function when password is modified
    if(!this.isModified('password')) return next();

    //Hash the password with cost of 12
     this.password = await bcrypt.hash(this.password, 12);

    //Delete passwordConfirm field
     this.passwordConfirm = undefined;
     next();
})

//CHANGING PASSWORDCHANGEDAT
userSchema.pre('save', function(next){
    if(!this.isModified('password') || this.isNew) return next();

    this.passwordChangedAt = Date.now() - 1000;
    next();
});

//PASSWORD COMPARE
userSchema.methods.correctPassword = async function(candidate, password) {
    return await bcrypt.compare(candidate, password)
};


//CREATE PASSWORD RESET TOKEN
userSchema.methods.createResetToken = function(){
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

    console.log({resetToken}, this.passwordResetToken)

    this.passwordResetExpires = Date.now()+10*60*1000;
    return resetToken;
}



module.exports = mongoose.model('User', userSchema)
