const {components} = require("chrome");
const Socket = require("socket");						// Module to establish the connection

// History service
var historyService = components.classes["@mozilla.org/browser/nav-history-service;1"]
                               .getService(components.interfaces.nsINavHistoryService);

var databaseStatus = historyService.databaseStatus;
switch (databaseStatus) {
  case historyService.DATABASE_STATUS_OK:
    // Database did already exist and has been correctly initialized.
    break;
  case historyService.DATABASE_STATUS_CREATE:
    // Database did not exist, a new one has just been created and initialized.
    break;
  case historyService.DATABASE_STATUS_CORRUPT:
    // Database was corrupt, has been moved to a .corrupt file and a new one has been created and initialized.
    break;
  case historyService.DATABASE_STATUS_UPGRADED:
    // Database had an old schema version and has been upgraded to a new one.
    break;
}

// On visit
var recordVisit = function(aURI, aVisitID, aTime, aSessionID, aReferringID, aTransitionType) {
	var URL = aURI.scheme + '://' + aURI.asciiHost + aURI.path;
	var keywordsTag = new RegExp("<meta\s+name=\"keywords\"\s+content=\"(.*)\"\s*>", "i");
	var descriptionTag = new RegExp("<meta\s+name=\"description\"\s+content=\"(.*)\"\s*>|<meta\s+content=\"(.*)\"\s+name=\"description\"\s*>", "i");
	var titleTag = new RegExp("<title>(.*)</title>", "i");
	var keywordSep = new RegExp(",\s*", "g");
	var titleSep = new RegExp("\s+(\||\-)\s+");

	let r = require("request").Request({
		url: URL,
		onComplete: function(response) {
			var keywords = keywordsTag.exec(response.text);
			var description = descriptionTag.exec(response.text);
			var title = titleTag.exec(response.text);
			var queryStr = "";
			if (keywords) {
				queryStr = keywords[1].replace(keywordSep, " ");
			} else if (description) {
				queryStr = description[1];
			} else if (title) {
				queryStr = title[1].split(titleSep)[0];
				if (queryStr.match(keywordSep)) {
					queryStr = queryStr.split(keywordSep)[0] + " " + queryStr.split(keywordSep)[1];
				}
			}
			Socket.connect('localhost', 6666, queryStr, function(q, data) {
				console.log(data.split('.')[1]);				
			});	
		}
	}).get();
}

// Observer
var historyObserver = {
  onBeginUpdateBatch: function() {},
  onEndUpdateBatch: function() {},
  onVisit: recordVisit,
  onTitleChanged: function(aURI, aPageTitle) {},
  onBeforeDeleteURI: function(aURI) {},
  onDeleteURI: function(aURI) {},
  onClearHistory: function() {},
  onPageChanged: function(aURI, aWhat, aValue) {},
  onDeleteVisits: function() {},
  QueryInterface:  function(iid) {
	if (iid.equals(components.interfaces.nsINavHistoryObserver) ||
      iid.equals(components.interfaces.nsINavHistoryObserver_MOZILLA_1_9_1_ADDITIONS) ||
      iid.equals(components.interfaces.nsISupports)) {
    	return this;
  	}
  	throw components.results.NS_ERROR_NO_INTERFACE;
  }
};

// Add observer
historyService.addObserver(historyObserver, false);
