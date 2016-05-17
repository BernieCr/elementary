


// https://github.com/cvrebert/css-mq-parser
// https://github.com/ericf/css-mediaquery = SCHROTT

(function() {

    function toPx(length) {
        var RE_LENGTH_UNIT     = /(em|rem|px|cm|mm|in|pt|pc)?$/;

        var value = parseFloat(length),
            units = String(length).match(RE_LENGTH_UNIT)[1];

        switch (units) {
            case 'em' : return value * 16;
            case 'rem': return value * 16;
            case 'cm' : return value * 96 / 2.54;
            case 'mm' : return value * 96 / 2.54 / 10;
            case 'in' : return value * 96;
            case 'pt' : return value * 72;
            case 'pc' : return value * 72 / 12;
            default   : return value;
        }
    }



    var elementQueries = {};


    var elementQueriesAST = {};

    var buildQueryAst = function() {

        elementQueriesAST = {};

        for (var selector in elementQueries) {
            if (elementQueries.hasOwnProperty(selector)) {

                var ast = {};

                var items = elementQueries[selector];
                for (var className in items) {
                    if (items.hasOwnProperty(className)) {
                        var query = items[className];
                        ast[className] = parseQuery(query)[0];
                    }
                }
                elementQueriesAST[selector] = ast;
            }
        }

        console.log(elementQueriesAST);
    };

    document.addEventListener("DOMContentLoaded", function () {

        var elementQueryContentDummyId = 'element-query-content-bridge';

        var dummyDiv = document.createElement('div');
        dummyDiv.setAttribute('id', elementQueryContentDummyId);
        document.body.appendChild(dummyDiv);

        var dummyStyle = window.getComputedStyle(dummyDiv, ':after');
        var cssDummyContent = dummyStyle.getPropertyValue('content');
        document.body.removeChild(dummyDiv);

        cssDummyContent = cssDummyContent.replace(/'/g, "");
        console.log(cssDummyContent);

        elementQueries = JSON.parse(cssDummyContent);
        if (typeof elementQueries === "string") { // wurde String vom Browser escaped?
            elementQueries = JSON.parse(elementQueries); // DOUBLE PARSE!!!
        }
        console.log(elementQueries);

        buildQueryAst();

        doElementQuery();
    });


    var doElementQuery = function () {

        for (var selector in elementQueriesAST) {
            if (elementQueriesAST.hasOwnProperty(selector)) {

                var elementList = document.querySelectorAll(selector);
                for (var i = 0; i < elementList.length; ++i) {
                    var node = elementList[i];
                    var rect = node.getBoundingClientRect();
                    var width = rect.width;
                    if (width === undefined) {
                        width = rect.right - rect.left;
                    }
                    console.log(selector+': '+width);

                    var classMatches = {};

                    var items = elementQueriesAST[selector];
                    for (var className in items) {
                        if (items.hasOwnProperty(className)) {
                            var ast = items[className];

                            var iMatched = 0;
                            var iToMatch = ast.expressions.length;

                            for (var j = 0; j < iToMatch; j++) {

                                var bMatch = false;

                                var exp = ast.expressions[j];
                                var px = toPx(exp.value);
                                var mod =  exp.modifier;
                                if (exp.feature == 'width') {
                                    if ( (mod == 'min') && (width >= px) ) {
                                        bMatch = true;
                                    }
                                    if ( (mod == 'max') && (width <= px) ) {
                                        bMatch = true;
                                    }
                                }

                                if (bMatch) {
                                    iMatched++;
                                }
                                else {
                                    break; // hat doch alles keinen Sinn mehr
                                }
                            }

                            if (iMatched == iToMatch) {
                                // yay!
                                classMatches[className] = true;
                                console.log(className+' matches!');
                            }
                        }
                    }

                    var iMatches = Object.getOwnPropertyNames(classMatches).length;

                    var nodeClasses = node.className.split(' ');

                    // remove
                    for (var j = 0; j < nodeClasses.length; j++) {
                        var sClass = nodeClasses[j];
                        if (items[sClass] !== undefined) {
                            nodeClasses.splice(j, 1);
                            j--;
                        }
                    }

                    // add
                    if ((iMatches > 1) && (classMatches['*'] === true)) {
                        console.log('Warning! Both default element query and other rule(s) match!\n'+JSON.stringify(Object.getOwnPropertyNames(classMatches)));
                    }
                    if (iMatches) {
                        console.log('matches: '+JSON.stringify(Object.getOwnPropertyNames(classMatches)));
                        if (classMatches['*'] !== undefined) {
                            delete classMatches['*'];
                        }
                        var newClasses = Object.getOwnPropertyNames(classMatches);
                        nodeClasses.push.apply(nodeClasses, newClasses);
                        console.log('new node classes: ', nodeClasses);
                    }

                    node.className = nodeClasses.join(' ');
                }


            }
        }

    };


    (function () {
        var throttle = function (type, name, obj) {
            obj = obj || window;
            var running = false;
            var func = function () {
                if (running) {
                    return;
                }
                running = true;
                requestAnimationFrame(function () {
                    obj.dispatchEvent(new CustomEvent(name));
                    running = false;
                });
            };
            obj.addEventListener(type, func);
        };

        /* init - you can init any event */
        throttle("resize", "optimizedResize");
    })();

// handle event
    window.addEventListener("optimizedResize", function () {
       // console.log("Resource conscious resize callback!");
        doElementQuery();
    });

})();