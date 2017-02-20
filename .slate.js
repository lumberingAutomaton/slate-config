// slate js configuration
/* globals slate */
(function () {
    'use strict';
    var cache = {};
    var similarityFactor = 0.85;
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
     * Class Point
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

    /**
     * Class Rect
     */
    var Rect = function (tl, br) {
        this.tl = tl;
        this.br = br;
    };

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
        if (tl.x > br.x || tl.y > br.y){
            return null;
        }
        return new Rect(tl, br);
    };

    /**
     * helper functions
     */
    var getPositionRects = function(view){
        var key = view.width + 'x' + view.height;
        if (!cache[key]){
            cache[key] = calculateRects(view);
        }
        return cache[key];
    };

    var calculateRects = function(view){
        return {
            rt: getXYWHRect(
                view.width / 2,
                view.y,
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            ),
            rb: getXYWHRect(
                view.width / 2,
                view.height / 2 + 12, // 12 px lower to account for menu bar
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            ),
            lb: getXYWHRect(
                view.x,
                view.height / 2 + 12, // 12 px lower to account for menu bar
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            ),
            lt: getXYWHRect(
                view.x,
                view.y,
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
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
                view.width / 9,
                view.height / 9,
                (view.width / 9) * 7,
                (view.height / 9) * 7
            )
        };
    };

    /**
     * gets a rect object from top left x,y coord
     * with width and height.
     */
    var getXYWHRect = function (x, y, w, h) {
        // slate.log( 'getXYWHRect', x, y, w, h);
        return new Rect(
            new Point(x, y),
            new Point( x + w, y + h)
        );
    };

    /**
     * gets a rect object from top left x, y coord
     * and bottom right x, y coord.
     */
    var getTLBRRect = function (x1, y1, x2, y2){
        // slate.log( 'getTLBRRect', x1, y1, x2, y2);
        return new Rect(
            new Point(x1, y1),
            new Point(x2, y2)
        );
    };

    var getRectFromSlateObj = function(slob){
        // slate.log( 'getRectFromSlateObj');
        return getXYWHRect(
            slob.x,
            slob.y,
            slob.width,
            slob.height
        );
    };

    var getNearestMatchingRect = function(win, rects){
        var cursor = { name : null, rect: null, coverage : -1 };
        for (var name in rects){
            var rect = rects[name];
            var overlap = win.overlap(rect);
            if (overlap){
                var overlapArea = overlap.area();
                // how much of the position is covered by win?
                var rectCoverage = overlapArea / rect.area();
                // how much of the win is over the position?
                var winCoverage = overlapArea / win.area();
                var coverage = rectCoverage + winCoverage;     
                // slate.log(name, coverage);
                if (coverage > cursor.coverage){
                    cursor.name = name;
                    cursor.rect = rect;
                    cursor.coverage = coverage;
                    cursor.overlap = overlap;
                }
            }
        }
        return cursor;
    };

    var getCurrentPos = function(win, rects){
        var winRect = getRectFromSlateObj(win.rect());
        var match = getNearestMatchingRect(winRect, rects);
        // if the overlap is similar enough to the position, the window is in that position.
        if (match.rect.area() * similarityFactor > match.overlap.area()){
            match.name = 'na';
        }
        // slate.log("match: " + match.name + " > " + match.rect.toString());
        return match.name;
    };

    var getNextRect = function(win, rects, direction){
        var pos = getCurrentPos(win, rects);
        // slate.log('pos: ' + pos);
        var next = positions[pos][direction];
        // slate.log('next: ' + next);
        return rects[next];
    }

    var translate = function(win, rect){
        // slate.log(rect.toString());
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
            var screen = slate.screen();
            var view = screen.rect();
            var rects = getPositionRects(view);
            var next = getNextRect(win, rects, direction);
            translate(win, next);
        };
    };

    slate.bind("left:ctrl;cmd", keypress(direction.left));

    slate.bind("right:ctrl;cmd", keypress(direction.right));

    slate.bind("up:ctrl;cmd", keypress(direction.up));

    slate.bind("down:ctrl;cmd", keypress(direction.down));

})();
