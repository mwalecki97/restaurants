const reservation = require('../models/reservationModel');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

//Get all reservations
const getAll = catchAsync(async (req, res) => {
    const result = await reservation.find();

    res.status(200).json({
        status: 'success',
        result: result.length, 
        data: result
    })
}) 

//Get reservation by user Id
const getId = catchAsync(async (req, res) => {
    const result = await reservation.findById(req.params.id)

    if(!result) {
        return next(new AppError(`No reservation with this id`, 404))
    }

    res.status(200).json({
        status: 'success',
        result: result
    })
})

//Create new reservation
const createNew = catchAsync(async (req, res) => {
    const result = await restaurant.create(req.body);

    res.status(201).json({
        status: 'success',
        data: result
    })
})

module.exports = {
    getAll,
    createNew
}