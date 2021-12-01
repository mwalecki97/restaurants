const restaurant = require('../models/restaurantModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const ApiFeatures = require('../utils/apiFeatures')

//Get all restaurants
const getAll = catchAsync(async (req, res) => {
        
    const features = new ApiFeatures(restaurant.find(), req.query)
    .filter().sort().limitFields().paginate()
    const restaurants = await features.query

    if(!restaurants){
        return next(new AppError('Bad request', 400));
    }
    
    res.status(200).json({
        status: 'success',
        results: restaurants.length,
        data: {
            restaurants
        }
    })
})

//Get restaurant by id
const getId = catchAsync(async (req, res) => {
        const result = await restaurant.findById(req.params.id)
       
        if(!result){
            return next(new AppError(`No restaurant with this id`, 404))
        }
        
        res.status(200).json({
            status: 'success',
            result: result
        })
})

module.exports = {
    getAll,
    getId
}