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
    
    .directive('hvacConfig', ['$log',
        function ($log) {
            return {
                restrict: 'AE',
                templateUrl: '/javascripts/angular/hvacConfig.tpl.html',
                controller: 'hvacConfigController',
                replace: false,
                scope: false,
                link: function (scope, elm, atts, c) {
                    $log.debug("hvacConfigController LINK");
                }
            }
        }
    ])


     

   
})();