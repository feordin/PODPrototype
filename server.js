(function () {
    var pageData = {
        checkboxes: {},
        textAreas: {},
        serviceRadio: "",
        numOfPlans: 1
    };

    var imageData = {};

    var app = require('http').createServer()
  , io = require('socket.io').listen(app)

    io.configure(function() {
    io.set('transports', [ 'websocket' ]);
        if (process.env.IISNODE_VERSION) {
            io.set('resource', '/socket.io');
        }
    });


    io.sockets.on('connection', function (socket) {

        //initialize new connections to current page state
        socket.emit('pageState', pageData);

        // when a user draws something
        // broadcast to all users
        socket.on('drawClick', function (data) {
            socket.broadcast.emit('draw', data);
        });

        // when a page updates the state
        // save and broadcast to all users
        socket.on('pageState', function (data) {
            pageData = data;
            socket.broadcast.emit('pageState', pageData);
        });

        // after finishing drawing a particular line
        // save out the image data so we can
        // refresh newly connected users
        socket.on('imageData', function (data) {
            imageData[data.num] = data.imageData;
        });

        socket.on('readyForImages', function (data) {
            socket.emit('initImages', imageData);
        });
    });

    // start the http server listening on custom port
    // provided by iisnode
    app.listen(process.env.PORT);

}).call(this);
