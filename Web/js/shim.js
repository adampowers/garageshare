//=============================================================================
// File           : shim.js
// Author         : Shimona Carvalho
// Date           : 03/15/2012
// Description    : Contains functionality for following components
//                    Search results
//                    Mapping
//                    Borrowed and Lent Items
//                    New items
//                    Alerts
//                    Modal Item description dialogs
//=============================================================================


//=============================================================================
// Function       : initializeMap
// Description    : This function initializes the Google Maps API
// Global         : Initializes global variable map to new map.
//=============================================================================
function initializeMap()
{
  //Setup options for Google maps
  var myOptions = {
    center: currentUser.latlng,
    zoom: 15,
    mapTypeId: google.maps.MapTypeId.ROADMAP
  };
  
  //Create new map 
  map = new google.maps.Map(document.getElementById("mapCanvas"),
      myOptions);
      
  //Create home marker based on current user
  var marker = new google.maps.Marker({
    position: currentUser.latlng,
    title:'My House',
    icon: 'img/home.png'
    });
  marker.setMap(map); 
  
  return map;
}

//=============================================================================
// Function       : loadDialog
// Description    : Populates and opens Item Details Dialog
//=============================================================================
function loadDialog(entryStr, modeStr)
{
  //Get id from id string
  var id = entryStr.split("-")[1];
  id = parseInt(id);
  console.log("loadDialog entryId is " + id);
  
  //Find item in database
  var i = itemDB({itemId:id}).first();
  
  //If item does not exist
  if (!i)
  {
    $('#dialog .dialogItem .title').html("Item with id " + id + " not found.");
  }
  else //If item exists
  {
    //Set title of dialog
    $('#dialog').dialog('option', 'title', i.title + ' Details');

    $('#dialog .itemData .title').html(i.title);                  //Set title
    
    if (i.similarItemUrl.length > 0)                              //Set similar Item URL
    { 
      $('#dialog .similarItem td').html('<a href="' + i.similarItemUrl + '" target="_blank">See similar item online</a>'); 
    }
    else
    { 
      $('#dialog .similarItem').hide(); 
    }
          
    var user = userDB({userId:i.ownerId}).first();                //Get userdata        
    $('#dialog .itemData .owner .ivalue').html(user.realName);    //Set user info
    $('#dialog .itemData .desc .ivalue').html(i.description);     //Set item description
    
    if (i.image.length > 0)                                       //Set item image
      $('#dialog .itemThumb .thumb').attr('src', i.image);
    else
      $('#dialog .itemThumb .thumb').attr('src', 'img/itemNotFound_l.jpg');
      
    if (i.notes)                                                   //Set item Notes
    {      
      $('#dialog .itemData .notes').show();
      $('#dialog .itemData .notes .ivalue').html(i.notes);
    }
    else
      $('#dialog .itemData .notes').hide();

    var buttons = {};                                               //Setup buttons
    //Buttons are configured depending on how the item was called
    //From the borrowed/lent list etc...
    if (modeStr == 'borrowed')
    {
      buttons = {
              "Return item": function() { 
                $(this).dialog("close"); 
              }
            };
    }
    else if (modeStr == 'lent')
    {
      buttons = {
              "Send Reminder": function() { 
                $(this).dialog("close"); 
              } 
            };
    }
    else if (modeStr == 'viewNotMyItem')
    {
      buttons = {
              "Request Item": function() { 
                $(this).dialog("close"); 
              }
            };
    }
    //All windows have a cancel button
    buttons["Cancel"] = function() { 
                $(this).dialog("close"); 
              } 
    //Set the buttons
    $('#dialog').dialog('option', 'buttons', buttons);
  }
  //Open dialog
  $('#dialog').dialog('open');
}

//=============================================================================
// Function       : loadMiniDialog
// Description    : This dialog just shows a simple message and allows cancel 
//                  to close.
//=============================================================================
function loadMiniDialog(title, string)
{
  $('#minidialog').html(string);
  $('#minidialog').dialog('option', 'title', title);
  $('#minidialog').dialog('open');
}

