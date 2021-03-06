(function () {
    var plans = [];
    var socket;

    var date = getQueryVariable("date");
    var patient = getQueryVariable("patient");

    var pageData = {
        checkboxes: {},
        textAreas: {},
        serviceRadio : "",
        numOfPlans: 1,
        date: date,
        patient: patient,
        planName: date + patient
    }



    /*
    Init 
    */
    init = function () {
        // setup web socket
        var address = window.location.protocol + '//' + window.location.host;

        var details = {
            resource: "socket.io"
        };
        socket = io.connect(address, details);
        socket.on("connect", function () {
            //alert("Connected!");
            
            pData = {
                date: date,
                patient: patient,
                planName: date + patient
            }
            socket.emit('plan', pData);
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
            
            $('[name=service]').prop('checked', false);
            $('[name=service][value="' + pageData.serviceRadio + '"]').prop('checked', true);

            socket.emit('readyForImages', {planName: pageData.planName});
            
        });

        socket.on('initImages', function (data) {
            for (var image in data) {
                var newImage = new Image();
                newImage.src = data[image];
                plans[image].ctx.drawImage(newImage, 0, 0);
            }


            // update text boxes after images because that seems to cause the 
            // images to be painted properly
            for (var textId in pageData.textAreas) {
                $('#' + textId)[0].value = pageData.textAreas[textId].text;
            }
        });

        /*
        Setup Draw Events
        */
        $('canvas').live('drag dragstart dragend', onDraw);

        if ('ontouchstart' in document.documentElement) {
            $('canvas').live('touchstart touchmove touchend', onDraw);
        }

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

        $('#btnAddHemoDynamics').click(function (e) {
            addPlan("Hemodynamics");
        });

        $('#btnFluids').click(function (e) {
            addPlan("Fluids");
        });

        $('#btnNutrition').click(function (e) {
            addPlan("Nutrition");
        });

        $('#btnMobility').click(function (e) {
            addPlan("Mobility / Pressure Ulcer Minimization");
        });

        $('#btnAnalgesia').click(function (e) {
            addPlan("Analgesia / Sedation");
        });

        $('#patientName').val(patient);
        $('#patientName')[0].disabled = true;

        $('#date').val(date);
        $('#date')[0].disabled = true;

        // add first plan textarea/canvas
        addPlan();

        //cbcontainer = document.getElementById("plan100");
        //cbcanvas = document.getElementById("canvas100");
        //cbcanvas.height = cbcontainer.clientHeight;
        //cbcanvas.width = cbcontainer.clientWidth;
        //cbcanvas.style.position = 'absolute';
        //cbcanvas.style.top = cbcontainer.clientTop;
        //cbcanvas.style.left = cbcontainer.clientLeft;
    };

    draw = function (num, x, y, type) {
        if (plans[num] && plans[num].ctx) {
            var ctx = plans[num].ctx;
            if ((type === "dragstart") || (type === "touchstart")) {
                ctx.beginPath();
                return ctx.moveTo(x, y);
            } else if ((type === "drag") || (type === "touchmove")) {
                ctx.lineTo(x, y);
                return ctx.stroke();
            } else {
                return ctx.closePath();
            }
        }
    };

    function onKeyUp(e) {
        var id = e.target.id;
        var num = id.substr(id.length - 1);
        if (!pageData.textAreas[id]) {
            pageData.textAreas[id] = {label:null, text:""};
        }
        pageData.textAreas[id].text = e.target.value;
        socket.emit('pageState', pageData);
    }


    function onDraw(e) {
        if (e.preventDefault) {
            e.preventDefault();
        }
        var id = e.target.parentElement.id;
        if (id) {
            var num = id.substr(4);
            var offset, type, x, y;
            type = e.type;
            offset = $(this).offset();
            if ((type == 'touchstart') || (type == 'touchmove') || (type == 'touchend')) {
                x = e.pageX - offset.left;
                y = e.pageY - offset.top;
            }
            else {
                x = e.offsetX;
                y = e.offsetY;
            }
            draw(num, x, y, type);
            socket.emit('drawClick', {
                planName: pageData.planName,
                plan: num,
                x: x,
                y: y,
                type: type
            });
            if ((type == 'dragend') || (type == 'touchend')) {
                var imageData = e.target.toDataURL();
                socket.emit('imageData', { num: num, imageData: imageData, planName: pageData.planName, date: pageData.date, patient: pageData.patient });
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

    function initPlan(num, label) {
        var writeId = 'write' + num;
        var typeId = 'type' + num;
        var textId = 'textarea' + num;
        
        var nd = {};
        var divHTML = '<div class="planContainer" id="plan' + num + '"></div>';

        // pageData already has the object, then this is not a new text area
        if (pageData.textAreas[textId]) {
            // if it is not new, and has a label, add it
            if (pageData.textAreas[textId].label) {
                nd = $('<br><span id="label' + num + '" class="planLabel">' + pageData.textAreas[textId].label + '</span>').appendTo('#plans');
            }
        }
            // this is a newly added textArea
        else {
            // this is new with a label
            if (label) {
                pageData.textAreas[textId] = { label: label, text: "" };
                nd = $('<br><span id="label' + num + '" class="planLabel">' + label + '</span>').appendTo('#plans');
            }
                // this is new without a label
            else {
                pageData.textAreas[textId] = { label: null, text: "" };
            }
        }
        
        $('#plans').append('<label><input type="radio" name="writetype' + num + '" id="' + writeId + '" class="writeTypeRadio" />write </label>');
        $('#' + writeId).click(write);
        $('#plans').append('<label><input type="radio" name="writetype' + num + '" id="' + typeId + '" class="writeTypeRadio" /> type</label>');
        $('#' + typeId).click(type);
        
        nd = $(divHTML).appendTo('#plans');
        var textAreaHTML = '<textarea onclick = "void(0)" class="float" id="textarea' + num + '"></textarea>';
        nd.append(textAreaHTML);


        return nd;
    }

    function addPlan(label) {
        var num = plans.length;
        var planContainer = initPlan(num, label);
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