/*
Create the root application here
*/
var app = angular.module('hvacapp',
    [
    'ui.router',
    'ui.date',
    'ui.utils',
    'ui.bootstrap',
    'ui.select',
    'ngSanitize',
    'ngAnimate'
    
]);


/*
Now config the root application
*/
app.config(['$compileProvider', '$stateProvider', '$logProvider', '$locationProvider', '$urlRouterProvider',
    function ($compileProvider, $stateProvider, $logProvider, $locationProvider, $urlRouterProvider) {
        
        try {

            $stateProvider.state('home', {
                url: '/',
                templateUrl: '/javascripts/angular/hvacMonitor.view.html',
                controller: 'hvacMonitorStateController'
            })

            $stateProvider.state('config', {
                url: '/app/config',
                template: '<div data-hvac-config></div>'
            })
                       
            $urlRouterProvider.otherwise(function ($injector, $location) {
                console.log("bad route $urlRouterProvider.otherwise redirecting to home page");
                return "/";
            })
            //errorHandlerProvider.setDefaultErrorMessage('An Error has occured on the server. Error Code NER100');
            $locationProvider.html5Mode(true);
        } catch (ex) {
           //$logToConsole('Fatal Error in app.js config: ' + ex.message);
        }

    }]);

/*
    Now execute run on the root application
    */
    app.run(['$templateCache', '$rootScope', '$location', '$anchorScroll', '$http', '$log', '$state',
        function ($templateCache, $rootScope, $location, $anchorScroll, $http, $log, $state) {

        $rootScope.previousState = 'home';
        $rootScope.currentState;
        $rootScope.$on('$stateChangeSuccess', function (ev, to, toParams, from, fromParams) {
            $rootScope.previousState = from.name;
            $rootScope.currentState = to.name;
            $log.debug('Previous state:' + $rootScope.previousState)
            $log.debug('Current state:' + $rootScope.currentState)
        });
        
       

    }]);

/*############################################################
  Here we are fetching startup data for the app
    THEN we are bootstrapping angular

  If you want to add a call, just write a function that 
  returns a promise and add it to the when call below
############################################################*/
//$(document).ready(function () {
//    try {
        
//        //Now manually bootstrap angular
//        angular.bootstrap(document, ['pmapp']);
//        $.logToConsole('Angular bootstrap Complete');
        
//    } catch (ex) {
//        console.error('JANKS');
//        console.error(ex);
//        $.logToConsole('Fatal Error in Angular bootstrap: ' + ex.message)
//    }
//});

