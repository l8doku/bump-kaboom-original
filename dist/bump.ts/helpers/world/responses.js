export function touch(_world, column, _x, _y, _w, _h, _goalX, _goalY, _filter) {
    return { x: column.touch.x, y: column.touch.y, collisions: [] };
}
export function cross(world, column, x, y, w, h, goalX, goalY, filter) {
    const collisions = world.project(column.item, x, y, w, h, goalX, goalY, filter);
    return { x: goalX, y: goalY, collisions };
}
export function slide(world, column, x, y, w, h, goalX, goalY, filter) {
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
export function bounce(world, collision, x, y, w, h, goalX, goalY, filter) {
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
//# sourceMappingURL=responses.js.map