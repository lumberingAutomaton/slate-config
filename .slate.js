// slate js configuration

(function () {
    'use strict';
    var screen, view, positions, sizes;
    var directions = {
        left: 0,
        right: 1,
        up: 0,
        down: 1
    };

    var update = function () {
        screen = slate.screen();
        view = screen.rect();
        //view = screen.visibleRect();
        positions = {
            horizontal: {
                left: view.x,
                center: view.width / 4,
                right: view.width / 2
            },
            vertical: {
                top: view.y,
                bottom: view.height / 2 + 12
            }
        };

        sizes = {
            width: {
                half: view.width / 2,
                full: view.width
            },
            height: {
                half: view.height / 2 - 12,
                full: view.height
            }
        };
    };

    var roughly = function (over, under) {
        var proportion = over / under;
        return (proportion < 1.05) && proportion > 0.95;
    };

    var toFull = function (win) {
        win.resize({
            width: sizes.width.full,
            height: sizes.height.full
        });
    };

    var isFull = function (rect) {
        return roughly(rect.width, sizes.width.full);
    };

    var toHalf = function (win) {
        win.resize({
            width: sizes.width.half,
            height: sizes.height.full
        });
    };

    var isHalf = function (rect) {
        return roughly(rect.width, sizes.width.half) &&
            roughly(rect.height, sizes.height.full);
    };

    var toQuarter = function (win) {
        win.resize({
            width: sizes.width.half,
            height: sizes.height.half
        });
    };

    var isQuarter = function (rect) {
        return (isTop(rect) || isBottom(rect)) && roughly(rect.width, sizes.width.half) &&
            roughly(rect.height, sizes.height.half);
    };

    var toRight = function (win) {
        var rect = win.rect();
        var breakpoint = rect.x + positions.horizontal.center;
        if (roughly(breakpoint, positions.horizontal.right + positions.horizontal.center)) {
            breakpoint = positions.horizontal.left;
        }
        win.move({
            x: breakpoint,
            y: rect.y
        });
    };

    var isRight = function (rect) {
        return roughly(rect.x, positions.horizontal.right);
    };

    var toLeft = function (win) {
        var rect = win.rect();
        var breakpoint = rect.x - positions.horizontal.center;
        if (breakpoint < positions.horizontal.left) {
            breakpoint = positions.horizontal.right;
        }
        win.move({
            x: breakpoint,
            y: rect.y
        });
    };

    var isLeft = function (rect) {
        return Math.abs(rect.x - positions.horizontal.left) < 24;
    };

    var toTop = function (win) {
        win.move({
            x: win.rect().x,
            y: positions.vertical.top
        });
    };

    var isTop = function (rect) {
        return (rect.y < positions.vertical.bottom);
    };

    var toBottom = function (win) {
        win.move({
            x: win.rect().x,
            y: positions.vertical.bottom
        });
    };

    var isBottom = function (rect) {
        return roughly(rect.y, positions.vertical.bottom);
    };

    var toMiddle = function (win) {
        win.move({
            x: positions.horizontal.center,
            y: win.rect().y
        });
    };

    var isMiddle = function (rect) {
        return !isRight(rect) && !isLeft(rect);
    };

    var horizontalPush = function (direction) {
        return function (win) {
            view = screen.visibleRect();
            var rect = win.rect();
            if (isFull(rect)) {
                toHalf(win);
                direction && toLeft(win);
                return;
            }
            if (isQuarter(rect)) {
                if (isRight(rect)) {
                    toRight(win);
                } else {
                    toLeft(win);
                }
                return;
            }
            toTop(win);
            toHalf(win);
            direction ? toRight(win) : toLeft(win);
        };
    };

    var verticalPush = function (direction) {
        return function (win) {
            view = screen.visibleRect();
            var rect = win.rect();
            if (direction) { // going down
                if (isQuarter(rect) && isTop(rect)) {
                    toBottom(win);
                    return;
                }
                if (isHalf(rect) && !isMiddle(rect)) {
                    toQuarter(win);
                    toBottom(win);
                    return;
                }
                if (isFull(rect)) {
                    toMiddle(win);
                    toHalf(win);
                    return;
                }
            } else { // going up
                if (isHalf(rect)) {
                    if (isRight(rect)) {
                        toRight(win);
                    } else if (isLeft(rect)) {
                        // aww yeah
                    } else {
                        toLeft(win);
                    }
                    toFull(win);
                    return;
                }
                if (isQuarter(rect)) {
                    if (isBottom(rect)) {
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

    update();

    slate.bind("left:ctrl;cmd", horizontalPush(directions.left));

    slate.bind("up:ctrl;cmd", verticalPush(directions.up));

    slate.bind("down:ctrl;cmd", verticalPush(directions.down));

    slate.bind("right:ctrl;cmd", horizontalPush(directions.right));

})();
