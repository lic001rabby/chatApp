var mongoose   = require('mongoose');
var Chat = require('./models/chats.js')
var Log = require('./models/logs.js')
var express = require('express');
var bodyParser = require('body-parser');
var app = express();
var server = app.listen(3000);
var io = require('socket.io').listen(server);
var router = express.Router();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
var moment = require('moment');
moment().format();



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


//event handlers
var usernames = {};
var numUsers = 0;

io.on('connection', function (socket) {
  
  var addedUser = false;
  var chat = new Chat();
  socket.usernames = {};
  
  
  socket.on('create session', function(sname){
    chat.sessionName = sname;
    chat.chatStatus = 'waiting';
    chat.save(function(err,sid){
    if (err) throw err;
    console.log(sid._id);
    socket.emit('session created',{
      sessionid: sid._id,
      sessionname: sname
    });
    });
    
  });

  // when the client emits 'new message', this listens and executes
  socket.on('new message', function (username, message) {
    // we tell the client to execute 'new message'
    console.log(message);
    var log = new Log();
    log.sessionId = socket.room;
    log.userName = username;
    log.time = moment();
    log.data = message;
    log.save(function(err, sid){
      if (err) throw err;
      console.log(sid._id);
      socket.broadcast.to(socket.room).emit('incoming message', {
      username: username,
      message: message
    });
      
    });
    
    
  });

  // when the client emits 'add user', this listens and executes
  socket.on('add user', function (username, sessionid) {
    // we store the username in the socket session for this client
    socket.username = username;
    // store the room name in the socket session for this client
		socket.room = sessionid;
    // set the session
		socket.join(sessionid);
      console.log(username);
      console.log(sessionid);
    // add the client's username to the global list
    socket.usernames[username] = username;
    
    ++numUsers;
    addedUser = true;
    var query = Log.find({ 'sessionId': sessionid });
    query.select('userName time data');
    query.exec(function (err, list){
      if(err) throw err;
      socket.emit('login', list);
      })
    // echo globally (all clients) that a person has connected
    socket.broadcast.to(socket.room).emit('user joined', {
      username: socket.username,
      sessionname: socket.room
    });
  });

 
});


//BUILDING REQUIRED API
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

//get list of active chats
router.route('/activechats')
  .get(function(req,res){
    var query = Chat.find({ 'chatStatus': 'waiting' });
    query.select('_oid sessionName chatStatus');
    query.exec(function (err, list){
      if(err) res.send(err);
      res.json(list);
});
    
  })
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});

//get a session name
router.route('/:sessionId')
  .get(function(req, res) {
    var query = Chat.findById(req.params.sessionId);
    query.select('sessionName');
    query.exec(function (err, list){
      if(err) res.send(err);
      res.json(list);
    });
  });
  
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });   
});


app.use('/chats', router);


var query = Chat.find({ 'chatStatus': 'waiting' });
query.select('_oid session chatStatus');
query.exec(function (err, list){
  console.log(JSON.stringify(list));
});

//database debug


/*
Chat.find ({}, '_id','session', 'status' function(err,ids){
  if (err) throw err;
  JSON.stringify(ids);
  console.log(ids);
  ids.forEach(function(element) {
    console.log(element._id);
  }, this);
  
});*/




