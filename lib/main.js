/*
 *  Script for AOL logs
 *  IIIA - CSIC
 */

/*
 * Import dependences
 */
const {components} = require("chrome");
const goopir = require("goopir");						// GooPIR module
const tabs = require('tabs');							// Tabs' utilities
const widgets = require("widget");						// Widget
const Data = require("self").data;						// Module to access addon's URLs
const CookieMgr = require('cookies');					// Utilities to work with cookies
const notifications = require("notifications");			// Module to display notifications
const io = require('io.js');
var history = require('history.js');

//Find add-on's directory
const dirsvc = components.classes["@mozilla.org/file/directory_service;1"]
		.getService(components.interfaces.nsIProperties);
const abs = dirsvc.get("ProfD", components.interfaces.nsIFile);
abs.append('GooPIR');

if (!io.exists(io.join(abs.path, 'init'))) {
	io.fwrite(io.join(abs.path, 'init'), '1');
	notifications.notify({
	  title: "GooPIR",
	  text: "The add-on is being configured...",
	  data: "The add-on is being configured...",
	  onClick: function (data) {
	    console.log(data);
	  }
	});
	CookieMgr.initContexts(function() {
		notifications.notify({
		  title: "GooPIR",
		  text: "The add-on is ready to use. Click on the icon of the add-on's bar.",
		  data: "The add-on is ready to use. Click on the icon of the add-on's bar..",
		  onClick: function (data) {
		    console.log(data);
		  }
		});
		exports.Goopir();
	});
}

exports.Goopir = function() {
	var w = new widgets.Widget({
		id: "goopir-link",
		label: "GooPIR add-on",
		contentURL: Data.url("img/iiia.png"),
		onClick: function() {			
			// On click, open a tab with the search page
			tabs.open({
				 url: Data.url('search.html'),
				 onReady: function() {
					 // Attach a worker that handles the event of sending the query
					 var worker = this.attach({
						 contentScriptFile: [Data.url('js/jquery.js'),Data.url('js/handleQuery.js')],
					 });					 
					 // When the event is triggered:
					 worker.port.on('querySent', function(query) {	
						 goopir.main(query, function(results) {
							 worker.port.emit('loadResponse', results);
						 });											 
					});
				 }
			}); 	 
		}
	});
}
