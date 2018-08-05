let handlers = require('./handlers');

// Define the request router
let router = {
    'hello': handlers.hello,
    'notFound': handlers.notFound
};

module.exports = router;
