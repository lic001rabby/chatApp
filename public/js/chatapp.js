
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
              templateUrl: "templates/userlist.html"
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
teamChat.controller('ListCtrl',['$scope','listService', function ($scope, listService) {
  $scope.isCollapsed = false;
  $scope.class = 'glyphicon glyphicon-minus'
  var myDataPromise = listService.getData('activechats');
    myDataPromise.then(function(result) {  // this is only run after $http completes
       $scope.maininfo.active = result;
       console.log($scope.maininfo.active);
    });
    $scope.$watch('isCollapsed', function() {
       
       if($scope.isCollapsed === true) $scope.class = 'glyphicon glyphicon-plus';
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
       console.log(newVal);
       console.log($scope.maininfo);
       
    });
    
    
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

teamChat.controller('chatCtrl', [ '$scope', '$cookies','$stateParams', 'socketService', 'listService' , function($scope, $cookies, $stateParams, socketService, listService) {
  $scope.$watch('msg', function(newval, oldval) {
    });
   $cookies.put('sessionid', $stateParams.sessionid);
   var dataPromise = listService.getData($stateParams.sessionid);
   dataPromise.then(function(result) {  // this is only run after $http completes
       $scope.maininfo.sessionname = result.sessionName;
       console.log($scope.maininfo.sessionname);
    });
   
   console.log('promised: '+ dataPromise.sessionName)
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
    var message = "Welcome to this session about "+ data;
    console.log(message);
    myEl.append('<li>'+message+'</li>');
    
  });
  
  // Whenever the server emits 'user joined', log it in the chat body
  socketService.socket.on('user joined', function (data) {
    myEl.append(data.username + ' joined ' + $scope.maininfo.sessionname); 
  });
  
  //output the messages
  socketService.socket.on('incoming message', function (data) {
    console.log(data.username + ' said- ' + data.message);
    myEl.append('<li>'+data.username + ' said- ' + data.message+'</li>');  
  });
  
  //CODE IN ACTION
  setUsername($cookies.get('username'), $cookies.get('sessionid'), $scope.maininfo.sessionname);
  $scope.submit = function() {
    sendMessage($cookies.get('username'), $scope.msg);
     myEl.append('<li>'+$scope.msg+'</li>'); 
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

