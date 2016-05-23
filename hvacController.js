//HVACController.Js
//This Module will connect to the BeagleBone Hardware Pins to read Temp Trip relays, and Drive PWM output to Control HVAC dampers via Op Amp
//it then raises events based on hardware reading etc



var util = require('util');
var extend = require('extend');
var EventEmitter = require('events').EventEmitter;
var math = require('mathjs');
var HVACControllerEmulator = require('events').EventEmitter;
var debug = require('debug')('hvaController');
var nconf = require('nconf');
var i2c = null;
var MCP9808 = null;
var mcp9808 = null;
var HVACController = function (options) {
    var self = this;
    var defaultOptions = {
        pinLm35: '',
        mcp9808I2CAddress: "0x18",
        refreshTimerIntervalSeconds: 60,
        tempTarget: 75,
        tempCorrectionOffset: -10,
        tempTolerance: 5,
        schedule: [],// Code assumes these are in order earl
        relays: null
    }
    nconf.file('./configs/hvacControllerConfig.json');
    var configFileSettings = nconf.get();
    var objOptions = extend({}, defaultOptions, configFileSettings, options);
    
    

    // EventEmitters inherit a single event listener, see it in action
    this.on('newListener', function (listener) {
        debug('HvacController Event Listener: ' + listener);
    });
    
    var commonData = {
        temp: -0.001,
        isOverTemp: false,
        isUnderTemp: false,
        relays: {},
        isEmulationEnabled:false
    }
    var settings = {};
    extend(settings, objOptions);
    
    var hvacControllerEmulator = null;
    var isBeagleBone = false
    var boneScript;
    
    
    function boneScriptPrintStatus(err, x) {
        self.emit('log', { type: "info", msg: 'boneScript printStatus:', err:err, bonescript: x });
    }
    
    function boneScriptPrintPinMux(err, x) {
        
        var msg = 'boneScript PrintPinMux: ';
        msg = msg + 'mux = ' + x.mux + ',';
        msg = msg + 'pullup = ' + x.pullup + ',';
        msg = msg + 'slew = ' + x.slew + ',';
        if (x.options)
            msg = msg + 'options = ' + x.options.join(',') + ',';
        msg = msg + 'pin = ' + x.pin + ',';
        msg = msg + 'name = ' + x.name + ',';
        msg = msg + 'err = ' + x.err + ',';

        self.emit('log', { type: "info", msg: JSON.stringify(x), data:x, err: err });
    }

    self.setSetting = function (name, value, save) {
        var extraData = null
        if (typeof (value) === 'object') {
            extend(settings[name], value);
        } else {
            settings[name] = value;
        }
        if (save) {
            nconf.set(name, value);
            nconf.save();
        }
        switch (name) {
            case "tempTarget":
                commonData.tempTarget = value;
                extraData = { tempTarget: settings.tempTarget, tempTolerance: settings.tempTolerance };
                break;

        }
        self.emit('hvacEvent', { type: "settingsChange", data: { name: name, value: value, date: new Date(), extraData: extraData } });
    }
    
    self.getSetting = function (name) {
        
        return settings[name];
        
    }

    self.getSettings = function () {
        return settings;
    }
   

    var processNewTemp = function (temp, source) {
        //self.emit('log', { type: "info", msg: 'temp ' + temp + 'commonData.temp:' + commonData.temp});
        if (temp != commonData.temp) {
            commonData.temp = temp;
            
            var tempTargetDifference = commonData.temp - settings.tempTarget;
            //self.emit('log', { type: "info", msg: 'tempTargetDifference ' + tempTargetDifference });
            var isOverTemp = (tempTargetDifference > 0)
            if (tempTargetDifference < 0) {
                // make tempTagetDifference positive
                tempTargetDifference = 0 - tempTargetDifference;
            }

            if (tempTargetDifference > settings.tempTolerance) {
                //WE are out of the Tolerance so lets trip our relays etc
                if (isOverTemp) {
                    //If we are already overtemp then no need to do anything we already did it
                    if (commonData.isOverTemp == false) {
                        self.emit('log', { type: "info", msg: 'we are now overtemp!' });
                        commonData.isOverTemp = true;
                        commonData.isUnderTemp = false;
                        
                        //Set Relays if they should be on OverTemp
                        for (var propname in settings.relays) {
                            var relay = settings.relays[propname];
                            if (relay) {
                                if (relay.enableOnOverTemp) {
                                    self.emit('log', { type: "info", msg: 'setting relay ' + relay.alias + ' pin ' + relay.pin + ' ' + (relay.onStateIsHigh ? 'HIGH' : 'LOW') });
                                    if (isBeagleBone) {
                                        
                                        boneScript.digitalWrite(relay.pin, (relay.onStateIsHigh ? boneScript.HIGH : boneScript.LOW), boneScriptPrintStatus);
                                    }
                                    commonData.relays[propname].pinIsHigh = (relay.onStateIsHigh ? true : false);
                                    commonData.relays[propname].isOn = true,
                                    self.emit('hvacEvent', { type: "relay", data: { name:propname,  alias: relay.alias, pinIsHigh: commonData.relays[propname].pinIsHigh, isOn: commonData.relays[propname].isOn, temp: temp, date: new Date() } });
                                }
                            }
                        } 
                        
                    } else {
                        self.emit('log', { type: "info", msg: 'we are still overtemp!' });
                    }
                } else {
                    //If we are already undertemp then no need to do anything we already did it
                    if (commonData.isUnderTemp == false) {
                        commonData.isOverTemp = false;
                        commonData.isUnderTemp = true;
                        //Set Relays if they should be on UnderTemp
                        for (var propname in settings.relays) {
                            var relay = settings.relays[propname];
                            if (relay) {
                                if (relay.enableOnUnderTemp) {
                                    self.emit('log', { type: "info", msg: 'setting relay ' + relay.alias + ' pin ' + relay.pin + ' ' + (relay.onStateIsHigh ? 'HIGH' : 'LOW') });
                                    if (isBeagleBone) {
                                        boneScript.digitalWrite(relay.pin, (relay.onStateIsHigh ? boneScript.HIGH : boneScript.LOW), boneScriptPrintStatus);
                                    }
                                    commonData.relays[propname].pinIsHigh = (relay.onStateIsHigh ? true : false);
                                    commonData.relays[propname].isOn = true,
                                    self.emit('hvacEvent', { type: "relay", data: { name: propname, alias: relay.alias, pinIsHigh: commonData.relays[propname].pinIsHigh, isOn: commonData.relays[propname].isOn, temp: temp, date: new Date() } });
                                }
                            }
                        } 
                    } else {
                        self.emit('log', { type: "info", msg: 'we are still undertemp!' });
                    }
                }

            } else {
                //if we are now not out of tollerence but don't turn off until we are at or below tempTarget
                if (commonData.isOverTemp == true) {
                    
                    if (commonData.temp > settings.tempTarget) {
                        self.emit('log', { type: "info", msg: 'we are no longer overtemp but still above tempTarget so stay on' });
                    } else {
                        self.emit('log', { type: "info", msg: 'we are no longer overtemp!' });   
                        commonData.isOverTemp = false;
                        //Set Relays if they should be on OverTemp
                        for (var propname in settings.relays) {
                            var relay = settings.relays[propname];
                            if (relay) {
                                if (relay.enableOnOverTemp) {
                                    self.emit('log', { type: "info", msg: 'setting relay ' + relay.alias + ' pin ' + relay.pin + ' ' + (relay.onStateIsHigh ? 'LOW' : 'HIGH') });
                                    if (isBeagleBone) {
                                        boneScript.digitalWrite(relay.pin, (relay.onStateIsHigh ? boneScript.LOW : boneScript.HIGH), boneScriptPrintStatus);
                                    }
                                    commonData.relays[propname].pinIsHigh = (relay.onStateIsHigh ? false : true);
                                    commonData.relays[propname].isOn = false,
                                    self.emit('hvacEvent', { type: "relay", data: { name: propname, alias: relay.alias, pinIsHigh: commonData.relays[propname].pinIsHigh, isOn: commonData.relays[propname].isOn, temp: temp, date: new Date() } });
                                }
                            }
                        }
                    }
                }
                if (commonData.isUnderTemp == true) {
                    if (commonData.temp < settings.tempTarget) {
                        self.emit('log', { type: "info", msg: 'we are no longer undertemp but still below tempTarget so stay on!' });
                    } else {
                        self.emit('log', { type: "info", msg: 'we are no longer undertemp!' });
                        commonData.isUnderTemp = false;
                        //Set Relays Off if they should be on UnderTemp
                        for (var propname in settings.relays) {
                            var relay = settings.relays[propname];
                            if (relay) {
                                if (relay.enableOnUnderTemp) {
                                    self.emit('log', { type: "info", msg: 'setting relay ' + relay.alias + ' pin ' + relay.pin + ' ' + (relay.onStateIsHigh ? 'LOW' : 'HIGH') });
                                    if (isBeagleBone) {
                                        boneScript.digitalWrite(relay.pin, (relay.onStateIsHigh ? boneScript.LOW : boneScript.HIGH), boneScriptPrintStatus);
                                    }
                                    commonData.relays[propname].pinIsHigh = (relay.onStateIsHigh ? false : true);
                                    commonData.relays[propname].isOn = false,
                                    self.emit('hvacEvent', { type: "relay", data: { name: propname, alias: relay.alias, pinIsHigh: commonData.relays[propname].pinIsHigh, isOn: commonData.relays[propname].isOn, temp: temp, date: new Date() } });
                                }
                            }
                        }
                    }
                }
            }

            self.emit('hvacEvent', { type: "temp", data: { temp: temp, date: new Date(), tempTarget: settings.tempTarget, tempTolerance: settings.tempTolerance, source: source} });
        }
    }
    
   

    var readTemp = function () {
        var temp;
        if (isBeagleBone && objOptions.mcp9808I2CAddress != '') {
            //console.log('attempting mcp9808 read');
            mcp9808.AmbientTemperature(function (err, temp) {
                //makes sure it isn't undefined
                 if (err) {
                    self.emit('log', {type:"error", msg:"error reading i2c mcp9808 temp",error:err})
                } else {
                    temp = (temp * 1.8000) + 32.00;
                    self.emit('log', { type: "info", msg: "ic2 mcp9808 tempature reading " + temp + 'F' });
                    processNewTemp(math.round(temp, 2), "mcp9808");
                }
            });
           

        }
        if (isBeagleBone && objOptions.pinLm35 && objOptions.pinLm35 != '') {
            boneScript.analogRead(objOptions.pinLm35, function (x) {
                //console.log('x.value = ' + x.value);
                //console.log('x.err = ' + x.err);
                temp = ((x.value  * 324) + 32) + settings.tempCorrectionOffset;
                self.emit('log', { type: "info", msg: "LM35 tempature reading " + temp + 'F' });
                processNewTemp(math.round(temp, 2), "LM35");
            });
        }

        if (isBeagleBone == false){
            self.emit('log', { type: "info", msg: "emulated tempature reading" });
            temp = hvacControllerEmulator.readTemp();
            processNewTemp(math.round(temp, 2),"Emulator");
        }
        
    }
    
    //self.setTempTarget = function (tempTarget){
    //    commonData.tempTarget = tempTarget;
    //}
    
    self.setEmulatorSetting = function (name, value){
        if (commonData.isEmulationEnabled == true) {
            hvacControllerEmulator.setSetting(name, value);
        }
    }

    var _started = false;
    
    var init = function (){
        
        //for each setting raise a setting change event to let all our listeners know we changed our settings.
        for (var propname in settings) {
            if (propname) {
                self.emit('hvacEvent', { type: "settingsChange", data: { name: propname, value: settings[propname], date: new Date() } });
            }
        }
        
        if (process.platform !== 'win32') {
            isBeagleBone = true;
            
            //boneScript = require('./octalbonescript/octalbonescript.js');
            //boneScript = require('bonescript');
            //diable autoload of cape in octalbone
            process.env['AUTO_LOAD_CAPE'] = '0';
            //process.env['DEBUG'] = 'bone';
            boneScript = require('octalbonescript');
            boneScript.getPlatform(function (err,x) {
                debug('bonescript getPlatform');
                debug('version = ' + x.version);
                debug('serialNumber = ' + x.serialNumber);
                debug('dogtag = ' + x.dogtag);
                self.emit('log', { type: "info", msg: "octalboneScript platform name:" + x.boardName + ', version:' + x.version + ', serialNumber:' + x.serialNumber + ', dogtag:' + x.dogtag });
            });
            i2c = require('i2c');
            MCP9808 = require('./mcp9808.js');
            mcp9808 = new MCP9808();
            if (isBeagleBone && objOptions.mcp9808I2CAddress != '') {
                console.log('attempting mcp9808 read');
                mcp9808.Initialize({}, function (err) {
                    
                    console.log('i2c mcp9808 Inited');
                    
                    
                });
            }
            
        } else {
            var HvacControllerEmulator = require('./hvacControllerEmulator.js');
            hvacControllerEmulator = new HvacControllerEmulator();
            commonData.isEmulationEnabled = true;
            hvacControllerEmulator.start();
        }
        for (var propname in settings.relays) {
            var relay = settings.relays[propname];
            if (relay) {
                commonData.relays[propname] = { pinIsHigh: (relay.onStateIsHigh ? false : true), isOn:false }
                if (isBeagleBone) {
                    //Init the relays
                    boneScript.getPinMode(relay.pin, boneScriptPrintPinMux);
                    boneScript.pinMode(relay.pin, boneScript.OUTPUT, function (err, x) {
                        boneScript.digitalWrite(relay.pin, (relay.onStateIsHigh ? boneScript.LOW : boneScript.HIGH), boneScriptPrintStatus);
                    }
                        ) //, 7, (settings.pinRelay2OnHigh ? 'pulldown' : 'pullup'), boneScriptPrintStatus);
                    //init relay to off
                    
                }
                self.emit('hvacEvent', { type: "relay", data: { name:propname, alias: relay.alias, pinIsHigh: commonData.relays[propname].pinIsHigh, isOn: commonData.relays[propname].isOn, date: new Date() } });
            }
        }

    }
    

    var refreshTimer = null;
    self.start = function () {
        _started = true;
        init();
        readTemp();
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
                    
                    self.emit('log', { type: "info", msg: "refreshTimer Interval" });
                    readTemp();
                    
                } else {
                    //we stoped so clear the interval
                    if (refreshTimer != null) {
                        clearInterval(refreshTimer);
                    }
                
                }
            }, settings.refreshTimerIntervalSeconds * 1000);
    }
    
    self.stop = function () {
        _started = false;
        clearInterval(reconnectTimer);
        reconnectTimer = null;
    }

    self.getData = function () {
        return commonData;
    }

};
// extend the EventEmitter class using our Radio class
util.inherits(HVACController, EventEmitter);

module.exports = HVACController;