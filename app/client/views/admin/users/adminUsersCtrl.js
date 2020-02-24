const moment = require('moment');
const swal = require('sweetalert');

angular.module('reg')
  .controller('AdminUsersCtrl',[
    '$scope',
    '$state',
    '$stateParams',
    'UserService',
    function($scope, $state, $stateParams, UserService){

      $scope.pages = [];
      $scope.users = [];

      // Semantic-UI moves modal content into a dimmer at the top level.
      // While this is usually nice, it means that with our routing will generate
      // multiple modals if you change state. Kill the top level dimmer node on initial load
      // to prevent this.
      $('.ui.dimmer').remove();
      // Populate the size of the modal for when it appears, with an arbitrary user.
      $scope.selectedUser = {};
      $scope.selectedUser.sections = generateSections({status: '', confirmation: {
        dietaryRestrictions: []
      }, profile: ''});

      function updatePage(data){
        $scope.users = data.users;
        $scope.currentPage = data.page;
        $scope.pageSize = data.size;

        var p = [];
        for (var i = 0; i < data.totalPages; i++){
          p.push(i);
        }
        $scope.pages = p;
      }

      UserService
        .getPage($stateParams.page, $stateParams.size, $stateParams.query)
        .then(response => {
          updatePage(response.data);
        });

      $scope.$watch('queryText', function(queryText){
        UserService
          .getPage($stateParams.page, $stateParams.size, queryText)
          .then(response => {
            updatePage(response.data);
          });
      });

      $scope.goToPage = function(page){
        $state.go('app.admin.users', {
          page: page,
          size: $stateParams.size || 50
        });
      };

      $scope.goUser = function($event, user){
        $event.stopPropagation();

        $state.go('app.admin.user', {
          id: user._id
        });
      };

      $scope.toggleCheckIn = function($event, user, index) {
        $event.stopPropagation();

        if (!user.status.confirmed){
          swal({
            title: "Unable to Check In",
            text: user.profile.firstName + " has not confirmed, so they can't be checked in!",
            icon: "warning",
          })
          return;
        }

        if (!user.status.checkedIn){
          swal({
            title: "Whoa, wait a minute!",
            text: "You are about to check in " + user.profile.firstName + "!",
            icon: "warning",
            buttons: {
              cancel: {
                text: "Cancel",
                value: null,
                visible: true
              },
              checkIn: {
                className: "danger-button",
                closeModal: false,
                text: "Yes, check them in",
                value: true,
                visible: true
              }
            }
          })
          .then(value => {
            if (!value) {
              return;
            }

            UserService
              .checkIn(user._id)
              .then(response => {
                $scope.users[index] = response.data;
                swal("Accepted", response.data.profile.firstName + " has been checked in.", "success");
              });
          });
        } else {
          UserService
            .checkOut(user._id)
            .then(response => {
              $scope.users[index] = response.data;
              swal("Accepted", response.data.profile.firstName + ' has been checked out.', "success");
            });
        }
      };

      $scope.acceptUser = function($event, user, index) {
        $event.stopPropagation();

        console.log(user);

        swal({
          buttons: {
            cancel: {
              text: "Cancel",
              value: null,
              visible: true
            },
            accept: {
              className: "danger-button",
              closeModal: false,
              text: "Yes, accept them",
              value: true,
              visible: true
            }
          },
          dangerMode: true,
          icon: "warning",
          text: "You are about to accept " + user.profile.firstName + "!",
          title: "Whoa, wait a minute!"
        }).then(value => {
          if (!value) {
            return;
          }

          swal({
            buttons: {
              cancel: {
                text: "Cancel",
                value: null,
                visible: true
              },
              yes: {
                className: "danger-button",
                closeModal: false,
                text: "Yes, accept this user",
                value: true,
                visible: true
              }
            },
            dangerMode: true,
            title: "Are you sure?",
            text: "Your account will be logged as having accepted this user. " +
              "Remember, this power is a privilege.",
            icon: "warning"
          }).then(value => {
            if (!value) {
              return;
            }

            UserService
              .admitUser(user._id)
              .then(response => {
                $scope.users[index] = response.data;
                swal("Accepted", response.data.profile.firstName + ' has been admitted.', "success");
              });
          });
        });
      };

      $scope.toggleAdmin = function($event, user, index) {
        $event.stopPropagation();

        if (!user.admin){
          swal({
            title: "Whoa, wait a minute!",
            text: "You are about make " + user.profile.firstName + " an admin!",
            icon: "warning",
            buttons: {
              cancel: {
                text: "Cancel",
                value: null,
                visible: true
              },
              confirm: {
                text: "Yes, make them an admin",
                className: "danger-button",
                closeModal: false,
                value: true,
                visible: true
              }
            }
          }).then(value => {
            if (!value) {
              return;
            }

            UserService
              .makeAdmin(user._id)
              .then(response => {
                $scope.users[index] = response.data;
                swal("Made", response.data.profile.firstName + ' an admin.', "success");
              });
            }
          );
        } else {
          UserService
            .removeAdmin(user._id)
            .then(response => {
              $scope.users[index] = response.data;
              swal("Removed", response.data.profile.firstName + ' as admin', "success");
            });
        }
      };

      function formatTime(time){
        if (time) {
          return moment(time).format('MMMM Do YYYY, h:mm:ss a');
        }
      }

      $scope.rowClass = function(user) {
        if (user.admin){
          return 'admin';
        }
        if (user.status.confirmed) {
          return 'positive';
        }
        if (user.status.admitted && !user.status.confirmed) {
          return 'warning';
        }
      };

      function selectUser(user){
        $scope.selectedUser = user;
        $scope.selectedUser.sections = generateSections(user);
        $('.long.user.modal')
          .modal('show');
      }

      function generateSections(user){
        return [
          {
            name: 'Basic Info',
            fields: [
              {
                name: 'Created On',
                value: formatTime(user.timestamp)
              },{
                name: 'Last Updated',
                value: formatTime(user.lastUpdated)
              },{
                name: 'Confirm By',
                value: formatTime(user.status.confirmBy) || 'N/A'
              },{
                name: 'Checked In',
                value: formatTime(user.status.checkInTime) || 'N/A'
              },{
                name: 'Email',
                value: user.email
              }
            ]
          },{
            name: 'Profile',
            fields: [
              {
                name: 'First Name',
                value: user.profile.firstName
              },{
                name: 'Last Name',
                value: user.profile.lastName
              },{
                name: 'Gender',
                value: user.profile.gender
              },{
                name: 'Race',
                value: user.profile.race
              },{
                name: 'School',
                value: user.profile.school
              },{
                name: 'Level of Study',
                value: user.profile.level
              },{
                name: 'Major',
                value: user.profile.major
              },{
                name: 'How did you hear about HackNYU',
                value: user.profile.hear
              },{
                name: 'HackNYU would be which hackathon for you?',
                value: user.profile.hackathons
              },{
                name: 'Attended HackNYU in the past?',
                value: user.profile.hacknyu
              }
            ]
          },{
            name: 'Confirmation',
            fields: [
              {
                name: 'Phone Number',
                value: user.confirmation.phone
              },{
                name: 'Date of Birth',
                value: user.confirmation.dob
              },{
                name: 'Shirt Size',
                value: user.confirmation.shirt
              },{
                name: 'Graduation Month',
                value: user.confirmation.gradMonth
              },{
                name: 'Graduation Year',
                value: user.confirmation.gradYear
              },{
                name: 'Interested in Track',
                value: user.confirmation.track
              },{
                name: 'Is Minor',
                value: user.confirmation.isMinor,
                type: 'boolean'
              },{
                name: 'Is NYU Student',
                value: user.confirmation.goesToNYU,
                type: 'boolean'
              },{
                name: 'NetID',
                value: user.confirmation.netID
              },{
                name: 'NYU School',
                value: user.confirmation.nyuSchool
              },{
                name: 'Is International',
                value: user.confirmation.isInternational,
                type: 'boolean'
              },{
                name: 'International Country',
                value: user.confirmation.internationalCountry
              },{
                name: 'Wants Hardware',
                value: user.confirmation.wantsHardware,
                type: 'boolean'
              },{
                name: 'Hardware Wanted',
                value: user.confirmation.hardware
              },{
                name: 'Has Dietary Restrictions',
                value: user.confirmation.hasDietaryRestrictions,
                type: 'boolean'
              },{
                name: 'Dietary Restrictions',
                value: user.confirmation.dietaryRestrictions
              },{
                name: 'Has Accessibility Needs',
                value: user.confirmation.hasAccessibilityNeeds,
                type: 'boolean'
              },{
                name: 'AccessibilityNeeds',
                value: user.confirmation.accessibilityNeeds
              },{
                name: 'Github',
                value: user.confirmation.github
              },{
                name: 'Linkedin',
                value: user.confirmation.linkedin
              },{
                name: 'Website',
                value: user.confirmation.website
              },{
                name: 'Emergency Contact Name',
                value: user.confirmation.emergencyName,
              },{
                name: 'Emergency Contact Relation',
                value: user.confirmation.emergencyRelation
              },{
                name: 'Emergency Contact Phone Number',
                value: user.confirmation.emergencyPhone,
              },{
                name: 'Additional Notes',
                value: user.confirmation.notes
              }
            ]
          }
        ];
      }

      $scope.selectUser = selectUser;

    }]);
