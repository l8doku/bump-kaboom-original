System.register("bump.ts/helpers/generic/assertIsPositiveNumber", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    function assertIsPositiveNumber(value, name) {
        if (isNaN(value) || value <= 0)
            throw new Error(`"${name}" must be a positive integer, but was ${value} (${typeof value})`);
    }
    exports_1("default", assertIsPositiveNumber);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("bump.ts/constants", [], function (exports_2, context_2) {
    "use strict";
    var DELTA;
    var __moduleName = context_2 && context_2.id;
    return {
        setters: [],
        execute: function () {
            exports_2("DELTA", DELTA = 1e-10); // floating-point margin of error
        }
    };
});
System.register("bump.ts/helpers/generic/nearest", [], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    function nearest(x, a, b) {
        return Math.abs(a - x) < Math.abs(b - x) ? a : b;
    }
    exports_3("default", nearest);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("bump.ts/rect", ["bump.ts/constants", "bump.ts/helpers/generic/nearest"], function (exports_4, context_4) {
    "use strict";
    var constants_1, nearest_1;
    var __moduleName = context_4 && context_4.id;
    function rect_getNearestCorner(x, y, w, h, px, py) {
        return { x: nearest_1.default(px, x, x + w), y: nearest_1.default(py, y, y + h) };
    }
    exports_4("rect_getNearestCorner", rect_getNearestCorner);
    // This is a generalized implementation of the liang-barsky algorithm, which also returns
    // the normals of the sides where the segment intersects.
    // Returns null if the segment never touches the rect
    // Notice that normals are only guaranteed to be accurate when initially ti1, ti2 == -math.huge, math.huge
    function rect_getSegmentIntersectionIndices(x, y, w, h, x1, y1, x2, y2, ti1, ti2) {
        let _ti1 = isNaN(ti1) ? 0 : ti1;
        let _ti2 = isNaN(ti2) ? 1 : ti2;
        let dx = x2 - x1;
        let dy = y2 - y1;
        let nx;
        let ny;
        let nx1 = 0;
        let ny1 = 0;
        let nx2 = 0;
        let ny2 = 0;
        let p, q, r;
        for (const side of [1, 2, 3, 4]) {
            // left
            if (side === 1) {
                nx = -1;
                ny = 0;
                p = -dx;
                q = x1 - x;
            }
            // right
            else if (side === 2) {
                nx = 1;
                ny = 0;
                p = dx;
                q = x + w - x1;
            }
            // top
            else if (side === 3) {
                nx = 0;
                ny = -1;
                p = -dy;
                q = y1 - y;
            }
            // bottom
            else {
                nx = 0;
                ny = 1;
                p = dy;
                q = y + h - y1;
            }
            if (p === 0) {
                if (q <= 0)
                    return [
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                        undefined,
                    ];
            }
            else {
                r = q / p;
                if (p < 0) {
                    if (r > _ti2)
                        return [
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                        ];
                    else if (r > _ti1) {
                        _ti1 = r;
                        nx1 = nx;
                        ny1 = ny;
                    }
                } // p > 0
                else {
                    if (r < _ti1)
                        return [
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                            undefined,
                        ];
                    else if (r < _ti2) {
                        _ti2 = r;
                        nx2 = nx;
                        ny2 = ny;
                    }
                }
            }
        }
        return [_ti1, _ti2, nx1, ny1, nx2, ny2];
    }
    exports_4("rect_getSegmentIntersectionIndices", rect_getSegmentIntersectionIndices);
    // //Calculates the Minkowsky difference between 2 rects, which is another rect
    function rect_getDiff(x1, y1, w1, h1, x2, y2, w2, h2) {
        return {
            x: x2 - x1 - w1,
            y: y2 - y1 - h1,
            w: w1 + w2,
            h: h1 + h2,
        };
    }
    exports_4("rect_getDiff", rect_getDiff);
    function rect_containsPoint(x, y, w, h, px, py) {
        return (px - x > constants_1.DELTA && py - y > constants_1.DELTA && x + w - px > constants_1.DELTA && y + h - py > constants_1.DELTA);
    }
    exports_4("rect_containsPoint", rect_containsPoint);
    function rect_isIntersecting(x1, y1, w1, h1, x2, y2, w2, h2) {
        return x1 < x2 + w2 && x2 < x1 + w1 && y1 < y2 + h2 && y2 < y1 + h1;
    }
    exports_4("rect_isIntersecting", rect_isIntersecting);
    function rect_getSquareDistance(x1, y1, w1, h1, x2, y2, w2, h2) {
        const dx = x1 - x2 + (w1 - w2) / 2;
        const dy = y1 - y2 + (h1 - h2) / 2;
        return dx * dx + dy * dy;
    }
    exports_4("rect_getSquareDistance", rect_getSquareDistance);
    function rect_detectCollision(x1, y1, w1, h1, x2, y2, w2, h2, goalX, goalY) {
        const _goalX = isNaN(goalX) ? x1 : goalX;
        const _goalY = isNaN(goalY) ? y1 : goalY;
        let dx = _goalX - x1;
        let dy = _goalY - y1;
        const { x, y, w, h } = rect_getDiff(x1, y1, w1, h1, x2, y2, w2, h2);
        let overlaps;
        let nx, ny;
        let ti;
        // If the item was intersecting other
        if (rect_containsPoint(x, y, w, h, 0, 0)) {
            let { x: px, y: py } = rect_getNearestCorner(x, y, w, h, 0, 0);
            let wi = Math.min(w1, Math.abs(px)); // area of intersection
            let hi = Math.min(h1, Math.abs(py)); // area of intersection
            ti = -wi * hi; // `ti` is the negative area of intersection
            overlaps = true;
        }
        else {
            let [ti1, ti2, nx1, ny1] = rect_getSegmentIntersectionIndices(x, y, w, h, 0, 0, dx, dy, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
            // To make the compiler stop complaining
            ti1 = ti1;
            // item tunnels into other
            if (!isNaN(ti1) &&
                ti1 < 1 &&
                Math.abs(ti1 - (ti2 || 0)) >= constants_1.DELTA && // special case for rect going through another rect's corner
                (0 < ti1 + constants_1.DELTA || (0 === ti1 && (ti2 || 0) > 0))) {
                ti = ti1;
                nx = nx1;
                ny = ny1;
                overlaps = false;
            }
        }
        if (isNaN(ti))
            return;
        let tx, ty;
        if (overlaps)
            if (dx === 0 && dy === 0) {
                //intersecting and not moving - use minimum displacement vector
                let { x: px, y: py } = rect_getNearestCorner(x, y, w, h, 0, 0);
                if (Math.abs(px) < Math.abs(py))
                    py = 0;
                else
                    px = 0;
                nx = Math.sign(px);
                ny = Math.sign(py);
                tx = x1 + px;
                ty = y1 + py;
            }
            else {
                //intersecting and moving - move in the opposite direction
                // @ts-ignore
                let [ti1, _, _nx, _ny] = rect_getSegmentIntersectionIndices(x, y, w, h, 0, 0, dx, dy, -Number.MAX_SAFE_INTEGER, 1);
                nx = _nx;
                ny = _ny;
                if (!ti1)
                    return;
                tx = x1 + dx * ti1;
                ty = y1 + dy * ti1;
            }
        //tunnel
        else {
            // @ts-ignore
            tx = x1 + dx * ti;
            // @ts-ignore
            ty = y1 + dy * ti;
        }
        return {
            overlaps: overlaps,
            // @ts-ignore
            ti,
            move: { x: dx, y: dy },
            normal: { x: nx, y: ny },
            touch: { x: tx, y: ty },
            itemRect: { x: x1, y: y1, w: w1, h: h1 },
            otherRect: { x: x2, y: y2, w: w2, h: h2 },
        };
    }
    exports_4("rect_detectCollision", rect_detectCollision);
    return {
        setters: [
            function (constants_1_1) {
                constants_1 = constants_1_1;
            },
            function (nearest_1_1) {
                nearest_1 = nearest_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("bump.ts/grid", [], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    function grid_toWorld(cellSize, cx, cy) {
        return [(cx - 1) * cellSize, (cy - 1) * cellSize];
    }
    exports_5("grid_toWorld", grid_toWorld);
    function grid_toCell(cellSize, x, y) {
        return [Math.floor(x / cellSize) + 1, Math.floor(y / cellSize) + 1];
    }
    exports_5("grid_toCell", grid_toCell);
    //grid_traverse * functions are based on "A Fast Voxel Traversal Algorithm for Ray Tracing",
    //by John Amanides and Andrew Woo - http://www.cse.yorku.ca/~amana/research/grid.pdf
    //It has been modified to include both cells when the ray "touches a grid corner",
    //and with a different exit condition
    function grid_traverse_initStep(cellSize, ct, t1, t2) {
        const v = t2 - t1;
        if (v > 0)
            return [1, cellSize / v, ((ct + v) * cellSize - t1) / v];
        else if (v < 0)
            return [-1, -cellSize / v, ((ct + v - 1) * cellSize - t1) / v];
        else
            return [0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
    }
    exports_5("grid_traverse_initStep", grid_traverse_initStep);
    function grid_traverse(cellSize, x1, y1, x2, y2, traverseFunction) {
        const [cx1, cy1] = grid_toCell(cellSize, x1, y1);
        const [cx2, cy2] = grid_toCell(cellSize, x2, y2);
        let [stepX, dx, tx] = grid_traverse_initStep(cellSize, cx1, x1, x2);
        let [stepY, dy, ty] = grid_traverse_initStep(cellSize, cy1, y1, y2);
        let [cx, cy] = [cx1, cy1];
        traverseFunction(cx, cy);
        // The default implementation had an infinite loop problem when
        // approaching the last cell in some occassions. We finish iterating
        // when we are *next* to the last cell.
        do {
            if (tx < ty) {
                [tx, cx] = [tx + dx, cx + stepX];
                traverseFunction(cx, cy);
            }
            else {
                // Addition: include both cells when going through corners
                if (tx == ty)
                    traverseFunction(cx + stepX, cy);
                ty = ty + dy;
                cy = cy + stepY;
                traverseFunction(cx, cy);
            }
        } while (Math.abs(cx - cx2) + Math.abs(cy - cy2) > 1);
        //If we have not arrived to the last cell, use it
        if (cx != cx2 || cy != cy2)
            traverseFunction(cx2, cy2);
    }
    exports_5("grid_traverse", grid_traverse);
    function grid_toCellRect(cellSize, x, y, w, h) {
        let [cx, cy] = grid_toCell(cellSize, x, y);
        const cr = Math.ceil((x + w) / cellSize);
        const cb = Math.ceil((y + h) / cellSize);
        return [cx, cy, cr - cx + 1, cb - cy + 1];
    }
    exports_5("grid_toCellRect", grid_toCellRect);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("bump.ts/helpers/generic/assertType", [], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    function assertType(desiredType, value, name) {
        if (typeof value !== desiredType)
            throw new Error(`"${name}" must be a ${desiredType}, but was a ${value} (${typeof value})`);
    }
    exports_6("default", assertType);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("bump.ts/helpers/generic/assertIsRect", ["bump.ts/helpers/generic/assertIsPositiveNumber", "bump.ts/helpers/generic/assertType"], function (exports_7, context_7) {
    "use strict";
    var assertIsPositiveNumber_1, assertType_1;
    var __moduleName = context_7 && context_7.id;
    function assertIsRect(x, y, w, h) {
        assertType_1.default('number', x, 'x');
        assertType_1.default('number', y, 'y');
        assertIsPositiveNumber_1.default(w, 'w');
        assertIsPositiveNumber_1.default(h, 'h');
    }
    exports_7("default", assertIsRect);
    return {
        setters: [
            function (assertIsPositiveNumber_1_1) {
                assertIsPositiveNumber_1 = assertIsPositiveNumber_1_1;
            },
            function (assertType_1_1) {
                assertType_1 = assertType_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("bump.ts/helpers/world/responses", [], function (exports_8, context_8) {
    "use strict";
    var __moduleName = context_8 && context_8.id;
    function touch(_world, column, _x, _y, _w, _h, _goalX, _goalY, _filter) {
        return { x: column.touch.x, y: column.touch.y, collisions: [] };
    }
    exports_8("touch", touch);
    function cross(world, column, x, y, w, h, goalX, goalY, filter) {
        const collisions = world.project(column.item, x, y, w, h, goalX, goalY, filter);
        return { x: goalX, y: goalY, collisions };
    }
    exports_8("cross", cross);
    function slide(world, column, x, y, w, h, goalX, goalY, filter) {
        let _goalX = isNaN(goalX) ? x : goalX;
        let _goalY = isNaN(goalY) ? y : goalY;
        const tch = column.touch;
        const move = column.move;
        if (move.x !== 0 || move.y !== 0)
            if (column.normal.x !== 0)
                _goalX = tch.x;
            else
                _goalY = tch.y;
        column.slide = { x: _goalX, y: _goalY };
        const _x = tch.x;
        const _y = tch.y;
        const collisions = world.project(column.item, _x, _y, w, h, _goalX, _goalY, filter);
        return { x: _goalX, y: _goalY, collisions };
    }
    exports_8("slide", slide);
    function bounce(world, collision, x, y, w, h, goalX, goalY, filter) {
        const _goalX = isNaN(goalX) ? x : goalX;
        const _goalY = isNaN(goalY) ? y : goalY;
        const { touch, move } = collision;
        let bx = touch.x;
        let by = touch.y;
        if (move.x !== 0 || move.y !== 0) {
            let bnx = _goalX - touch.x;
            let bny = _goalY - touch.y;
            if (collision.normal.x === 0)
                bny = -bny;
            else
                bnx = -bnx;
            bx = touch.x + bnx;
            by = touch.y + bny;
        }
        collision.bounce = { x: bx, y: by };
        const collisions = world.project(collision.item, touch.x, touch.y, w, h, bx, by, filter);
        return { x: bx, y: by, collisions };
    }
    exports_8("bounce", bounce);
    return {
        setters: [],
        execute: function () {
        }
    };
});
System.register("bump.ts/helpers/world/sortByTiAndDistance", ["bump.ts/rect"], function (exports_9, context_9) {
    "use strict";
    var rect_1;
    var __moduleName = context_9 && context_9.id;
    function sortByTiAndDistance(a, b) {
        if (a.ti === b.ti) {
            const ir = a.itemRect;
            const ar = a.otherRect;
            const br = b.otherRect;
            const ad = rect_1.rect_getSquareDistance(ir.x, ir.y, ir.w, ir.h, ar.x, ar.y, ar.w, ar.h);
            const bd = rect_1.rect_getSquareDistance(ir.x, ir.y, ir.w, ir.h, br.x, br.y, br.w, br.h);
            return ad - bd;
        }
        return a.ti - b.ti;
    }
    exports_9("default", sortByTiAndDistance);
    return {
        setters: [
            function (rect_1_1) {
                rect_1 = rect_1_1;
            }
        ],
        execute: function () {
        }
    };
});
System.register("bump.ts/index", ["bump.ts/helpers/generic/assertIsPositiveNumber", "bump.ts/rect", "bump.ts/grid", "bump.ts/helpers/generic/assertIsRect", "bump.ts/helpers/world/responses", "bump.ts/helpers/world/sortByTiAndDistance"], function (exports_10, context_10) {
    "use strict";
    var assertIsPositiveNumber_2, rect_2, grid_1, assertIsRect_1, responses_1, sortByTiAndDistance_1, World, bump;
    var __moduleName = context_10 && context_10.id;
    function defaultFilter() {
        return 'slide';
    }
    function sortByWeight(a, b) {
        return a.weight - b.weight;
    }
    function getCellsTouchedBySegment(self, x1, y1, x2, y2) {
        const cells = [];
        const visited = {};
        grid_1.grid_traverse(self.cellSize, x1, y1, x2, y2, function (cx, cy) {
            let row = self.rows[cy];
            if (!row)
                return;
            let cell = row[cx];
            if (!cell || visited[cell.ID])
                return;
            visited[cell.ID] = true;
            cells.push(cell);
        });
        return cells;
    }
    function getInfoAboutItemsTouchedBySegment(self, x1, y1, x2, y2, filter) {
        let cells = getCellsTouchedBySegment(self, x1, y1, x2, y2);
        let rect, l, t, w, h, ti1, ti2;
        let visited = {};
        let itemInfo = [];
        for (const cell of cells) {
            if (cell?.items)
                for (const itemID of Object.keys(cell.items)) {
                    if (!visited[itemID]) {
                        visited[itemID] = true;
                        if (!filter || filter(itemID)) {
                            // rect = self['rectsMap'].get(item)
                            rect = self['rects'][itemID];
                            l = rect.x;
                            t = rect.y;
                            w = rect.w;
                            h = rect.h;
                            const arr1 = rect_2.rect_getSegmentIntersectionIndices(l, t, w, h, x1, y1, x2, y2, 0, 1);
                            ti1 = arr1[0];
                            ti2 = arr1[1];
                            if (!isNaN(ti1) &&
                                ((0 < ti1 && ti1 < 1) || (0 < ti2 && ti2 < 1))) {
                                // -- the sorting is according to the t of an infinite line, not the segment
                                const [tii0, tii1] = rect_2.rect_getSegmentIntersectionIndices(l, t, w, h, x1, y1, x2, y2, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
                                itemInfo.push({
                                    item: itemID,
                                    ti1: ti1,
                                    ti2: ti2,
                                    weight: Math.min(tii0 || 0, tii1 || 0),
                                });
                            }
                        }
                    }
                }
        }
        return itemInfo.sort(sortByWeight);
    }
    return {
        setters: [
            function (assertIsPositiveNumber_2_1) {
                assertIsPositiveNumber_2 = assertIsPositiveNumber_2_1;
            },
            function (rect_2_1) {
                rect_2 = rect_2_1;
            },
            function (grid_1_1) {
                grid_1 = grid_1_1;
            },
            function (assertIsRect_1_1) {
                assertIsRect_1 = assertIsRect_1_1;
            },
            function (responses_1_1) {
                responses_1 = responses_1_1;
            },
            function (sortByTiAndDistance_1_1) {
                sortByTiAndDistance_1 = sortByTiAndDistance_1_1;
            }
        ],
        execute: function () {
            World = class World {
                responses = {};
                cellSize = 0;
                rows;
                rectsMap;
                reverseIdMap;
                rects;
                nonEmptyCells;
                currentIndex = 0;
                constructor(input) {
                    this.cellSize = input.cellSize;
                    this.rects = input.rects;
                    this.rows = input.rows;
                    this.nonEmptyCells = input.nonEmptyCells;
                    this.responses = input.responses;
                    this.rectsMap = new WeakMap();
                    this.reverseIdMap = new Map();
                    this.currentIndex = 0;
                }
                addResponse(name, response) {
                    this.responses[name] = response;
                }
                getResponseByName(name) {
                    const response = this.responses[name];
                    if (!response)
                        throw new Error(`Unknown collision type: ${name} (${typeof name})`);
                    return response;
                }
                // TODO: make the function take objects (maybe, if kept public)
                project(itemID, x, y, w, h, goalX, goalY, filter) {
                    assertIsRect_1.default(x, y, w, h);
                    const _goalX = isNaN(goalX) ? x : goalX;
                    const _goalY = isNaN(goalY) ? y : goalY;
                    const _filter = filter || defaultFilter;
                    let collisions = [];
                    let visited = {};
                    if (itemID)
                        visited[itemID] = true;
                    // This could probably be done with less cells using a polygon raster over the cells instead of a
                    // bounding rect of the whole movement.Conditional to building a queryPolygon method
                    let tl = Math.min(_goalX, x);
                    let tt = Math.min(_goalY, y);
                    let tr = Math.max(_goalX + w, x + w);
                    let tb = Math.max(_goalY + h, y + h);
                    let tw = tr - tl;
                    let th = tb - tt;
                    let [cl, ct, cw, ch] = grid_1.grid_toCellRect(this.cellSize, tl, tt, tw, th);
                    let dictItemsInCellRect = this.getDictItemsInCellRect(cl, ct, cw, ch);
                    for (const other of Object.keys(dictItemsInCellRect)) {
                        if (!visited[other]) {
                            visited[other] = true;
                            const responseName = _filter(itemID, other);
                            if (responseName &&
                                /* why do I have to do this extra check? */ this._hasItem(other)) {
                                let otherRect = this._getRect(other);
                                let collision = rect_2.rect_detectCollision(x, y, w, h, otherRect.x, otherRect.y, otherRect.w, otherRect.h, _goalX, _goalY);
                                if (collision) {
                                    collision.other = other;
                                    collision.otherObj = this.reverseIdMap.get(other);
                                    collision.item = itemID;
                                    // @ts-ignore
                                    collision.itemObj = this.reverseIdMap.get(itemID);
                                    collision.type = responseName;
                                    collisions.push(collision);
                                }
                            }
                        }
                    }
                    return collisions.sort(sortByTiAndDistance_1.default);
                }
                countCells() {
                    let count = 0;
                    for (const row of this.rows.filter(row => !!row))
                        for (const _col of row)
                            if (!!_col)
                                count++;
                    return count;
                }
                // public
                hasItem(item) {
                    const itemID = this.rectsMap.get(item);
                    if (itemID === undefined) {
                        return false;
                    }
                    // return this.rectsMap.has(item);
                    return !!this.rects[itemID];
                }
                _hasItem(item) {
                    return !!this.rects[item];
                }
                getItems() {
                    return Object.keys(this.rects).map(rectID => this.rects[rectID]);
                }
                countItems() {
                    return Object.keys(this.rects).length;
                }
                addItemToCell(itemID, cx, cy) {
                    this.rows[cy] = this.rows[cy] || [];
                    const row = this.rows[cy];
                    // Initialize a cell if no cell is present at this point
                    if (!row[cx])
                        row[cx] = {
                            ID: `Cell_${Math.ceil(Math.random() * Date.now()).toString(36)}`,
                            x: cx,
                            y: cy,
                            items: {},
                        };
                    const cell = row[cx];
                    this.nonEmptyCells[cell.ID] = true;
                    if (!cell.items[itemID])
                        cell.items[itemID] = true;
                }
                // public
                getRect(item) {
                    const itemID = this.rectsMap.get(item);
                    if (itemID === undefined) {
                        throw new Error(`Item "${itemID}" must be added to the world before getting its rect. Use world:add(item, x,y,w,h) to add it first.`);
                    }
                    return this._getRect(itemID);
                }
                _getRect(itemID) {
                    let rect = this.rects[itemID];
                    if (!rect)
                        throw new Error(`Item "${itemID}" must be added to the world before getting its rect. Use world:add(item, x,y,w,h) to add it first.`);
                    return {
                        x: rect.x,
                        y: rect.y,
                        w: rect.w,
                        h: rect.h,
                    };
                }
                // public
                getDictItemsInCellRect(cl, ct, cw, ch) {
                    const items_dict = {};
                    for (let cy = ct; cy <= ct + ch - 1; cy++) {
                        let row = this.rows[cy];
                        if (row) {
                            for (let cx = cl; cx <= cl + cw - 1; cx++) {
                                let cell = row[cx];
                                if (cell?.items && Object.keys(cell.items)?.length > 0)
                                    // no cell.itemCount > 1 because tunneling
                                    for (const itemID of Object.keys(cell.items))
                                        items_dict[itemID] = true;
                            }
                        }
                    }
                    return items_dict;
                }
                removeItemFromCell(itemID, cx, cy) {
                    let row = this.rows[cy];
                    if (!row?.[cx]?.['items']?.[itemID])
                        return false;
                    let cell = row[cx];
                    delete cell.items[itemID];
                    if (Object.keys(cell.items)?.length === 0)
                        delete this.nonEmptyCells[cell.ID];
                    return true;
                }
                // public
                toWorld(cx, cy) {
                    return grid_1.grid_toWorld(this.cellSize, cx, cy);
                }
                // public
                toCell(x, y) {
                    return grid_1.grid_toCell(this.cellSize, x, y);
                }
                // public
                queryRect(x, y, w, h, filter) {
                    assertIsRect_1.default(x, y, w, h);
                    const [cl, ct, cw, ch] = grid_1.grid_toCellRect(this.cellSize, x, y, w, h);
                    const dictItemsInCellRect = this.getDictItemsInCellRect(cl, ct, cw, ch);
                    const items = [];
                    for (const itemID of Object.keys(dictItemsInCellRect))
                        if ((!filter || filter(itemID)) &&
                            rect_2.rect_isIntersecting(x, y, w, h, this.rects[itemID].x, this.rects[itemID].y, this.rects[itemID].w, this.rects[itemID].h))
                            items.push(itemID);
                    return items;
                }
                // public
                queryPoint(x, y, filter) {
                    const [cx, cy] = this.toCell(x, y);
                    const dictItemsInCellRect = this.getDictItemsInCellRect(cx, cy, 1, 1);
                    const items = [];
                    for (const itemID of Object.keys(dictItemsInCellRect))
                        if ((!filter || filter(itemID)) &&
                            rect_2.rect_containsPoint(this.rects[itemID].x, this.rects[itemID].y, this.rects[itemID].w, this.rects[itemID].h, x, y))
                            items.push(itemID);
                    return items;
                }
                // public
                querySegment(x1, y1, x2, y2, filter) {
                    const itemsInfo = getInfoAboutItemsTouchedBySegment(this, x1, y1, x2, y2, filter);
                    const items = [];
                    if (itemsInfo)
                        for (const itemInfo of itemsInfo)
                            items.push(itemInfo.item);
                    return items;
                }
                // public
                querySegmentWithCoords(x1, y1, x2, y2, filter) {
                    let itemInfo = getInfoAboutItemsTouchedBySegment(this, x1, y1, x2, y2, filter);
                    let dx = x2 - x1;
                    let dy = y2 - y1;
                    let info;
                    let ti1;
                    let ti2;
                    for (const item of itemInfo) {
                        info = item;
                        ti1 = info.ti1;
                        ti2 = info.ti2;
                        info.weight = null;
                        info.x1 = x1 + dx * ti1;
                        info.y1 = y1 + dy * ti1;
                        info.x2 = x1 + dx * ti2;
                        info.y2 = y1 + dy * ti2;
                    }
                    return itemInfo;
                }
                getItemByIndex(itemID) {
                    return this.reverseIdMap.get(itemID);
                }
                // public
                add(item, x, y, w, h) {
                    if (!this.rectsMap.has(item)) {
                        this.rectsMap.set(item, (++this.currentIndex).toString());
                        // @ts-ignore
                        this.reverseIdMap.set(this.rectsMap.get(item), item);
                    }
                    const itemID = this.rectsMap.get(item);
                    if (itemID === undefined) {
                        throw new Error(`Something went horribly wrong, an item was added but it's not in the map`);
                    }
                    const rect = this.rects[itemID];
                    if (rect)
                        throw new Error(`Item "${itemID}" added to the world twice.`);
                    assertIsRect_1.default(x, y, w, h);
                    this.rects[itemID] = { x, y, w, h };
                    const [cl, ct, cw, ch] = grid_1.grid_toCellRect(this.cellSize, x, y, w, h);
                    for (let cy = ct; cy < ct + ch; cy++)
                        for (let cx = cl; cx < cl + cw; cx++)
                            this.addItemToCell(itemID, cx, cy);
                    return itemID;
                }
                // public
                remove(item) {
                    const itemID = this.rectsMap.get(item);
                    if (itemID === undefined) {
                        console.log("Trying to delete item that doesn't exist. Doing nothing");
                        return;
                    }
                    this._remove(itemID);
                    this.rectsMap.delete(item);
                    this.reverseIdMap.delete(itemID);
                }
                _remove(itemID) {
                    const itemRect = JSON.parse(JSON.stringify(this._getRect(itemID)));
                    delete this.rects[itemID];
                    let [cl, ct, cw, ch] = grid_1.grid_toCellRect(this.cellSize, itemRect.x, itemRect.y, itemRect.w, itemRect.h);
                    for (let cy = ct; cy < ct + ch; cy++)
                        for (let cx = cl; cx < cl + cw; cx++)
                            this.removeItemFromCell(itemID, cx, cy);
                }
                // public
                update(itemID, x2, y2, w2, h2) {
                    let itemRect = this._getRect(itemID);
                    w2 = isNaN(w2) ? itemRect.w : w2;
                    h2 = isNaN(h2) ? itemRect.h : h2;
                    assertIsRect_1.default(x2, y2, w2, h2);
                    if (itemRect.x != x2 ||
                        itemRect.y != y2 ||
                        itemRect.w != w2 ||
                        itemRect.h != h2) {
                        const [cl1, ct1, cw1, ch1] = grid_1.grid_toCellRect(this.cellSize, itemRect.x, itemRect.y, itemRect.w, itemRect.h);
                        const [cl2, ct2, cw2, ch2] = grid_1.grid_toCellRect(this.cellSize, x2, y2, w2, h2);
                        if (cl1 != cl2 || ct1 != ct2 || cw1 != cw2 || ch1 != ch2) {
                            const cr1 = cl1 + cw1 - 1;
                            const cb1 = ct1 + ch1 - 1;
                            const cr2 = cl2 + cw2 - 1;
                            const cb2 = ct2 + ch2 - 1;
                            let cyOut;
                            for (let cy = ct1; cy <= cb1; cy++) {
                                cyOut = Number(cy) < ct2 || cy > cb2;
                                for (let cx = cl1; cx <= cr1; cx++)
                                    if (cyOut || cx < cl2 || cx > cr2)
                                        this.removeItemFromCell(itemID, cx, cy);
                            }
                            for (let cy = ct2; cy <= cb2; cy++) {
                                cyOut = cy < ct1 || cy > cb1;
                                for (let cx = cl2; cx <= cr2; cx++)
                                    if (cyOut || cx < cl1 || cx > cr1)
                                        this.addItemToCell(itemID, cx, cy);
                            }
                        }
                        const rect = this.rects[itemID];
                        rect.x = x2;
                        rect.y = y2;
                        rect.w = w2;
                        rect.h = h2;
                    }
                }
                // public
                move(item, goalX, goalY, filter) {
                    const itemID = this.rectsMap.get(item);
                    if (itemID === undefined) {
                        throw new Error("Trying to move item that doesn't exist.");
                    }
                    return this._move(itemID, goalX, goalY, filter);
                }
                _move(itemID, goalX, goalY, filter) {
                    const { x, y, collisions } = this._check(itemID, goalX, goalY, filter);
                    this.update(itemID, x, y);
                    return { x, y, collisions };
                }
                // public
                // TODO: make the function take objects
                check(item, goalX, goalY, filter) {
                    const itemID = this.rectsMap.get(item);
                    if (itemID === undefined) {
                        throw new Error("Trying to check item that doesn't exist.");
                    }
                    return this._check(itemID, goalX, goalY, filter);
                }
                _check(itemID, goalX, goalY, filter) {
                    let _goalX = goalX;
                    let _goalY = goalY;
                    const checkFilter = filter || defaultFilter;
                    let visited = {};
                    visited[itemID] = true;
                    const visitedFilter = (itm, other) => !!visited[other] ? false : checkFilter(itm, other);
                    let detectedCollisions = [];
                    const itemRect = this._getRect(itemID);
                    // this is returning an empty array. WHY?
                    let projectedCollisions = this.project(itemID, itemRect.x, itemRect.y, itemRect.w, itemRect.h, _goalX, _goalY, visitedFilter);
                    let collisionsCounter = projectedCollisions?.length || 0;
                    while (collisionsCounter > 0) {
                        const collision = projectedCollisions[0];
                        detectedCollisions.push(collision);
                        visited[collision.other] = true;
                        let response = this.getResponseByName(collision.type);
                        const { x, y, collisions } = response(this, collision, itemRect.x, itemRect.y, itemRect.w, itemRect.h, _goalX, _goalY, visitedFilter);
                        _goalX = x;
                        _goalY = y;
                        projectedCollisions = collisions;
                        collisionsCounter = collisions?.length || 0;
                    }
                    return { x: _goalX, y: _goalY, collisions: detectedCollisions };
                }
            };
            exports_10("World", World);
            // Public library functions
            bump = {
                newWorld: function (cellSize) {
                    cellSize = cellSize || 64;
                    assertIsPositiveNumber_2.default(cellSize, 'cellSize');
                    const world = new World({
                        cellSize: cellSize,
                        rects: {},
                        rows: [],
                        nonEmptyCells: {},
                        responses: {},
                    });
                    world.addResponse('touch', responses_1.touch);
                    world.addResponse('cross', responses_1.cross);
                    world.addResponse('slide', responses_1.slide);
                    world.addResponse('bounce', responses_1.bounce);
                    return world;
                },
                rect: {
                    getNearestCorner: rect_2.rect_getNearestCorner,
                    getSegmentIntersectionIndices: rect_2.rect_getSegmentIntersectionIndices,
                    getDiff: rect_2.rect_getDiff,
                    containsPoint: rect_2.rect_containsPoint,
                    isIntersecting: rect_2.rect_isIntersecting,
                    getSquareDistance: rect_2.rect_getSquareDistance,
                    detectCollision: rect_2.rect_detectCollision,
                },
                responses: {
                    touch: responses_1.touch,
                    cross: responses_1.cross,
                    slide: responses_1.slide,
                    bounce: responses_1.bounce,
                },
            };
            exports_10("default", Object.freeze(bump));
        }
    };
});
System.register("bump-kaboom", ["bump.ts/index"], function (exports_11, context_11) {
    "use strict";
    var index_1;
    var __moduleName = context_11 && context_11.id;
    // turn "a collides with b on the right side" to
    // "b collides with a on the left side"
    // 'touch', 'slide' and 'bounce' are incorrect,
    // but in this case 'other' should never move, so they
    // should never be used 
    function invertCollision(c) {
        return {
            other: c.item,
            item: c.other,
            otherObj: c.itemObj,
            itemObj: c.otherObj,
            type: c.type,
            overlaps: c.overlaps,
            ti: c.ti,
            move: { x: 0, y: 0 },
            normal: { x: -c.normal.x, y: -c.normal.y },
            touch: c.touch,
            itemRect: c.otherRect,
            otherRect: c.itemRect,
            slide: c.slide,
            bounce: c.bounce
        };
    }
    // convert origin string to a vec2 offset
    function originPt(orig) {
        switch (orig) {
            case "topleft": return vec2(-1, -1);
            case "top": return vec2(0, -1);
            case "topright": return vec2(1, -1);
            case "left": return vec2(-1, 0);
            case "center": return vec2(0, 0);
            case "right": return vec2(1, 0);
            case "botleft": return vec2(-1, 1);
            case "bot": return vec2(0, 1);
            case "botright": return vec2(1, 1);
            default: return orig;
        }
    }
    return {
        setters: [
            function (index_1_1) {
                index_1 = index_1_1;
            }
        ],
        execute: function () {
            exports_11("default", (k) => {
                // only one global collision world now 
                const world = index_1.default.newWorld(50);
                function barea() {
                    // entry where key="wall", value="slide" means when colliding with
                    // an object with a tag "wall" the collision response should be "slide"
                    const filterCollection = {};
                    let bfilter = (_, other) => {
                        for (const [key, value] of Object.entries(filterCollection)) {
                            const otherObj = world.getItemByIndex(other);
                            if (!otherObj) {
                                continue;
                            }
                            // @ts-ignore
                            if (otherObj.is(key)) {
                                return value;
                            }
                        }
                        return undefined;
                    };
                    return {
                        id: "barea",
                        require: ["pos", "area"],
                        barea: {
                            w: 0,
                            h: 0,
                            offset: vec2(0)
                        },
                        load() {
                            let w = this.area.width ?? this.width;
                            let h = this.area.height ?? this.height;
                            if (w == null || h == null) {
                                throw new Error("failed to get area dimension");
                            }
                            const scale = vec2(this.scale ?? 1);
                            w *= scale.x;
                            h *= scale.y;
                            this.barea.w = w;
                            this.barea.h = h;
                            const orig = originPt(this.origin || "topleft");
                            const bareaOffset = orig.add(1, 1).scale(0.5).scale(w, h);
                            const pos = (this.pos ?? vec2(0))
                                .sub(bareaOffset);
                            this.barea.offset = bareaOffset;
                            world.add(this, pos.x, pos.y, w, h);
                        },
                        bmoveTo(dest) {
                            // move within the Bump world, result is the final coordinates
                            // after all the collidions
                            // can safely teleport (moveTo) to them afterwards
                            // apply offset
                            const pos = dest.sub(this.barea.offset);
                            const { x, y, collisions } = world.move(this, pos.x, pos.y, bfilter);
                            // reverse apply offset
                            const goal = vec2(x, y).add(this.barea.offset);
                            this.moveTo(goal.x, goal.y);
                            for (const col of collisions) {
                                this.trigger("bumpcollide", col.otherObj, col);
                                // @ts-ignore
                                col.otherObj.trigger("bumpcollide", this, invertCollision(col));
                            }
                        },
                        bmove(...args) {
                            if (typeof args[0] === "number" && typeof args[1] === "number") {
                                return this.bmove(vec2(args[0], args[1]));
                            }
                            this.bmoveTo(k.vec2(this.pos.x + args[0].x * dt(), this.pos.y + args[0].y * dt()));
                        },
                        addBumpCollision(tag, response) {
                            filterCollection[tag] = response;
                        },
                        addCollisionResponse(tag, f) {
                            return this.on("bumpcollide", (obj, col) => {
                                obj.is(tag) && f(obj, col);
                            });
                        },
                    };
                }
                return {
                    barea
                };
            });
        }
    };
});
//# sourceMappingURL=bump-kaboom.js.map