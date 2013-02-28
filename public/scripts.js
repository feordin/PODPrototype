(function () {
    var plans = [];
    var socket;
    /*
    Init 
    */
    init = function () {
        // setup web socket
        var address = window.location.protocol + '//' + window.location.host;

        var details = {
            resource: "/socket.io"
        };
        socket = io.connect(address, details);
        socket.on("connect", function () {
            //alert("Connected!");
        });
        socket.on("error", function () {
            alert("Error");
        });
        socket.on('draw', function (data) {
            return draw(data.plan, data.x, data.y, data.type);
        });

        /*
        Setup Draw Events
        */
        $('canvas').live('drag dragstart dragend', onDraw);

        // add first plan textarea/canvas
        addPlan();
    };

    draw = function (num, x, y, type) {
        var ctx = plans[num].ctx;
        if (type === "dragstart") {
            ctx.beginPath();
            return ctx.moveTo(x, y);
        } else if (type === "drag") {
            ctx.lineTo(x, y);
            return ctx.stroke();
        } else {
            return ctx.closePath();
        }
    };

    function onDraw(e) {
        var id = e.target.parentElement.id;
        var num = id.substr(id.length - 1);
        var offset, type, x, y;
        type = e.handleObj.type;
        offset = $(this).offset();
        x = e.offsetX;
        y = e.offsetY;
        draw(num, x, y, type);
        socket.emit('drawClick', {
            plan: num,
            x: x,
            y: y,
            type: type
        });
    }

    function addCanvasToPlan(planContainer) {
        var canvas = document.createElement("canvas");
        var planTextArea = planContainer.children("textarea")[0];
        canvas.width = planTextArea.clientWidth;
        canvas.height = planTextArea.clientHeight;
        planContainer.append(canvas);
        var c = planContainer.children('canvas');

        return canvas;
    }

    function initPlan(num) {
        var writeId = 'write' + num;
        var typeId = 'type' + num;
        $('#plans').append('<span id="' + writeId + '">write </span>');
        $('#' + writeId).click(write);
        $('#plans').append('<span id="' + typeId + '"> type</span>');
        $('#' + typeId).click(type);

        var nd = $('<div class="planContainer" id="plan' + num + '"></div>').appendTo('#plans');
        nd.append('<textarea class="float"></textarea>');

        return nd;
    }

    function addPlan() {
        var num = plans.length;
        var planContainer = initPlan(num);
        var plan = {};
        plan.canvas = addCanvasToPlan(planContainer);

        // setup canvas context
        plan.ctx = plan.canvas.getContext("2d");
        plan.ctx.fillStyle = "solid";
        plan.ctx.strokeStyle = "#ECD018";
        plan.ctx.lineWidth = 2;
        plan.ctx.lineCap = "round";
        plans.push(plan);
    }

    // click events to switch between writing and typing
    function write (e) {
        var id = e.target.id;
        var num = id.substr(id.length - 1);
        $('#plan' + num + ' textarea').fadeOut();
    }

    function type(e) {
        var id = e.target.id;
        var num = id.substr(id.length - 1);
        $('#plan' + num + ' textarea').fadeIn();
        $('#plan' + num + ' textarea').focus();
    }

    $(window).load(function () {
        init();
    });

}).call(this);