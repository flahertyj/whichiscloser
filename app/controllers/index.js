var MapModule = require('ti.map');

var ipAddress = Titanium.Platform.address;

var location = undefined;
var testLat = 39.758140;
var testLng = -105.015249;
var metersInAMile = 1609.34;
var testDefaultRadius = metersInAMile * 2.5;
var date = new Date();
var mapView = undefined;
var useGoogleGeolocation = true;
var polyline = {};

// This is adapted from the implementation in Project-OSRM
// https://github.com/DennisOSRM/Project-OSRM-Web/blob/master/WebContent/routing/OSRM.RoutingGeometry.js
polyline.decode = function(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    // Coordinates have variable length when encoded, so just keep
    // track of whether we've hit the end of the string. In each
    // loop iteration, a single coordinate is decoded.
    while (index < str.length) {

        // Reset shift, result, and byte
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push({
        	latitude: lat / factor,
        	longitude: lng / factor
        });
    }

    return coordinates;
};

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

function defaultParam(param, defaultVal) {
	return typeof param !== 'undefined' ? param : defaultVal;
}

function createMapView() {
	if (mapView == undefined) {// Don't want to create a map when one already exists.
		mapView = MapModule.createView({
		    userLocation: true,
		    mapType: MapModule.NORMAL_TYPE,
		    animate: true,
		    regionFit: true,
		    region: {latitude: testLat, longitude: testLng, latitudeDelta: 0.1, longitudeDelta: 0.1},
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
}

function createBackButton() {
	var backButton = Titanium.UI.createButton({
	   title: 'Back',
	   left: 3,
	   top: 15,
	   width: 40,
	   height: 25
	});

	backButton.addEventListener('click', function(e) {
	   win.remove(mapView);
	   mapView = undefined;
	   win.remove(backButton);
	   win.close();
	});

	return backButton;
}

function createAnnotation(lat, lng, annotationTitle, annotationSubtitle, animateAnnotation, annotationColor) {
	return MapModule.createAnnotation({
    	latitude: lat,
        longitude: lng,
        title: annotationTitle,
        subtitle: annotationSubtitle,
        animate: animateAnnotation,
        pincolor: annotationColor
	});
}

function setMapLocation(lat, lng, latDelta, lngDelta, drawAnnotations) {
	if ((mapView != undefined) && (lat != undefined) && (lng != undefined)) {
		latDelta = defaultParam(latDelta, 0.1);
		lngDelta = defaultParam(lngDelta, 0.1);

		var region = {
			latitude: lat,
			longitude: lng,
			latitudeDelta: latDelta,
			longitudeDelta: lngDelta
		};

		mapView.setLocation(region);
		
		if (drawAnnotations == true) {
      		var annotation = createAnnotation(location.lat, location.lng, 'Current Location', '' , false, MapModule.ANNOTATION_PURPLE);
      		var annotations = typeof mapView.annotations !== undefined ? mapView.annotations : [];
      		annotations.push(annotation);
      		mapView.annotations = annotations;
		}
	}
}

function getCurrentLocation() {
	Ti.API.info("getCurrentLocation called.");
	if (useGoogleGeolocation == true) {
		googleGeolocation();
	} else {
		titaniumGeolocation();
	}
}

function titaniumGeolocation() {
	try {
        Ti.Geolocation.getCurrentPosition(function(e)
        {
            if(!e.success || e.error) {
                common.launchEvent({
                    TYPE :    'ERROR',
                    MESS :    'E0002'
                });
            }

            if(e.success) {
                var lat = e.coords.latitude;
                var lng = e.coords.longitude;
                location = {
                	lat: lat,
                	lng: lng
                };
	      		Ti.API.info("Location: " + lat + ", " + lng);

	      		setMapLocation(lat, lng, 0.1, 0.1, true);
	      		testPlaces(lat, lng, true);

                /*persHandler.putPersData({
                    type :    'lon',
                    data :    lon
                });
                persHandler.putPersData({
                    type :    'lat',
                    data :    lat
                });
                common.launchEvent({
                    TYPE :    'nextLocationCheck'
                });*/
            }
        });
    }
    catch(err) {
        common.launchEvent({
            TYPE :    'ERROR',
            MESS :    'E0002'
        });
    }
}

function googleGeolocation() {
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://www.googleapis.com/geolocation/v1/geolocate?key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient({
		onload: function(){
      		response = JSON.parse(this.responseText);
      		location = response.location;
      		setMapLocation(location.lat, location.lng, 0.1, 0.1, true);
      		testPlaces(location.lat, location.lng, true);
      		Ti.API.info("Location: " + location);
		},
		onerror: function(e) {
			Ti.API.info("Error trying to get geolocation: " + e.error);
		},
		timeout : 5000// 5 seconds.
	});

    xhr.open('POST', url);
    xhr.send();
}

function testPlaces(lat, lng, drawAnnotations) {
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=" + lat + "," + lng +
		"&radius=" + testDefaultRadius + "&name=" + searchText + "&key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient();

	xhr.onload = function() {
      var jsonObject = JSON.parse(this.responseText);
      if (jsonObject && jsonObject.results.length > 0) {
      	if (drawAnnotations == true) {
      		var annotations = typeof mapView.annotations !== undefined ? mapView.annotations : [];

      		for (placeNum = 0; placeNum < jsonObject.results.length; ++placeNum) {
      			var result = jsonObject.results[placeNum];
      			var placeLoc = result.geometry.location;
	      		var annotation = createAnnotation(placeLoc.lat, placeLoc.lng, result.name, result.vicinity, false);
	      		annotations.push(annotation);

				testDirections(location.lat, location.lng, placeLoc.lat, placeLoc.lng);
			}

			mapView.annotations = annotations;
	    }
      	//testPlaceDetails(jsonObject.results[0].place_id);
      	//destination = jsonObject.results[0].geometry.location;
      	//testDirections(origin, destination);
      }
      
	  if (Titanium.Platform.name == 'iPhone OS') {
		win.add(createBackButton());
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

function testDirections(originLat, originLng, destinationLat, destinationLng) {
	serverKey = Ti.App.Properties.getString("ti.android.google.server.api.key");
	url = "https://maps.googleapis.com/maps/api/directions/json?userip=" + ipAddress +
		  "&origin=" + originLat + "," + originLng + "&destination=" +
		  destinationLat + "," + destinationLng +
		  "&key=" + serverKey;
	xhr = Titanium.Network.createHTTPClient();
	var waypoints = [];

	xhr.onload = function() {
      var jsonObject = JSON.parse(this.responseText);
      if (jsonObject && jsonObject.routes) {
	      var directions = jsonObject.routes[0];
		  var routePoints = [];
	      for (legNum = 0; legNum < directions.legs.length; ++legNum) {
	      	  var leg = directions.legs[legNum];
		      Ti.API.info("Directions: Start Address - " + leg.start_address + "\nEnd Address - " + leg.end_address);

		      for (stepNum = 0; stepNum < leg.steps.length; ++stepNum) {
		      	var step = leg.steps[stepNum];
		      	var stepNumPrint = stepNum + 1;
		      	Ti.API.info("Leg Step #" + stepNumPrint + " - " + step.html_instructions);
		      	polylinePoints = polyline.decode(step.polyline.points);
		      	startLoc = step.start_location;
		      	routePoints = routePoints.concat(polylinePoints);
		      }
		  }

	      var route = MapModule.createRoute({
	      	points: routePoints,
	      	color: "#f00",
	      	width: 3.0
	      });

		  mapView.addRoute(route);
	  }
	};

    xhr.open('GET', url);
    xhr.send();
}