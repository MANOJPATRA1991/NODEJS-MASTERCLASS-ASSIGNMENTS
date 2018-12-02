/*
 * Primary file for API
 *
 */

// Dependencies
var http = require('http');
var url = require('url');
var StringDecoder = require('string_decoder').StringDecoder;

// Configure the server to respond to all requests with a string
var server = http.createServer(function(req,res){

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  //Get the headers as an object
  var headers = req.headers;

  // Payloads which come in as part of HTTP request, come in as stream.

  // Get the payload,if any
  var decoder = new StringDecoder('utf-8');
  var buffer = '';

  req.on('data', function(data){
      /**
       * Returns a decoded string, ensuring that any incomplete 
       * multibyte characters at the end of the Buffer are 
       * omitted from the returned string and stored in an 
       * internal buffer for the next call to 
       * stringDecoder.write() or stringDecoder.end()
       */
      buffer += decoder.write(data);
  });

  // The end event is always gonna be called
  req.on('end', function(){
      /**
       * Returns any remaining input stored in the internal buffer 
       * as a string. Bytes representing incomplete UTF-8 and 
       * UTF-16 characters will be replaced with substitution 
       * characters appropriate for the character encoding.
       * 
       * If the buffer argument is provided, one final call to 
       * stringDecoder.write() is performed before returning the 
       * remaining input.
       */
      buffer += decoder.end();
    
      // Send the response
      res.end('Hello World!');

      // Log the request/response
      console.log('Request was received with this payload: ' + buffer);

  });
});

// Start the server
server.listen(3000,function(){
  console.log('The server is up and running now');
});
