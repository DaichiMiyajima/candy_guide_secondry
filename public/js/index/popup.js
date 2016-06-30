function swal_init_on(candyService,uniqueurl,ref,position){
    swal({
        title: "SHARE YOUR LOCATION!",
        text: "Write your name or nickname:",
        type: "input",
        showCancelButton: false,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: "Write your NAME"
    }, function(inputValue){
        if (inputValue === false) return false;
        if (inputValue === "") {
            swal.showInputError("You need to write your name!");
            return false
        }
        var postsRef = ref.child("sharemap").child(uniqueurl).child('users');
        var newPostRef = postsRef.push();
        var postID = newPostRef.key();
        //AddUser
        candyService.registerUser(inputValue,position,uniqueurl,"on",postID);
        // Store session
        window.localStorage.setItem([uniqueurl],[postID]);
        window.localStorage.setItem([uniqueurl+"name"],[inputValue]);
        yourname = inputValue;
        //AddMessage
        candyService.registerMessage("attend",yourname + " attend");
        swal("Nice!", "You are " + inputValue, "success");
    });
}

function swal_locationoff(callback){
    swal({
        title: "SEE FRIEND'S LOCATION!",
        text: "Write your name or nickname:(your location doesn't share!!)",
        type: "input",
        showCancelButton: false,
        closeOnConfirm: false,
        animation: "slide-from-top",
        inputPlaceholder: "Write your NAME"
    }, callback);
}

function swal_url(){
    swal({
        title: "RIGHT?",
        text: "You url doesn't exist! Confirm right url!",
        type: "warning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: false
        },
    function(isConfirm){
        if (isConfirm) {
            window.location.href = "/" ;
        }
    });
}

function swal_relocation(){
    swal({
        title: "RIGHT?",
        text: "You geolocation is off. If you can share your location, I would like yout to re-login.",
        type: "warning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: true,
        showCancelButton: true
        },
    function(isConfirm){
        if (isConfirm) {
            localStorage.removeItem(uniqueurl);
            window.location.reload();
        }
    });
}

function swal_addmessage(){
    swal({
        title: "SHARE YOUR MESSAGE!",
        text: "Write your message:",
        type: "input",
        showCancelButton: true,
        animation: "slide-from-top",
        inputPlaceholder: "Write your NAME",
        closeOnConfirm: true,
        closeOnCancel: true
    }, function(inputValue){
        if (inputValue === false) return false;
        if (inputValue !== "") {
        var key = window.localStorage.getItem([uniqueurl[2]]);
        var postsRef = ref.child("sharemap").child(uniqueurl[2]).child("message");
        var newPostRef = postsRef.push();
        var postID = newPostRef.key();
        ref.child('sharemap').child(uniqueurl[2]).child("message").child(postID).set({
            key : key ,
            name : yourname,
            time : Firebase.ServerValue.TIMESTAMP,
            kind : "message",
            message : inputValue
        });//set
        }
    });
}


function swal_remove_meetUpMarker(key){
    swal({
        title: "Remove Marker?",
        type: "warning",
        text: "You can put only one marker within group:",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: true,
        showCancelButton: true
        },
    function(isConfirm){
        if (isConfirm) {
            ref.child('sharemap').child(uniqueurl[2]).child("meetup").child(key).remove();
            delete(markers_meet);
        }
    });
}

function swal_remove_meetUpMarkers(){
    swal({
        title: "Remove Marker?",
        type: "warning",
        text: "You can put only one marker within your group:",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: true,
        showCancelButton: true
        },
    function(isConfirm){
        if (isConfirm) {
            ref.child('sharemap').child(uniqueurl[2]).child("meetup").remove();
            delete(markers_meet);
            //Delete route
            if(directionsDisplayArray[direction_number]){
                directionsDisplayArray[direction_number].setMap(null);
                directionsDisplayArray[direction_number].setDirections(null);
            }
            var postsmessageRef = ref.child("sharemap").child(uniqueurl[2]).child('message');
            var newmessagePostRef = postsmessageRef.push();
            var messagepostID = newmessagePostRef.key();
            ref.child('sharemap').child(uniqueurl[2]).child('message').child(messagepostID).set({
                key : window.localStorage.getItem([uniqueurl[2]]),
                name : yourname,
                time : Firebase.ServerValue.TIMESTAMP,
                kind : "meetupremove",
                message : yourname + " remove marker"
            });//set
        }
    });
}

function swal_must_register_meetupMarker(){
    swal({
        title: "RIGHT?",
        text: "Marker doesn't exist! Register Marker!",
        type: "warning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: false
    });
}

function swal_cannot_read_direction(){
    swal({
        title: "Sorry",
        text: "I cannot read this direction. Sorry !!",
        type: "warning",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: false
    });
}

function swal_dragend(callback){
    swal({
        title: "Move Marker?",
        type: "warning",
        text: "Do you move marker ?",
        confirmButtonColor: "#DD6B55",
        confirmButtonText: "OK",
        closeOnConfirm: true,
        showCancelButton: true
        },callback);
}