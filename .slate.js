// slate js configuration
/* globals slate */
(function () {
    'use strict';

    /**
     * globals
     */
    var cache = {};
    var debugging = false;
    var similarityFactor = 0.85;
    var menubarHeight = 12;
    var gridSize = 9;
    var direction = { left: 'left', right: 'right', up: 'up', down: 'down' };
    var positions = {
        rt : {
            left : 'lt',
            right: 'lt',
            up: 'rh',
            down: 'rb'
        },
        rb : {
            left : 'lb',
            right: 'lb',
            up: 'rt',
            down: 'rb'
        },
        lb : {
            left : 'rb',
            right: 'rb',
            up: 'lt',
            down: 'lb'
        },
        lt : {
            left : 'rt',
            right: 'rt',
            up: 'lh',
            down: 'lb'
        },
        rh : {
            left : 'lh',
            right: 'lh',
            up: 'fs',
            down: 'rb'
        },
        lh : {
            left : 'rh',
            right: 'rh',
            up: 'fs',
            down: 'lb'
        },
        fs : {
            left : 'lh',
            right: 'rh',
            up: 'fs',
            down: 'na'
        },
        na : {
            left : 'lh',
            right: 'rh',
            up: 'fs',
            down: 'na'
        }
    };

    /**
     * Classes
     */
    var Point = function (x, y) {
        this.x = x;
        this.y = y;
    };

    Point.max = function (p1, p2) {
        return new Point(
            Math.max(p1.x, p2.x),
            Math.max(p1.y, p2.y)
        );
    };

    Point.min = function (p1, p2) {
        return new Point(
             Math.min(p1.x, p2.x),
             Math.min(p1.y, p2.y)
        );
    };

    var Rect = function (tl, br) {
        this.tl = tl;
        this.br = br;
    };

    Rect.empty = new Rect(
        new Point(0, 0),
        new Point(0, 0)   
    );

    Rect.prototype.toString = function(){
        return "tl:(" + this.tl.x + ", " + this.tl.y + "), " +
            "br:(" + this.br.x + ", " + this.br.y + ")";
    };  

    Rect.prototype.area = function () {
        var w = this.br.x - this.tl.x;
        var h = this.br.y - this.tl.y;
        return w * h;
    };

    Rect.prototype.overlap = function (subject) {
        var tl = Point.max(this.tl, subject.tl);
        var br = Point.min(this.br, subject.br);
        // ensure that that there is overlap
        if (tl.x > br.x || tl.y > br.y){
            return Rect.empty;
        }
        return new Rect(tl, br);
    };

    /**
     * helper functions
     */
    var log = function(msg){
        if (debugging){
            slate.log(msg);
        }
    };

    var getScreenRects = function(view){
        var key = view.width + 'x' + view.height;
        if (!cache[key]){
            cache[key] = precalculateScreenRects(view);
        }
        return cache[key];
    };

    var precalculateScreenRects = function(view){
        return {
            rt: getXYWHRect(
                view.width / 2,
                view.y,
                view.width / 2,
                view.height / 2 - menubarHeight
            ),
            rb: getXYWHRect(
                view.width / 2,
                view.height / 2 + menubarHeight,
                view.width / 2,
                view.height / 2 - menubarHeight
            ),
            lb: getXYWHRect(
                view.x,
                view.height / 2 + menubarHeight,
                view.width / 2,
                view.height / 2 - menubarHeight
            ),
            lt: getXYWHRect(
                view.x,
                view.y,
                view.width / 2,
                view.height / 2 - menubarHeight
            ),
            rh: getXYWHRect(
                view.width / 2,
                view.y,
                view.width / 2,
                view.height
            ),
            lh: getXYWHRect(
                view.x,
                view.y,
                view.width / 2,
                view.height
            ),
            fs : getRectFromSlateObj(view),
            na : getXYWHRect(
                view.width / gridSize,
                view.height / gridSize,
                (view.width / gridSize) * (gridSize - 2),
                (view.height / gridSize) * (gridSize - 2)
            )
        };
    };

    /**
     * gets a rect object from top left x,y coord
     * with width and height.
     */
    var getXYWHRect = function (x, y, w, h) {
        return new Rect(
            new Point(x, y),
            new Point( x + w, y + h)
        );
    };

    var getRectFromSlateObj = function(slob){
        return getXYWHRect(
            slob.x,
            slob.y,
            slob.width,
            slob.height
        );
    };

    var getComparisonContext = function(name, rects, win){
        var overlap = Rect.empty,
            coverage = -1,
            rect = rects[name];
        if (rect){
            overlap = win.overlap(rect);
            var overlapArea = overlap.area();
            // how much of the position is covered by win?
            var rectCoverage = overlapArea / rect.area();
            // how much of the win is over the position?
            var winCoverage = overlapArea / win.area();
            coverage = rectCoverage + winCoverage;
        }
        return {
            name : name,
            rect : rect,
            coverage : coverage,
            overlap : overlap
        };
    };

    var getMatchingScreenRect = function(win, rects){
        var match = getComparisonContext('match', rects, win);
            for (var name in rects){
                if (Object.prototype.hasOwnProperty.call(rects, name)){
                    var cursor = getComparisonContext(name, rects, win);   
                    if (cursor.coverage > match.coverage){
                        match = cursor;
                    }
                }
            }
        log("nearest match: " + match.name + " > " + match.rect.toString());
        return match;
    };

    var getCurrentPosition = function(win, rects){
        var winRect = getRectFromSlateObj(win.rect());
        var match = getMatchingScreenRect(winRect, rects);
        // if the overlap is similar enough to the position, the window is in that position.
        if (match.rect.area() * similarityFactor > match.overlap.area()){
            match.name = 'na';
        }
        log("selected match: " + match.name + " > " + match.rect.toString());
        return match.name;
    };

    var getDestinationRect = function(win, rects, direction){
        var position = getCurrentPosition(win, rects);
        var destination = positions[position][direction];
        log(direction + ": " + position + " > " + destination);
        return rects[destination];
    };

    var translateTo = function(win, rect){
        win.move({
            x : rect.tl.x,
            y : rect.tl.y,
        });
        win.resize({
            width: rect.br.x - rect.tl.x,
            height: rect.br.y - rect.tl.y
        });
    };

    var keypress = function (direction) {
        return function (win) {
            if (win.isMovable() && win.isResizable()){
                var screen = slate.screen();
                var view = screen.rect();
                var rects = getScreenRects(view);
                var destination = getDestinationRect(win, rects, direction);
                translateTo(win, destination);
            }
        };
    };

    slate.bindAll({
        "left:ctrl;cmd" : keypress(direction.left),
        "right:ctrl;cmd" : keypress(direction.right),
        "up:ctrl;cmd" : keypress(direction.up),
        "down:ctrl;cmd" : keypress(direction.down)
    });

})();
