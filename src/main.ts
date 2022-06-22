// import Bump from '../bump.ts/src/index'
import k from "./init.js"
import { cron } from "./cronTimer.js"
import { Clock } from "./cronTimer.js"
import { GameObj, Vec2 } from 'kaboom'
import { BumpCollision } from "./barea.js"


k.loadSprite("mage", "/sprites/mage.png")

const kinetic = (velocity: any) :any => {
  return {
  id: "kinetic",
  require: ["pos"],
  velocity: velocity,

  update() {
    this.bmove(this.velocity.x, this.velocity.y)
  },
  }
}
const BLOCK_SIZE = 40
const MOVE_UP_KEY = "w"
const MOVE_LEFT_KEY = "a"
const MOVE_RIGHT_KEY = "d"
const MOVE_DOWN_KEY = "s"
const MOVE_UP_KEY2 = "up"
const MOVE_LEFT_KEY2 = "left"
const MOVE_RIGHT_KEY2 = "right"
const MOVE_DOWN_KEY2 = "down"


const levelOptAscii =  {
  width: BLOCK_SIZE,
  height: BLOCK_SIZE,
  pos: k.vec2(0, 0),
  "1": ()=>[
    k.rect(BLOCK_SIZE, BLOCK_SIZE),
    k.color(0, 0, 130),
    k.area(),
    k.barea(),
    "wall",
  ],
}
const levelAscii = [
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


const playerControl = () :any => {

  let shootTimer: Clock
  const rateOfFire = 50
return {

  id: "playerControl",
  require: ["pos"],
  shootPressed: false,


  add() {
      shootTimer = cron.every(1/rateOfFire, ()=>{this.shoot()})

      k.onMousePress("left", () => {
          this.shootPressed = true
      })
      k.onMouseRelease("left", () => {
          this.shootPressed = false
      })
  },

  update() {
    const cdt = k.dt()
    if (shootTimer && this.shootPressed) {
      shootTimer.update(cdt)
    }
  },

  shootSpawn(startPos: Vec2, direction: Vec2) {

    const size = 10
    const speed = 600
    const bulletVelocity = direction.scale(speed)

    const bullet = k.add([
      k.rect(size, size),
      k.pos(startPos),
      k.origin("center"),
      k.color(0, 200, 0),
      k.area(),
      k.barea(),
      "bullet",
      // kinetic(velocity),
      k.lifespan(5),
      {hits: 2},
      {velocity: bulletVelocity}
    ])

    bullet.onUpdate(()=>{
      bullet.bmove(bullet.velocity)
    })

    bullet.addCollisionResponse("wall", (_:any, cls: BumpCollision)=>{
      if (cls.normal.x != 0) {
        bullet.velocity.x = -bullet.velocity.x/2
      }
      if (cls.normal.y != 0) {
        bullet.velocity.y = -bullet.velocity.y/2
      }
      bullet.hits -= 1
      if (bullet.hits == 1) {
        bullet.color = k.YELLOW
      } else if (bullet.hits == 0) {
        bullet.color = k.RED
      }
      
    })

    bullet.addBumpCollision('wall', 'bounce')


  },
  shoot() {
      const worldMousePos = k.toWorld(k.mousePos())
      const aimAngle = worldMousePos.angle(this.pos)
      const shootAngle = aimAngle + rand(-15, 15)
      const bulletVelocityAngle = k.Vec2.fromAngle(shootAngle)
      const randomOffset = k.Vec2.fromAngle(rand(0, 360)).scale(rand(0, 50))
      const bulletSpawnPos = this.pos.add(randomOffset)
      this.shootSpawn(bulletSpawnPos, bulletVelocityAngle)
  },
}
}

const mainscene = () => {

  k.addLevel(levelAscii, levelOptAscii)

  const player = k.add([
    k.sprite("mage"),
    k.pos(k.vec2(400, 400)),
    k.origin("center"),
    k.area(),
    k.barea(),
    playerControl(),
    k.health(10),
    layer("obj2"),
    "player",
    {speed: 300}
  ])


    player.addBumpCollision('wall', 'slide')
  
    k.onKeyDown([MOVE_UP_KEY, MOVE_UP_KEY2], () => {
      player.bmove(0, -player.speed)
    })
  
    k.onKeyDown([MOVE_LEFT_KEY, MOVE_LEFT_KEY2], () => {
      player.bmove(-player.speed, 0)
    })
  
    k.onKeyDown([MOVE_DOWN_KEY, MOVE_DOWN_KEY2], () => {
      player.bmove(0, player.speed)
    })
  
    k.onKeyDown([MOVE_RIGHT_KEY, MOVE_RIGHT_KEY2], () => {
      player.bmove(player.speed, 0)
    })
  
  
  

  const uiMenuText = k.add([
    k.pos(10, 10),
    k.text("Ui menu text", {
      size: 20,
      width: 200
    }),
    k.fixed(),
    k.color(255, 255, 255),
    {
      calls: 0,
      objs: 0,
      fps: 0
    }
  ])


  uiMenuText.onUpdate(() => {
    uiMenuText.calls = k.debug.drawCalls()
    uiMenuText.objs = k.debug.objCount()
    uiMenuText.fps = k.debug.fps()
    let uiText = `Draw calls: ${uiMenuText.calls}\nObjects: ${uiMenuText.objs}\nFPS: ${uiMenuText.fps}\n`
    uiMenuText.text = uiText
  })


};


k.scene("main", mainscene);

k.go("main");




