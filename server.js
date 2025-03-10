var express = require('express'),
    path = require('path'),
    fs = require('fs'),
    favicon = require('serve-favicon'),
    logger = require('morgan'),
    expressLayouts = require('express-ejs-layouts'),
    http = require('http'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    mongoose = require('mongoose'),
    stormpath = require ('stormpath'),
    session = require('express-session')
    cors = require('cors');


var app = express();

//port setting and server creation
app.set('port',3000);
app.set('env','development');

app.use(cors());

// exprss-device detection object
//var device = require('express-device');


// view engine setup
app.set('view engine', 'ejs');
//app.set('view options', { layout: true });
app.set('views', path.join(__dirname, '/src/views'));

// express settings
app.use(favicon(__dirname + '/public/images/favicon.ico'));
app.use(logger('dev'))
   .use(bodyParser.json())
   .use(bodyParser.urlencoded({ extended: false }))
   .use(cookieParser())
   .use(require('less-middleware')(path.join(__dirname, 'public')))
   .use(express.static(__dirname + '/public', { maxAge: 999999999999 }))
   .use(expressLayouts)
   .set('layout','defaults/login-layout')
   .enable('view cache');

////express-device configuration
//app.use(bodyParser());
//app.use(device.capture());
//device.enableDeviceHelpers(app);
//device.enableViewRouting(app);

app.use(session({
  cookieName: 'session',
  secret: 'Uber-Portal',
  duration: 30 * 60 * 1000,
  activeDuration: 5 * 60 * 1000
}));

//Redis Cache
var redis = require("redis"),
    cache = redis.createClient();

cache.on('connect', function() {
    console.log('connected');
});

cache.on("error", function (err) {
    console.log("Error " + err);
});

//including config file
var config = require('./config/config')[app.get('env')];

//mongodb connection
mongoose.connect(config.db);

// Bootstrap models
var models_path = __dirname + '/src/models';
fs.readdirSync(models_path).forEach(function (file) {
    require(models_path+'/'+file)
});


// Bootstrap routes
require('./routes/admin')(app);
require('./routes/index')(app,config,cache);
require('./routes/mobile')(app,config,cache);


// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('defaults/error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('defaults/error', {
        message: err.message,
        error: {}
    });
});




// Start the app by listening on <port>
http.createServer(app).listen(app.get('port'), function(){
    app.locals.deployVersion = (new Date).getTime();
    app.locals.env = 'development';
    console.log('server listening on port: '+app.get('port') );
}).on('error', onError);


/**
 * Event listener for HTTP server "error" event.
 */

function onError(error) {
    var port=app.get('port')
    if (error.syscall !== 'listen') {
        throw error;
    }
    var bind = typeof port === 'string'
        ? 'Pipe ' + port
        : 'Port ' + port;

    // handle specific listen errors with friendly messages
    switch (error.code) {
        case 'EACCES':
            console.error(bind + ' requires elevated privileges');
            process.exit(1);
            break;
        case 'EADDRINUSE':
            console.error(bind + ' is already in use');
            process.exit(1);
            break;
        default:
            throw error;
    }
}



module.exports = app;
