const { primisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION
    });
}

//Register as user
const signupUser = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm, 
        name: req.body.name,
        surename: req.body.surename,
        gender: req.body.gender,
        dateOfBirth: req.body.dateOfBirth,
        state: req.body.state,
        city: req.body.city,
        postalCode: req.body.postalCode,
        streetName: req.body.streetName,
        streetNumber: req.body.streetNumber
    });
  
    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
});

//Register as reataurant
const signupRestaurant = catchAsync(async (req, res, next) => {
    const newRestaurant = await Restaurant.create({
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        restaurantName: req.body.restaurantName,
        cuisine: req.body.cuisine,
        postalCode: req.body.zipCode,
        city: req.body.city,
        state: req.body.state,
        streetName: req.body.streetName,
        streetNumber: req.body.streetNumber,
        apartmentNumber: req.body.apartmentNumber
    });

    const token = signToken(newRestaurant._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newRestaurant
        }
    });
})

//Login user
const login = catchAsync(async (req, res, next) => {
    //Save typed email and password from input body
    const { email, password } = req.body;

    //Check if email and password exists
    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    //Check if user exists && password correct
    const user = await User.findOne({ email }).select('+password'); //+password adding hidden password
    const restaurant = await Restaurant.findOne({ email }).select('+password');

    if(user && (await user.correctPassword(password, user.password))) {
        const token = signToken(user._id);
        res.status(200).json({
        status: 'success',
        type: 'user',
        id: user._id,
        token
    });
    }else if(restaurant && (await restaurant.correctPassword(password, restaurant.password))){ 
        const token = signToken(restaurant._id);
        res.status(200).json({
        status: 'success',
        type: 'restaurant',
        id: restaurant._id,
        token
    })
    //Return error if email || password is incorrect
    }else{
        return next(new AppError('Incorrect email or password', 401));
    }
});


const protect = catchAsync(async(req,res,next) => {
    
    //Getting token and check existing
    let token;
    if (req.headers.authorization && req.headers.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    
    if(!token){
        return next(new AppError('Authorization error, user not logged in', 401))
    }

    //Verificating token 
     const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)



    //Check if user still exists
    

    //Check if user changed password after JWT was issued
    
    next()
})

module.exports = {
signupUser,
signupRestaurant,
login,
protect
}