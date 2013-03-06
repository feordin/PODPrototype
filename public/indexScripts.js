(function () {
    var plans = [];
    var socket;

    var pageData = {
        checkboxes: {},
        textAreas: {},
        serviceRadio: "",
        numOfPlans: 1
    }
    /*
    Init 
    */
    init = function () {
        // setup web socket
        var address = window.location.protocol + '//' + window.location.host;

        var details = {
            resource: "/socket.io"
        };

        // initialize handler for create button
        $("#btnCreatePlan").click(function (e) {
            var patient = $("#txtPatientName").val();
            if (!patient || patient.length < 1) {
                patient = "John Doe";
            }

            var dateString = getDate();
            var pData = {
                date: dateString,
                patient: patient,
                planName: dateString + patient
            }
            socket.emit('create', pData);
        });

        socket = io.connect(address, details);
        socket.on("connect", function () {
            socket.emit('index', {});
        });

        socket.on('index', function (data) {
            data.sort(compareDays);
            for (var day in data) {
                $("#plans").append("<h3>" + data[day].date + "</h3><ul id='" + data[day].date + "'></ul>");
                addDay(data[day]);
            }
        });
    }

    function addDay(day) {
        for (var p in day.plans) {
            var uri = encodeURI("plan.html?date=" + day.date + "&patient=" + day.plans[p]);
            $("#" + day.date).append("<li><a href='" + uri + "' >" + day.plans[p] + "</a></li>");
        }
    }

    function getDate() {
        var d = new Date();
        var yyyy = d.getFullYear().toString();
        var mm = (d.getMonth() + 1).toString(); // getMonth() is zero-based
        var dd = d.getDate().toString();
        return yyyy + "-" + (mm[1] ? mm : "0" + mm[0]) + "-" + (dd[1] ? dd : "0" + dd[0]); // padding
    };

    function compareDays(a, b) {
        if (a.date < b.date)
            return -1;
        if (a.date > b.date)
            return 1;
        return 0;
    }
        
    $(window).load(function () {
        init();
    });

}).call(this);