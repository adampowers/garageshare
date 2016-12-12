//=============================================================================
// File           : shim.js
// Author         : Shimona Carvalho, Narine Cholakyan
// Date           : 03/15/2012
// Description    : Contains functionality for 
//                    Current user setup
//                    Globals
//                    Document.ready and calls to load components
//=============================================================================

//=============================================================================
// GLOBAL VARIABLES
//=============================================================================
//Current user
var currentUser;
var currentUserId;
var currentUserLatLng;
var loadCounter = 0;

//DB related
var userDB;
var itemDB;
var msgDB;
var transDB;

//Search related
var map;
var mapMarkersArray = [];
var infowindow;
var searchResults = [];
var searchOwners = [];
var numNewItems;
var sliderStart;


//===========================================================================
// Function:          getCurrentUserId
// Description:       Gets the current user id from GET string
//===========================================================================
function getCurrentUserId()
{
  (function(){ // Import GET Vars
     document.$_GET = [];
     var urlHalves = String(document.location).split('?');
     if(urlHalves[1]){
        var urlVars = urlHalves[1].split('&');
        for(var i=0; i<=(urlVars.length); i++){
           if(urlVars[i]){
              var urlVarPair = urlVars[i].split('=');
              document.$_GET[urlVarPair[0]] = urlVarPair[1];
           }
        }
     }
  })();
  
  currentUserId = parseInt(document.$_GET['userId']);
}

//===========================================================================
// Function:          initializeDBs
// Description:       Initializes the databases that are used by component
//                    code
//===========================================================================
function initializeDBs() 
{
  userDB = TAFFY();
  userDB.insert(userList);
  itemDB = TAFFY();
  itemDB.insert(itemList);
  msgDB = TAFFY();
  msgDB.insert(msgList);
  transDB = TAFFY();
  transDB.insert(transList);
}

//===========================================================================
// Function:         loadModal
// Description:      Sets up modal windows
//===========================================================================
function loadModal()
{			
  $(function(){

    // Dialog for item details
    $('#dialog').dialog({
      autoOpen: false,
      width: 600,
      modal:true,
      buttons: {
        "Ok": function() { 
          $(this).dialog("close"); 
        }, 
        "Cancel": function() { 
          $(this).dialog("close"); 
        } 
      }
    });
    
    // Dialog for small messages
    $('#minidialog').dialog({
      autoOpen: false,
      width: 400,
      modal:true,
      buttons: {
        "Ok": function() { 
          $(this).dialog("close"); 
        }, 
      }
    });				
    
    //Sets up click for unhandled buttons
    $('body').on('click', '.btn-supermini', function () {
      loadMiniDialog('Sorry!', 'This function needs an actual back-end and therefore hasn\'t been implemented yet.');
      });
    
    
  });
}

//===========================================================================
// Function:          setupCurrentUser
// Description:       gets user information for current User
//===========================================================================
function setupCurrentUser()
{
  //============================================================
  // SETUP CURRENT USER
  //============================================================
  //Get user id from query string
  getCurrentUserId();
  //TESTING FB PROFILE PIC
  if (currentUserId > 10)
  {
		getFBpic(currentUserId);
  }
  //end here
  if (!currentUserId)
  {
    //console.log("No user logged in!");
    //return false;
    currentUserId = 1;
  }
  
  //Get users info from userDB
  currentUser = userDB({userId:currentUserId}).first();
  if (!currentUser)
  {
    console.log("No user found with id " + currentUserId + "!!");
    return false;
  }
  currentUser.latlng = new google.maps.LatLng(currentUser.lat, currentUser.lon);
  return true;
}   

//===========================================================================
// Function:          document.ready
// Description:       Loads all the initialization functions for dbs and 
//                    components
//===========================================================================
$(document).ready(function() {

  initializeDBs();

  if (setupCurrentUser())
  {
    $('#navRow').load('navbar.html');
    $('#welcome').text(currentUser.username);  
    
    loadAlerts();                   //shim.js:loadAlerts populates Alerts component
    /* Trying something */
    
       var elements = document.getElementsByTagName('div');
       n = elements.length;
      for (var i = 0; i < n; i++) 
      {
       var e = elements[i];
       if (e.className == "panel-header")
        console.log(e.innerHTML);
      }


    loadNewItems();                 //shim.js:loadNewItems populates New Items component
    loadModal();                    //main.js:loadModal sets up modals
    getUserPic(currentUser.userId); //prof.js:getUserPic gets profile and friend pictures
    loadBorrowedItems();            //shim.js:loadNewItems populates Borrowed Items component
    loadLentItems();                //shim.js:loadNewItems populates Lent Items component

    }
  else
  {
    $('#navRow').load('navbar.html');
    $('.mainCol').text("ERROR: No user logged in.");
  }
  
});