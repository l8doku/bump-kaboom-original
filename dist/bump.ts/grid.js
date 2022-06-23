export function grid_toWorld(cellSize, cx, cy) {
    return [(cx - 1) * cellSize, (cy - 1) * cellSize];
}
export function grid_toCell(cellSize, x, y) {
    return [Math.floor(x / cellSize) + 1, Math.floor(y / cellSize) + 1];
}
//grid_traverse * functions are based on "A Fast Voxel Traversal Algorithm for Ray Tracing",
//by John Amanides and Andrew Woo - http://www.cse.yorku.ca/~amana/research/grid.pdf
//It has been modified to include both cells when the ray "touches a grid corner",
//and with a different exit condition
export function grid_traverse_initStep(cellSize, ct, t1, t2) {
    const v = t2 - t1;
    if (v > 0)
        return [1, cellSize / v, ((ct + v) * cellSize - t1) / v];
    else if (v < 0)
        return [-1, -cellSize / v, ((ct + v - 1) * cellSize - t1) / v];
    else
        return [0, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER];
}
export function grid_traverse(cellSize, x1, y1, x2, y2, traverseFunction) {
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
export function grid_toCellRect(cellSize, x, y, w, h) {
    let [cx, cy] = grid_toCell(cellSize, x, y);
    const cr = Math.ceil((x + w) / cellSize);
    const cb = Math.ceil((y + h) / cellSize);
    return [cx, cy, cr - cx + 1, cb - cy + 1];
}
//# sourceMappingURL=grid.js.map