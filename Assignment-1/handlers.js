// Define all the handlers
let handlers = {};

// Ping handler
handlers.hello = (callback) => {
    callback(200);
};

// Not-Found handler
handlers.notFound = (callback) => {
    callback(404);
};

module.exports = handlers;