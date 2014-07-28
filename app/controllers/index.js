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

var mapView = MapModule.createView({
    userLocation: true,
    mapType: MapModule.NORMAL_TYPE,
    animate: true,
    region: {latitude: 39.7392, longitude: -104.9847, latitudeDelta: 0.1, longitudeDelta: 0.1},
    height: '100%',
    top: 0,
    left: 0,
    width: '100%'
});

win.add(mapView);
win.open();

function getLocation() {
	//Get the current position and set it to the mapview
	Titanium.Geolocation.getCurrentPosition(function(e){
	        var region={
	            latitude: e.coords.latitude,
	            longitude: e.coords.longitude,
	            animate:true,
	            latitudeDelta:0.005,
	            longitudeDelta:0.005
	        };
	        mapView.setLocation(region);
	});
}

//Titanium.Geolocation.addEventListener('location',function() {
//    getLocation();
//});

//mapView.addEventListener('complete', function(evt){
//    getLocation();
//});