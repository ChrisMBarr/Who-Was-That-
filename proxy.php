<?php
// Set Content-type
header('Content-type: application/json');


/*	IMDB JSON search format via: http://stackoverflow.com/a/7744369/79677
	Possible Parameters
	q=total+recall 		-- search query
	tt=on  				-- title search
	nm=on 			-- name search
	json=1				-- return JSON data format
	xml=1				-- return XML data format
	nr=1				-- ????

*/
$base = 'http://www.imdb.com/xml/find?json=1&tt=on&q=';
//Get the search query
$term = $_GET['term'];
//Build the final URL to search IMDB
$url= $base.urlencode($term);

//echo $url;

// Open the stream to access content as read-only with file pointer at beginning of file
$pointer = fopen($url, 'r');

// If the file/content exists, loop through the file until end of file
if ($pointer) {
    while (!feof($pointer)) {
        $line = fgets($pointer); // Get data from current line
        echo $line; // Output date from current line
    }
    fclose($pointer); // Close connection to file
}
?>