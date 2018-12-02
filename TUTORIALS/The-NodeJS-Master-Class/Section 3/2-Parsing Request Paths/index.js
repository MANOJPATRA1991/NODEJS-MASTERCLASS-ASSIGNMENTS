/*
 * Primary file for API
 *
 */

// Dependencies
var http = require('http');
var url = require('url');

// Configure the server to respond to all requests with a string
// Everytime http://localhost:3000/ is called, this function is invoked
var server = http.createServer(function(req,res){

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  // Get the path
  var path = parsedUrl.pathname;

  // Trim off slashes
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Send the response
  res.end("Hello World!");

  // Log the request/response
  console.log("Request is received on path: " + trimmedPath);
});

// Start the server
server.listen(3000,function(){
  console.log('The server is up and running now');
});
