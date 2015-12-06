var mongoose   = require('mongoose');
var Chat = require('./models/chats.js')
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
var router = express.Router();



//starting the server
server.listen(3000);

//connecting to the database
mongoose.connect('mongodb://teamchat:monkeyKing@ds063134.mongolab.com:63134/chats');



var port = process.env.PORT || 3000;

//app.use('/assets', express.static(__dirname + '/public'));
app.use(express.static('public'));

app.get('/', function(req, res) {
	res.render('index');
});


var urlencodedParser = bodyParser.urlencoded({ extended: false })

//handle the user login
app.post('/login', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
  	res.sendFile(__dirname +'/public/index.html', function(err){
		  if(err){
			  console.log(err);
		  }
		 
	  });
	  res.cookie('username', req.body.username);
	  console.log(req.body.username);
});

//handle new session

app.post('/home', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400);
	  console.log(req.body.sessionid);
    return res.sendStatus(200);
});

//DEBUG CODE
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  var addedUser = false;

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (data) {
    // we tell the client to execute 'new message'
    socket.broadcast.emit('new message', {
      username: socket.username,
      message: data
    });
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username) {
    // we store the username in the socket session for this client
    socket.username = username;
      console.log(username);
      console.log(numUsers);
    // add the client's username to the global list
    usernames[username] = username;
    ++numUsers;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

 
});

//database debug
var chat = new Chat();
chat.session = 'trial';

//chat.save(function(err){
//  if (err) throw err;
//  console.log('saved');
//})

Chat.find ({}, '_id', function(err,ids){
  if (err) throw err;
  JSON.stringify(ids);
  console.log(ids);
  ids.forEach(function(element) {
    console.log(element._id);
  }, this);
  
});




