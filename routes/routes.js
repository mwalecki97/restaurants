const express = require('express')
const authController = require('../controllers/authController')
const restaurantController = require('../controllers/restaurantController')
const router = express.Router();

//New user 
router.post('/signupUser', authController.signupUser);                      //JWT

//New restaurant
router.post('/signupRestaurant', authController.signupRestaurant)           //JWT

//Login user
router.post('/login', authController.login)                                 //JWT

//Get all restaurants
router.get('/restaurants', restaurantController.getAll)                     

//Add reservation by id


//Get reservations for current logged user
//WORKING ON IT


module.exports = router;

