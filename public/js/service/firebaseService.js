/*global candy, angular, Firebase */
'use strict';

candy.service('firebaseService', function ($q,$firebaseAuth,$firebaseObject,googlemapService,FIREBASE_URL,GOOGLE,ROOMID,FirebaseAuth) {
    var ref;
    // Initialize
    this.initialize = function(){
        // Initialize Firebase
        ref = firebase.database().ref();
    }
    //Facebook
    this.facebookRedirect = function(callback){
        var deferred = $q.defer();
        firebase.auth().getRedirectResult().then(function(result) {
            if (result.credential) {
                // This gives you a Facebook Access Token. You can use it to access the Facebook API.
                var token = result.credential.accessToken;
                var credential = firebase.auth.FacebookAuthProvider.credential(result.credential.accessToken);
                FirebaseAuth.userInfo = FirebaseAuth.auth.$getAuth();
                callback(FirebaseAuth.auth.$getAuth(),"facebook");
                deferred.resolve(result.user);
            }
        }).catch(function(error) {
            console.log("error");
        });
        return deferred.promise;
    }
    //RegisterAuth
    this.registerAuth = function(){
        var deferred = $q.defer();
        FirebaseAuth.auth.$signInAnonymously().then(function(firebaseUser) {
        }).catch(function(error) {
            console.log("error");
        });
        FirebaseAuth.auth.$onAuthStateChanged(function(firebaseUser) {
            if(firebaseUser){
                deferred.resolve(firebaseUser);
            }
        });
        return deferred.promise;
    }
    //GetAuth
    this.getAuth = function(){
        return FirebaseAuth.auth.$getAuth();
    }
    //Add User
    this.registerUser = function(userinfo,provider){
        ref.child('users').child(userinfo.uid).update({
            displayname : userinfo.displayName,
            photoURL : userinfo.photoURL,
            provider : provider,
            latitude : "",
            longitude : "",
            time : new Date().getTime()
        });//set
    }
    //Select User
    this.selectLoginUser = function(uid){
        return ref.child('users').child(uid);
    }
    //Add new room
    this.registerSharemap = function(url,inputgroupname,callback){
        ref.child("room").child(url).set({
            name : inputgroupname
        },callback);
    }
    //Init create marker
    this.initloadUser = function(users,callback){
        console.log(users);
        $firebaseObject(users).$loaded().then(function(user) {
            console.log(user);
            angular.forEach(user, function(value, key) {
                if(value.share == "on"){
                    var userslocation = callback(key);
                    $firebaseObject(userslocation).$loaded().then(function(userlocation) {
                        console.log(userlocation);
                        if(userlocation.displayname && userlocation.latitude && userlocation.longitude){
                            googlemapService.createMarker(userlocation.latitude, userlocation.longitude, userlocation.displayname, key, userlocation.provider, userlocation.photoURL,googlemapService.markercreate);
                        }
                    });
                }
            });
        });
    }
    //create infowindow
    this.loadinfowindow = function(infomessages){
        $firebaseObject(infomessages).$loaded().then(function() {
            angular.forEach(infomessages, function(value, key) {
                // create and handle info window
                googlemapService.createInfoWindow(value,key);
                googlemapService.handleInfoWindow(value,key);
            });
        });
    }
    //SelectUser once
    this.referenceUserOnce = function(){
        return ref.child('room').child(ROOMID.roomid).child('roomusers').orderByChild("share").equalTo("on");
    }
    //watch add user
    this.referenceAddUser = function(callback){
        console.log("referenceAddUser 1");
        ref.child('room').child(ROOMID.roomid).child('roomusers').on('child_added', function(snapshot, addChildKey) {
            var userslocation = callback(snapshot.key);
            $firebaseObject(userslocation).$loaded().then(function(userlocation) {
                if(userlocation.displayname && userlocation.latitude && userlocation.longitude){
                    console.log("referenceAddUser 2");
                    googlemapService.createMarker(userlocation.latitude, userlocation.longitude, userlocation.displayname, snapshot.key, userlocation.provider, userlocation.photoURL,googlemapService.markercreate);
                }
            });
        });
    }
    //watch change user
    this.referenceChangeUser = function(callback){
        ref.child('room').child(ROOMID.roomid).child('roomusers').orderByChild("share").equalTo("on").on('child_changed', function(snapshot, changeChildKey) {
            var userslocation = callback(snapshot.key);
            $firebaseObject(userslocation).$loaded().then(function(userlocation) {
                if(userlocation.displayname && userlocation.latitude && userlocation.longitude){
                    googlemapService.changeMarker(userlocation,snapshot.key);
                }
            });
        });
    }
    //watch addmessage
    this.referenceAddMessage = function(){
        ref.child('room').child(ROOMID.roomid).child('message').limitToLast(1).on('child_added', function(snapshot, addChildKey) {
            var adddata = snapshot.val();
            // create and handle info window
            googlemapService.createInfoWindow(adddata,snapshot.key);
            googlemapService.handleInfoWindow(adddata,snapshot.key);
            if(adddata.kind=="message"){
                Materialize.toast("[" + adddata.displayname + "]" + " : " + adddata.message, 5000, 'rounded message') 
            }else if(adddata.kind=="attend" || adddata.kind=="meetup"){
                Materialize.toast(adddata.message , 5000, 'rounded attend meetup');
            }else if(adddata.kind=="meetupremove"){
                Materialize.toast(adddata.message , 5000, 'rounded meetupremove');
            }else if(adddata.kind=="meetupchange"){
                Materialize.toast(adddata.message , 5000, 'rounded meetupchange');
            }
        });
    }
    //watch addmeetup
    this.referenceAddMeetup = function(){
        ref.child('room').child(ROOMID.roomid).child('meetup').on('child_added', function(snapshot, addChildKey) {
            var adddata = snapshot.val();
            //create meetup
            googlemapService.meetupCreateMarkers(adddata,snapshot.key,function(){});
        });
    }
    //watch addmeetup
    this.referenceChangeMeetup = function(){
        ref.child('room').child(ROOMID.roomid).child('meetup').on('child_changed', function(snapshot, changeChildKey) {
            var changedata = snapshot.val();
            //change meetup
            googlemapService.meetupChangeMarkers(changedata,snapshot.key);
        });
    }
    //watch removemeetup
    this.referenceRemoveMeetup = function(){
        ref.child('room').child(ROOMID.roomid).child('meetup').on('child_removed', function(snapshot, changeChildKey) {
            var removedata = snapshot.val();
            //Remove meetup
            googlemapService.meetupRemoveMarkers(removedata,snapshot.key);
            
        });
    }

    //SelectSharemap
    this.referenceSharemap = function(){
        return ref.child('room');
    }
    //select User for getting location
    this.referenceUserOn = function () {
        return ref.child('room').child(ROOMID.roomid).child('users').orderByChild("share").equalTo("on").limitToLast(1);
    }
    //AddUser
    this.registerRoomUser = function (name,share) {
        ref.child('users').child(FirebaseAuth.auth.$getAuth().uid).update({
            displayname : name,
            provider : "anonymous"
        });
        ref.child('room').child(ROOMID.roomid).child('roomusers').child(FirebaseAuth.auth.$getAuth().uid).update({
            share : share,
            time : new Date().getTime()
        });//set
    }
    //UpdateUSer
    this.updateUser = function (position,share) {
        if(share == "on"){
            ref.child('users').child(FirebaseAuth.auth.$getAuth().uid).update({
                latitude : position.coords.latitude,
                longitude : position.coords.longitude,
                time : new Date().getTime()
            });//set
            ref.child('room').child(ROOMID.roomid).child('roomusers').child(FirebaseAuth.auth.$getAuth().uid).update({
                share : share,
                time : new Date().getTime()
            });//set
        }else{
            ref.child('users').child(FirebaseAuth.auth.$getAuth().uid).update({
                latitude : position.coords.latitude,
                longitude : position.coords.longitude,
                time : new Date().getTime()
            });//set
            ref.child('room').child(ROOMID.roomid).child('roomusers').child(FirebaseAuth.auth.$getAuth().uid).update({
                share : share,
                time : new Date().getTime()
            });//set
        }
    }
    //select Message
    this.referenceMessage = function () {
        return ref.child('room').child(ROOMID.roomid).child('message').orderByChild("time");
    }
    //Join User and message
    this.joinUserandMessage = function(selectLoginUser,message){
        var deferred = $q.defer();
        var usermessage = new Array();
        var i = 0;
        message.$loaded().then(function(messageData) {
            console.log("pass" + i);
            angular.forEach(messageData, function(value, key) {
                var user = selectLoginUser(value.key);
                $firebaseObject(user).$loaded().then(function(userinfo) {
                    value["displayname"] = userinfo.displayname;
                    value["photoURL"] = userinfo.photoURL;
                });
                usermessage[i] = value;
                i = i + 1;
            });
            deferred.resolve(usermessage);
        });
        return deferred.promise;
    }
    //AddMessage
    this.registerMessage = function (kind,messageInput) {
        var postsRef = ref.child("room").child(ROOMID.roomid).child("message");
        var newPostRef = postsRef.push();
        newPostRef.set({
            key : FirebaseAuth.auth.$getAuth().uid ,
            time : new Date().getTime(),
            kind : kind,
            message : messageInput
        });//set
    }
    //Add MeetUp Marker
    this.registerMeetUpMarker = function (place) {
        var postsRef = ref.child("room").child(ROOMID.roomid).child("meetup");
        var newPostRef = postsRef.push();
        //Set meetup
        newPostRef.update({
            key : window.localStorage.getItem([ROOMID.roomid]),
            latitude : place.geometry.location.lat(),
            longitude : place.geometry.location.lng(),
            kind : "search"
        });//set
    }
    //Add MeetUp Marker from nothing
    this.registerMeetUpMarkerNothing = function () {
        var latlng = GOOGLE.googlemap.getCenter();
        var postsRef = ref.child("room").child(ROOMID.roomid).child("meetup");
        var newPostRef = postsRef.push();
        //Set meetup
        newPostRef.update({
            key : window.localStorage.getItem([ROOMID.roomid]),
            latitude : latlng.lat(),
            longitude : latlng.lng(),
            kind : "nothing"
        });//set
    }
    //update MeetUp MArker
    this.updateMeetUpMarkerNothing = function (key,position) {
        //Set meetup
        ref.child('room').child(ROOMID.roomid).child('meetup').child(key).update({
            latitude : position.lat(),
            longitude : position.lng()
        });//set
    }
    this.removeMeetUpMarker = function(){
        ref.child('room').child(ROOMID.roomid).child("meetup").remove();
    }
})