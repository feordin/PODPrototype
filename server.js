(function () {

    var plans = {};

    var app = require('http').createServer()
  , io = require('socket.io').listen(app)
    var fs = require('fs');

    io.configure(function() {
        io.set('transports', [ 'websocket' ]);
        if (process.env.IISNODE_VERSION) {
            io.set('resource', '/socket.io');
        }
    });

    io.sockets.on('connection', function (socket) {

        socket.on('index', function (data) {
            // get a list of the saved plans of the day
            // and send those back

            if (!fs.existsSync('./SavedPODs')) {
                fs.mkdirSync('./SavedPODs');
            }

            
            fs.readdir('./SavedPODs', function (err, files) {
                if (err)
                    throw err;

                var dateString = getDate();
                var todayFound = false;
                var days = [];

                // for each directioy under SavedPODs
                // each directory should represent a day
                for (var index in files) {

                    console.log(files[index]);

                    // get stats to find our if it's a 
                    // directory
                    var stat = fs.statSync("./SavedPODs/" + files[index]);

                    if (stat.isDirectory()) {
                        // now check if it is today
                        if (files[index] === dateString) {
                            todayFound = true;
                        }
                        var day = {
                            date: files[index],
                            plans: []
                        }

                        var planFiles = fs.readdirSync("./SavedPODs/" + files[index]);
                        for (var planFile in planFiles) {
                            day.plans.push(planFiles[planFile]);
                        }

                        days.push(day);
                    }
                }

                if (!todayFound) {
                    fs.mkdir("./SavedPODs/" + dateString);
                }

                socket.emit('index', days);

            });

        });

        socket.on('create', function(data){
            if (!fs.existsSync('./SavedPODs/' + data.date)) {
                fs.mkdirSync('./SavedPODs/' + data.date);
            }
            if (!fs.existsSync('/SavedPODs/' + data.date + '/' + data.patient)) {
                var plan = {
                    pageData: {
                        checkboxes: {},
                        textAreas: {},
                        serviceRadio: "",
                        numOfPlans: 1,
                        date: data.date,
                        patient: data.patient,
                        planName: data.planName
                    },
                    imageData: {}
                };
                fs.writeFileSync('./SavedPODs/' + data.date + '/' + data.patient, JSON.stringify(plan));
            }
            socket.emit('created', { date: data.date, patient: data.patient });
        });

        // when a plan page comes online
        socket.on('plan', function (planData) {

            socket.join(planData.planName);

            // check if plan is already in memory
            if (!plans[planData.planName]) {
                // create an empty plan as a safety measure
                var plan = {
                    pageData: {
                        checkboxes: {},
                        textAreas: {},
                        serviceRadio: "",
                        numOfPlans: 1,
                        date: planData.date,
                        patient: planData.patient,
                        planName: planData.planName
                    },
                    imageData: {}
                };

                fs.readFile('./SavedPODs/' + planData.date + '/' + planData.patient, function (err, readData) {
                    if (readData) {
                        console.log("read plan data from file");
                        plan = JSON.parse(readData);
                    }
                    var planName = planData.planName;
                    plans[planName] = plan;
                    //initialize new connections to current page state
                    socket.emit('pageState', plans[planName].pageData);
                });
            }
            else {
                //initialize new connections to current page state
                socket.emit('pageState', plans[planData.planName].pageData);
            }

            // when a user draws something
            // broadcast to all users
            socket.on('drawClick', function (data) {
                var planName = data.planName;
                //socket.broadcast.emit('draw', data);
                socket.broadcast.to(planName).emit('draw', data);
            });

            // when a page updates the state
            // save and broadcast to all users
            socket.on('pageState', function (data) {
                var planName = data.planName;
                plans[planName].pageData = data;
                socket.broadcast.to(planName).emit('pageState', plans[planName].pageData);
                fs.writeFile('./SavedPODs/' + data.date + '/' + data.patient, JSON.stringify(plans[planName]));
            });

            // after finishing drawing a particular line
            // save out the image data so we can
            // refresh newly connected users
            socket.on('imageData', function (data) {
                console.log(data);
                var planName = data.planName;
                plans[planName].imageData[data.num] = data.imageData;
                fs.writeFile('./SavedPODs/' + data.date + '/' + data.patient, JSON.stringify(plans[planName]), function (err) {
                    console.log(err);
                });
            });

            socket.on('readyForImages', function (data) {
                var planName = data.planName;
                socket.emit('initImages', plans[planName].imageData);
            });

            // check if image and page state data exist for
            // this room, and if not creat i
        });
    });

    // start the http server listening on custom port
    // provided by iisnode
    app.listen(process.env.PORT);

    function getDate() {
        var d = new Date();
        var yyyy = d.getFullYear().toString();
        var mm = (d.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd = d.getDate().toString();
        return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]); // padding
    };

}).call(this);
