
var express = require('express');
var app = express();
var request = require('request');
var bodyParser = require('body-parser');

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var mongoose   = require('mongoose');
mongoose.connect('mongodb://localhost:27017/blueberryCabs'); // connect to our database
var connection = mongoose.connection;

var cabs = require('./app/models/cabs');
var customer = require('./app/models/customer');
var cabsRequest = require('./app/models/cabRequest');

connection.on('open', function () {
    connection.db.listCollections({name: 'cabs'}).next(function(err, collinfo) {            // it will check cabs collection exist or not, if not will create
        if (collinfo) {
            console.log(collinfo);
        }
        else {
            console.log(collinfo);
            populateDB();
        }
    });
});

var port = 8080;

var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
    // do logging
    console.log('Something is happening.');
    next(); // make sure we go to the next routes and don't stop here
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', function(req, res) {
    res.json({ message: 'hooray! welcome to our api!' });
});



// /requestCar
router.route('/requestCar')
    .get(function (req, res) {   // GET request http://localhost:8080/api/requestCar?fromLongitude=78&fromLatitude=13&toLongitude=80&toLatitude=15&userId=1&isPink=true
        console.log('one car requested by user');
        cabs.findOne({cabLocation: { $near: [req.param('fromLongitude'), req.param('fromLatitude')] }, isPink: req.param('isPink'), available: true}, function(err, cabs) {
            if (err) {
                console.log(err);
                res.json(err);
            }
            else if (cabs == null) {
                console.log(cabs);
                res.json('No cabs available');
            }
            else {
                console.log("cab id - "+cabs._id);
                var d_long = ( req.param('fromLongitude') - cabs.cabLocation[0] );
                var d_lat = ( req.param('fromLatitude') - cabs.cabLocation[1] );
                cabs.distance = Math.sqrt(d_long * d_long + d_lat * d_lat)+' km';
                res.json(cabs);
            }
        });
    })

    .post(function (req, res) {   // POST request http://localhost:8080/api/requestCar?fromLongitude=78&fromLatitude=13&toLongitude=80&toLatitude=15&userId=1&isPink=true

        // GET request http://localhost:8080/api/requestCar?fromLongitude=78&fromLatitude=13&toLongitude=80&toLatitude=15&userId=1&isPink=true
        var url = 'http://localhost:8080/api/requestCar?fromLongitude='+req.param('fromLongitude')+'&fromLatitude='+req.param('fromLatitude')+'&toLongitude='+req.param('toLongitude')+'&toLatitude='+req.param('toLatitude')+'&userId='+req.param('userId')+'&isPink='+req.param('isPink')+'';
        request(url, function (error, response, body) {
            if (body) {
                body = JSON.parse(body);
                console.log(body);

                var cabRequest = new cabsRequest();
                cabRequest.driverId = body.driverId;
                cabRequest.distance = body.distance;
                cabRequest.tripId = makeId();
                cabRequest.isPink = req.param('isPink');
                cabRequest.userId = req.param('userId');
                cabRequest.fromLocation = [req.param('fromLongitude'), req.param('fromLatitude')];
                cabRequest.toLocation = [req.param('toLongitude'), req.param('toLatitude')];
                cabRequest.requestTime = new Date();

                if ( body == 'No cabs available' ) {
                    cabRequest.success = false;
                    cabRequest.message = 'No cabs available';
                }
                else {
                    cabRequest.success = true;
                    cabRequest.message = 'thanks';
                }

                cabRequest.save(function(err) {
                    if (err)
                        res.send(err);

                    // res.json({ message: 'one cabRequest row created!' });
                    res.send(cabRequest);
                });
            }
        });
    });



// GET request http://localhost:8080/api/requestCar/<driverId>
router.route('/requestCar/:driverId')
    .get(function (req, res) {
        console.log('although this matches');
        cabsRequest.findOne({driverId: req.param('driverId')}, function(err, cabRequest) {
            if (err) {
                console.log(err);
                res.json(err);
            }
            else if (cabRequest == null) {
                console.log(cabRequest);
                res.json('No cabRequest');
            }
            else {
                console.log(cabRequest);
                res.json(cabRequest);
            }
        });
    })

    .put(function (req, res) {       // PUT request http://localhost:8080/api/requestCar/<driverId>?acceptByDriver=false

        cabsRequest.findOne({driverId: req.param('driverId')}, function(err, cabRequest) {
            cabRequest.acceptByDriver = req.param('acceptByDriver');
            cabRequest.updated_at = new Date();
            console.log(req.param('acceptByDriver'));

            if (req.param('acceptByDriver') == 'true') {
                cabs.findOne({driverId: req.param('driverId')}, function(err, cab) {
                    if (err)
                        res.send(err);

                    cab.available = false;
                    cab.save(function(err) {
                        if (err)
                            res.send(err);

                        console.log('cab is booked.');
                    });
                });
            }

            cabRequest.save(function(err) {
                if (err)
                    res.send(err);

                res.json({ message: 'cabRequest row updated!' });
            });
        });
    });




