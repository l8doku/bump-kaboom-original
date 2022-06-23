import Bump from './bump.ts/index';
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
export default (k) => {
    // only one global collision world now 
    const world = Bump.newWorld(50);
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
};
//# sourceMappingURL=bump-kaboom.js.map