//=============================================================================
// Function       : loadAlerts
// Description    : Sets up and loads the alert components which shows all 
//                  alerts targeted at current user.
//=============================================================================
function loadAlerts()
{
  //Get current users alerts
  var result = msgDB({ownerId:currentUserId,deleted:0});
  var newMsg;
  //If no results, close msg container
  if (result.count() == 0)
  {
    $('#msgContainer').hide();
  }
  //Else load alerts into container
  else
  {
    //Build html that will be appended
    newMsg = "<div class=\"panel-header\">Alerts</div>";
    $('#msgContainer').append(newMsg);  
    newMsg = "<ul>";
    
    //For each result msg
    result.each(function (r) {
    
      newMsg += "<li class=\"panel-entry\" id=\"entry-" + r.msgId + "\">\n";
      newMsg += "<button class=\"dismiss\" href=\"\" title=\"Dismiss Alert\">x</button>\n";
      
      //Change icon based on category of msg
      if (r.category == 1)
      {
        newMsg += "<i class=\"icon-time\"></i>";
      }
      else if (r.category == 2)
      {
        newMsg += "<i class=\"icon-question-sign\"></i>";
      }
      else if (r.category == 3)
      {
        newMsg += "<i class=\"icon-plus-sign\"></i>";
      }
      
      newMsg += "<span class=\"text\">"+ r.text +"</span></li>\n";
    });
    newMsg += "</ul>";
    
    //Append msg
    $('#msgContainer').append(newMsg);  
    
    //Enable dismiss button
    $('#msgContainer').on('click', '.dismiss', function() {      
      $(this).parent().hide('slow');
      });
    console.log("got past the click assign");
    
    //Show msg container
    $('#msgContainer').show();
  }

}
//===========================================================================
// Function:          clearMapMarkers
// Description:       Clears all the previous map markers from the map
//===========================================================================
function clearMapMarkers()
{
  // Removes the overlays from the map, but keeps them in the array
  if (mapMarkersArray) {
    for (i in mapMarkersArray) {
      mapMarkersArray[i].setMap(null);
    }
    mapMarkersArray.length = 0;
  }
}

//===========================================================================
// Function:          displayResultMap
// Description:       Displays the map with all the current results
//===========================================================================
function displayResultMap(result)
{
  //If no results found, do not display map
  if (result.length == 0)
  {
    if ($('#mapCanvas').css('display') != 'none')
    {
      $('#mapCanvas').hide();
    }
  }
  else
  {
    //If map not currently visible, initialize
    if ($('#mapCanvas').css('display') == 'none')
    {
      $('#mapCanvas').show();
      map = initializeMap();      
    }

    //Clear old map markers
    clearMapMarkers();
    
    //Create bounds info to allow map to zoom out to 
    //include all found items
    var prevOwnerId = -1;
    var mapBounds = new google.maps.LatLngBounds();
    mapBounds.extend(currentUser.latlng);

    //For each item in the result
    for (var i = 0; i < result.length; i++) 
    {            
      var r = result[i];
      var image = "img/tools.png";
      
      //Build array with owner information to populate item results
      //with useful information.
      if (r.ownerId != prevOwnerId)
      {
        //If this is a new owner (i.e. owner has no previous found items)
        var u = r.owner;
        if (u.lat.length > 0) 
        {            
          // Create marker for new owner
          var titleStr = u.realName.split(" ")[0] + " has " + r.title + "\n " + r.owner.distance.toFixed(2) + " mi away";
          var marker = new google.maps.Marker({ 
            position: r.owner.latlng,
            map: map,
            title: titleStr,
            icon: image
            });

          //Zoom map appropriately
          mapBounds.extend(r.owner.latlng);
          map.fitBounds(mapBounds);
          if (map.getZoom() > 15)
          {
            map.setZoom(15);
          }

          //save marker
          mapMarkersArray.push(marker);
          u.marker = marker;

          } //end if lat available
        
        prevOwnerId = r.ownerId;
      } //end if new owner

      else //if you have seen this owner previously update his items
      {
        var titleStr = r.owner.marker.getTitle()
        titleStr = titleStr.replace(/\n/, ", " + r.title + "\n ");
        r.owner.marker.setTitle(titleStr);
      }
        
      //Create hover animation for map marker
      if (r.owner.marker != undefined)
      {
        var identString = '#entry-' + r.itemId;
        var m = r.owner.marker;
        $(identString).mouseenter(function() {
          var hoverItemId = Number(this.id.substring(6));
          itemDB({itemId:hoverItemId}).first().owner.marker.setAnimation(google.maps.Animation.BOUNCE);
        });
        $(identString).mouseleave(function() {
          var hoverItemId = Number(this.id.substring(6));
          itemDB({itemId:hoverItemId}).first().owner.marker.setAnimation(null);
        });
      }//If owner is available
      
    }//for each item in search result
  }//if result.length > 0
}

