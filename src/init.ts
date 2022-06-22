import kaboom from "kaboom"
import bumpKaboom from "./barea.js"

const windowWidth = document.documentElement.clientWidth
const windowHeight = document.documentElement.clientHeight
const gameWidth = 800
const gameHeight = 800
const scaleX = windowWidth / gameWidth
const scaleY = windowHeight / gameHeight 
const scaleGame = Math.min(scaleX, scaleY)


export const k = kaboom({
    background: [50, 50, 50],
    width: gameWidth,
    height: gameHeight,
    scale: scaleGame,
    plugins: [bumpKaboom]
  });
  
export default k
