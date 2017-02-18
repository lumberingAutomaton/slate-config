// slate js configuration

(function(){
    'use strict';
    var offset = 6;
    var screen = slate.screen();
    var view = screen.visibleRect();

    var directions = {
        left : 0,
        right: 1,
        up: 0,
        down: 1
    };

    var horizontal = [
        view.x,
        view.x / 4,
        view.x / 2
    ];

    var vertical = [
        view.y,
        view.y / 2
    ];

    var roughly = function(num, denom){
        var proportion = num / denom;
        return (proportion < 1.1) && proportion > 0.9;
    };

    var toFull = function(win){
        win.resize({
            width : view.width,
            height : view.height
        });
    };

    var isFull = function(rect){
        return roughly(rect.width, view.width);
    };

    var toHalf = function(win){
        win.resize({
            width : view.width / 2 - offset / 2,
            height : view.height
        });
    };

    var isHalf = function(rect){
        return roughly(rect.width, view.width / 2 - offset / 2) && roughly(rect.height, view.height); 
    };

    var toQuarter = function(win){
        win.resize({
            width : view.width / 2 - offset /2,
            height : view.height / 2
        });
    };

    var isQuarter = function(rect){
        return roughly(rect.width, view.width / 2 - offset / 2) && roughly(rect.height, view.height / 2);  
    };

    var toRight = function(win){
        var rect = win.rect();
        var breakpoint = rect.x + view.width / 4;
        if (breakpoint > view.width /2 + offset){
            breakpoint = view.x;
        }
        win.move({
            x : breakpoint,
            y : win.rect().y
        });
    };

    var isRight = function(rect){
        return roughly(rect.x, view.width / 2 + offset / 2);
    };

    var toLeft = function(win){
        var rect = win.rect();
        var breakpoint = rect.x - view.width / 4;
        if (breakpoint < view.x - offset){
            breakpoint = view.width / 2 + offset / 2;
        }
        win.move({
            x : breakpoint,
            y : win.rect().y
        });
    };

    var isLeft = function(rect){
        return (rect.x ===  view.x);
    };

    var toTop = function(win){
        win.move({
            x : win.rect().x,
            y : view.y
        });
    };

    var isTop = function(rect){
        return (rect.y === view.y);
    };

    var toBottom = function(win){
        win.move({
            x : win.rect().x,
            y : view.height / 2
        });
    };

    var isBottom = function(rect){
        return roughly(rect.y, view.height / 2);
    };

    var toMiddle = function(win){
        win.move({
            x : view.width / 4,
            y : win.rect().y
        });
    };

    var isMiddle = function(rect){
        return !isRight(rect) && !isLeft(rect);
    };

    var horizontalPush = function(direction){
        return function(win){
            view = screen.visibleRect();
            var rect = win.rect();
            if(isFull(rect)){
                toHalf(win);
                direction && toLeft(win);
                return;
            }
            if (isQuarter(rect)){
                if(isRight(rect)){
                    toRight(win);
                } else {
                    toLeft(win);
                }
                return;
            }
            toHalf(win);
            direction ? toRight(win) : toLeft(win);
        };
    };

    var verticalPush = function(direction){
        return function(win){
            view = screen.visibleRect();
            var rect = win.rect();
            if(direction){ // going down
                if(isQuarter(rect) && isTop(rect)){
                    toBottom(win);
                    return;
                }
                if (isHalf(rect) && !isMiddle(rect)){
                    toQuarter(win);
                    toBottom(win);
                    return;
                }
                if (isFull(rect)){
                    toMiddle(win);
                    toHalf(win);
                    return;
                }
            } else { // going up
                if (isHalf(rect)){
                    toTop(win);
                    toFull(win);
                    return;
                }
                if(isQuarter(rect)){
                    if(isBottom(rect)){
                        toTop(win);
                        return;
                    } else {
                        toHalf(win);
                        return;
                    }
                }
            }
        };
    };

    slate.bind("left:ctrl;cmd", horizontalPush(directions.left));

    slate.bind("up:ctrl;cmd", verticalPush(directions.up));

    slate.bind("down:ctrl;cmd", verticalPush(directions.down));

    slate.bind("right:ctrl;cmd", horizontalPush(directions.right));

})();