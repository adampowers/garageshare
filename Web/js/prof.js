//var fbUserID;
function getUserPic(currUserId)
{
		var  urlSetUp;
		urlSetUp = "./pic/" + currUserId; //creating a URL format for the profile picture
		var friend1Id ;	
		var friend2Id;
		var friend3Id;
		if (currUserId == 2) //depending on the userId, it will set the other users as friends of the current user
		{
			friend1Id = 1;
			friend2Id = 3;
			friend3Id = 4;
		}
		else if (currUserId == 3)
		{
			friend1Id = 1;
			friend2Id = 2;
			friend3Id = 4;
		}
		else if (currUserId == 4)
		{
			friend1Id = 1;
			friend2Id = 2;
			friend3Id = 3;
		}
		else
		{
			friend1Id = 2;
			friend2Id = 3;
			friend3Id = 4;
		}
		var friend1 = userDB({userId:friend1Id}).first(); //gets the information for each friend
		var friend2 = userDB({userId:friend2Id}).first();
		var friend3 = userDB({userId:friend3Id}).first();
		
//setting up and displaying the name, profile picture, and reputation of the current user
	$("#profPic").html('<h4> '+ currentUser.realName + '</h4> <img src=' + urlSetUp + '.jpg width="80" height="80"> &nbsp <img src=./img/Leaf' + currentUser.reputation + '.png>').show();	
//getting the profile pictures and location of friends and displaying 
		$("#friend1Pic").html( '<img src=./pic/' + friend1Id + '.jpg width="50" height="50"> <br> '); 
		$("#locateF1").html('<h4> ' + friend1.realName + '</h4>' + friend1.city + ', ' + friend1.state +'<br>').show();
		$("#friend2Pic").html( '<img src=./pic/' + friend2Id + '.jpg width="50" height="50"> <br>');
		$("#locateF2").html('<h4> ' + friend2.realName + '</h4>' + friend2.city + ', ' + friend2.state).show();
		$("#friend3Pic").html( '<img src=./pic/' + friend3Id + '.jpg width="50" height="50"> <br>');
		$("#locateF3").html('<h4> ' + friend3.realName + '</h4>' + friend3.city + ', ' + friend3.state).show();
}
/*
function getFBpic(id){
		fbUserID = id;
		var src = 'http://graph.facebook.com/' + id + '/picture';
		$("#repMain").html('HI I"M TESTING <img src=' + src + ' width="50" height="50"> ' ).show();
}*/