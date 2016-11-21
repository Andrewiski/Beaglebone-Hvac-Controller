//This File is shared with both the node.js server and the client as it is used to process SMDREvents 
//and keep callData insync

// The logic here is to determine if this is the 
// start of a call a transfer, or end of a call and add, delete from the calls list
// we will raise the call begin and call end events 
// as well as on and off hock events for the extensions and trunks

//this will get set at the bottom depending on if module is present
var extend


var HvacShared = function (options) {
    var self = this;
    var defaultOptions = {
        name: "",
        eventsMaxCount: 1000
    }
    
    var objOptions = extend({}, defaultOptions, options);
    
    

    var commonData = {
        name: objOptions.name,
        temp: 0.00,
        tempTarget:0.00,
        relays: {},
        events: []
    }
    var eventHistory = {
        currentDayOfWeek: -1,
        dayOfWeeks: [
            { label: "Monday", events: [] },
            { label: "Tuesday", events: [] },
            { label: "Wednesday", events: [] },
            { label: "Thursday", events: [] },
            { label: "Friday", events: [] },
            { label: "Saturday", events: [] },
            { label: "Sunday", events: [] }
        ]
    } 
        
    self.chartPointClick = function (label) {
        for (var i = 0; i < commonData.chart.labels.length; i++) {
            if (label == commonData.chart.labels[i]) {
                var dayOfWeek = commonData.reports.dayOfWeeks[commonData.reports.currentDayOfWeek];
                if (dayOfWeek.hourly && dayOfWeek.hourly.length > 0) {
                    var minLabels = [];
                    for (var k = 0; k < 60; k++) {
                        
                        minLabels.push(dayOfWeek.hourly[i].label + ":" + k);
                    
                    }
                    commonData.chart.labels = minLabels;
                    commonData.chart.data[0] = dayOfWeek.hourly[i].data;
                }
                return;
            }

        }
        
        
    };
    
    var getRelaySymbol = function (p1, p2, p3, p4, p5, p6, p7, p8) {
        var mod = p3 % 3;

        switch (mod) {

        }

    }
    
    var getPlotDataSet = function (events){
        var chartDataSet = {
            label: objOptions.name,
            data: [                
                { label: "Temp Above", lines: { show: true, fill: true, zero: false }, points: { show: false }, data: [] },
                { label: "Temp Below", lines: { show: true, fill: true, zero: false }, points: { show: false }, data: [] },
                { label: "Temp", lines: { show: true },points: { show: true, fill: true},hoverable:true,  data: [] }
                
            ]
        }
        
        for (var key in commonData.relays) {
            chartDataSet.data.push({ label: commonData.relays[key].alias, lines: { show: true}, points: { show: true, symbol: "triangle" }, data: [] });
        }
        
        for (var i = 0; i < events.length; i++) {
            var eventData = events[i];
            if (eventData.data && eventData.data.date) {
                var tempDate = new Date(eventData.data.date);
                var x = tempDate.getTime();
                switch (eventData.type) {
                    case "temp":
                        chartDataSet.data[2].data.push([x, eventData.data.temp]);
                        //push a tempTarget value
                        chartDataSet.data[1].data.push([x, eventData.data.tempTarget + eventData.data.tempTolerance, eventData.data.tempTarget]);
                        chartDataSet.data[0].data.push([x, eventData.data.tempTarget, eventData.data.tempTarget - eventData.data.tempTolerance]);
                        
                        break;
                    case "relay":
                        var relayData = null;
                        for (var k = 2; k < chartDataSet.data.length; k++) {
                            if (chartDataSet.data[k].label == eventData.data.alias) {
                                relayData = chartDataSet.data[k].data;
                                break;
                            }
                        }
                        if (relayData) {
                            relayData.push([x, eventData.data.temp]);
                            if (eventData.data.isOn == false) {
                                //push a null so the line doesn't connect tell its back on
                                relayData.push([x+1, null]);
                            }
                        
                        }
                        break;
                    case "settingsChange":
                        switch (eventData.data.name) {
                            case "tempTarget":
                                //chartDataSet.data[1].data.push([x, eventData.data.value]);
                                if (eventData.data.extraData && eventData.data.extraData.tempTarget && eventData.data.extraData.tempTolerance) {
                                    chartDataSet.data[1].data.push([x, eventData.data.extraData.tempTarget + eventData.data.extraData.tempTolerance, eventData.data.extraData.tempTarget]);
                                    chartDataSet.data[0].data.push([x, eventData.data.extraData.tempTarget, eventData.data.extraData.tempTarget - eventData.data.extraData.tempTolerance]);
                                }
                                break;
                        }
                        break;
                }
            } else {
                console.error("Invalid eventData", eventData);
            }
        }
        return chartDataSet; 
    }

    self.getChartDataSet = function (chartName){
        switch (chartName) {
            case "live":
                return getPlotDataSet(commonData.events);
            default:
                return getPlotDataSet(self.getEventHistory(chartName));
        }
    } 
    
    self.getEventHistory = function(name) {
        for (var i = 0; i < eventHistory.dayOfWeeks.length; i++) {
            if (eventHistory.dayOfWeeks[i].label == name) {
                return eventHistory.dayOfWeeks[i].label;
            }
        }
    }

    var eventListeners = [];
    
    var eventEmit = function (name, data){
        for (var i = 0; i < eventListeners.length; i++) {
            if (eventListeners[i].name == name) {
                eventListeners[i].handler(name, data);
            }
        }
    }
    
    var eventOn = function (name, handler){
        eventListeners.push({name:name, handler:handler})
    }
    
    var addEventHistory = function (eventData){
        //here we add the data to the reports arrays
        if (!eventData.data.date) {
            debug('error eventData date missing ' + eventData.type);
        }
        var tempDate = new Date(eventData.data.date);
        var dayOfWeek = tempDate.getDay();
        var dayOfWeekEvents = eventHistory.dayOfWeeks[dayOfWeek].events;
        if (eventHistory.currentDayOfWeek != dayOfWeek) {
            if (eventData.type != "settingsChange") {
                eventHistory.currentDayOfWeek = dayOfWeek;
                //clear the array
                dayOfWeekEvents.length = 0;
                //add an Event for eachRelay to record its current state
                for (var key in commonData.relays) {
                    relay = commonData.relays[key];
                    dayOfWeekEvents.push({ type: "relay", data: { name:key, alias: relay.alias, pinIsHigh: relay.pinIsHigh, isOn: relay.isOn, date: new Date() } });
                }
            }
        }
       dayOfWeekEvents.push(eventData);
    }


    var processHvacControllerEvent = function (eventData) {
        switch (eventData.type) {
            case "temp":
                commonData.temp = eventData.data.temp;
                if (commonData.events.length > objOptions.eventsMaxCount) {
                    commonData.events.shift();
                }
                commonData.events.push(eventData);
                break;
            case "relay":
                if (commonData.events.length > objOptions.eventsMaxCount) {
                    commonData.events.shift();
                }
                var relay = commonData.relays[eventData.data.name];
                if (relay) {
                    relay.pinIsHigh = eventData.data.pinIsHigh;
                    relay.isOn = eventData.data.isOn;
                } else {
                    console.error("unable to find relay");
                    console.dir(eventData);
                }
                commonData.events.push(eventData);
                break;
            case "settingsChange":
                switch (eventData.data.name) {
                    case "tempTarget":
                        commonData.tempTarget = eventData.data.value;
                        if (commonData.events.length > objOptions.eventsMaxCount) {
                            commonData.events.shift();
                        }
                        commonData.events.push(eventData);
                        break;
                    case "relays":
                        extend(commonData.relays, eventData.data.value);
                }     
           break;
        }
        addEventHistory(eventData);
          
    }
    
    self.setSettings = function (settings) {
        extend(objOptions, settings);
    }

    self.processHvacControllerEvent = processHvacControllerEvent;
    self.getData = function (){
        return commonData;
    }
    self.on = eventOn;

    //self.getSmdrEventDuration = getSmdrEventDuration;
    //self.getSmdrEventTimeStamp = getSmdrEventTimeStamp;
}




if (typeof(require) == "undefined") {
    //This should only happen client side as require is valid in Node.js server side but not client side so we add the functions
    $.hvacapp = $.hvacapp || {};
    $.hvacapp.HvacShared = $.hvacapp.HvacShared || HvacShared;
    //$.extend($.pmapp.SMDRShared, SMDRShared);
    extend = $.extend;

} else {
    

    extend = require('extend');
    module.exports = HvacShared;
}


        
