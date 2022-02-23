const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const Restaurant = require('../models/restaurantModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const crypto = require('crypto');
const { clearScreenDown } = require('readline');

//GENERATE JWT ACCESS TOKEN 
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRATION
    });
}

//SEND TOKEN
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

//SIGNUP USER
const signupUser = catchAsync(async (req, res, next) => {   
    try{
        //Check if user with provided email exists in restaurants collection
        const findemail = await Restaurant.findOne({ email: req.body.email })
        if(findemail) return next(new AppError('user with provided email exists already exists!'))
        
        //Create new user 
        const newUser = await User.create(req.body);

        //Create login token
        createSendToken(newUser, 201, res)

    }catch(err){
        return next(new AppError('make sure that all fields are filled'))
    }
})

//SIGNUP RESTAURANT
const signupRestaurant = catchAsync(async (req, res, next) => {
    try{
        //Check if user with provided email exists in users collection
        const findemail = await Restaurant.findOne({ email: req.body.email })
        if(findemail) return next(new AppError('user with provided email exists already exists!'))

        //create new restaurant
        const newRestaurant = await Restaurant.create(req.body);

        //Create login token
        createSendToken(newRestaurant, 201, res)
        
    }catch(err){
        return next(new AppError('make sure that all fields are filled'))
    }
})

//LOGIN
const login = catchAsync(async (req, res, next) => {
    //Save typed email and password from input body
    const { email, password } = req.body;

    //Check if email and password are typed in body
    if (!email || !password) return next(new AppError('Please provide email and password', 400))
    
    //Check if user exists && password is correct
    const user = await User.findOne({ email }).select('+password');
    const restaurant = await Restaurant.findOne({ email }).select('+password');
    
    if(user && (await user.correctPassword(password, user.password))) 
    createSendToken(user, 200, res)

    else if(restaurant && (await restaurant.correctPassword(password, restaurant.password))) 
    createSendToken(restaurant, 200, res)

    else return next(new AppError('Incorrect email or password', 401));
});

//ROUTES PROTECTION
const protect = catchAsync(async(req,res,next) => {
    //Get token
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) 
        token = req.headers.authorization.split(' ')[1]
    
    //Check if token is existing
    if(!token) return next(new AppError('Authorization error, user not logged in', 401))
    
    //Verificating token 
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET)
    
    //Check if user still exists
    const freshUser = await User.findById(decoded.id)
    const freshRestaurant = await Restaurant.findById(decoded.id)

    
    if(freshUser || freshRestaurant) next()
    else return next(new AppError('User belonging to this token no longer exists', 401)) 
})

//SEND PASSWORD RESET TOKEN TO EMAIL
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
            await user.save({ validateBeforeSave: false }) 
            //validateBeforeSave deactvates all required values
    
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
            await restaurant.save({ validateBeforeSave: false }) 
            //validateBeforeSave deactvates all required values
    
            return next(new AppError('There was an error sending email. Try again later', 500))
        }
    }else return next(new AppError('There is no user with this email address', 404))
})

//RESET FORGOTTEN PASSWORD
const resetPassword = catchAsync(async(req, res, next) => {
        //Get user based on token encrypt token and compare it with token in db
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
            try{
                user.password = req.body.password
                user.passwordConfirm = req.body.passwordConfirm
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                await user.save({ validateBeforeSave: false });
                
                createSendToken(user, 200, res)

               }catch(err){
                    return next(new AppError('Passwords must be the same!', 403))
                }
            
        }else if(restaurant){
            try{
                restaurant.password = req.body.password
                restaurant.passwordConfirm = req.body.passwordConfirm
                restaurant.passwordResetToken = undefined;
                restaurant.passwordResetExpires = undefined;
                await restaurant.save({ validateBeforeSave: false });
                
                createSendToken(restaurant, 200, res)
        
               }catch(err){
                    return next(new AppError('Passwords must be the same!', 403))
                }
        } else return next(new AppError('Token is invalid or has expired', 400))
})

//UPDATING CURRENT USER PASSWORD
const updatePassword = catchAsync(async (req, res, next) => {
    //New password
    const { password, newPassword, confirmNewPassword } = req.body

    if(!password) return next(new AppError('provide old password'))
    else if (!newPassword) return next(new AppError('Type new password'))
    else if (!confirmNewPassword) return next(new AppError('Confim new password'))

    //Get user from collection
    const user = await User.findById({ _id: req.params.id }).select('+password');
    const restaurant = await Restaurant.findById({ _id: req.params.id }).select('+password'); 
    if(!user && !restaurant) return next(new AppError('user with provided id not found'))

    //Check if passwrod is correct
    if(user && user.correctPassword(password, user.password)){
        user.password = newPassword
        user.passwordConfirm = confirmNewPassword
        await user.save({ validateBeforeSave: false })

        createSendToken(user, 200, res)

    }else if(restaurant && restaurant.correctPassword(password, restaurant.password)){
        restaurant.password = newPassword
        restaurant.passwordConfirm = confirmNewPassword
        await restaurant.save({ validateBeforeSave: false })

        createSendToken(restaurant, 200, res)

    }else return next(new AppError('Wrong old password'))
})

//UPDATING CURRENT USER DATA
const updateUser = catchAsync(async (req, res, next) => {
    
    

    //IN PROGRESS

})



module.exports = {
signupUser,
signupRestaurant,
login,
protect,
forgotPassword,
resetPassword,
updatePassword
}