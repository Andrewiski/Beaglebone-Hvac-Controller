(function () {

    'use strict';
    /**
     * @ngdoc directive
     * @name pmapp.phoneMonitorController
     * @function
     *
     * @description
     * This Controller will controler a widget that will allow a user to perform Admin functions
     */
    angular.module('hvacapp')
    
    .controller('hvacMonitorController', ['$rootScope','$scope', '$q', '$log', '$http', 'hvacMonitorService',  
        function ($rootScope, $scope, $q, $log, $http, hvacMonitorService) {
            $scope.doneLoading = false;

            $log.debug("hvacMonitorController init");
            $scope.data = hvacMonitorService.commonData;
            //phoneMonitor.connect(); //Conect to the server using socket.io
            
           
            //$scope.chart = hvacMonitorService.commonData.hvacShared.chart;

            $scope.refresh = function (){
                hvacMonitorService.refreshHvacSharedData().then(function () {
                    refreshLiveChart();  
                });
            }
            
            $scope.tempTargetUp = function(){
                hvacMonitorService.tempTargetUp(); 
            }
            
            $scope.tempTargetDown = function() {
                hvacMonitorService.tempTargetDown();
            }
            
            $scope.chartName = 'live';
            $scope.chartClickData = { plotItem: null };
            
            var plotClickHandler = function (event, pos, item) {
                //alert("You clicked at " + pos.x + ", " + pos.y);
                // axis coordinates for other axes, if present, are in pos.x2, pos.x3, ...
                // if you need global screen coordinates, they are pos.pageX, pos.pageY
                
                if (item) {
                    $scope.chartClickData.plotItem = item;
                    $scope.$apply();
                    //highlight(item.series, item.datapoint);
                    //alert("You clicked a point!");
                }
            }

            //$scope.plot.bind("plotclick", plotClickHandler); 

            var refreshLiveChart = function (data){
                if ($scope.chartName == 'live') {
                    var data = hvacMonitorService.getChartDataSet('live');
                    $scope.plot.setData(data.data);
                    $scope.plot.setupGrid();
                    $scope.plot.draw();
                    
                }
                
            }
            hvacMonitorService.getServerSettings();
            //Go get the first batch of data
            $scope.refresh();
            // listen for the event in the relevant $scope
            $rootScope.$on('hvacMonitor:hvacEvent', function (event, data) {
                refreshLiveChart(data);
                $scope.$apply(); //this triggers a $digest so we pick up changes to the commonData
            });

            
            //$scope.onClick = function (points, evt) {
            //    var point;
            //    if (points.length == 3) {
            //        point = points[1];
            //    } else {
            //        point = points[0];
            //    }
            //    hvacMonitorService.chartPointClick(point.label);
            //    console.log(points, evt);
            //};

 
        }
    ])

    .controller('hvacMonitorEventController', ['$scope', '$log',   
        function ($scope, $log) {
            $log.debug("hvacMonitorEventController init");
        }
    ])

   
})();