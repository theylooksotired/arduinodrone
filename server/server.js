var express = require('express');
var app = express();

/*---SET-UP THE ARDUINO BOARD AND SERVER---*/

var five = require("johnny-five");
var myBoard;
var optionForward;
var optionBackward;
var optionLeft;
var optionRight;
var sensorTemperature;
var sensorTemperatureValue;
var motor;

myBoard = new five.Board();
myBoard.on("ready", function() {

	//MOTOR
	motor = new five.Motor({pin: 5});

	//CONTROLS
	optionForward = new five.Led(13);
	optionLeft = new five.Led(12);
	optionRight = new five.Led(11);
	optionBackward = new five.Led(10);
	
	//TEMPERATURE
	sensorTemperature = new five.Sensor("A0");
	sensorTemperature.on("read", function(err, value){
		sensorTemperatureValue = (100 * (value / 1000) + 20).toFixed(2);
	});

	//CONSOLE REPLICAS (SERVER'S TEST CASES)
	this.repl.inject({
		led1: optionForward,
		led2: optionLeft,
		led3: optionRight,
		led4: optionBackward,
		mot: motor
	});

});

//CONFIGURE CROSS DOMAIN
app.configure(function () {
    app.use(express.methodOverride());
    app.use(express.bodyParser());
    app.use(function(req, res, next) {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Headers", "X-Requested-With");
      next();
    });
    app.use(app.router);
});

//START SERVER
var server = app.listen(6677, function () {
	var host = server.address().address;
	var port = server.address().port;
})

/*---WEB SERVICE OPTIONS---*/

//START THE DRONE
app.get('/start', function (req, res, next) {
	motor.start(200);
	res.send('{"started":"ok"}');
});

//STOP THE DRONE
app.get('/stop', function (req, res, next) {
	stopDrone();
	motor.stop();
	res.send('{"stopped":"ok"}');
});

//MOVE THE DRONE
app.get('/move/*', function (req, res, next) {
	var action = req.url.split("/");
	switch (action[2]) {
		case 'forward':
			stopDrone();
			optionForward.on();
		break;		
		case 'backward':
			stopDrone();
			optionBackward.on();
		break;		
		case 'left':
			stopDrone();
			optionLeft.on();
		break;		
		case 'right':
			stopDrone();
			optionRight.on();
		break;		
	}
	res.send('{"moved":"'+action[2]+'"}');
});

//GET TEMPERATURE
app.get('/temperature', function (req, res, next) {
	res.send('{"temperature":"'+sensorTemperatureValue+'"}');
});

//MOTOR
app.get('/gas/*', function (req, res, next) {
	var action = req.url.split("/");
	var gasPower = action[2] * 1;
	motor.start(gasPower);
	res.send('{"gasPower":"'+gasPower+'"}');
});

//AUTOPILOT
app.post('/auto', function (req, res, next) {
	var markers = req.body.markers;
	var initTime = 100;
	for (index in markers) {
		var action = markers[index].action + "";
		var wait = markers[index].wait * 1;
		setTimeMarker(action, initTime);
		initTime = initTime + wait;
	}
	setTimeMarker('stop', initTime+200);
	res.send('{"auto":"ok"}');
});

function setTimeMarker(action, initTime) {
	setTimeout(function(){
		switch(action) {
			case 'start':
			case 'start-light':
				motor.start(150);
			break;
			case 'start-medium':
				motor.start(200);
			break;
			case 'start-hight':
				motor.start(300);
			break;
			case 'stop':
				stopDrone();
				motor.stop();
			break;
			case 'right':
				stopDrone();
				optionRight.on();
			break;
			case 'left':
				stopDrone();
				optionLeft.on();
			break;
			case 'backward':
				stopDrone();
				optionBackward.on();
			break;
			case 'forward':
				stopDrone();
				optionForward.on();
			break;
			case 'temperature':
				console.log(sensorTemperatureValue);
			break;
		}
	}, initTime);
}

//AUTOPILOT TEST
app.get('/auto-test', function (req, res, next) {
	setTimeout(function(){
		motor.start(200);
	}, 100);
	setTimeout(function(){
		stopDrone();
		optionForward.on();
	}, 500);
	setTimeout(function(){
		stopDrone();
		optionLeft.on();
	}, 1000);
	setTimeout(function(){
		stopDrone();
		optionRight.on();
	}, 1500);
	setTimeout(function(){
		stopDrone();
		optionLeft.on();
	}, 2000);
	setTimeout(function(){
		stopDrone();
		optionForward.on();
	}, 2500);
	setTimeout(function(){
		stopDrone();
		optionLeft.on();
	}, 3000);
	setTimeout(function(){
		stopDrone();
		optionRight.on();
	}, 3500);
	setTimeout(function(){
		stopDrone();
		optionBackward.on();
	}, 4000);
	setTimeout(function(){
		console.log(sensorTemperatureValue);
	}, 4500);
	setTimeout(function(){
		stopDrone();
		motor.stop();
	}, 5000);
	res.send('{"auto":"ok"}');
});


/*---EXTRA FUNCTIONS---*/
function stopDrone() {
	optionForward.off();
	optionBackward.off();
	optionLeft.off();
	optionRight.off();
}

function sleep(milliseconds) {
  var start = new Date().getTime();
  for (var i = 0; i < 1e7; i++) {
    if ((new Date().getTime() - start) > milliseconds){
      break;
    }
  }
}