const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); 

//Schema for users
const userSchema = mongoose.Schema({
    email: {
        type: String, 
        required: [true, 'Please enter your email'],
        unique: true,
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
    }
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

//PASSWORD COMPARE
userSchema.methods.correctPassword = async function(candidate, password) {
    return await bcrypt.compare(candidate, password)
};


module.exports = mongoose.model('User', userSchema)