var $WhoWasThat = {
	Init:function(){
		$WhoWasThat.Search.SetupAutoComplete();

		// test();
	},
	Search:{
		SetupAutoComplete:function(){
			//This attaches an auto-complete plugin to the search box for each of the movie columns
			$('#search')
				.children('input')
				.autocomplete({
					minLength: 2,
					source: $WhoWasThat .Search.PerformSearch,
					select: $WhoWasThat.Search.MakeSelection
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
		},
		PerformSearch: function( request, response ) {
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
		},
		MakeSelection:function(event, ui){
			var api_url = 'http://www.imdbapi.com/?i='+ ui.item.id;
			var $input = $(this)

			//Call another API using the IMDB movie ID to get the movie details
			$.getJSON(api_url, function(data, status, xhr ) {
				//save the data to the input box itself
				$input.data('movieData', data);
				var $otherInputs = $input.siblings('input');

				var allHasData = true;
				//Check if the other inputs also have data on them...
				$otherInputs.each(function(){
					if(!Boolean($otherInputs.data('movieData'))) allHasData = false;
				});
				//If everything has data, show the results
				if(allHasData) $WhoWasThat.Results.Display($input.add($otherInputs));
			});
		}
	},
	Results:{
		Display:function($inputs){
			var $movies = $('#results').children('.movie');

			//Private function for processing comma separated lists of names and titling them
			function _processList(list, allNamesArray, $target, pluralTitle, singularTitle){
				//Trims out whitespace and splits the string into an array
				var names = $.map(list.split(","), $.trim);
				
				var singleName = '';
				var listHtml ='';
				//Only continue if there are items to process
				if(names.length === 1){
					//Just one item in the list
					$target.children('strong').text(singularTitle+':');
					singleName = $.trim(names[0]);

					$target.show();
				}else if(names.length >1){
					//Multiple items in the list
					$target.children('strong').text(pluralTitle);

					listHtml = '<li>' + names.join('</li><li>')+'</li>';
					
					$target.show();
				}
				$target.children('span').text(singleName);
				$target.children('ul').html(listHtml);

				return names;
			}

			//Loop through each of the inputs and grab the data from it.
			$inputs
				.each(function(i){
					var myData = $(this).data('movieData');
					var $thisMovie = $movies.eq(i);
					var $items = $thisMovie.children();

					//Set the image
					$items.filter('img').prop('src',myData.Poster)
					//Set the movie title and add in the year
					$items.filter('h2').html(  myData.Title + ' <small>('+myData.Year + ')</small>');
					//Set the IMDB link
					$items.filter('a').prop('href', 'http://imdb.com/title/'+myData.imdbID);
					//Set the plot desciption
					$items.filter('p').text(myData.Plot);

					//Create an empty array we will pass into each of the lists. They will add to this array
					var allNames = [];

					//Process the lists of actors, directors, and writers
					allNames = allNames.concat(_processList(myData.Actors, allNames, $items.filter('.js-actors'), 'Actors', 'Actor'));
					allNames = allNames.concat(_processList(myData.Director, allNames, $items.filter('.js-directors'), 'Directors', 'Director'));
					allNames = allNames.concat(_processList(myData.Writer, allNames, $items.filter('.js-writers'), 'Writers', 'Writer'));

					//Save that array as data on the movie
					$thisMovie.data('allNames', allNames);
				});

			$('#results').show();

			$WhoWasThat.Results.FindMatches($movies);
		},
		FindMatches:function($movies){
			//Private function to find matches within the passed in arrays
			//Found via: http://stackoverflow.com/a/11076696/79677
			
			function _arraysInCommon(arrays){
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
			
			//Get the array of names out of each movie
			var namesData = [];
			$movies.each(function(i){
				namesData.push($(this).data('allNames'));
			});

			var matches = _arraysInCommon(namesData);

			if(matches.length){
				var matchingPeopleList = '<li>' + matches.join('</li><li>')+'</li>';
				$('#matches')
					.show()
					.find('ul')
					.html(matchingPeopleList);

				$('#no-matches').hide();

				var $allPeople = $('#results').find('.movie .list').find('li, span');
				$.each(matches,function(i, value){
					$allPeople.filter(':contains('+value+')').addClass('highlight');
				});

				$("#results .movie .list ul li").each(function(){
					this.innerText
				});
			}else{
				$('#no-matches').show();
				$('#matches').hide();
			}
			
		}
	}
};

//Page load
$($WhoWasThat.Init);


// function test(){
// 	var $inputs = $("input");

// 	$inputs.first().val("Independence Day").data("movieData", {"Title":"Independence Day","Year":"1996","Rated":"PG-13","Released":"03 Jul 1996","Runtime":"2 h 33 min","Genre":"Action, Adventure, Sci-Fi, Thriller","Director":"Roland Emmerich","Writer":"Dean Devlin, Roland Emmerich","Actors":"Will Smith, Bill Pullman, Jeff Goldblum, Mary McDonnell","Plot":"The aliens are coming and their goal is to invade and destroy. Fighting superior technology, Man's best weapon is the will to survive.","Poster":"http://ia.media-imdb.com/images/M/MV5BMTMwODY3NzQzNF5BMl5BanBnXkFtZTcwNzUxNjc0MQ@@._V1_SX640.jpg","imdbRating":"6.7","imdbVotes":"225,011","imdbID":"tt0116629","Response":"True"});
// 	$inputs.last().val("Men in Black").data("movieData", {"Title":"Men in Black","Year":"1997","Rated":"PG-13","Released":"02 Jul 1997","Runtime":"1 h 38 min","Genre":"Action, Comedy, Sci-Fi","Director":"Barry Sonnenfeld","Writer":"Lowell Cunningham, Ed Solomon","Actors":"Tommy Lee Jones, Will Smith, Linda Fiorentino, Vincent D'Onofrio","Plot":"A streetwise NYPD detective joins a secret organization that polices extraterrestrial affairs on Earth.","Poster":"http://ia.media-imdb.com/images/M/MV5BNzA2MzI5Nzc0N15BMl5BanBnXkFtZTcwODE2NDU2MQ@@._V1_SX640.jpg","imdbRating":"7.1","imdbVotes":"195,825","imdbID":"tt0119654","Response":"True"});

// 	$WhoWasThat.Results.Display($inputs);
// }