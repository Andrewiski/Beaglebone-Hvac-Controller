//HVACController.Js
//This Module will connect to the BeagleBone Hardware Pins to read Temp Trip relays, and Drive PWM output to Control HVAC dampers via Op Amp
//it then raises events based on hardware reading etc

var util = require('util');
var extend = require('extend');
var EventEmitter = require('events').EventEmitter;


var HVACControllerEmulator = function (options) {
    var self = this;
    var defaultOptions = {
        temp: 71.99,
        refreshTimerIntervalSeconds : 1,
        changeDegreesPerInterval: .1,
        maxTemp: 80,
        minTemp: 60,
        tempChangeUp: true,
    }
    var objOptions = extend({}, defaultOptions, options);
    
    var commonData = {
        temp: 0
    }
    
    var settings = {};
    extend(settings, objOptions);
    commonData.temp = objOptions.temp;
    var readTemp = function () {
        return commonData.temp;
    }
    
    self.setTemp = function (value){
        commonData.temp = value;
    }

    self.readTemp = function () {
        return commonData.temp;
    }

    self.setSetting = function (name, value){
        setting[name] = value;
    }
    
    var _started = false;
    var refreshTimer = null;
    self.start = function () {
        _started = true;
        if (refreshTimer != null) {
            //console.log('reconnectTimer != null so clearInterval');
            self.emit('log', { type: "info", msg: "refreshTimer != null so clearInterval" });
            clearInterval(reconnectTimer);
            refreshTimer = null;
        }
        
        //start a timer so that if we get disconnected we reconnect
        refreshTimer = setInterval(
            function () {
                if (_started == true) {
                    
                    if (settings.changeDegreesPerInterval > 0) {
                        if (settings.tempChangeUp) {
                            commonData.temp = commonData.temp + settings.changeDegreesPerInterval;
                        } else {
                            commonData.temp = commonData.temp - settings.changeDegreesPerInterval;
                        }

                        if (commonData.temp >= settings.maxTemp) {
                            settings.tempChangeUp = false;
                            commonData.temp = settings.maxTemp;
                        }
                        if (commonData.temp <= settings.minTemp) {
                            settings.tempChangeUp = true;
                            commonData.temp = settings.minTemp;
                        }

                    }

                    self.emit('log', { type: "info", msg: "refreshTimer Interval" });
                    readTemp();
                    
                } else {
                    //we stoped so clear the interval
                    if (refreshTimer != null) {
                        clearInterval(refreshTimer);
                    }
                
                }
            }, objOptions.refreshTimerIntervalSeconds * 1000);
    }
    
    self.stop = function () {
        _started = false;
        clearInterval(reconnectTimer);
        reconnectTimer = null;
    }

};
// extend the EventEmitter class using our Radio class
util.inherits(HVACControllerEmulator, EventEmitter);

module.exports = HVACControllerEmulator;