//===========================================================================
// Function:          displayAllItems
// Description:       Displays All Items in database, only used for debug
//===========================================================================
function displayAllItems()
{
  var result = itemDB();
  var datadiv = document.getElementById("itemContainer");
  //For each result r
  result.each(function (r) {
  
    //Create a child div called entry
    var entry = document.createElement("div");
    entry.className = "searchItem";
    entry.id = "entry-" + r.itemId;
    
    //Fill the innerHTML with the following data.
    entry.innerHTML = "<div class=title>title:" + r.title + "</div>description:";
    entry.innerHTML += r.description;
    datadiv.appendChild(entry);
    });
}



//===========================================================================
// Function:          displayResultList
// Description:       Displays list version of search results
//===========================================================================
function displayResultList(result)
{
  //Clear result container
  $('#resultContainer').empty();
  
  //If no results found, display message
  if (result.length == 0)
  {
    $('#resultContainer').append("<div class=\"panel-entry\">Sorry! No items were found. Please try a different search or request this item.</div>");
  }
  else //If results found
  {
    //Iterate through results
    for (var i = 0; i < result.length; i++) 
    {      

      //Set r to the specific result
      var r = result[i];
      
      //Create a child div called entry
      var entry = document.createElement("div");
      entry.className = "panel-entry";
      entry.id = "entry-" + r.itemId;
      
      //Build the string of innerHTML
      var buildHTML;
      buildHTML = "<div class=\"panel-entry\" id=\"entry-" + r.itemId + "\">\n";
      buildHTML +=  "<img class=\"thumb\" src=\"" + r.image + "\">";
      buildHTML += "<div class=\"searchData\">\n<a  href='javascript:void(0);'  class=\"title\">" + r.title + "</a>";
      
      buildHTML += "<div class=\"subtitle\">Owned by " + r.owner.realName + "<br>Lives "
                    + r.owner.distance.toFixed(1) +" mi away</div></div>\n";
      
      buildHTML += "<div class=\"address\">" + r.owner.addressL1 + "<br>" + r.owner.city + ", " + r.owner.state;
      
      //TODO add owner.phone to schema and user.js
      buildHTML += " " + r.owner.zip + "<br>858-775-8829</div>";
      buildHTML += "<div class=\"float-clear\"></div></div>";
      
      //Add the child 
      $('#resultContainer').append(buildHTML);
      
    } //for i = each result index  
    
    //Enable modal dialog on click
    $('#resultContainer .panel-entry .title').click(function() {
      loadDialog($(this).parent().parent().attr('id'), 'viewNotMyItem');
    });
  }
}