// PUT request http://localhost:8080/api/startTrip/<tripId>
router.route('/startTrip/:tripId')
    .put(function (req, res) {       

        cabsRequest.findOne({tripId: req.param('tripId')}, function(err, trip) {
            if (err)
                res.send({success:false, message: err});

            console.log(trip);

            trip.startTime = new Date();

            trip.save(function(err) {
                if (err)
                    res.send({success:false, message: err});

                res.json({ success: true, message: 'Trip started' });
            });
        });
    });





// on routes that end in /requestCar
// ----------------------------------------------------
router.route('/stopTrip/:tripId')
    .put(function (req, res) {       // PUT request http://localhost:8080/api/stopTrip/<tripId>

        cabsRequest.findOne({tripId: req.param('tripId')}, function(err, trip) {
            if (err)
                res.send({success:false, message: err});

            trip.endTime = new Date();

            var d_long = ( trip.fromLocation[0] - trip.toLocation[0] );
            var d_lat = ( trip.fromLocation[1] - trip.toLocation[1] );
            trip.distance = Math.sqrt(d_long * d_long + d_lat * d_lat);

            var totalMinutes = ( trip.endTime.getTime() - trip.startTime.getTime() ) / (1000 * 60);
            trip.timeElapsed = totalMinutes+' Min';
            trip.success = true;
            trip.message = 'Trip complete.';

            if (trip.isPink) {
                trip.pinkCharge = 5;
                trip.tripFare = parseInt(trip.distance * 2 + totalMinutes * 1 + 5);
            }
            else {
                trip.pinkCharge = 0;
                trip.tripFare = parseInt(trip.distance * 2 + totalMinutes * 1);
            }

            trip.save(function(err) {
                if (err)
                    res.send({success:false, message: err});

                
            }).then(function(){

                cabs.findOne({driverId: trip.driverId}, function(err, cab) {
                    console.log(trip.driverId);
                    cab.cabLocation = trip.toLocation;
                    cab.available = true;

                    cab.save(function(err) {
                        if (err)
                            res.send({success:false, message: err});

                        res.json(trip);
                    });
                });

            });
        });
    });





app.use('/api', router);


// start server
app.listen(port);
console.log('Magic happens on port 8080');




// database sample data for application started first time
var populateDB = function() {

    var userJsonArray = [
    {
        name: "Arpit",
        userId: 1,
        fromLocation: [77,13],
        toLocation: [78.342543,15.345345]
    },
    {
        name: "Vijay",
        userId: 2,
        fromLocation: [73,23],
        toLocation: [88.342543,25.345345]
    },
    {
        name: "Ajay",
        userId: 3,
        fromLocation: [63,21],
        toLocation: [82.342543,24.345345]
    },
    {
        name: "Mohan",
        userId: 4,
        fromLocation: [71,28],
        toLocation: [82.342543,29.345345]
    },
    {
        name: "Anurag",
        userId: 5,
        fromLocation: [53,29],
        toLocation: [81.342543,26.345345]
    }
    ];
    customer.insertMany(userJsonArray, function(error, docs) {
        console.log(docs);
        console.log('\n=================================================\n');
    });

    var cabsJsonArray = [
    {
        "driverId" : makeId(),
        "isPink" : false,
        "available" : true,
        "cabLocation" : [
                73.63997110000003,
                23.0280047
            ]
    },
    {
        "driverId" : makeId(),
        "isPink" : false,
        "available" : true,
        "cabLocation" : [
                77.64115449999997,
                12.9718915
            ]
    },
    {
        "driverId" : makeId(),
        "isPink" : true,
        "available" : false,
        "cabLocation" : [
                77.62855850000005,
                12.9817147
            ]
    },
    {
        "driverId" : makeId(),
        "isPink" : false,
        "available" : true,
        "cabLocation" : [
                77.60547099999997,
                12.975614
            ]
    },
    {
        "driverId" : makeId(),
        "isPink" : true,
        "available" : true,
        "cabLocation" : [
                77.62047400000006,
                12.972814
            ]
    },
    {
        "driverId" : makeId(),
        "isPink" : true,
        "available" : true,
        "cabLocation" : [
                77.62710779999998,
                12.9279232
            ]
    },
    {
        "driverId" : makeId(),
        "isPink" : true,
        "available" : true,
        "cabLocation" : [
                77.63873160000003,
                12.9609857
            ]
    }
    ];
    cabs.insertMany(cabsJsonArray, function(error, docs) {
        console.log(docs);
        console.log('\n=================================================\n');
    });

}


// generate Ids
function makeId()
{
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for( var i=0; i < 5; i++ )
        text += possible.charAt(Math.floor(Math.random() * possible.length));

    return text;
}

module.exports = router;   // for unit testing
