/*global angular */
'use strict';

/**
 * The main candy app module
 */

var candy = 
    angular.module('candy', ['firebase','ngTouch','ngTouchstart','ngRoute'])
    .config(['$locationProvider', function ($locationProvider) {
        $locationProvider.html5Mode(true);
     }])
    //https://candyguideweb-d7d76.firebaseio.com/
    //https://candyguide-test.firebaseio.com/
    .constant('FIREBASE_URL', 'https://candyguide-test.firebaseio.com/')
    .config(['$routeProvider', function($routeProvider){
        $routeProvider
            .when('/', {
                templateUrl: '/views/top/top.htm',
                reloadOnSearch: false
            })
            .when('/sharemap/:roomid', {
                templateUrl: '/views/room/room.htm',
                reloadOnSearch: false
            })
            .otherwise({
                redirectTo: '/'
            });
    }])
    .factory('MARKER',function(){
        return {
            latitude : "",
            longitude : ""
        }
    })
    .factory('GOOGLE',function(){
        return {
            googlemap : "",
            markers : new Array(),
            markers_meet : new Array(),
            infoWindows :new Array(),
            placeService : "",
            watchID : "init"
        }
    })
    .factory('SCREEN',function(){
        return {
            resize_count : 0,
            resizeClass : "",
            messageInputHeight :""
        }
    })
    .factory('ROOMID',function(){
        return {
            roomid : window.location.pathname.split("/")[2]
        }
    })
    .factory("FirebaseAuth", ["$firebaseAuth",function($firebaseAuth) {
        var config = {
            apiKey: "AIzaSyCgH8GYpKZcG_1uOsGY0yaoQDYPjunClvg",
            authDomain: "candyguide-test.firebaseapp.com",
            databaseURL: "https://candyguide-test.firebaseio.com",
            storageBucket: "candyguide-test.appspot.com",
        };
        firebase.initializeApp(config);
        return {
            auth : $firebaseAuth(),
            userAuth : "",
            userInfo : "",
            displayname : "",
            photoURL : ""
        }
     }])
    // after starting the application
    .run(function($q,$route,$routeParams,$location,$rootScope,$firebaseAuth,$firebaseObject, $firebaseArray,firebaseService,screenEventService,gpslocationService,googlemapService,popupService,ROOMID,GOOGLE,SCREEN,FirebaseAuth){
        //initialize firebase
        firebaseService.initialize();
        firebaseService.facebookRedirect(firebaseService.registerUser).then(function(user){
            FirebaseAuth.userAuth = firebaseService.getAuth();
            FirebaseAuth.userInfo = $firebaseObject(firebaseService.selectLoginUser(FirebaseAuth.userAuth.uid));
            $rootScope.userInfo = FirebaseAuth.userInfo;
        });
        $rootScope.$on('$routeChangeSuccess', function(event, current, previous){
            // wait for getAuth
            FirebaseAuth.auth.$waitForSignIn().then(function () {
                if(FirebaseAuth.auth.$getAuth()){
                    FirebaseAuth.userInfo = $firebaseObject(firebaseService.selectLoginUser(FirebaseAuth.auth.$getAuth().uid));
                    $rootScope.userInfo = FirebaseAuth.userInfo;
                    FirebaseAuth.userInfo.$loaded().then(function(user) {
                        FirebaseAuth.displayname = user.displayname;
                        if(user.photoURL){
                            FirebaseAuth.photoURL = user.photoURL;
                        }
                    });
                }
                //Init function load map and etc......
                var rooms = firebaseService.referenceSharemap();
                $firebaseObject(rooms).$loaded().then(function(room) {
                    if(room[ROOMID.roomid]){
                        var crios = !!navigator.userAgent.match(/crios/i);
                        var safari = !!navigator.userAgent.match(/safari/i);
                        var iphone = !!navigator.userAgent.match(/iphone/i);
                        var line = !!navigator.userAgent.match(/Line/i);
                        if(safari && !crios && iphone && !line){
                            $("#map").css("height","90vh");
                        }
                        $rootScope.candy_map_tab = {
                            "min-height" : 50 + "vh",
                            "max-height" : 50 + "vh"
                        }
                        $rootScope.flex_box = {
                            "min-height" : 50 + "vh",
                            "max-height" : 50 + "vh"
                        }
                        SCREEN.messageInputHeight = $('.messageInputAreaDiv').height();
                        
                        $rootScope.groupname = room[ROOMID.roomid].name;
                        if (navigator.geolocation) {
                            if(GOOGLE.watchID != "init"){
                                navigator.geolocation.clearWatch(GOOGLE.watchID);
                            }
                            navigator.geolocation.getCurrentPosition(function(position) {
                                var authfunc = function(){
                                    var deferred = $q.defer();
                                    if(FirebaseAuth.auth.$getAuth() && FirebaseAuth.auth.$getAuth().uid){
                                        var userDatas = $firebaseObject(firebaseService.selectLoginUser(FirebaseAuth.auth.$getAuth().uid));
                                        userDatas.$loaded().then(function(userData) {
                                            if(!userData.displayname){
                                                popupService.swal_init_on(function(){
                                                    FirebaseAuth.userInfo = $firebaseObject(firebaseService.selectLoginUser(FirebaseAuth.auth.$getAuth().uid));
                                                    $rootScope.userInfo = FirebaseAuth.userInfo;
                                                    //UpdateUser
                                                    firebaseService.updateUser(position,"on");
                                                    FirebaseAuth.userInfo.$loaded().then(function(user) {
                                                        FirebaseAuth.displayname = user.displayname;
                                                        deferred.resolve();
                                                    });
                                                });
                                            }else{
                                                //UpdateUser
                                                firebaseService.updateUser(position,"on").then(function () {
                                                    deferred.resolve();
                                                });
                                            }
                                        });
                                    }else{
                                        firebaseService.registerAuth().then(function(user){
                                            FirebaseAuth.userAuth = user;
                                            popupService.swal_init_on(function(){
                                                FirebaseAuth.userInfo = $firebaseObject(firebaseService.selectLoginUser(FirebaseAuth.auth.$getAuth().uid));
                                                $rootScope.userInfo = FirebaseAuth.userInfo;
                                                //UpdateUser
                                                firebaseService.updateUser(position,"on");
                                                deferred.resolve();
                                            });
                                        });
                                    }
                                    return deferred.promise;
                                }
                                authfunc().then(function() {
                                    //ifでもelseでも実行
                                    var mylatlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                                    //init MAp
                                    googlemapService.loadMap(mylatlng);
                                    // select User
                                    var users = firebaseService.referenceUserOnce();
                                    //init create Marker
                                    firebaseService.initloadUser(users,firebaseService.selectLoginUser);
                                    //infowindow
                                    var infomessages = firebaseService.referenceMessage();
                                    firebaseService.loadinfowindow(infomessages);
                                    //watch position
                                    GOOGLE.watchID = gpslocationService.currentPosition();
                                    //watch add user
                                    firebaseService.referenceAddUser(firebaseService.selectLoginUser);
                                    //watch change user
                                    firebaseService.referenceChangeUser(firebaseService.selectLoginUser);
                                    //watch addmessage
                                    firebaseService.referenceAddMessage();
                                    //watch addmessage
                                    firebaseService.referenceAddMeetup();
                                    //watch changemessage
                                    firebaseService.referenceChangeMeetup();
                                    //watch Removemessage
                                    firebaseService.referenceRemoveMeetup();
                                });
                            }, 
                            // エラー時のコールバック関数は PositionError オブジェクトを受けとる
                            function(error) {//UpdateUser
                                if(!FirebaseAuth.auth.$getAuth()){
                                    firebaseService.registerAuth().then(function(user){
                                        FirebaseAuth.userAuth = user;
                                        popupService.swal_init_on(function(){
                                            FirebaseAuth.userInfo = $firebaseObject(firebaseService.selectLoginUser(FirebaseAuth.auth.$getAuth().uid));
                                            $rootScope.userInfo = FirebaseAuth.userInfo;
                                            //UpdateUser
                                            firebaseService.updateUser("","off");
                                            FirebaseAuth.userInfo.$loaded().then(function(user) {
                                                FirebaseAuth.displayname = user.displayname;
                                            });
                                        });
                                    });
                                }
                                GOOGLE.watchID = "off";
                                //Location on のユーザーがいればそのlocationを参照
                                var userlocation = firebaseService.referenceUserOn();
                                $firebaseObject(userlocation).$loaded().then(function(userlocation) {
                                    var mylatlng = new google.maps.LatLng("35.690921", "139.700258");
                                    angular.forEach(userlocation, function(value, key) {
                                        mylatlng = new google.maps.LatLng(value.latitude, value.longitude);
                                    });
                                    //LocationOnのユーザーのLocationを中心地として表示 init MAp
                                    googlemapService.loadMap(mylatlng);
                                    // select User
                                    var users = firebaseService.referenceUserOnce();
                                    //init create Marker
                                    firebaseService.initloadUser(users,firebaseService.selectLoginUser);
                                    //infowindow
                                    var infomessages = $firebaseObject(firebaseService.referenceMessage());
                                    firebaseService.loadinfowindow(infomessages);
                                    //watch add user
                                    firebaseService.referenceAddUser();
                                    //watch change user
                                    firebaseService.referenceChangeUser();
                                    //watch addmessage
                                    firebaseService.referenceAddMessage();
                                    //watch addmessage
                                    firebaseService.referenceAddMeetup();
                                    //watch changemessage
                                    firebaseService.referenceChangeMeetup();
                                    //watch Removemessage
                                    firebaseService.referenceRemoveMeetup();
                                });
                            });
                        }else{
                        }
                    }else{
                        firebaseService.referenceUserRooms().then(function(roomusers){
                            $rootScope.userrooms = roomusers;
                        });
                        //url doesn't exist
                        $location.path('/');
                        
                    }
                })
            });
        });
    });