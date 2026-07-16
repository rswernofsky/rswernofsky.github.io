// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_DURATION_MS = 1600;
const DURATION_JITTER_RANGE = [0.75, 1.35];
// 3 is twice as likely to be picked as 4.
const NUM_CIRCLES_OPTIONS = [3, 3, 4];

const NUM_ARCS = 7;
const ARC_OFFSCREEN_MARGIN = 80;
// Small stagger so initial slugs don't all start moving in perfect unison.
const INITIAL_START_DELAY_MAX_MS = 6000;

const HEAD_TAIL_RADIUS_MULT = 1.5;
const BODY_RADIUS_MULT = 2;
const DOT_RADIUS_MULT = 0.35;
const STROKE_WEIGHT = 6;

const ANTENNA_LENGTH_MULT = 0.55;
const ANTENNA_SPREAD_MULT = 0.45;

// Must have at least NUM_ARCS entries so every slug gets a unique color.
const PASTEL_PALETTE = [
  [255, 179, 198], // pink
  [186, 225, 255], // sky blue
  [255, 223, 186], // peach
  [200, 255, 214], // mint
  [223, 186, 255], // lavender
  [255, 244, 179], // butter
  [186, 255, 241], // aqua
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let unitSize;
let arcs = [];
let slugs = [];

// ---------------------------------------------------------------------------
// Cross-page persistence
// ---------------------------------------------------------------------------

// Slugs keep crawling across page navigations within the same tab: state is
// saved to sessionStorage on the way out and resumed (at the elapsed
// animation position, not restarted) on the next page's setup().
const SLUG_STORAGE_KEY = "slugCrawlState";

function saveSlugState() {
  const now = millis();
  const state = {
    width,
    height,
    slugs: slugs.map((slug, i) => ({
      index: i,
      arc: {
        origin: { x: slug.arc.origin.x, y: slug.arc.origin.y },
        radius: slug.arc.radius,
        startAngle: slug.arc.startAngle,
        endAngle: slug.arc.endAngle,
      },
      thetaStep: slug.thetaStep,
      initialThetas: slug.initialThetas,
      duration: slug.duration,
      elapsed: max(
        0,
        now - slug.spawnTime - slug.startDelay + slug.phaseOffset,
      ),
    })),
  };
  try {
    sessionStorage.setItem(SLUG_STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    // Storage unavailable (e.g. private browsing) — just skip persistence.
  }
}

// Rebuilds slugs/arcs from saved state, resuming each slug's animation at
// the point it left off rather than jumping back to spawn.
function restoreSlugState() {
  let state;
  try {
    const raw = sessionStorage.getItem(SLUG_STORAGE_KEY);
    if (!raw) return null;
    state = JSON.parse(raw);
  } catch (e) {
    return null;
  }
  if (!state || !Array.isArray(state.slugs) || state.slugs.length === 0) {
    return null;
  }

  const scaleX = width / state.width;
  const scaleY = height / state.height;
  const scale = (scaleX + scaleY) / 2;
  const now = millis();

  const restoredArcs = [];
  const restoredSlugs = [];
  for (const s of state.slugs) {
    const arc = {
      origin: createVector(s.arc.origin.x * scaleX, s.arc.origin.y * scaleY),
      radius: s.arc.radius * scale,
      startAngle: s.arc.startAngle,
      endAngle: s.arc.endAngle,
    };
    const [red, green, blue] = PASTEL_PALETTE[s.index % PASTEL_PALETTE.length];
    const bodyColor = color(red, green, blue);
    const dotColor = lerpColor(bodyColor, color(255), 0.4);

    restoredArcs.push(arc);
    restoredSlugs.push({
      arc,
      thetaStep: s.thetaStep,
      initialThetas: s.initialThetas,
      duration: s.duration,
      bodyColor,
      dotColor,
      spawnTime: now - s.elapsed,
      startDelay: 0,
      phaseOffset: 0,
    });
  }
  return { arcs: restoredArcs, slugs: restoredSlugs };
}

// ---------------------------------------------------------------------------
// Lifecycle
// ---------------------------------------------------------------------------

function setup() {
  createCanvas(windowWidth, windowHeight);
  computeLayout();

  const restored = restoreSlugState();
  if (restored) {
    arcs = restored.arcs;
    slugs = restored.slugs;
  } else {
    spawnAllSlugs();
  }

  window.addEventListener("pagehide", saveSlugState);
  window.addEventListener("beforeunload", saveSlugState);
}

function draw() {
  background(255);

  const now = millis();
  for (let i = 0; i < slugs.length; i++) {
    const thetas = circleThetasAt(slugs[i], now);
    if (thetas.every((theta) => theta > slugs[i].arc.endAngle)) {
      arcs[i] = generateArc(arcs.filter((_, j) => j !== i));
      slugs[i] = makeSlug(arcs[i], i, false);
    }
    drawSlug(slugs[i], now);
  }
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  computeLayout();
  spawnAllSlugs();
}

function computeLayout() {
  unitSize = min(width, height) * 0.04;
}

// randomizePhase false pins a slug to the very start of its cycle, so a
// respawned slug enters from offscreen instead of jumping ahead.
function spawnAllSlugs(randomizePhase = true) {
  arcs = generateArcs(NUM_ARCS);
  slugs = arcs.map((arc, index) => makeSlug(arc, index, randomizePhase));
}

// ---------------------------------------------------------------------------
// Arc geometry
// ---------------------------------------------------------------------------

function generateArcs(count) {
  const result = [];
  for (let i = 0; i < count; i++) {
    result.push(generateArc(result));
  }
  return result;
}

// Rejection-samples against otherArcs' visible midpoints so paths spread out
// across the screen instead of clustering/crossing on top of each other.
function generateArc(otherArcs = []) {
  const minSeparation = min(width, height) * 0.25;
  let best = null;
  let bestScore = -Infinity;

  for (let attempt = 0; attempt < 15; attempt++) {
    const candidate = buildArc();
    if (otherArcs.length === 0) return candidate;

    const apex = pointOnArc(
      candidate,
      (candidate.startAngle + candidate.endAngle) / 2,
    );
    const score = Math.min(
      ...otherArcs.map((other) =>
        apex.dist(pointOnArc(other, (other.startAngle + other.endAngle) / 2)),
      ),
    );

    if (score >= minSeparation) return candidate;
    if (score > bestScore) {
      bestScore = score;
      best = candidate;
    }
  }
  return best;
}

function buildArc() {
  const { a, b } = pickArcChord();
  const mid = p5.Vector.lerp(a, b, 0.5);
  const { radius, centerCandidates } = circleThroughChord(a, b);
  const origin = chooseVisibleCenter(centerCandidates, radius, mid);
  const { startAngle, endAngle } = arcAngleRange(origin, a, b, mid);

  return { origin, radius, startAngle, endAngle };
}

function pickArcChord() {
  const minSpan = min(width, height) * 0.5;
  let a, b;
  for (let attempt = 0; attempt < 20; attempt++) {
    a = randomOffscreenPoint(ARC_OFFSCREEN_MARGIN);
    b = randomOffscreenPoint(ARC_OFFSCREEN_MARGIN);
    if (a.dist(b) >= minSpan) break;
  }
  return { a, b };
}

function randomOffscreenPoint(margin) {
  const side = floor(random(4));
  const off = random(10, margin);
  if (side === 0) return createVector(random(-margin, width + margin), -off);
  if (side === 1)
    return createVector(width + off, random(-margin, height + margin));
  if (side === 2)
    return createVector(random(-margin, width + margin), height + off);
  return createVector(-off, random(-margin, height + margin));
}

// Two circles pass through any chord; this returns both candidate centers.
function circleThroughChord(a, b) {
  const d = a.dist(b);
  const radius = (d / 2) * random(1.05, 2);
  const mid = p5.Vector.lerp(a, b, 0.5);
  const dir = p5.Vector.sub(b, a).normalize();
  const perp = createVector(-dir.y, dir.x);
  const h = sqrt(max(radius * radius - (d / 2) * (d / 2), 0));

  const centerCandidates = [
    p5.Vector.add(mid, p5.Vector.mult(perp, h)),
    p5.Vector.sub(mid, p5.Vector.mult(perp, h)),
  ];
  return { radius, centerCandidates };
}

function chooseVisibleCenter(centerCandidates, radius, mid) {
  const screenCenter = createVector(width / 2, height / 2);

  let origin = centerCandidates[0];
  let bestDist = Infinity;
  for (const c of centerCandidates) {
    const angleToMid = atan2(mid.y - c.y, mid.x - c.x);
    const arcPeak = createVector(
      c.x + radius * cos(angleToMid),
      c.y + radius * sin(angleToMid),
    );
    const distToScreenCenter = arcPeak.dist(screenCenter);
    if (distToScreenCenter < bestDist) {
      bestDist = distToScreenCenter;
      origin = c;
    }
  }
  return origin;
}

function arcAngleRange(origin, a, b, mid) {
  const angleA = atan2(a.y - origin.y, a.x - origin.x);
  const angleB = atan2(b.y - origin.y, b.x - origin.x);
  const angleMid = atan2(mid.y - origin.y, mid.x - origin.x);

  if (isAngleBetween(angleA, angleMid, angleB)) {
    return {
      startAngle: angleA,
      endAngle: angleB < angleA ? angleB + TWO_PI : angleB,
    };
  }
  return {
    startAngle: angleB,
    endAngle: angleA < angleB ? angleA + TWO_PI : angleA,
  };
}

function normalizeAngle(a) {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}

function isAngleBetween(a, m, b) {
  a = normalizeAngle(a);
  m = normalizeAngle(m);
  b = normalizeAngle(b);
  return a <= b ? m >= a && m <= b : m >= a || m <= b;
}

function pointOnArc(arc, theta) {
  return createVector(
    arc.origin.x + arc.radius * cos(theta),
    arc.origin.y + arc.radius * sin(theta),
  );
}

// ---------------------------------------------------------------------------
// Slug model
// ---------------------------------------------------------------------------

function makeSlug(arc, index, randomizePhase) {
  const numCircles = random(NUM_CIRCLES_OPTIONS);
  const duration =
    BASE_DURATION_MS *
    random(DURATION_JITTER_RANGE[0], DURATION_JITTER_RANGE[1]);

  const thetaStep = (1.05 * unitSize) / arc.radius;
  const initialSpacing = (2.3 * unitSize) / arc.radius;
  // Extra pullback so the head circle clears the screen entirely at spawn,
  // instead of just poking onto it.
  const spawnPullback = (2 * unitSize) / arc.radius;
  const thetaBase = arc.startAngle - spawnPullback;
  const initialThetas = [];
  for (let i = 0; i < numCircles; i++) {
    initialThetas.push(thetaBase - i * initialSpacing);
  }

  const [red, green, blue] = PASTEL_PALETTE[index % PASTEL_PALETTE.length];
  const bodyColor = color(red, green, blue);
  const dotColor = lerpColor(bodyColor, color(255), 0.4);

  const cycleLength = numCircles * duration;
  // Anchoring elapsed time to spawnTime, rather than using millis() raw,
  // keeps a respawned slug's cycle starting at zero instead of jumping
  // ahead by however many cycles had elapsed since page load.
  const spawnTime = millis();
  const phaseOffset = randomizePhase ? random(0, cycleLength) : 0;
  const startDelay = randomizePhase ? random(0, INITIAL_START_DELAY_MAX_MS) : 0;

  return {
    arc,
    thetaStep,
    initialThetas,
    duration,
    bodyColor,
    dotColor,
    spawnTime,
    startDelay,
    phaseOffset,
  };
}

// Each circle takes its turn advancing one thetaStep forward at constant
// speed over the slug's duration, then the next circle in the chain
// immediately starts its own turn.
function circleThetasAt(slug, now) {
  const duration = slug.duration;
  const cycleLength = slug.initialThetas.length * duration;
  const elapsed = max(
    0,
    now - slug.spawnTime - slug.startDelay + slug.phaseOffset,
  );
  const cycleIndex = Math.floor(elapsed / cycleLength);
  const t = elapsed % cycleLength;
  const activeIndex = Math.floor(t / duration);
  const localT = constrain((t % duration) / duration, 0, 1);

  return slug.initialThetas.map((theta0, i) => {
    let turnsCompleted;
    if (activeIndex > i) turnsCompleted = cycleIndex + 1;
    else if (activeIndex === i) turnsCompleted = cycleIndex + localT;
    else turnsCompleted = cycleIndex;
    return theta0 + turnsCompleted * slug.thetaStep;
  });
}

function segmentRadius(index, count) {
  const isEndSegment = index === 0 || index === count - 1;
  return unitSize * (isEndSegment ? HEAD_TAIL_RADIUS_MULT : BODY_RADIUS_MULT);
}

// ---------------------------------------------------------------------------
// Rendering
// ---------------------------------------------------------------------------

function computeSlugGeometry(slug, now) {
  const thetas = circleThetasAt(slug, now);
  const circles = thetas.map((theta) => pointOnArc(slug.arc, theta));

  const segments = circles.map((circ, i) => {
    // Tangent to the path at this circle, in the direction of travel, used
    // instead of fixed screen axes so the body outline stays aligned with
    // the slug however it's oriented.
    const forward = createVector(-sin(thetas[i]), cos(thetas[i]));
    const normal = createVector(-forward.y, forward.x);
    const rad = segmentRadius(i, circles.length);
    return { circ, forward, normal, rad };
  });

  const topPoints = [];
  const bottomPoints = [];
  const head = segments[0];
  const tail = segments[segments.length - 1];

  topPoints.push(
    p5.Vector.add(head.circ, p5.Vector.mult(head.forward, head.rad / 2)),
  );
  for (const { circ, normal, rad } of segments) {
    bottomPoints.push(p5.Vector.sub(circ, p5.Vector.mult(normal, rad / 2)));
    topPoints.push(p5.Vector.add(circ, p5.Vector.mult(normal, rad / 2)));
  }
  topPoints.push(
    p5.Vector.sub(tail.circ, p5.Vector.mult(tail.forward, tail.rad)),
  );

  return { segments, topPoints, bottomPoints, head };
}

function drawSlug(slug, now) {
  const geometry = computeSlugGeometry(slug, now);
  renderSlugSegments(slug, geometry);
  renderSlugOutline(slug, geometry);
  drawAntennae(slug, geometry.head);
}

function renderSlugSegments(slug, { segments }) {
  for (const { circ, rad } of segments) {
    noFill();
    stroke(slug.bodyColor);
    strokeWeight(STROKE_WEIGHT);
    circle(circ.x, circ.y, rad);
    noStroke();
    fill(slug.dotColor);
    circle(circ.x, circ.y, unitSize * DOT_RADIUS_MULT);
  }
}

function renderSlugOutline(slug, { topPoints, bottomPoints }) {
  noFill();
  stroke(slug.bodyColor);
  beginShape();

  for (const p of topPoints) splineVertex(p.x, p.y);
  for (let i = bottomPoints.length - 1; i >= 0; i--) {
    splineVertex(bottomPoints[i].x, bottomPoints[i].y);
  }

  endShape(CLOSE);
}

function drawAntennae(slug, head) {
  const headRad = head.rad / 2;
  const length = unitSize * ANTENNA_LENGTH_MULT;
  const spread = unitSize * ANTENNA_SPREAD_MULT;
  const sides = [-1, 1];

  for (const side of sides) {
    const dir = p5.Vector.add(
      head.forward,
      p5.Vector.mult(head.normal, side),
    ).normalize();
    const base = p5.Vector.add(head.circ, p5.Vector.mult(dir, headRad));
    const tip = p5.Vector.add(
      base,
      p5.Vector.add(
        p5.Vector.mult(head.forward, length),
        p5.Vector.mult(head.normal, spread * side * 0.4),
      ),
    );

    noFill();
    stroke(slug.bodyColor);
    strokeWeight(STROKE_WEIGHT);
    line(base.x, base.y, tip.x, tip.y);
  }
}
