const express = require('express')
const authController = require('../controllers/authController')
const restaurantController = require('../controllers/restaurantController')
const router = express.Router();

//New user 
router.post('/signupUser', authController.signupUser)                      //JWT

//New restaurant
router.post('/signupRestaurant', authController.signupRestaurant)           //JWT

//Login user
router.post('/login', authController.login)                                 //JWT

//Get all restaurants
router.get('/restaurants', restaurantController.getAll)

//Get restaurant by id
router.get('/restaurants/:id', restaurantController.getId) 

//Reset password
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)



module.exports = router;

