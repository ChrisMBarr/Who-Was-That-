$page = (function(){

	var $inputs;
	var completeSearchData = "completesearch"
	
	var viewModel = {
		SearchComplete : ko.observable(false),
		Movies : ko.observableArray([]),
		Matches : ko.observableArray([])
	};

	function movieModel(movieData){
		var self = this;
		self.Title = ko.observable(movieData.Title);
		self.Year = ko.observable(movieData.Year);
		self.Rating = ko.observable(movieData.Rated);
		self.Description = ko.observable(movieData.Plot);
		self.Poster = ko.observable(movieData.Poster);
		self.ImdbLink = ko.observable("http://imdb.com/title/" + movieData.imdbID);
		
		self.PeopleGroups = ko.observableArray([
			new personGroupModel(movieData.Actors, "Actor:", "Actors"),
			new personGroupModel(movieData.Director, "Director:", "Directors"),
			new personGroupModel(movieData.Writer, "Writer:", "Writers")
		]);
	}

	function personGroupModel(list, singularTitle, pluralTitle){
		var self = this;
		self.People = $.map(list.split(","), $.trim);
		self.Title = self.People.length ===1 ? singularTitle : pluralTitle;
	}

	//Page Load
	$(function(){
		//Bind the view model 
		ko.applyBindings(viewModel);

		//Populate the variable with the jQuery inputs
		$inputs = $('#search').children('input');

		//This attaches an auto-complete plugin to the search box for each of the movie columns
		$inputs 
			.autocomplete({
				minLength: 2,
				source: PerformSearch,
				select: MakeSelection
			})
			.each(function(){
				//Override an internal jQuery UI function to allow it to properly display HTML!
				$(this).data( "autocomplete" )._renderItem = function( ul, item ) {
					return $( "<li></li>" )
						.data( "item.autocomplete", item )
						.append( "<a>" +  item.label + "</a>" )
						.appendTo(ul);
				}
			});

			insetTestData();
	});

	//This handle what happens when typing into the search box.
	//Basically when you select a movie title you get an IMDB movie ID back
	function PerformSearch( request, response ) {
		//Private function to loop through matches in the passed in array
		function _parseMatches(list){
			var arr = [];
			if(list){
				for (var i = 0; i < list.length ; i++) {
					var match = {
						label : list[i].title +' <small>('+list[i].description.split(',')[0]+')</small>',
						value : list[i].title.replace('&#x27;',"'").replace('&#x26;', '&'),
						id : list[i].id
					};
					arr[i] = (match);
				};
			}
			return arr;
		}

		$.getJSON('proxy.php', request, function(data, status, xhr ) {
			//Create a finalized array to use
			var moviesList = [];
			moviesList = moviesList.concat( _parseMatches(data.title_popular));
			moviesList = moviesList.concat(_parseMatches(data.title_exact));
			//Only show approximate matches when no others exist
			if(!data.title_popular && !data.title_exact) moviesList = moviesList.concat(_parseMatches(data.title_approx));

			//Return the final array
			response(moviesList);
		});
	}

	//This take the IMDB movie ID and looks up movie information from another API
	function MakeSelection(event, ui){
		var api_url = 'http://www.imdbapi.com/?i='+ ui.item.id;
		var $thisInput = $(this);

		//Set the current input to complete
		$thisInput.data(completeSearchData, true);

		//Check the other inputs as well
		var allComplete = true;
		$inputs.each(function(i, el){
			allComplete = allComplete && $(el).data(completeSearchData);
		});

		//Change the search complete bool on teh view model
		viewModel.SearchComplete(allComplete);

		//Call another API using the IMDB movie ID to get the movie details
		$.getJSON(api_url, function(movieData, status, xhr ) {
			//Dump the data into a new movie model
			viewModel.Movies.push(new movieModel(movieData));

			//Get all the names from all the movies...
			var allNames = new Array();
			$.each(viewModel.Movies(), function(i, thisMovie){
				allNames.push(
					$.map(thisMovie.PeopleGroups(), function(group){
						return group.People;
					})
				);
			});

			//Find the matches and set them in the view model
			viewModel.Matches(arraysInCommon(allNames));

		});
	}

	//Private function to find matches within the passed in arrays
	//Found via: http://stackoverflow.com/a/11076696/79677
	function arraysInCommon(arrays){
		var i, common,
		L= arrays.length, min= Infinity;
		while(L){
			if(arrays[--L].length<min){
				min= arrays[L].length;
				i= L;
			}
		}
		common= arrays.splice(i, 1)[0];
		return common.filter(function(itm, indx){
			if(common.indexOf(itm)== indx){
				return arrays.every(function(arr){
					return arr.indexOf(itm)!= -1;
				});
			}
		}).sort();
	}

	function insetTestData(){
		var movie1Data = {"Title":"Independence Day","Year":"1996","Rated":"PG-13","Released":"03 Jul 1996","Runtime":"2 h 33 min","Genre":"Action, Adventure, Sci-Fi, Thriller","Director":"Roland Emmerich","Writer":"Dean Devlin, Roland Emmerich","Actors":"Will Smith, Bill Pullman, Jeff Goldblum, Mary McDonnell","Plot":"The aliens are coming and their goal is to invade and destroy. Fighting superior technology, Man's best weapon is the will to survive.","Poster":"http://ia.media-imdb.com/images/M/MV5BMTMwODY3NzQzNF5BMl5BanBnXkFtZTcwNzUxNjc0MQ@@._V1_SX640.jpg","imdbRating":"6.7","imdbVotes":"225,011","imdbID":"tt0116629","Response":"True"};
		var movie2Data = {"Title":"Men in Black","Year":"1997","Rated":"PG-13","Released":"02 Jul 1997","Runtime":"1 h 38 min","Genre":"Action, Comedy, Sci-Fi","Director":"Barry Sonnenfeld","Writer":"Lowell Cunningham, Ed Solomon","Actors":"Tommy Lee Jones, Will Smith, Linda Fiorentino, Vincent D'Onofrio","Plot":"A streetwise NYPD detective joins a secret organization that polices extraterrestrial affairs on Earth.","Poster":"http://ia.media-imdb.com/images/M/MV5BNzA2MzI5Nzc0N15BMl5BanBnXkFtZTcwODE2NDU2MQ@@._V1_SX640.jpg","imdbRating":"7.1","imdbVotes":"195,825","imdbID":"tt0119654","Response":"True"};

		viewModel.Movies(new movieModel(movie1Data));
		viewModel.Movies(new movieModel(movie2Data));

		$inputs.first().val("Independence Day").trigger("autocompleteselect");;
		$inputs.last().val("Men in Black").trigger("autocompleteselect");;
		
	}

	return {
		viewModel: viewModel
	};

})();