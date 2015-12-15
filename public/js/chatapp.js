
//Modules
var teamChat = angular.module('teamChat', ['ngResource', 'ui.router', 'ui.bootstrap','ngAnimate', 'ngCookies']);



//Routing
teamChat.config(function($stateProvider, $urlRouterProvider){
    $urlRouterProvider.otherwise("/home");
    
    $stateProvider
    .state('chatting', {
        url: "/chat/{sessionid}",
        views: {
            mainModule: {
                templateUrl: "templates/chatwindow.html"
            },
            'userList@chatting': {
              templateUrl: "templates/userlist.html",
              controller: "timeCtrl"
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
                templateUrl: "templates/sessionlists.html",
                controler: "ListCtrl"
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
  
//setting the username
  $scope.maininfo = {};
  $scope.maininfo.username = $cookies.get('username');
  $scope.maininfo.sessionid = $cookies.get('sessionid');
  
  
 //if no username defined, redirecting to login page   
  if ($cookies.get('username') == 'undefined' || !($cookies.get('username')) ) {
      $location.path("/login");
  }
}]);


//active sessions list on sidebar controller
teamChat.controller('ListCtrl',['$scope','listService', function ($scope, listService) {
  $scope.isCollapsed1 = false;
  $scope.isCollapsed2 = false;
  var myDataPromise = listService.getData('activechats');
    myDataPromise.then(function(result) {  // this is only run after $http completes
       $scope.maininfo.active = result;
    });
    
    myDataPromise = listService.getData('endedchats');
    myDataPromise.then(function(result) {  // this is only run after $http completes
       $scope.maininfo.ended = result;
    });
    
    
  
  

  
  
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

teamChat.controller('sessionCtrl',['$scope','$cookies', '$location', '$http','socketService', function ($scope, $cookies, $location, $http, socketService) {
  
  //adding a watcher for the session name
   $scope.$watch('sname', function(newVal, oldVal) {
       
    });
    
  //creating the session  
   $scope.submit = function() {
     socketService.socket.emit('create session', $scope.sname);
   }
   
   socketService.socket.on('session created', function(data){
     console.log('session created');
     $scope.maininfo.sessionname = data.sessionname;
     $scope.maininfo.sessionid = data.sessionid;
     $cookies.put('sessionid', data.sessionid);
     $location.path("/chat/"+ data.sessionid);
     
   })
    
    
}]);
//controlling the timer
teamChat.controller('timeCtrl',['$scope', '$timeout', '$stateParams', 'socketService','listService', function($scope, $timeout, $stateParams, socketService, listService){
  
  //initialising the timer
  var dataPromise = listService.getData($stateParams.sessionid);
   dataPromise.then(function(result) {  // this is only run after $http completes
       $scope.maininfo.sessionname = result.sessionName;
       $scope.maininfo.chatStatus = result.chatStatus;
       if (result.chatStatus === 'active'){
         $scope.maininfo.endtime = result.endTime;
         var endtime = moment($scope.maininfo.endtime);
         var now = moment();
         var timeleft = endtime.diff(now, 'seconds');
         $scope.counter = timeleft;
    
    $scope.startTimeout();
       }
       if (result.chatStatus === 'waiting'){
         $scope.counter = 900;
       }
       if (result.chatStatus === 'ended'){
         $scope.counter = 0;
       }
    });
  
    $scope.startTimeout = function () {  
        $scope.counter --; 
        if ($scope.counter == 0) {$scope.stop();}
       
        mytimeout = $timeout($scope.startTimeout, 1000);  
    }  
//start button
    $scope.start = function(){
      $scope.maininfo.chatStatus = 'active';
      socketService.socket.emit('start', $scope.maininfo.sessionid);
      $scope.startTimeout();
    }
//stop button
    $scope.stop = function(){
      socketService.socket.emit('stopped', $scope.maininfo.sessionid)
      $timeout.cancel(mytimeout);
    }
    
    socketService.socket.on('started', function(data){
    $scope.maininfo.chatStatus = 'active';
    var endtime = moment(data);
    var now = moment();
    var timeleft = endtime.diff(now, 'seconds');
    $scope.counter = timeleft;
    $scope.startTimeout();
  });
  
    socketService.socket.on('ended',function(){
     $timeout.cancel(mytimeout);
    })
    
    
}]);

//the chat controller
teamChat.controller('chatCtrl', [ '$scope', '$cookies','$stateParams', 'socketService', 'listService' , function($scope, $cookies, $stateParams, socketService, listService) {
  $scope.$watch('msg', function(newval, oldval) {
    });
   $cookies.put('sessionid', $stateParams.sessionid);
   var dataPromise = listService.getData($stateParams.sessionid);
   dataPromise.then(function(result) {  // this is only run after $http completes
       $scope.maininfo.sessionname = result.sessionName;
       $scope.maininfo.chatStatus = result.chatStatus;
       if (result.chatStatus === 'active'){
         $scope.maininfo.endtime = result.endTime;
       }
    });
   
   var myEl = angular.element( document.querySelector( '#chat-log' ) );
   
//PRIMARY FUNCTIONS
  // Sets the client's username
  var setUsername = function (username, sessionid) {
    

    // If the username is valid
    if (username) {

      
      // Tell the server your username
      socketService.socket.emit('add user', username, sessionid);
    }
  }

  // Sends a chat message
  var sendMessage = function (username, message) {
    // Prevent markup from being injected into the message
    // if there is a non-empty message and a socket connection
    if (message) {
      // tell server to execute 'new message' and send along one parameter
      socketService.socket.emit('new message', username, message);
    }
  };
  // Socket events

  // Whenever the server emits 'login', log the login message
  socketService.socket.on('login', function (data) {
    var connected = true;
    // Display the welcome message
    var message = 'Welcome to this session';
    data.forEach(function(element) {
      myEl.append('<li>'+element.userName+' on '+ element.time +': ' +element.data+'</li>');
    }, this);
    myEl.append('<li>'+message+'</li>');
    
  });
  
  // Whenever the server emits 'user joined', log it in the chat body
  socketService.socket.on('user joined', function (data) {
    myEl.append(data.username + ' joined ' + $scope.maininfo.sessionname); 
  });
  
  //output the messages
  socketService.socket.on('incoming message', function (data) {
    myEl.append('<li><span class="glyphicon glyphicon-user"></span> '+data.username + ' : ' + data.message+'</li>');  
  });
  
  //CODE IN ACTION
  setUsername($cookies.get('username'), $cookies.get('sessionid'), $scope.maininfo.sessionname);
  $scope.submit = function() {
    sendMessage($cookies.get('username'), $scope.msg);
     myEl.append('<li><span class="glyphicon glyphicon-star"></span> You: '+$scope.msg+'</li>'); 
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

teamChat.service('socketService', function(){
    this.socket = io();
});

teamChat.service('listService',['$http', function($http) {
  /*this.getActiveChats = function(){
    $http({
      method: 'GET',
      url: '/api/activechats'
    }).then(function successCallback(response) {
      console.log(response.data);
      return response.data;
    
    }, function errorCallback(response) {
      console.log('error getting list'+ response);
    
  });
  }*/
  var getData = function(list) {

        return $http({method:"GET", url:"/chats/"+list}).then(function(result){
            return result.data;
        });
    };
    return { getData: getData };

    
  
}])




teamChat.directive('stateLoadingIndicator', function($rootScope) {
  return {
    restrict: 'E',
    template: "<div ng-show='isStateLoading' class='loading-indicator'>" +
    "<div class='loading-indicator-body'>" +
    "<h3 class='loading-title'>Loading...</h3>" +
    "<div class='spinner'><chasing-dots-spinner></chasing-dots-spinner></div>" +
    "</div>" +
    "</div>",
    replace: true,
    link: function(scope, elem, attrs) {
      scope.isStateLoading = false;
 
      $rootScope.$on('$stateChangeStart', function() {
        scope.isStateLoading = true;
      });
      $rootScope.$on('$stateChangeSuccess', function() {
        scope.isStateLoading = false;
      });
    }
  };
})

teamChat.filter('secondsToDateTime', [function() {
    return function(seconds) {
        return new Date(1970, 0, 1).setSeconds(seconds);
    };
}])

