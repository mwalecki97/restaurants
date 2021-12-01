const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');

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

//Protect routes
const protect = catchAsync(async(req,res,next) => {
    
    //Getting token and check existing
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    console.log(token)
    
    if(!token){
        return next(new AppError('Authorization error, user not logged in', 401))
    }

    //Verificating token 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    
    //Check if user still exists
    const freshUser = await User.findById(decoded.id);
    const freshRestaurant = await Restaurant.findById(decoded.id);

    if(freshUser || freshRestaurant){
       next()
    }else{
        return next(new AppError('User belonging to this token no longer exists', 401))
    }
})

//Send password reset token to mail 
const forgotPassword = catchAsync(async(req, res, next) => {

    //Get user by email and check if exists in DB
    const user = await User.findOne({ email: req.body.email })
    const restaurant = await Restaurant.findOne({ email: req.body.email })

    if(user){
        //Create reset token for user
        const userResetToken = user.createResetToken();
        await user.save({ validateBeforeSave: false });

        const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${userResetToken}`;
        const message = `Forgot your password? Submit PATCH request with new one to ${resetURL}`;

        try{
            await sendEmail({
                email: user.email,
                subject: 'Password reset token',
                message
            })
    
            res.status(200).json({
                status: 'success',
                user: 'user',
                message: 'Token sent to email!'
            })
    
        }catch(err){
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save({ validateBeforeSave: false }) //validateBeforeSave deactvates all required values
    
            return next(new AppError('There was an error sending email. Try again later', 500))
        }
        
    }else if(restaurant){
        //Create reset token for restaurant
        const restaurantResetToken = restaurant.createResetToken();
        await restaurant.save({ validateBeforeSave: false });

        const resetURL = `${req.protocol}://${req.get('host')}/resetPassword/${restaurantResetToken}`;
        const message = `Forgot your password? Submit PATCH request with new one to ${resetURL}`;

        try{
            await sendEmail({
                email: restaurant.email,
                subject: 'Password reset token',
                message
            })
    
            res.status(200).json({
                status: 'success',
                user: 'restaurant',
                message: 'Token sent to email!'
            })
    
        }catch(err){
            restaurant.passwordResetToken = undefined;
            restaurant.passwordResetExpires = undefined;
            await restaurant.save({ validateBeforeSave: false }) //validateBeforeSave deactvates all required values
    
            return next(new AppError('There was an error sending email. Try again later', 500))
        }
    }else{
        return next(new AppError('There is no user with this email address', 404))
    }
})

//Reset forgotten password
const resetPassword = catchAsync(async(req, res, next) => {
        //Get user based on token   encrypt token and compare it with token in db
        const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex')

        const user = await User.findOne({ 
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        const restaurant = await Restaurant.findOne({ 
            passwordResetToken: hashedToken,
            passwordResetExpires: { $gt: Date.now() }
        });

        if(user){
            user.password = req.body.password
            user.passwordConfirm = req.body.passwordConfirm
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            await user.save();
            
            const token = signToken(user._id);

            res.status(200).json({
                status: 'success',
                type: 'user',
                token
            })
        }else if(restaurant){
            restaurant.password = req.body.password
            restaurant.passwordConfirm = req.body.passwordConfirm
            restaurant.passwordResetToken = undefined;
            restaurant.passwordResetExpires = undefined;
            await restaurant.save();
            
            const token = signToken(restaurant._id);

            res.status(200).json({
                status: 'success',
                type: 'user',
                token
            })
        }else{
            return next(new AppError('Token is invalid or has expired', 400))
        }
})







module.exports = {
signupUser,
signupRestaurant,
login,
protect,
forgotPassword,
resetPassword
}