//===========================================================================
// Function:          searchClick
// Description:       Click Handler for search button
//===========================================================================
function searchClick()
{
  //Get search string from searchbox
  var searchStr = document.getElementById("searchBox").value;
  
  //Get search result from DB
  searchResult = itemDB([{title:{likenocase:searchStr}},
                         {description:{likenocase:searchStr}}],
                         {ownerId:{'!is':currentUserId}})
                         .order('ownerId')
                         .get()
                         ;
                         
  //If results available                        
  if (searchResult.length > 0)
  { 
    //Build full data on search results from multiple tables
    searchOwners = [];
    var prevOwnerId = -1;
    var numItems = 0;
    
    for (var i = 0; i < searchResult.length; i++) 
    {              
      //Set r to the specific result
      var r = searchResult[i];
      
      //If owner did not exist in array
      if (r.ownerId != prevOwnerId)
      {
        //Add sum of found items to owner entry
        if (prevOwnerId != -1)
        {
          searchResult[i-1].owner.numItems = numItems;
          numItems = 0;
        }
        //Add owner to array
        var owner = userDB({userId:r.ownerId}).first();
        owner.latlng = new google.maps.LatLng(owner.lat, owner.lon);
        
        // Calculate distance in miles using google maps API
        var dist = google.maps.geometry.spherical.computeDistanceBetween(currentUser.latlng, owner.latlng); 
        owner.distance = dist / 1609.344;
    
        searchOwners.push(owner);
      }
      //For all items set a pointer to the owner
      r.owner = searchOwners[searchOwners.length - 1];
      numItems++;
      prevOwnerId = r.ownerId;

    }
    //Add sum of found items to owner entry
    if (prevOwnerId != -1)
    {
      searchResult[i-1].owner.numItems = numItems;
    }
  }
  
  //Display list and map
  displayResultList(searchResult);
  displayResultMap(searchResult);
  
  return false;
}

//===========================================================================
// Function:          loadNewItems
// Description:       Populates New Items component
//===========================================================================
function loadNewItems()
{
  //Gets latest item information from itemDB
  var latestItems = itemDB(  {ownerId:{'!is':currentUserId}})
                         .order('itemId desc')
                         .limit(10)
                         .get();
  //Reverse so latest items are shown first
  latestItems = latestItems.reverse();
  var content = "<ul>";
  
  //Build each pane in slider
  if (latestItems.length > 0)
  {  
    for (var i = 0; i < latestItems.length; i++) 
    {              
      //Set r to the specific result
      var r = latestItems[i];
      content += "<li class='pane' id='entry-" + r.itemId +"'><a class='photo_link' href='javascript:void(0)'><img class='photo' src='" + r.image 
              + "' alt='" + r.title + "'><div class='caption'>" + r.title + "</div></a></li>\n";
    }
    content += "</ul>";
    $('#newItems').append(content);
  }
  
  //Initialize slider information 
  numNewItems = $('#newItems ul').children().length;
  var numSlides = 4;
  sliderStart = numNewItems - numSlides;
  var i = 0;
  
  //Attach modal window to pane click
  $('#newItems .pane').click(function() {
    loadDialog($(this).attr('id'), 'viewNotMyItem');
    });
    
  //Only show last 4 items (numSlides)
  $('#newItems li').each( function (idx) {
    if (idx < (numNewItems - numSlides))
    {
      $(this).hide();
    }
  });
  
  //Set up next/prev buttons, enabled/disabled
  $('#newPrev a').css('background-position', '-2px -23px');
  $('#newNext a').css('background-position', '-20px -3px');
  
  //Setup previous button click
  $('#newPrev a').click( function() {
    if (sliderStart > 0)
    {
      $('#newItems li').eq(sliderStart+(numSlides-1)).toggle('slide', function() {
        $('#newItems li').eq(sliderStart - 1).toggle('slide');   
        sliderStart--;
        
        //Enable/disable button images if at limit of items
        if (sliderStart == 0)
        {
          $('#newPrev a').css('background-position', '-2px -3px');          
        }        
        else if (sliderStart == (numNewItems - numSlides))
        {
          $('#newNext a').css('background-position', '-20px -3px');
        }
        else
        {
          $('#newPrev a').css('background-position', '-2px -23px');
          $('#newNext a').css('background-position', '-20px -23px');
        }
      });
    }
  });
  //Setup next button click
  $('#newNext a').click( function() {
    if ((sliderStart + numSlides) < numNewItems)
    {
      $('#newItems li').eq(sliderStart).toggle('slide', function() {
        $('#newItems li').eq(sliderStart + numSlides).toggle('slide');   
        sliderStart++;

        //Enable/disable button images if at limit of items
        if (sliderStart == 0)
        {
          $('#newPrev a').css('background-position', '-2px -3px');
        }
        else if (sliderStart == (numNewItems - numSlides))
        {
          $('#newNext a').css('background-position', '-20px -3px');
        }
        else
        {
          $('#newPrev a').css('background-position', '-2px -23px');
          $('#newNext a').css('background-position', '-20px -23px');
        }
      });
    }
  });

}

