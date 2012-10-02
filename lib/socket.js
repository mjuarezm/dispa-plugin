const {components} = require("chrome");
const {NetUtil} = components.utils.import("resource://gre/modules/NetUtil.jsm");

exports.connect = function(server, port, data, callback) {
    var transportService =  components.classes["@mozilla.org/network/socket-transport-service;1"]
    		.getService(components.interfaces.nsISocketTransportService);  

    var transport = transportService
    		.createTransport(null, 0, server, port, null);  

    var stream = transport
			.openInputStream(components.interfaces.nsITransport.OPEN_UNBUFFERED,null,null);
    
    var instream = components.classes["@mozilla.org/scriptableinputstream;1"]
    		.createInstance(components.interfaces.nsIScriptableInputStream); 

    // Initialize
    instream.init(stream);
    
    var outstream = transport.openOutputStream(0, 0, 0);
    
    var dataListener = { 
        onStartRequest: function(request, context) {
        	console.log("[GooPIR] - Connected to GoopirServer");
        },

        onStopRequest: function(request, context, status) {
            instream.close();
            outstream.close();
        }, 

        onDataAvailable: function(request, context, inputStream, offset, count) {        	
            callback(data, instream.read(count).replace(/\n/gm,''));
        }
    };

    var pump = components.classes["@mozilla.org/network/input-stream-pump;1"]
            .createInstance(components.interfaces.nsIInputStreamPump);
    
    pump.init(stream, -1, -1, 0, 0, false); 
    pump.asyncRead(dataListener, null); 
	
	// Find category
	var inputStr = components.classes["@mozilla.org/io/string-input-stream;1"]
			.createInstance(components.interfaces.nsIStringInputStream);

	var outData = data + '\n';
	
	inputStr.setData(outData, outData.length);

	NetUtil.asyncCopy(inputStr, outstream, function(aResult) {  
		if (!components.isSuccessCode(aResult)) {
			console.log("[GooPIR] - ERROR: writing to socket");
		}
	});    											
}