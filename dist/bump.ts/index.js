import assertIsPositiveNumber from './helpers/generic/assertIsPositiveNumber';
import { rect_containsPoint, rect_detectCollision, rect_getDiff, rect_getNearestCorner, rect_getSegmentIntersectionIndices, rect_getSquareDistance, rect_isIntersecting, } from './rect';
import { grid_toCell, grid_toCellRect, grid_toWorld, grid_traverse, } from './grid';
import assertIsRect from './helpers/generic/assertIsRect';
import { bounce, cross, slide, touch, } from './helpers/world/responses';
import sortByTiAndDistance from './helpers/world/sortByTiAndDistance';
function defaultFilter() {
    return 'slide';
}
function sortByWeight(a, b) {
    return a.weight - b.weight;
}
function getCellsTouchedBySegment(self, x1, y1, x2, y2) {
    const cells = [];
    const visited = {};
    grid_traverse(self.cellSize, x1, y1, x2, y2, function (cx, cy) {
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
                        const arr1 = rect_getSegmentIntersectionIndices(l, t, w, h, x1, y1, x2, y2, 0, 1);
                        ti1 = arr1[0];
                        ti2 = arr1[1];
                        if (!isNaN(ti1) &&
                            ((0 < ti1 && ti1 < 1) || (0 < ti2 && ti2 < 1))) {
                            // -- the sorting is according to the t of an infinite line, not the segment
                            const [tii0, tii1] = rect_getSegmentIntersectionIndices(l, t, w, h, x1, y1, x2, y2, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
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
export class World {
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
        assertIsRect(x, y, w, h);
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
        let [cl, ct, cw, ch] = grid_toCellRect(this.cellSize, tl, tt, tw, th);
        let dictItemsInCellRect = this.getDictItemsInCellRect(cl, ct, cw, ch);
        for (const other of Object.keys(dictItemsInCellRect)) {
            if (!visited[other]) {
                visited[other] = true;
                const responseName = _filter(itemID, other);
                if (responseName &&
                    /* why do I have to do this extra check? */ this._hasItem(other)) {
                    let otherRect = this._getRect(other);
                    let collision = rect_detectCollision(x, y, w, h, otherRect.x, otherRect.y, otherRect.w, otherRect.h, _goalX, _goalY);
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
        return collisions.sort(sortByTiAndDistance);
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
        return grid_toWorld(this.cellSize, cx, cy);
    }
    // public
    toCell(x, y) {
        return grid_toCell(this.cellSize, x, y);
    }
    // public
    queryRect(x, y, w, h, filter) {
        assertIsRect(x, y, w, h);
        const [cl, ct, cw, ch] = grid_toCellRect(this.cellSize, x, y, w, h);
        const dictItemsInCellRect = this.getDictItemsInCellRect(cl, ct, cw, ch);
        const items = [];
        for (const itemID of Object.keys(dictItemsInCellRect))
            if ((!filter || filter(itemID)) &&
                rect_isIntersecting(x, y, w, h, this.rects[itemID].x, this.rects[itemID].y, this.rects[itemID].w, this.rects[itemID].h))
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
                rect_containsPoint(this.rects[itemID].x, this.rects[itemID].y, this.rects[itemID].w, this.rects[itemID].h, x, y))
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
        assertIsRect(x, y, w, h);
        this.rects[itemID] = { x, y, w, h };
        const [cl, ct, cw, ch] = grid_toCellRect(this.cellSize, x, y, w, h);
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
        let [cl, ct, cw, ch] = grid_toCellRect(this.cellSize, itemRect.x, itemRect.y, itemRect.w, itemRect.h);
        for (let cy = ct; cy < ct + ch; cy++)
            for (let cx = cl; cx < cl + cw; cx++)
                this.removeItemFromCell(itemID, cx, cy);
    }
    // public
    update(itemID, x2, y2, w2, h2) {
        let itemRect = this._getRect(itemID);
        w2 = isNaN(w2) ? itemRect.w : w2;
        h2 = isNaN(h2) ? itemRect.h : h2;
        assertIsRect(x2, y2, w2, h2);
        if (itemRect.x != x2 ||
            itemRect.y != y2 ||
            itemRect.w != w2 ||
            itemRect.h != h2) {
            const [cl1, ct1, cw1, ch1] = grid_toCellRect(this.cellSize, itemRect.x, itemRect.y, itemRect.w, itemRect.h);
            const [cl2, ct2, cw2, ch2] = grid_toCellRect(this.cellSize, x2, y2, w2, h2);
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
}
// Public library functions
const bump = {
    newWorld: function (cellSize) {
        cellSize = cellSize || 64;
        assertIsPositiveNumber(cellSize, 'cellSize');
        const world = new World({
            cellSize: cellSize,
            rects: {},
            rows: [],
            nonEmptyCells: {},
            responses: {},
        });
        world.addResponse('touch', touch);
        world.addResponse('cross', cross);
        world.addResponse('slide', slide);
        world.addResponse('bounce', bounce);
        return world;
    },
    rect: {
        getNearestCorner: rect_getNearestCorner,
        getSegmentIntersectionIndices: rect_getSegmentIntersectionIndices,
        getDiff: rect_getDiff,
        containsPoint: rect_containsPoint,
        isIntersecting: rect_isIntersecting,
        getSquareDistance: rect_getSquareDistance,
        detectCollision: rect_detectCollision,
    },
    responses: {
        touch,
        cross,
        slide,
        bounce,
    },
};
export default Object.freeze(bump);
//# sourceMappingURL=index.js.map