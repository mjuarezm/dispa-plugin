/*
 *  Script for AOL logs
 *  IIIA - CSIC
 */

/*
 * Import dependences
 */
const {components} = require("chrome");
const Socket = require("socket");						// Module to establish the connection
const PageMod = require("page-mod").PageMod;			// Page Module
const PageWorker = require("page-worker");				// Page Workers
const CookieMgr = require('cookies');					// Utilities to work with cookies
const io = require('io.js');                      	 	// I/O library
const tabs = require('tabs');
const widgets = require("widget");
const Request = require("request").Request;
const Data = require("self").data;

// Get the absolute path for the profile
const dirsvc = components.classes["@mozilla.org/file/directory_service;1"]
		.getService(components.interfaces.nsIProperties);
const abs = dirsvc.get("ProfD", components.interfaces.nsIFile);
abs.append('GooPIR');

function reqGoogleResults(q, callback) {
	var googleResURL = "http://www.google.com/search?complete=0&num=100&hl=es&safe=off&q=";
	(new Request({
	 	url: googleResURL + q,
	 	onComplete: function (response) {
	 		var resultsPageHTML = response.text;									 		
	 		console.log("[GooPIR] - Request sent to Google.")
	 		// Store the results page
	 		io.fwrite(io.join(abs.path, 'Queries', q), resultsPageHTML);			
	 		// Load the DOM
	 		callback(resultsPageHTML);									 		
	 	}
	})).get();	
}

// Given a query and a callback, executes the callback to the results
// retrieved from Google using a GooPIR aproach (profileSpliting)
exports.main = function(query, callback) {					 										 					 
	console.log("[GooPIR] - Query: " + query);		
	
	// Check f this query exists
	if (io.exists(io.join(abs.path, 'Queries', query))) {
		console.log("[GooPIR] - Query exists.");		    				
		
		// Load stored page of results
		callback(io.fread(io.join(abs.path, 'Queries', query)));
		
	} else {    					
		console.log("[GooPIR] - Query does not exist.");
		
		var bypassConnection = function(q, data) {
			var inLine = data.split('.'), identifier = inLine[0], category = inLine[1];								
			console.log("[GoopirServer] - Category: " + category);
			require("notifications").notify({
		        title: "[GoopirServer]",
		        text: "Category: " + category
		    });
			
			CookieMgr.rmAll();
			// Check if there are cookies for that category
			if (CookieMgr.exists(identifier, category)) {
				console.log("[GooPIR] - There are stored cookies for that category");
				
				// In case already exist, load cookies for that category
				CookieMgr.ldAll(identifier, category);
				console.log("[GooPIR] - Context for " + category + " is loaded.");

			} else {
				console.log("[GooPIR] - Identifiers were found. New cookies will be generated.");
				CookieMgr.initContext(identifier, category).
					then(function() {
						CookieMgr.stAll(identifier, category);
					});
				// If it's the first query for that category, store it
				console.log("[GooPIR] - New context " + category + " for these identifiers is stored.");				
			}
			reqGoogleResults(q, callback);
		};
		// Make connection to classifier and send query
		Socket.connect('localhost', 6666, query, bypassConnection);	
	}				 
};
