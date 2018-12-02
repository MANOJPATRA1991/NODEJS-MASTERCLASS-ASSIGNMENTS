/*
 * Primary file for API
 *
 */

// Dependencies
var http = require('http');
var url = require('url');

 // Configure the server to respond to all requests with a string
var server = http.createServer(function(req,res){

  // Parse the url
  var parsedUrl = url.parse(req.url, true);

  /**
   * 
   * curl localhost:3000/foo/bar?fizz=buzz
   * 
   * Url {
      protocol: null,
      slashes: null,
      auth: null,
      host: null,
      port: null,
      hostname: null,
      hash: null,
      search: '?fizz=buzz',
      query: { fizz: 'buzz' },
      pathname: '/foo/bar',
      path: '/foo/bar?fizz=buzz',
      href: '/foo/bar?fizz=buzz' 
    }
   */
  console.log(parsedUrl);

  // Get the path
  var path = parsedUrl.pathname;
  var trimmedPath = path.replace(/^\/+|\/+$/g, '');

  // Get the query string as an object
  var queryStringObject = parsedUrl.query;

  // Get the HTTP method
  var method = req.method.toLowerCase();

  // Send the response
  res.end('Hello World!\n');

  // Log the request/response
  /**
   * curl localhost:3000/foo/bar?fizz=buzz
   * Request received on path: foo/bar with method: get and this query string:  { fizz: 'buzz' }
   */
  console.log('Request received on path: '+trimmedPath+' with method: '+method+' and this query string: ',queryStringObject);
});

// Start the server
server.listen(3000,function(){
  console.log('The server is up and running now');
});
