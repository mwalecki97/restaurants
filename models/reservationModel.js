const mongoose = require('mongoose');
const restaurant  = require('./restaurantModel');
const user = require('./userModel');

const reservationSchema = mongoose.Schema({
    userID: { 
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    restaurantID:{
        
    },
    status:{
        type: String
    }, 
    restaurantsName:{
        type: String
    },
    reservationDate:{
        type: Date
    },
    guestNumber:{
        type: Number
    }, 
    createdAt:{
        type: Date,
        default: Date.now(),
        selected: false
    }
})


module.exports = mongoose.model('Reservation', reservationSchema)