const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost/exercise-track' )

var Schema = mongoose.Schema;

var userSchema = new Schema({
  username: String,
  exercises: []     });/* = <Your Model> */

var user = mongoose.model('user', userSchema);

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});



//add user to database
app.post('/api/exercise/new-user', (req, res) => {
  user.findOne({username: req.body.username}, (err, data) => {
    if (err) {
      res.json({error : 'error'})
    } else if(data) {
      return res.json({username: 'Already Exists'});
    } else {
        var addUser = new user({username: req.body.username, exercises: []})
  addUser.save().then(name => {
    res.json({username: name.username, id: name._id})
  }).catch(error => {
    res.json({error: error})
  })
    }
  })
})

//add exercises to user
app.post('/api/exercise/add', (req, res) => {
  console.log(req.body)
  user.findOne({_id: req.body.userId}, (err, data) => {
    if (err) {
      res.json({error : 'error'})
    } else if(data) {
      if (req.body.date == '') {
        var today = new Date();
        var now = today.toISOString().split('T');
        var date = now[0];
        req.body.date = date;
      }
      var array = {description: req.body.description ,duration: req.body.duration, date: req.body.date}
      // console.log(data)
      data.exercises.push(array)
      // console.log(data)
      data.save().then(update => {
        res.json({user: update})
      }).catch(error => {
        res.json({error: error})
      })
    } else {
      return res.json({error: 'user does not exist'})
    }
  })
})
//get user list
app.get("/api/exercise/users", (req, res) => {
  user.find(({}),({_id: true}, {username: true}),(err, data)=> {
    if (err) {
      res.json({error: err})
    } else {
      res.json({data: data})
    }
  })
})

//user log
app.get("/api/exercise/log", (req, res) => {
  console.log(req.query.userId)
  user.findById(req.query.userId,(err, data)=> {
    if (err) {
      res.json({error: err})
    } else if (data) {
      if (req.query.from) {
        if (new Date(req.query.from) != 'Invalid Date') {
      var newFromExercises = [];
      var fromlength = data.exercises.length;  
        for (var i = 0; i < fromlength; i++) {
          // console.log('exercise', new Date(data.exercises[i]["date"]))
           console.log('from', new Date(req.query.from))
          if (new Date(data.exercises[i]["date"]) >= new Date(req.query.from)) {
            newFromExercises.push(data.exercises[i])
          }
        }
        data.exercises = newFromExercises;
       } else {
         return res.json({error: 'Invalid From Date'})
       }
      }
      if (req.query.to) {
        if (new Date(req.query.to) != 'Invalid Date') {
      var newToExercises = [];
      var tolength = data.exercises.length;  
        for (var i = 0; i < tolength; i++) {
          // console.log('exercise', new Date(data.exercises[i]["date"]))
          // console.log('from', new Date(req.query.from))
          if (new Date(data.exercises[i]["date"]) <= new Date(req.query.to)) {
            newToExercises.push(data.exercises[i])
          }
        }
        data.exercises = newToExercises;
        } else {
          return res.json({error: 'Invalid To Date'})
        }
      }
      if (req.query.limit) {
        if ( req.query.limit >= 0) {
        data.exercises = data.exercises.slice(0,req.query.limit)
        } else {
        return res.json({error: 'invalid limit'})  
        }
      }
      var count = data.exercises.length
      res.json({userId: data._id, username: data.username, count: count, log: data.exercises})
    } else {
      res.json({error: 'UserId Invalid'})
    }
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
