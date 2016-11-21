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
    
    .controller('hvacConfigController', ['$rootScope','$scope', '$q', '$log', '$http', 'hvacMonitorService',  
        function ($rootScope, $scope, $q, $log, $http, hvacMonitorService) {
            $scope.doneLoading = false;

            $log.debug("hvacConfigController init");
            $scope.data = hvacMonitorService.commonData;
            //phoneMonitor.connect(); //Conect to the server using socket.io
            
           
            //$scope.chart = hvacMonitorService.commonData.hvacShared.chart;

           
            
            $scope.tempTargetUp = function(){
                hvacMonitorService.tempTargetUp(); 
            }
            
            $scope.tempTargetDown = function() {
                hvacMonitorService.tempTargetDown();
            }

            $scope.refresh = function () {
                hvacMonitorService.refreshHvacSharedData().then(function () {
                    
                });
            }
            $scope.refresh();
            $rootScope.$on('hvacMonitor:hvacEvent', function (event, data) {
                $scope.$apply(); //this triggers a $digest so we pick up changes to the commonData
            });

 
        }
    ])

   
})();