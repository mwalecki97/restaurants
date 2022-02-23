const express = require('express')
const authController = require('../controllers/authController')
const restaurantController = require('../controllers/restaurantController')
const router = express.Router();


//NO-JWT ROUTES
//get all restaurants
router.get('/restaurants', restaurantController.getAll)

//get restaurant by id
router.get('/restaurants/:id', restaurantController.getId) 


//JWT ROUTES

//signup
router.post('/signupUser', authController.signupUser)                      
router.post('/signupRestaurant', authController.signupRestaurant)           

//login
router.post('/login', authController.login)                                 

//password reset
router.post('/forgotPassword', authController.forgotPassword)
router.patch('/resetPassword/:token', authController.resetPassword)

//update password
router.patch('/updateMyPassword/:id', authController.updatePassword)



module.exports = router;

