const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const app = express();

//Dotenv configuration
dotenv.config({ path: './config.env' })

//Importing error handler
const AppError = require('./utils/appError')
const globalErrorHandler = require('./controllers/errorController')

//Middlewares
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.use((req, res, next)=>{
  req.requestTime = new Date().toISOString();
  console.log(req.headers)
  next();
})

//Router import  
const userRouter = require('./routes/routes')

//Router middlewares
app.use('/', userRouter)

//App info
app.get('/', (req, res) =>{
  res.send('Restaurants_API')
})
 
//Handling not existing routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
})

//Error handling middelware
app.use(globalErrorHandler)

//Database connection
mongoose.connect(process.env.DB_CONNECT_URL)
const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error: "));
db.once("open",  () => {
  console.log("Connected successfully to mongoDB");
});

//Server listening
const PORT = process.env.PORT || 9000
app.listen(PORT, () => {console.log(`listening on ${PORT}`)}); 

