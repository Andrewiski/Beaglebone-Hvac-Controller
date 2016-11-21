#!/usr/bin/env node
var debug = require('debug')('hvacapp');
var app = require('./app');
var nconf = require('nconf');
nconf.file('./configs/hvacMonitorConfig.json');
var configFileSettings = nconf.get();
app.set('port', process.env.PORT || 12334);

//app.set('port', configFileSettings.webserverPort || process.env.PORT || 12334);

var server = app.listen(app.get('port'), function () {
    console.log('Express webserver listening on port ' + server.address().port)
    debug('Express webserver listening on port ' + server.address().port);
});

//used to attach the server to socketIO in app
app.attachServer(server);