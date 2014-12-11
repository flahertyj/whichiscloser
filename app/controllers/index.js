var MapModule = require('ti.map');

if (Titanium.Platform.name == 'android') {
	var rc = MapModule.isGooglePlayServicesAvailable();
	switch (rc) {
	    case MapModule.SUCCESS:
	        Ti.API.info('Google Play services is installed.');
	        break;
	    case MapModule.SERVICE_MISSING:
	        alert('Google Play services is missing. Please install Google Play services from the Google Play store.');
	        break;
	    case MapModule.SERVICE_VERSION_UPDATE_REQUIRED:
	        alert('Google Play services is out of date. Please update Google Play services.');
	        break;
	    case MapModule.SERVICE_DISABLED:
	        alert('Google Play services is disabled. Please enable Google Play services.');
	        break;
	    case MapModule.SERVICE_INVALID:
	        alert('Google Play services cannot be authenticated. Reinstall Google Play services.');
	        break;
	    default:
	        alert('Unknown error.');
	        break;
	}
}

var win = Ti.UI.createWindow({backgroundColor: 'white'});
var tabGroup = Ti.UI.createTabGroup();

var win1 = Titanium.UI.createWindow({
    title: 'Tab 1',
    backgroundColor: '#fff'
});

var tab1 = Titanium.UI.createTab({
    icon: 'KS_nav_views.png',
    title: 'Tab 1',
    window: win1
});
 
var button = Titanium.UI.createButton({
    color: '#999',
    title: 'Show Modal Window',
    width: 180,
    height: 35
});

var searchBar = Ti.UI.createSearchBar({
	barColor:'#000', 
    showCancel:true,
    height:43,
    top:0
});

var searchText = undefined;

searchBar.addEventListener('return', function(evt){
	Ti.API.info("RETURN PRESSED ON SEARCH BAR!!! Searched for: " + this.value);
	searchText = this.value;
	createMapView();
});
 
win1.add(button);
win1.add(searchBar);

//
// create controls tab and root window
//
var win2 = Titanium.UI.createWindow({
    title: 'Tab 2',
    backgroundColor: '#fff'
});

var tab2 = Titanium.UI.createTab({
    icon: 'KS_nav_ui.png',
    title: 'Tab 2',
    window: win2
});

//
//  add tabs
//
tabGroup.addTab(tab1);
tabGroup.addTab(tab2);
 
// open tab group
tabGroup.open();

var ipAddress = Titanium.Platform.address;

var location = undefined;
var testLat = 39.758140;
var testLong = -105.015249;
var metersInAMile = 1609.34;
var testDefaultRadius = metersInAMile * 2.5;
var date = new Date();
var mapView = undefined;

function createMapView() {
	mapView = MapModule.createView({
	    userLocation: true,
	    mapType: MapModule.NORMAL_TYPE,
	    animate: true,
	    region: {latitude: testLat, longitude: testLong, latitudeDelta: 0.1, longitudeDelta: 0.1},
	    height: '100%',
	    top: 0,
	    left: 0,
	    width: '100%'
	});

	mapView.addEventListener('complete', function(evt){
		Ti.API.info("Complete event called.");
		var intervalID = setInterval(function() {
	    	//setMapLocation();
	    	//followLocation();
	    	//testPlaces();
	    	getCurrentLocation();
	    	clearInterval(intervalID);
		}, 2500);
	});

	win.add(mapView);
	win.open();
}

function setMapLocation() {
	region = getCurrentRegion();
	if (mapView) {
		mapView.setLocation(region);
	}
}

function followLocation() {
	setInterval(function() {
		setMapLocation();
	}, 5000);
}

function getCurrentLocation() {
	Ti.API.info("getCurrentLocation called.");
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://www.googleapis.com/geolocation/v1/geolocate?key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient({
		onload: function(){
      		response = JSON.parse(this.responseText);
      		location = response.location;
      		testPlaces(location);
      		Ti.API.info("Location: " + location);
		},
		onerror: function(e) {
			Ti.API.info("Error trying to get geolocation: " + e.error);
		},
		timeout : 5000// 5 seconds.
	});
	/*xhr.onload = function() {
	  Ti.API.info(this.responseText);
      location = JSON.parse(this.responseText);
      Ti.API.info("Location: " + location);
      testDirections(location.location);
      return location.location;
	};*/

    xhr.open('POST', url);
    xhr.send();
}

function testPlaces(origin) {
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + origin.lat + "," + origin.lng +
		"&radius=" + testDefaultRadius + "&name=" + searchText + "&key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient();

	xhr.onload = function() {
      var jsonObject = JSON.parse(this.responseText);
      if (jsonObject && jsonObject.results.length > 0) {
      	testPlaceDetails(jsonObject.results[0].place_id);
      	destination = jsonObject.results[0].geometry.location;
      	testDirections(origin, destination);
      }
	};

    xhr.open('GET', url);
    xhr.send();
}

function testPlaceDetails(placeId) {
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://maps.googleapis.com/maps/api/place/details/json?placeid=" + placeId + "&key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient();

	xhr.onload = function() {
      var jsonObject = JSON.parse(this.responseText);
      result = jsonObject.result;
      var dayOfWeek = date.getDay() - 1;
      if (dayOfWeek < 0) {
      	dayOfWeek = 6;
      }
      Ti.API.info(result.name + " at address: " + result.formatted_address +
      	" hours today: " + result.opening_hours.weekday_text[dayOfWeek] + ".");
	};

    xhr.open('GET', url);
    xhr.send();
}

function testDirections(origin, destination) {
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://maps.googleapis.com/maps/api/directions/json?userip=" + ipAddress +
		  "&origin=" + origin.lat + "," + origin.lng + "&destination=" +
		  destination.lat + "," + destination.lng + "&key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient();

	xhr.onload = function() {
      var jsonObject = JSON.parse(this.responseText);
      if (jsonObject && jsonObject.routes) {
	      var directions = jsonObject.routes[0];
	      var route = directions.legs[0];
	      Ti.API.info("Directions: Start Address - " + route.start_address + "\nEnd Address - " + route.end_address);
	      for (i = 0; i < route.steps.length; ++i) {
	      	var stepNum = i + 1;
	      	Ti.API.info("Step #" + stepNum + " - " + route.steps[i].html_instructions);
	      }
	  }
	};

    xhr.open('GET', url);
    xhr.send();
}