var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var debug = require('debug')('hvacapp');
var nconf = require('nconf');
process.title = "hvacController";
var app = express();

//We Attach the socket.io Server that is created in /bin/www using the attachServer Callback below
var IO = require('socket.io');
var io = new IO();


var HvacController = require('./hvacController.js')
var HvacShared = require('./public/javascripts/HvacShared.js');



nconf.file('./configs/hvacMonitorConfig.json');
var configFileSettings = nconf.get();

var hvacController = new HvacController({ tempTarget: configFileSettings.tempTarget});

var hvacShared = new HvacShared(configFileSettings);



hvacController.on("log", function (logdata) {
    if (logdata.type == "info" && configFileSettings.debug == false) {
        debug('hvacController ' + logdata.type + ': ' + logdata.msg);
    } else {
        console.log('hvacController ' + logdata.type + ': ' + logdata.msg);
    }
})

hvacController.on("hvacEvent", function (eventdata) {
    //console.log('hvacController ' + eventdata.type + ': ');
    //console.dir(eventdata.data);
    hvacShared.processHvacControllerEvent(eventdata);
    if (io) {
        io.emit('hvacEvent', eventdata);
    }
})

hvacShared.on("log", function (logdata) {
    if (logdata.type == "info") {
        debug('hvacShared ' + logdata.type + ': ' + logdata.msg);
    } else {
        console.log('hvacShared ' + logdata.type + ': ' + logdata.msg);
    }
})

hvacController.start();

// uncomment after placing your favicon in /public
//app.use(favicon(__dirname + '/public/favicon.ico'));
//app.use(logger('dev'));
var ejs = require('ejs');
app.engine('html', ejs.renderFile);
app.set('view engine', 'ejs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
//app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));
//var router = express.Router();

///* GET home page. */
//router.get('/', function (req, res) {
//    res.sendFile(path.join(__dirname, 'public/index.html'));
//});
app.use('/app/*', function (req, res) {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

//Return the HvacCommon Data
app.use('/api/hvacController/data', function (req, res) {
    res.json(hvacController.getData());
})
app.use('/api/hvacController/settings', function (req, res) {
    res.json(hvacController.getSettings());
})

app.use('/api/hvacShared/data', function (req, res) {
    res.json(hvacShared.getData());
})

app.use('/api/hvacShared/settings', function (req, res) {
    res.json(configFileSettings);
})

app.use('/api/hvacShared/eventHistory/*', function (req, res) {
    res.json(hvacShared.geteventHistory(req.originalUrl));
})

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    if (err.status == 404) {
        debug('404 File Not Found ' + req.originalUrl);
    }
    next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        if (err.status == 404) {
            debug('404 File Not Found ' + req.originalUrl);
        }
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    if (err.status == 404) {
        debug('404 File Not Found ' + req.originalUrl);
    }
    res.render('error', {
        message: err.message,
        error: {}
    });
});


var clientHvacControllerEvent = function (data){
    console.log(data);
    debug('client hvacMonitorEvent ');

    switch (data.type) {
        case "tempTarget":
            var tempTarget = hvacController.getSetting('tempTarget');
            if (data.data.direction == 'up') {
                hvacController.setSetting('tempTarget', tempTarget + 1, true);
            } else {
                hvacController.setSetting('tempTarget', tempTarget - 1, true);
            }
            break;
        case "tempTollerence":
            var tempTarget = hvacController.getSetting('tempTarget');
            if (data.data.direction == 'up') {
                hvacController.setSetting('tempTarget', tempTarget + 1, true);
            } else {
                hvacController.setSetting('tempTarget', tempTarget - 1, true);
            }
    }
}

//the attachServer is called from /bin/www as that is where the Server Object is created
app.attachServer = function (server) {
    var ioserver = io.attach(server);
    //console.log('socket.io attached to Express server listening on port ' + server.address().port);
    ioserver.on('connection', function (socket) {
        debug('Client connected...');
        
        socket.on('join', function (data) {
            console.log(data);
        });
        socket.on('hvacController', function (data) {
            clientHvacControllerEvent(data);
        });
    });
}


module.exports = app;
