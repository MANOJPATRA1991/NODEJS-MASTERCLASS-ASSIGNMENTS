let url = require('url');
let StringDecoder = require('string_decoder').StringDecoder;
let router = require('./router');

let callbacks = {};

// All the server logic for both HTTP and HTTPS server
callbacks.unifiedServer = (req, res) => {
    // Parse the url
    let parsedUrl = url.parse(req.url, true);

    // Get the path
    let path = parsedUrl.pathname;
    let trimmedPath = path.replace(/^\/+|\/+$/g, '');

    // Get the HTTP method
    let method = req.method.toLowerCase();

    switch(method) {
        case 'get':
            let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : router.notFound;

            // Route the request to the handler specified in the router
            chosenHandler((statusCode) => {

                // Use the status code returned from the handler, or set the default status code to 200
                statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

                // Return the response
                res.setHeader('Content-Type', 'application/text');
                res.writeHead(statusCode);
                res.end(`Hello`);
            });
            break;

        case 'post':
            // Get the payload, if any
            let decoder = new StringDecoder('utf-8');
            
            let buffer = '';

            req.on('data', data => {
                buffer += decoder.write(data);
            });

            req.on('end', data => {
                buffer += decoder.end();

                let chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : router.notFound;

                // Route the request to the handler specified in the router
                chosenHandler((statusCode) => {

                    // Use the status code returned from the handler, or set the default status code to 200
                    statusCode = typeof(statusCode) == 'number' ? statusCode : 200;

                    // Return the response
                    res.setHeader('Content-Type', 'application/text');
                    res.writeHead(statusCode);
                    res.end(`Hello ${buffer !== '' ? buffer : 'user'}`);
                });
            });
            break;
        
        default:
            // Route the request to the handler specified in the router
            router.notFound((statusCode) => {

                // Use the status code returned from the handler, or set the default status code to 200
                statusCode = typeof(statusCode) == 'number' ? statusCode : 404;

                // Return the response
                res.setHeader('Content-Type', 'application/text');
                res.writeHead(statusCode);
                res.end(`Not found`);
            });
    }
};

module.exports = callbacks;