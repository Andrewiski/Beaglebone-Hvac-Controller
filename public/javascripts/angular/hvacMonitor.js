(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name deapp.admin
     * @function
     *
     * @description
     * This directive will generate a widget that will allow a user to perform Admin functions
     */
    angular.module('hvacapp')
    
    .directive('hvacMonitor', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/javascripts/angular/hvacMonitor.tpl.html',
                controller: 'hvacMonitorController',
                replace: false,
                scope:false,
                link: function (scope, elm, atts, c) {
                    $log.debug("hvacMonitorController LINK");
                    scope.chartoptions = {
                        series: {
                            shadowSize: 0,	// Drawing is faster without shadows
                            points: { show: true }
                        },
                        yaxis: {
                            //min: 0,
                            //max: 100
                        },
                        xaxis: {
                            show: true,
                            mode: "time",
                            timezone:"browser",
                            timeformat: "%I:%M:%S"
                        }
                    };
                    
                    scope.chartdata = [[]];
                    //var pc = $('#flotchartplaceHolder');
                    scope.plot = $.plot('#chartplaceHolder', scope.chartdata, scope.chartoptions);
                }
            };
        }
    ])


     .directive('hvacMonitorEvent', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/javascripts/angular/hvaceMonitor.event.tpl.html',
                controller: 'hvacMonitorEventController',
                replace: false,
                scope: {
                    event: '=hvacMonitorEvent'
                },
                link: function (scope, elm, atts, c) {

                    $log.debug("hvacMonitorEventController LINK");
                    
                }
            };
        }
    ])

   
})();