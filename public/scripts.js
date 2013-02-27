(function () {
    var App;
    App = {};
    /*
    Init 
    */
    App.init = function () {
        // Add initial plan canvas
        App.canvas = addCanvasToPlan($('#plan1'));

        App.ctx = App.canvas.getContext("2d");
        App.ctx.fillStyle = "solid";
        App.ctx.strokeStyle = "#ECD018";
        App.ctx.lineWidth = 2;
        App.ctx.lineCap = "round";

        App.socket = io.connect("http://localhost", { resource: "/POD/socket.io" });
        App.socket.on("error", function () {
            alert("Error");
        });
        App.socket.on('draw', function (data) {
            return App.draw(data.x, data.y, data.type);
        });

        App.draw = function (x, y, type) {
            if (type === "dragstart") {
                App.ctx.beginPath();
                return App.ctx.moveTo(x, y);
            } else if (type === "drag") {
                App.ctx.lineTo(x, y);
                return App.ctx.stroke();
            } else {
                return App.ctx.closePath();
            }
        };


        // set up click events to switch between writing and typing
        $('#plan1Write').click(function () {
            $('#plan1 textarea').hide();
        });

        $('#plan1Type').click(function () {
            $('#plan1 textarea').show();
            $('#plan1 textarea').focus();
        });

        /*
        Draw Events
        */
        $('canvas').live('drag dragstart dragend', function (e) {
            var offset, type, x, y;
            type = e.handleObj.type;
            offset = $(this).offset();
            //e.offsetX = e.layerX - offset.left;
            //e.offsetY = e.layerY - offset.top;
            x = e.offsetX;
            y = e.offsetY;
            App.draw(x, y, type);
            App.socket.emit('drawClick', {
                x: x,
                y: y,
                type: type
            });
        });

    };

    function addCanvasToPlan(planContainer) {
        var canvas = document.createElement("canvas");
        var planTextArea = $("#plan1 textarea")[0];
        canvas.width = planTextArea.clientWidth;
        canvas.height = planTextArea.clientHeight;
        planContainer.append(canvas);
        return canvas;
    }

    $(window).load(function () {
        App.init();
    });

}).call(this);