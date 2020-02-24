const swal = require('sweetalert');

angular.module('reg')
  .controller('ConfirmationCtrl', [
    '$scope',
    '$rootScope',
    '$state',
    'currentUser',
    'Utils',
    'UserService',
    function($scope, $rootScope, $state, currentUser, Utils, UserService){

      // Set up the user
      var user = currentUser.data;
      $scope.user = user;

      $scope.pastConfirmation = Date.now() > user.status.confirmBy;

      $scope.formatTime = Utils.formatTime;

      _setupForm();

      // -------------------------------

      function _updateUser(e){
        var confirmation = $scope.user.confirmation;

        UserService
          .updateConfirmation(user._id, confirmation)
          .then(response => {
            swal("Woo!", "You're confirmed!", "success").then(value => {
              $state.go("app.dashboard");
            });
          }, response => {
            console.log(response);
            swal("Uh oh!", "Please Fill Out The Required Fields", "error");
          });
      }

      function _setupForm(){
        // Semantic-UI form validation
        $('.ui.form').form({
          fields: {
            shirt: {
              identifier: 'shirt',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please give us a shirt size!'
                }
              ]
            },
            phone: {
              identifier: 'phone',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter a phone number.'
                }
              ]
            },
            dob: {
              identifier: 'dob',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your date of birth.'
                }
              ]
            },
            gradMonth: {
              identifier: 'gradMonth',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your graduation month.'
                }
              ]
            },
            gradYear: {
              identifier: 'gradYear',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your graduation year.'
                }
              ]
            },
            emergencyName: {
              identifier: 'emergencyName',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your emergency contact\'s name.'
                }
              ]
            },
            emergencyRelation: {
              identifier: 'emergencyRelation',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your emergency contact\'s relation to you.'
                }
              ]
            },
            emergencyPhone: {
              identifier: 'emergencyPhone',
              rules: [
                {
                  type: 'empty',
                  prompt: 'Please enter your emergency contact\'s phone number.'
                }
              ]
            },
            apis: {
              identifier: 'apis',
              rules: [
                {
                  type: 'empty',
                  prompt: 'You must agree to the API terms of use.'
                }
              ]
            },
            photos: {
              identifier: 'photos',
              rules: [
                {
                  type: 'empty',
                  prompt: 'You must agree to the photos agreement'
                }
              ]
            },
            minor: {
              identifier: 'minor',
              rules: [
                {
                  type: 'empty',
                  prompt: 'You must agree to the minors participation agreement'
                }
              ]
            },
            nyucoc: {
              identifier: 'nyucoc',
              rules: [
                {
                  type: 'empty',
                  prompt: 'You must agree to the NYU Code of Conduct'
                }
              ]
            },
            sponsors: {
              identifier: 'sponsors',
              rules: [
                {
                  type: 'empty',
                  prompt: 'You must agree to the sponsors agreement'
                }
              ]
            },
          }
        });
      }

      $scope.submitForm = function(){
        if ($('.ui.form').form('is valid')){
          _updateUser();
        } else {
            swal("Uh oh!", "Please Fill The Required Fields", "error");
        }
      };
    }]);
