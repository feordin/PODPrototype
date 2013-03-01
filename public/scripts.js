(function () {
    var plans = [];
    var socket;

    var pageData = {
        checkboxes: {},
        textAreas: {},
        serviceRadio : "",
        numOfPlans : 1
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
        socket.on('pageState', function (data) {
            pageData = data;
            for (var i = plans.length; i < pageData.numOfPlans; i++) {
                addPlan();
            }
            for (var id in pageData.checkboxes) {
                $('#' + id)[0].checked = (pageData.checkboxes[id]);
            }
            for (var textId in pageData.textAreas) {
                $('#' + textId)[0].value = pageData.textAreas[textId];
            }
            $('[name=service]').prop('checked', false);
            $('[name=service][value="' + pageData.serviceRadio + '"]').prop('checked', true);

            socket.emit('readyForImages', {});
            
        });

        socket.on('initImages', function (data) {
            for (var image in data) {
                var newImage = new Image();
                newImage.src = data[image];
                plans[image].ctx.drawImage(newImage, 0, 0);
            }
        });

        /*
        Setup Draw Events
        */
        $('canvas').live('drag dragstart dragend', onDraw);

        // setup form elements events
        $('textarea').live('keyup', onKeyUp);
        $('input[type=checkbox]').live('change', function (e) {
            pageData.checkboxes[e.target.id] = e.target.checked;
            socket.emit('pageState', pageData);
        });
        $('input[name=service]:radio').change(function (e) {
            pageData.serviceRadio = $('input[name=service]:checked').val();
            socket.emit('pageState', pageData);
        });
        $('#btnAddPlan').click(function (e) {
            addPlan();
        });

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

    function onKeyUp(e) {
        var id = e.target.id;
        var num = id.substr(id.length - 1);
        pageData.textAreas[id] = e.target.value;
        socket.emit('pageState', pageData);
    }

    function onDraw(e) {
        var id = e.target.parentElement.id;
        if (id) {
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
            if (type == 'dragend') {
                var imageData = e.target.toDataURL();
                socket.emit('imageData', { num: num, imageData: imageData });
            }
        }
    }

    function addCanvasToPlan(planContainer, num) {
        var canvas = document.createElement("canvas");
        canvas.id = "canvas" + num;
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
        nd.append('<textarea class="float" id="textarea' + num + '"></textarea>');

        return nd;
    }

    function addPlan() {
        var num = plans.length;
        var planContainer = initPlan(num);
        var plan = {};
        plan.canvas = addCanvasToPlan(planContainer, num);

        // setup canvas context
        plan.ctx = plan.canvas.getContext("2d");
        plan.ctx.fillStyle = "solid";
        plan.ctx.lineCap = "round";
        plans.push(plan);
        if ((plans.length > 1) && (plans.length > pageData.numOfPlans)){
            pageData.numOfPlans = plans.length;
            socket.emit('pageState', pageData);
        }
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