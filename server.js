// =================================================================
// get the packages we need ========================================
// =================================================================
var express 	= require('express');
var app         = express();
var bodyParser  = require('body-parser');
var morgan      = require('morgan');
var mongoose    = require('mongoose');



var jwt    = require('jsonwebtoken'); // used to create, sign, and verify tokens
var config = require('./config'); // get our config file
var User   = require('./app/models/user'); // get our mongoose model

var admin = require ('firebase-admin');
var serviceAccount = require('./path/to/serviceAccountKey.json');

var Utils = require('./server-response');


// =================================================================
// configuration ===================================================
// =================================================================
var port = process.env.PORT || 8080; // used to create, sign, and verify tokens
mongoose.connect(config.database); // connect to database

admin.initializeApp({
	credential: admin.credential.cert(serviceAccount),
	databaseURL: 'https://project-4182364925654083972.firebaseio.com/'
});

app.set('superSecret', config.secret); // secret variable

// use body parser so we can get info from POST and/or URL parameters
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// use morgan to log requests to the console
app.use(morgan('dev'));

// =================================================================
// routes ==========================================================
// =================================================================


// basic route (http://localhost:8080)
app.get('/', function(req, res) {
	res.send('Hello World The API is at http://localhost:' + port + '/api');
});

// ---------------------------------------------------------
// get an instance of the router for api routes
// ---------------------------------------------------------
var apiRoutes = express.Router(); 

// ---------------------------------------------------------
// authentication (no middleware necessary since this isnt authenticated)
// ---------------------------------------------------------
// http://localhost:8080/api/authenticate


app.post('/register', function(req, res) {

	// create a sample user
	var user = new User({ 
		uid: req.body.uid,
		deviceId: req.body.deviceId,
		name: req.body.name, 
		avatar: req.body.avatar,
	});
	user.save(function(err) {
		if (err) throw err;
		
		console.log('User saved successfully');
		res.json({ success : true , message :'Register Success' });
	});
});


apiRoutes.post('/login', function(req, res) {
	// find the user
	User.findOne({
		name: req.body.uid
	}, function(err, user) {

		if (err) throw err;

		if (!user) {
			res.json({ success: false, message: 'Authentication failed. User not found.' });
		} else if (user) {

			// check if password matches
			if (user.password != req.body.password) {
				res.json(Utils.response(false,'Authentication failed. Wrong password.'));
			} else {

				// if user is found and password is right
				// create a token
				var payload = {
					admin: user.admin	
				}
				var token = jwt.sign(payload, app.get('superSecret'), {
					expiresIn: 86400 // expires in 24 hours
				});

				res.json({
					success: true,
					message: 'Enjoy your token!',
					token: token
				});
			}		
		}
	});
});

// ---------------------------------------------------------
// route middleware to authenticate and check token
// ---------------------------------------------------------
apiRoutes.use(function(req, res, next) {

	// check header or url parameters or post parameters for token
	var token = req.body.token || req.param('token') || req.headers['x-access-token'];

	// decode token
	if (token) {
		// verifies secret and checks exp
		jwt.verify(token, app.get('superSecret'), function(err, decoded) {			
			if (err) {
				return res.json({ success: false, message: 'Failed to authenticate token.' });		
			} else {
				// if everything is good, save to request for use in other routes
				req.decoded = decoded;	
				next();
			}
		});

	} else {

		// if there is no token
		// return an error
		return res.status(403).send({ 
			success: false, 
			message: 'No token provided.'
		});
		
	}
});

// ---------------------------------------------------------
// authenticated routes
// ---------------------------------------------------------
apiRoutes.get('/', function(req, res) {
	res.json({ message: 'Hello World' });
});

apiRoutes.get('/users', function(req, res) {
	User.find({}, function(err, users) {
		res.json(users);
	});
});

apiRoutes.post('/pushNotify',(req,res)=>{

	var registrationToken = 'dtlPHeoHWgo:APA91bG6aNAGVqKa9IZ14H6c9DBGoXmlk4-TJ0UXpUXRUJWQfQaipJwHzAcAHEShbmfJaFCk0al8YTylQ1L5TFI4t7GFK2odYgozC_NxIhvVgXFcH1YCQlN4zrmE6QjVQBlD50p28Egq';

	// See documentation on defining a message payload.
	var message = {
	data: {
		score: '850',
		time: '2:45'
	},
	token: registrationToken
	};

	// Send a message to the device corresponding to the provided
	// registration token.
	admin.messaging().send(message)
	.then((response) => {
		// Response is a message ID string.
		console.log('Successfully sent message:', response);
	}).catch((error) => {
			console.log('Error sending message:', error);
	});
});

apiRoutes.get('/check', function(req, res) {
	res.json(req.decoded);
});

app.use('/api', apiRoutes);

// =================================================================
// start the server ================================================
// =================================================================
app.listen(port);
console.log('Magic happens at http://localhost:' + port);
