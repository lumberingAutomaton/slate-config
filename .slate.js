// slate js configuration
/* globals slate */
(function () {
    'use strict';
    var cache = {};
    var similarityFactor = 0.90;
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
            up: 'lh',
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
                view.width / 5,
                view.height / 5,
                (view.width / 5) * 3,
                (view.height / 5) * 3
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
            match.rect = rects.na;
        }
        return match;
    };

    var keypress = function (direction) {
        return function (win) {
            var screen = slate.screen();
            var view = screen.rect();
            var rects = getPositionRects(view);
            var pos = getCurrentPos(win, rects);
            var next = positions[pos.name][direction];
            slate.log(direction + ': ' + pos.name + '>' + next);
            move(win, rects[next]);
            
        };
    };

    slate.bind("left:ctrl;cmd", keypress(direction.left));

    slate.bind("right:ctrl;cmd", keypress(direction.right));

    slate.bind("up:ctrl;cmd", keypress(direction.up));

    slate.bind("down:ctrl;cmd", keypress(direction.down));

})();
