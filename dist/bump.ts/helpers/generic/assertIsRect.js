import assertIsPositiveNumber from './assertIsPositiveNumber';
import assertType from './assertType';
export default function assertIsRect(x, y, w, h) {
    assertType('number', x, 'x');
    assertType('number', y, 'y');
    assertIsPositiveNumber(w, 'w');
    assertIsPositiveNumber(h, 'h');
}
//# sourceMappingURL=assertIsRect.js.map