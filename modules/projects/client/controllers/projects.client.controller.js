'use strict';
// Projects controller
angular.module('projects').controller('ProjectsController', ['$scope', '$stateParams', '$location', '$window', '$timeout', 'Authentication', 'Projects', 'FileUploader',
	function($scope, $stateParams, $location, $window, $timeout, Authentication, Projects, FileUploader ) {
		$scope.authentication = Authentication;

		// Create file uploader instance
		$scope.uploader = new FileUploader({
			url: '/api/projects/picture'
		});

		$scope.uploaderC = new FileUploader({
			url: '/api/projects/picture'
		});

		// Create new Project
		$scope.create = function() {
			// Create new Project object
			var project = new Projects ({
				name: this.name,
				created: this.created,
				user: this.user,
				status: this.status,
				isPublic: this.isPublic,
				minGrade: this.minGrade,
				maxGrade: this.maxGrade,
				ask: this.ask,
				imagine: this.imagine,
				essentialDetails: this.essentialDetails,
				rating: null
			});

			// Redirect after save
			project.$save(function(response) {

				// Start upload of picture

				$scope.uploaderC.queue[0].url = '/api/projects/picture/' + response._id;
				$scope.uploaderC.uploadAll();


				// Clear form fields
				$scope.name = '';


				$location.path('projects/' + response._id);


			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});


		};

		// Remove existing Project
		$scope.remove = function( project ) {
			if ( project ) { project.$remove();

				for (var i in $scope.projects ) {
					if ($scope.projects [i] === project ) {
						$scope.projects.splice(i, 1);
					}
				}
			} else {
				$scope.project.$remove(function() {
					$location.path('projects');
				});
			}
		};

		// Update existing Project
		$scope.update = function() {
			var project = $scope.project;
			
			project.imagine.plan = '';

			project.$update(function() {

				$location.path('projects/' + project._id);
			}, function(errorResponse) {
				$scope.error = errorResponse.data.message;
			});

			$scope.uploader.queue[0].url = '/api/projects/picture/' + project._id;
			$scope.uploader.uploadAll();
		};

		// Find a list of Projects
		$scope.find = function() {
			$scope.projects = Projects.query();
		};

		// Find existing Project
		$scope.findOne = function() {
			$scope.project = Projects.get({ 
				projectId: $stateParams.projectId
			});

		};

		// Called after the user selected a new picture file
		$scope.uploader.onAfterAddingFile = function (fileItem) {
			if ($window.FileReader) {
				var fileReader = new FileReader();
				fileReader.readAsDataURL(fileItem._file);

				fileReader.onload = function (fileReaderEvent) {
					$timeout(function () {
						$scope.project.imagine.plan = fileReaderEvent.target.result;
					}, 0);
				};
			}
		};

		$scope.uploaderC.onAfterAddingFile = function (fileItem) {
			if ($window.FileReader) {
				var fileReader = new FileReader();
				fileReader.readAsDataURL(fileItem._file);

				fileReader.onload = function (fileReaderEvent) {
					$timeout(function () {
						$scope.imageURL = fileReaderEvent.target.result;
					}, 0);
				};
			}
		};

/*	-------------------------------------Star Rating Stuff-------------------------------------- */



		//an array containing the name of the glyphicon to use for each star
		$scope.glyphs = new Array(
			'gold glyphicon glyphicon-star-empty',
			'gold glyphicon glyphicon-star-empty',
			'gold glyphicon glyphicon-star-empty',
			'gold glyphicon glyphicon-star-empty',
			'gold glyphicon glyphicon-star-empty'
		);

		/*	
			Runs when a star glyphicon is hovered into. It sets all the stars up to the current one
			to have the filled-in star glyphicon.
		*/
		$scope.rating_hover = function(num){
			for(var i = 0; i < num; i++){
				$scope.glyphs[i] = 'gold glyphicon glyphicon-star';
			}
			for(i = num; i < 5; i++){
				$scope.glyphs[i] = 'gold glyphicon glyphicon-star-empty';
			}
		}; 
			
		//Runs when a star glyphicon is hovered out of. Resets the  stars' highlighing to the current rating
		$scope.reset_hover = function(){
			$scope.rating_hover($scope.rating);
		};

		//Prints out user's current rating of the project
		$scope.getMyRating = function(){

			if ($scope.project.rating && $scope.project.rating.ratings ){
				var rater = $scope.project.rating.ratings.filter(isRater)[0];
				console.log(rater);
				if (typeof rater === 'undefined'){
					$scope.rating = 0;	//current rating
					return 'You haven\'t yet rated this project. Give it a couple of stars?';
				}
				$scope.rating = rater.num;
				$scope.reset_hover();
				return ('Your currently rate this project at ' + rater.num + ' stars');
			}
			$scope.rating = 0;	//current rating
			return 'This project has not yet been rated. Give it a couple of stars?';

		}; 

        // Function to find the current rater
        var isRater = function(value){
			return value.reviewer === $scope.authentication.user._id;
        };

		//Changes the user's rating of the project
		$scope.rate = function(){
			console.log('In $scope.rate');
			if(!$scope.project.rating){
				$scope.project.rating = {
					ratings : [
						{
							num: $scope.rating,
							reviewer: $scope.authentication.user._id
						}
					],
					avg_rating : $scope.rating
				};
			} else {
                var rater = $scope.project.rating.ratings.filter(isRater)[0];
                var length = $scope.project.rating.ratings.length;
				var rateToRemove = 0;

                var newLength = length + 1;

                if(length === 0)
                {
                    $scope.project.rating.avg_rating = 0;
                }

				if(typeof rater !== 'undefined') {
                    rateToRemove = rater.num;
                    var rateIndex = $scope.project.rating.ratings.indexOf(rater);
                    $scope.project.rating.ratings.splice(rateIndex, 1);
                    newLength -= 1;
                }

				$scope.project.rating.avg_rating = ($scope.project.rating.avg_rating * length + $scope.rating - rateToRemove)/(newLength);

				$scope.project.rating.ratings.push({
						num: $scope.rating,
						reviewer: $scope.authentication.user._id
				});
			}
			$scope.update();


		};  

		
		
	}
]);
