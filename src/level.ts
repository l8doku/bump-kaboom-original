import k from "./init.js"


const BLOCK_SIZE = 40
const mapgen = [
  "11111111111111111111",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "1..................1",
  "11111111111111111111",
]


const addWallToLevel = () => {
  return [
    k.rect(BLOCK_SIZE, BLOCK_SIZE),
    k.color(0, 0, 130),
    k.area(),
    k.barea(),
    "wall",
  ]

}

export const levelOptAscii =  {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    pos: k.vec2(0, 0),
    "1": addWallToLevel,
}

// Add 
export const addCustomLevel = () => {

  const level = k.addLevel(mapgen, levelOptAscii)

  return {level}
}
