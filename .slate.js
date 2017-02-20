// slate js configuration
/* globals slate */
(function () {
    'use strict';

    var similarityFactor = 0.9;

    var direction = {
        left: 0,
        right: 1,
        up: 0,
        down: 1
    };

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

    var getXYWHRect = function (x, y, w, h) {
        //slate.log( 'getXYWHRect', x, y, w, h);
        return new Rect(
            new Point(x, y),
            new Point( x + w, y + h)
        );
    };
    
    var getTLBRRect = function (x1, y1, x2, y2){
        //slate.log( 'getTLBRRect', x1, y1, x2, y2);
        return new Rect(
            new Point(x1, y1),
            new Point(x2, y2)
        );
    };

    var getRectFromSlateObj = function(slob){
        //slate.log( 'getRectFromSlateObj');
        return getXYWHRect(
            slob.x,
            slob.y,
            slob.width,
            slob.height
        );
    };

    var rects = {
        rt: function (view) {
            return getXYWHRect(
                view.width / 2,
                view.y,
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            );
        },
        rb: function (view) {
            return getXYWHRect(
                view.width / 2,
                view.height / 2 + 12, // 12 px lower to account for menu bar
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            );
        },
        lb: function (view) {
            return getXYWHRect(
                view.x,
                view.height / 2 + 12, // 12 px lower to account for menu bar
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            );
        },
        lt: function (view) {
            return getXYWHRect(
                view.x,
                view.y,
                view.width / 2,
                view.height / 2 - 12 // 12 px smaller to account for menu bar
            );
        },
        rh: function (view) {
            return getXYWHRect(
                view.width / 2,
                view.y,
                view.width / 2,
                view.height
            );
        },
        lh: function (view) {
            return getXYWHRect(
                view.x,
                view.y,
                view.width / 2,
                view.height
            );
        },
        fs : getRectFromSlateObj
    };

    var getNearestMatchingRect = function(win, view){
        var cursor = { name : null, rect: null, coverage : -1 };
        for (var name in rects){
            var rect = rects[name](view);
            var overlap = win.overlap(rect);
            if (overlap){
                var overlapArea = overlap.area();
                var rectCoverage = overlapArea / rect.area();
                var winCoverage = overlapArea / win.area();
                var coverage = rectCoverage + winCoverage;     
                //slate.log(name, coverage);
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

    var getCurrentPos = function(w){
        var screen = slate.screen();
        var view = screen.rect();
        var win = getRectFromSlateObj(w.rect());
        var pos = getNearestMatchingRect(win, view);
        // if the overlap is similar enough to the position, the window is in that position.
        if (pos.rect.area() * similarityFactor > pos.overlap.area()){
            return null;
        }
        return pos;
    };

    var horizontalPush = function (direction) {
        return function (w) {
            var pos = getCurrentPos(w);
            if (pos){
                slate.log('nearest match accepted > ' + pos.name);
            } else {
                slate.log('nearest match discarded');
            }
            // if quarter screen, switch to other quarter
            // if half screen, switch to other half
            // else go to indicated half
        };
    };

    var verticalPush = function (direction) {
        return function (win) {
            var pos = getCurrentPos(w);
            if (pos){
                slate.log('nearest match accepted > ' + pos.name);
            } else {
                slate.log('nearest match discarded');
            }
            //up
            // if bottom quarter go to top quarter
            // if top quarter go to half
            // else go full
            //down
            // if half go bottom quarter
        };
    };

    slate.bind("left:ctrl;cmd", horizontalPush(direction.left));

    slate.bind("right:ctrl;cmd", horizontalPush(direction.right));

    slate.bind("up:ctrl;cmd", verticalPush(direction.up));

    slate.bind("down:ctrl;cmd", verticalPush(direction.down));

})();
