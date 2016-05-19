(function () {
    
    'use strict';

angular.module('hvacapp')
       .factory('hvacMonitorService', ['$q', '$rootScope', '$log', '$http', function ($q, $rootScope, $log, $http) {
            // We return this object to anything injecting our service
            var Service = {};
            
            var hvacShared = new $.hvacapp.HvacShared({
                eventLogMaxCount: 480
            });
            // Create our socket.io object and connect it to express
            var commonData = {
                hvacShared: hvacShared.getData(), 
                socket: {
                    reconnectionAttemptCount: 0,
                    reconnecting: false,
                    connected: false
                }
            };
        
            var socketIo = io();

            Service.commonData = commonData;

            var getHvacControllerData = function () {

                return $http.get('/api/hvacController/data').then(function (hvacControllerData) {
                    $log.debug("got HvacController Data");
                    //angular.merge(commonData.hvacData, hvacData.data);

                });
                
            }
            
            var getHvacControllerSettings = function () {
                
                return $http.get('/api/hvacController/settings').then(function (hvacControllerSettings) {
                    $log.debug("got HvacController Settings");
                    //angular.merge(commonData.hvacSettings, hvacSettings.data);
                });
                
            }
            
            
            var getHvacSharedData = function () {
                var mydefer = $q.defer();
                $http.get('/api/hvacShared/data').then(function (result) {
                    $log.debug("got Hvac Shared Data");
                    mydefer.resolve(result.data);

                }, function (result) {
                    mydefer.reject(result);
                });
                return mydefer.promise;
                
            }
            
            var refreshHvacSharedData = function (){
                var mydefer = $q.defer();
                getHvacSharedData().then(function (hvacSharedData) {
                    angular.merge(commonData.hvacShared, hvacSharedData);
                    mydefer.resolve(hvacSharedData);
                }, function (result) {
                    mydefer.reject(result);
                });
                return mydefer.promise;
            }
            
            Service.chartPointClick = function(label) {
                return hvacShared.chartPointClick(label);
            };
            
            Service.getChartDataSet = function (chartName) {
                return hvacShared.getChartDataSet(chartName);
            }
            
            Service.tempTargetUp = function (){
                socketIo.emit('hvacController', { type: 'tempTarget', data: { direction: 'up' } });
            }
            
            Service.tempTargetDown = function () {
                socketIo.emit('hvacController', { type: 'tempTarget', data: { direction: 'down' } });
            } 

            Service.refreshHvacSharedData = refreshHvacSharedData;
            
            Service.getServerSettings = function (){
                var mydefer = $q.defer();
                $http.get('/api/hvacShared/settings').then(function (result) {
                    $log.debug("got Hvac Settings");
                    hvacShared.setSettings(result.data);
                    mydefer.resolve(result.data);

                }, function (result) {
                    mydefer.reject(result);
                });
                return mydefer.promise;
                
            }
        
            socketIo.on('connect', function () {
                $log.info('hvacMonitorService socket connect');
                commonData.socket.connected = true;
                commonData.socket.reconnecting = false;
            });
            
            socketIo.on('disconnect', function (message) {
                $log.info('hvacMonitorService socket disconnect');
                commonData.socket.connected = false;
                commonData.socket.reconnecting = false;
            });
            socketIo.on('reconnect', function (message) {
                $log.info('hvacMonitorService socket reconnect success');
                commonData.socket.connected = true;
                commonData.socket.reconnecting = false;
            });
            
            socketIo.on('reconnect_attempt', function (attempt) {
                $log.info('hvacMonitorService socket reconnect_attemp');
                commonData.socket.connected = false;
                commonData.socket.reconnecting = true;
                commonData.socket.reconnectionAttemptCount = attempt;
            });
            
            socketIo.on('reconnecting', function (attempt) {
                $log.info('hvacMonitorService socket reconnecting');
                commonData.socket.connected = false;
                commonData.socket.reconnecting = true;
                commonData.socket.reconnectionAttemptCount = attempt;
            });
            
            socketIo.on('reconnect_error', function (attempt) {
                $log.info('hvacMonitorService socket reconnect_error');
                commonData.socket.connected = false;
                commonData.socket.reconnecting = false;
                commonData.socket.reconnectionAttemptCount = attempt;
            });
            
            socketIo.on('reconnect_failed', function (error) {
                $log.info('hvacMonitorService socket reconnect_failed');
                commonData.socket.connected = false;
                commonData.socket.reconnecting = false;
            });

            socketIo.on('hvacEvent', function (hvacEvent) {
                console.log('hvacMonitor received hvacEvent', hvacEvent);
                hvacShared.processHvacControllerEvent(hvacEvent);
                $rootScope.$emit("hvacMonitor:hvacEvent", hvacEvent);
            });
        

            return Service;
    }]);
})();