//===========================================================================
// Function:          displayBorrowedLentList
// Description:       Populate borrowed and lent components
//===========================================================================
function displayBorrowedLentList(result, type)
{
  var container, headerStr;
  //Based on type setup div and header string
  if (type == 'borrowed') 
  {
    container = '#borrowedContainer';
    headerStr = 'My Borrowed Items';
  }  
  else if (type == 'lent')
  {
    container = '#lentContainer';
    headerStr = 'My Lent Items';
  }
  //Empty previous results if any
  $(container).empty();
  
  //If no results, hide panel
  if (result.length == 0)
  {
    $(container).hide();
  }
  //If results, available build panels
  else
  {
    $(container).append('<div class="panel-header">' + headerStr + '</div><ul> </ul>');
    
    //For each result
    for (var i = 0; i < result.length; i++) 
    {      
      //Set r to the specific result
      var r = result[i];
      
      //Build HTML string
      buildHTML = '<li class="trans panel-entry" id="entry-' + r.itemId + '">\n';
      buildHTML += '<div class="displayItem">';
      buildHTML += '<img class="thumb" src="' + r.item.image + '"></div>\n';
      buildHTML += '<div class="itemData">';
      buildHTML += '<a href="javascript:void(0)" class="item">' + r.item.title + '</a><br>\n';
      buildHTML += (type == 'borrowed'? 'from' : 'to');
      buildHTML += ' <a href="javascript:void(0)" class="user">' + r.item.xUser.realName + '</a>\n';
      
      //Change string and class based on item return date
      if ((r.numDaysTo < 3) & (r.numDaysTo > 0)) //Item due soon
      {
        buildHTML += '<div class="time due-soon">' + r.numDaysTo + ' day' + 
          (r.numDaysTo > 1 ? 's' : '') + ' remaining</div>\n';
      }
      else if (r.numDaysTo == 0) //Item due today
      {
        buildHTML += '<div class="time due-today">Item due today!</div>\n';
      }
      else if (r.numDaysTo < 0) //Item pas due
      {
        buildHTML += '<div class="time past-due">Item due ' + Math.abs(r.numDaysTo) + ' day' + 
          (r.numDaysTo < -1 ? 's' : '') + ' ago</div>\n';
      }
      else // Item not due for a while.
      {
        buildHTML += '<div class="time">Item due ' + r.dateExpectedReturn + '</div>\n';
      }
      
      buildHTML += '</div> <div class="float-clear"></div>';
      buildHTML +='<div class="itemOptions">';
      
      //Add appropriate buttons based on borrowed/lent status
      if (type == 'borrowed')
      {
        buildHTML += '<a href="javascript:void(0)" class="btn-supermini itemReturn">Returned</a>';
        buildHTML += '<a href="javascript:void(0)" class="btn-supermini itemRequestTime">Need Time</a>'
      }
      else if (type == 'lent')
      {
        buildHTML += '<a href="javascript:void(0)" class="btn-supermini ">Returned</a>';
        buildHTML += '<a href="javascript:void(0)" class="btn-supermini">Remind</a>'
      }
      buildHTML += '</div>';      

      //Add the child 
      var selstr = container + ' ul';
      $(selstr).append(buildHTML);
    }  
    //Add click functionality to load Modal Windows
    var selstr = container + ' ul li a.item';    
    $(selstr).click(function() {
      loadDialog($(this).parent().parent().attr('id'), type);
    });
    
    var selstr = container + ' ul li img.thumb';    
    $(selstr).click(function() {
      loadDialog($(this).parent().parent().attr('id'), type);
    });
    
    //Show new panel
    $(container).show();

  }
}

