
  function goHome() {
    window.location.href = "./"; 
  }

  function goPrevious() {
    window.location.href = "collection.html"
  }

const BGCOLOR = [24, 195, 50];
const TGSTRING = "where did you find your chair ";

const CTHRESHOLD = 750;

let allGrassProfile = [];
let gCOLOR;
let fCOLORS;
let touchMode = false;
let field;

function setup() {
  gCOLOR = color(255, 255, 255);
  fCOLORS = {
     t: color(119, 239, 255),
  o: color(255, 187, 194),
  u: color(255, 153, 0),
  c: color(242, 18, 0),
  h: color(221, 255, 123),
  g: color(255, 255, 255),
  r: color(255, 229, 0),
  a: color(138, 97, 255),
  w: color(255, 100, 200), 
  e: color(255, 240, 150), 
  d: color(200, 255, 200), 
  i: color(200, 200, 255), 
  y: color(255, 200, 180), 
  f: color(180, 255, 200), 
  n: color(150, 255, 250)
  };
  
  createCanvas(windowWidth, windowHeight);
  clear();
  frameRate(60);

  field = select('#field');
  plantGrass();
  document.fonts.ready.then(() => {
    rebuildGrass();
    wakeSketch();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) noLoop();
    else wakeSketch();
  });
  
  describe('Background of pattern created by repeating the phrase "touch grass". Hovering over the letters makes them morph into flowers.');
}

function draw() {
  if (document.hidden || document.body.classList.contains('chairs-map-open') || document.body.classList.contains('chairs-page-info-open')) {
    noLoop();
    return;
  }
  if (!touchMode && touches.length > 0) {
    touchMode = true;
  }
  let changing = false;
  for (let grassProfile of allGrassProfile) {
    if (grassProfile.showGrowth()) changing = true;
  }
  if (!changing) noLoop();
}

function plantGrass() {
  let grass;
  while (!grass || grass.elt.getBoundingClientRect().top < window.innerHeight) {
    for (let curGrassType of TGSTRING) {
      grass = createSpan(curGrassType + '&#8203');
      grass.parent(field);
      allGrassProfile.push(new GrassProfile(grass, curGrassType));
    }
  }
  updateGrassPos();
}

function rebuildGrass() {
  field.html('');
  allGrassProfile = [];
  plantGrass();
}

function wakeSketch() {
  if (!document.hidden && !document.body.classList.contains('chairs-map-open') && !document.body.classList.contains('chairs-page-info-open')) loop();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  clear();
  rebuildGrass();
  wakeSketch();
}

function mouseMoved() {
  wakeSketch();
}

function mouseDragged() {
  wakeSketch();
}

function mousePressed() {
  wakeSketch();
}

function mouseReleased() {
  wakeSketch();
}

function touchStarted() {
  wakeSketch();
}

function touchMoved() {
  wakeSketch();
}

function touchEnded() {
  wakeSketch();
}

class GrassProfile {
  constructor(grass, grassType) {
    this.grass = grass;
    this.grassType = grassType;
    this.growth = 1;
    this.renderedGrowth = null;
    this.position = { x: 0, y: 0 };
  }
  
  showGrowth() {
    if(this.grassType == ' ') return false;
    const previousGrowth = this.growth;
    if(touchMode) this.checkGrowthTM();
    else this.checkGrowth();
    if (this.renderedGrowth !== this.growth) {
      this.grass.style('font-weight', this.growth);
      this.grass.style('color', this.getColor());
      this.renderedGrowth = this.growth;
    }
    return this.growth !== previousGrowth;
  }
  
  checkGrowth() {
    this.growth = Math.max(this.growth*0.9, 1);
    this.distToMouse = dist(mouseX, mouseY, this.position.x, this.position.y);
    if (this.distToMouse < 300) {
      this.growth = Math.min(this.growth+2500/(this.distToMouse+2), 1000);
    }
    if (mouseIsPressed && this.distToMouse < 350) {
      this.growth = Math.min(this.growth+(350-this.distToMouse), 1000);
    }
    this.growth = Math.round(this.growth);
  }
  
  checkGrowthTM() {
    this.growth = Math.max(this.growth*0.95, 1);
    let distToTouch;
    for (let touch of touches) {
      distToTouch = dist(touch.x, touch.y, this.position.x, this.position.y);
      if (distToTouch < 175) {
      this.growth = Math.min(this.growth+(175-distToTouch), 1000);
      }
    }
    this.growth = Math.round(this.growth);
  }
  
  getPosition() {
    const rect = this.grass.elt.getBoundingClientRect();
    return {
      x: (rect.left + rect.right) / 2,
      y: (rect.top + rect.bottom) / 2
    };
  }
  
  getColor() {
    let color = gCOLOR;
    if(this.growth > CTHRESHOLD) {
      let amt = (this.growth - CTHRESHOLD)/(1000 - CTHRESHOLD);
      color = lerpColor(gCOLOR, fCOLORS[this.grassType], amt);
    }
    return color;
  }
}

function updateGrassPos() {
    for (let grassProfile of allGrassProfile) {
      grassProfile.position = grassProfile.getPosition();
    }
}
