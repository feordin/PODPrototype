(function () {
    var app = require('http').createServer()
  , io = require('socket.io').listen(app)
    //io = require('socket.io').listen(process.env.PORT);

    io.configure(function() {
    io.set('transports', [ 'websocket' ]);
        if (process.env.IISNODE_VERSION) {
            io.set('resource', '/socket.io');
        }
    });


    io.sockets.on('connection', function (socket) {
        socket.on('drawClick', function (data) {
            socket.broadcast.emit('draw', data);
        });
    });

    app.listen(process.env.PORT);

}).call(this);
