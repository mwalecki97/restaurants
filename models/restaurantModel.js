const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs'); 

const restaurantSchema = mongoose.Schema({
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
    cuisine: {
        type: String,
        required: true
    },
    rating: Number,
    zipCode: {
        type: String,
        required: true
    },
    city: {
        type: String,
        required: true
    },
    state: {
        type: String,
        required: true
    },
    streetName: {
        type: String,
        required: true
    },
    streetNumber: {
        type: String,
        required: true
    },
    apartmentNumber: {
        type: String,
        required: false
    },
    createdAt: {
        type: Date,
        default: Date.now(),
        selected: false
    }

})

//PASSWORD ENCRYPTION
restaurantSchema.pre('save', async function(next){
    //Only run this function when password is modified
    if(!this.isModified('password')) return next();

    //Hash the password with cost of 12
     this.password = await bcrypt.hash(this.password, 12);

    //Delete passwordConfirm field
     this.passwordConfirm = undefined;
     next();
})

//PASSWORD COMPARE
restaurantSchema.methods.correctPassword = async function(candidate, password) {
    return await bcrypt.compare(candidate, password)
};

module.exports = mongoose.model('Restaurant', restaurantSchema);