//===========================================================================
// Function:          numDaysTo
// Description:       calculates number of days to Date
//===========================================================================
function numDaysTo(returnDate)
{
  var d1 = new Date();
  var d2 = new Date(returnDate);

  var day = 1000*60*60*24;
  var diff = Math.ceil((d2.getTime()-d1.getTime())/(day));
  return diff;
}

//===========================================================================
// Function:          loadBorrowedItems
// Description:       Gets borrowed items results
//===========================================================================
function loadBorrowedItems()
{
  //Get all transactions where borrowerId is currentUserId
  //and status = active or pending
  var queryResult = transDB({borrowerId:currentUserId}, 
                            {status:'active'})
                         .get();
                         
  //If results are available, get owner information
  if (queryResult.length > 0)
  { 
    //Get owner information and links
    var xUsers = [];
    var prevXuserId = -1;
    var numItems = 0;
    for (var i = 0; i < queryResult.length; i++) 
    {              
      //Set r to the specific result
      var r = queryResult[i];
      
      // Find item information
      r.item = itemDB({itemId:r.itemId}).first();
      if (!r.item) 
      {
        console.log("loadBorrowedItems itemId " + r.item + " not found.");
      }
      
      
      //If owner did not exist in array
      if (r.item.ownerId != prevXuserId)
      {
        //Add owner to array
        var xUser = userDB({userId:r.item.ownerId}).first();            
        xUsers.push(xUser);
        
      }
      //For all items set a pointer to the owner
      r.item.xUser = xUsers[xUsers.length - 1];
      
      //Calculate time to return
      r.numDaysTo = numDaysTo(r.dateExpectedReturn);
      prevXuserId = r.item.ownerId;

    }
  }
  //Display results
  displayBorrowedLentList(queryResult, 'borrowed');

}

//===========================================================================
// Function:          loadLentItems
// Description:       Gets lent item results
//===========================================================================
function loadLentItems()
{
  //Get all transactions where ownerId is currentUserId
  //and status = active
  var itemResult = itemDB({ownerId:currentUserId}).get();
  var itemIds = [];
  itemResult.forEach(function (i) {
    itemIds.push(i.itemId);
    });
  var queryResult = transDB({itemId:itemIds}, 
                            {status:'active'})
                         .get();
                         
  //If results are available, get owner information
  if (queryResult.length > 0)
  { 
    //Get owner information and links
    var xUsers = [];
    var prevXuserId = -1;
    var numItems = 0;
    for (var i = 0; i < queryResult.length; i++) 
    {              
      //Set r to the specific result
      var r = queryResult[i];
      
      // Find item information
      r.item = itemDB({itemId:r.itemId}).first();
      if (!r.item) 
      {
        console.log("loadLentItems itemId " + r.item + " not found.");
      }
      //If owner did not exist in array
      if (r.borrowerId != prevXuserId)
      {
        //Add xUser to array
        var xUser = userDB({userId:r.borrowerId}).first();            
        xUsers.push(xUser);
        
      }
      //For all items set a pointer to the owner
      r.item.xUser = xUsers[xUsers.length - 1];
      prevXuserId = r.xUserId;

    }
  }
  
  //Display results
  displayBorrowedLentList(queryResult, 'lent');

}