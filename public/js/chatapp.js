
//Modules
var teamChat = angular.module('teamChat', ['ngResource', 'ui.router', 'ui.bootstrap','ngAnimate', 'ngCookies']);



//Routing
teamChat.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("/home");
    
    $stateProvider
    .state('chatting', {
        url: "/chat",
        views: {
            mainModule: {
                templateUrl: "templates/chatwindow.html"
            },
           'chatbox@chatting': {
                templateUrl: "templates/chatbox.html",
                controller: "chatCtrl"
            }
            
        }
    
    })
    
    .state('home', {
        url: "/home",
        views: {
            mainModule: {
                templateUrl: "templates/home.html"
            },
            'sessionList@home': {
                templateUrl: "templates/sessionlists.html"
            },
            'sessionForm@home': {
                templateUrl: "templates/sessionform.html"
            }
            
        }
    })
    
    .state('login', {
        url: "/login",
        views: {
            mainModule: {
                templateUrl: "templates/login.html"
            }
        }
        
    })
})

//CONTROLLERS

//The main controller
teamChat.controller('mainCtrl',['$scope','$location', '$cookies', 'sessionService', function ($scope, $location, $cookies, sessionService) {
    
   $cookies.put('sessionid', 'default');
  var info = $cookies.getAll();
  console.log(info);
  
//setting the username
  $scope.maininfo = {};
  $scope.maininfo.username = $cookies.get('username');
  $scope.maininfo.sessionid = $cookies.get('sessionid');
  
  console.log($scope.maininfo.username + ' is the username in main scope maininfo :debug');
  
 //if no username defined, redirecting to login page   
  if ($cookies.get('username') == 'undefined' || !($cookies.get('username')) ) {
      $location.path("/login");
  }
}]);


//active sessions list on sidebar controller
teamChat.controller('ActiveListCtrl',['$scope', function ($scope) {
  $scope.isCollapsed = false;
}]);

//completed sessions list on sidebar controller
teamChat.controller('HistoryListCtrl', ['$scope', function ($scope) {
  $scope.isCollapsed = false;
}]);

//handle the login form

teamChat.controller('loginCtrl',['$scope','$location', 'userService', function ($scope, $location, userService) {
  $scope.username = userService.username;
  $scope.$watch('username', function() {
       userService.username = $scope.username; 
    });
  $scope.submit = function() {
       // $location.path("/home");
        console.log('form submitted');
    };
  
}]);

teamChat.controller('sessionCtrl',['$scope','$cookies', '$location', '$http', function ($scope, $cookies, $location, $http) {
  
  //adding a watcher for the session name
   $scope.$watch('sname', function(newVal, oldVal) {
       console.log(newVal);
       console.log($scope.maininfo);
       
    });
    
    
   $scope.submit = function() {
     $http({
      method: 'POST',
      url: '/home',
      data: {'sessionid': $scope.sname,
             'username': $cookies.get('username')
       }
      
    }).then(function successCallback(response) {
        // this callback will be called asynchronously
        // when the response is available
        
        $scope.maininfo.sessionid = $scope.sname;
     $cookies.put('sessionid', $scope.sname);
     console.log($scope.maininfo);
     $location.path("/chat");
      }, function errorCallback(response) {
        // called asynchronously if an error occurs
        // or server returns response with an error status.
        console.log(response);
      });
     
   }
    
    
}]);

teamChat.controller('chatCtrl', [ '$scope', '$cookies' , function($scope, $cookies) {
  var socket = io();
  $scope.$watch('msg', function(newval, oldval) {
       console.log(newval);
    });
//PRIMARY FUNCTIONS
  // Sets the client's username
  var setUsername = function (username, sessionid) {
    

    // If the username is valid
    if (username) {

      
      // Tell the server your username
      socket.emit('add user', username, sessionid);
    }
  }

  // Sends a chat message
  var sendMessage = function (username, message) {
    // Prevent markup from being injected into the message
    // if there is a non-empty message and a socket connection
    if (message) {
      // tell server to execute 'new message' and send along one parameter
      console.log(message);
      socket.emit('new message', username, message);
    }
  };
  // Socket events

  // Whenever the server emits 'login', log the login message
  socket.on('login', function (data) {
    var connected = true;
    // Display the welcome message
    var message = "Welcome to this session about "+ data;
    console.log(message);
    
  });
  
  // Whenever the server emits 'user joined', log it in the chat body
  socket.on('user joined', function (data) {
    console.log(data.username + ' joined ' + data.sessionname); 
  });
  
  //output the messages
  socket.on('incoming message', function (data) {
    console.log(data.username + ' said- ' + data.message); 
  });
  
  //CODE IN ACTION
  setUsername($cookies.get('username'), $cookies.get('sessionid'));
  $scope.submit = function() {
    sendMessage($cookies.get('username'), $scope.msg);
    $scope.msg = '';
    console.log('fired');
  }
}]);

//SERVICES
teamChat.service('sessionService', function(){
    this.sname = 'default';
});

teamChat.service('userService', function(){
    this.user = '';
});
