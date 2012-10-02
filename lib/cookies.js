// Dependencies
const {components} = require("chrome");
const cmgr = components.classes["@mozilla.org/cookiemanager;1"].getService(components.interfaces.nsICookieManager2);
const io = require('io.js');
const PageWorker = require("page-worker");	
const { defer } = require('api-utils/promise');
const Data = require("self").data;
const Deferred = require("jsdeferred").Deferred;

// Find add-on's directory
const dirsvc = components.classes["@mozilla.org/file/directory_service;1"]
		.getService(components.interfaces.nsIProperties);
const abs = dirsvc.get("ProfD", components.interfaces.nsIFile);
abs.append('GooPIR');

// Load domains
var domains = Data.load('domains').split('\n');

//Removes all cookies for all domains loaded on the browser under the specified category
exports.stAll = function(id, category) {
	for each (domain in domains) {
		exports.st(id, category, domain);
	}
}

// Stores all cookies in a file with the specified category name, identifiers and domain
exports.st = function(id, category, domain) {
	var cookieEnum = cmgr.getCookiesFromHost(domain);
	while (cookieEnum.hasMoreElements()) {
		var c = cookieEnum.getNext();
		if (c instanceof components.interfaces.nsICookie2){
			var cookieString = domain + ';' + c.path + ';' + c.name + ';' 
					+ c.value + ';'	+ c.isHttpOnly + ';' + c.expiry + '\n';	
			io.fwrite(io.join(abs.path, 'Cookies', id, category), cookieString);	       
		}
	}
};

// Loads all cookies from a file with the specified category name and identifiers
exports.ldAll = function(id, category) {
	var data = io.fread(io.join(abs.path, 'Cookies', id, category)), cookies = data.split('\n'), 
			numCookies = cookies.length;
	for (var i = 0; i < numCookies; i++) {
			var c = cookies[i].split(';');
			cmgr.add(c[0], c[1], c[2], c[3], false, c[4], false, c[5] + '');						
	}
};

// Removes all cookies for all domains loaded on the browser
exports.rmAll = function() {
	for each (domain in domains) {
		exports.rm(domain);
	}
}

// Removes all queries from the browser of the specified domain
exports.rm = function(domain) {
	var cookieEnum = cmgr.getCookiesFromHost(domain);
	while (cookieEnum.hasMoreElements()) {
		var c = cookieEnum.getNext();
		if (c instanceof components.interfaces.nsICookie2) {
			cmgr.remove(domain, c.name, c.path, false);
		}
	}	
};

// Checks if the cookie already exists
exports.exists = function(id, cat) { 
	return io.exists(io.join(abs.path, 'Cookies', id, cat)); 
}

//Generates a standard cookie
exports.gen = function(domain, callback) {
	let r = require("request").Request({
		url: "http://www" + domain,
		onComplete: function() {
			callback();
		}
	}).get();
};

//Generates a standard cookie
exports.genAll = function(callback) {
	// Init Google's cookies
	Deferred.loop(domains.length, function (i, o) {
		var d = new Deferred(), dom = domains[i];
		// Generate initialize a context for each category
		exports.gen(dom, function() {
			d.call();
		});
		return o.last? callback : d;
	}).next(function(cb) { cb();});
};

// Generates a doubleclick cookie
exports.genDoubleClick = function(time, callback) {
	var url =  "http://www.google.com/ads/preferences";
	let pw = new PageWorker.Page({
		contentURL: url,
		contentScriptFile: Data.url("js/jquery.js"),
		contentScript: "setTimeout(function() {" +
							"self.postMessage($('form').attr('action'));" +
						"}, " + time + ");",
		contentScriptWhen: "end",
		onMessage: function(actionURL) {
			try {
				require("request").Request({
					url: actionURL,
					onComplete: function() {
						callback();
					}
				}).get();
			} catch (e) {
				exports.genDoubleClick(time+100, callback);
			}
		}      			  
	});
};



exports.initContext = function() {
	var deferred = defer(), end = false;
	
	// Init doubleclick
	exports.genDoubleClick(100, function () {
		console.log("[GooPIR] - DoubleClick cookie generated for this category.");
		end? deferred.resolve() : end = true;
	});
	
	exports.genAll(function() {
		console.log("[GooPIR] - All Google's cookies generated for this category.")
		end? deferred.resolve() : end = true;
	});

	return deferred.promise;
};

exports.initContexts = function(callback) {
	var categories = ["Arts", "Games", "Reference", "Shopping", "Business", "Health", "News", 
	                  "Society", "Computers", "Home", "Recreation", "Science", "Sports"];
	var id = "2914";
	Deferred.next(function() {
		// Remove all existing cookies
		exports.rmAll();
		console.log("[GooPIR] - Existing cookies were removed.");
		console.log("[GooPIR] - Generating default cookies...");
	}).loop(categories.length, function (i) {
		var d = new Deferred(), cat = categories[i];
		// Generate initialize a context for each category
		console.log("[GooPIR] - Generating cookies for category: " + cat);
		exports.initContext().
			then(function() {
				exports.stAll(id, cat);
			}).then(function() {
				exports.rmAll(id, cat);
			}).then(function() {
				d.call();
			});
		return d;
	}).next(function() {
		console.log("[GooPIR] - Cookies were initialized.");
	}).next(callback);	
};
