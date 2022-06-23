import { rect_getSquareDistance } from '../../rect';
export default function sortByTiAndDistance(a, b) {
    if (a.ti === b.ti) {
        const ir = a.itemRect;
        const ar = a.otherRect;
        const br = b.otherRect;
        const ad = rect_getSquareDistance(ir.x, ir.y, ir.w, ir.h, ar.x, ar.y, ar.w, ar.h);
        const bd = rect_getSquareDistance(ir.x, ir.y, ir.w, ir.h, br.x, br.y, br.w, br.h);
        return ad - bd;
    }
    return a.ti - b.ti;
}
//# sourceMappingURL=sortByTiAndDistance.js.map