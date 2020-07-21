let confetti = [];
let slide = 0;

const refresh = () => {
  context.canvas.width  = window.innerWidth;
  context.canvas.height = window.innerHeight;

  if (slide <= 1) confettiAnimation();
  if (slide >= 2 && slide <= 11) iLikeYou();
  if (slide >= 12) confettiAnimation();
};

const confettiAnimation = () => {
  confetti.forEach((c) => {
    if (c.y > context.canvas.height) {
      i = confetti.indexOf(c);
      if (i !== -1) {
        confetti.splice(i, 1);
        makeCircle(-1);
      }
    }

    context.beginPath();
    context.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
    context.fillStyle = c.color;
    context.fill();
    c.fall();
  });


  if (slide <= 1) {
    text("Happy Birthday Josh!", 80, "Zapfino", 0);
    text("Press the right arrow key to continue.", 15, "Verdana", 50);
    if (slide == 1) {
      text("But first take a minute to appreciate the confetti because it took a while to make.", 15, "Verdana", 130);
    }
  }
  else {
    text("Love, Rebecca", 80, "Zapfino", 0);
  }
}

const iLikeYou = () => {
  switch(slide) {
    case 2: text("I like you a lot (obviously).", 30, "Verdana", 0); break;
    case 3: text("So I thought I would share some things about you that I like.", 30, "Verdana", 0); break;

    case 4: text("thing", 30, "Verdana", 0); break;
    case 5: text("another thing", 30, "Verdana", 0); break;
    case 6: text("yet another thing", 30, "Verdana", 0); break;
    case 7: text("so many things", 30, "Verdana", 0); break;
    case 8: text("this is another one", 30, "Verdana", 0); break;
    case 9: text("ok we get the point", 30, "Verdana", 0); break;
    case 10: 
      text("and finally, this is the last thing", 30, "Verdana", 0); 
      break;
    case 11: text("Enjoy being 17, my dude.", 30, "Verdana", 0); break;
  }
}

const getRandomNum = (upTo) => upTo * Math.random();
const getRandomColor = () => '#' + Math.floor((1<<24) * Math.random()).toString(16);

const makeCircle = (y) => {
  confetti.push(new Circle(getRandomNum(context.canvas.width),
                            y,
                            getRandomNum(6),
                            getRandomColor(),
                            getRandomNum(1) + 3,
                            getRandomNum(.5) - .25
  ))};


const text = (words, size, font, yOffset) => {
  context.fillStyle = "#ffffff";
  context.textAlign = "center";
  context.font = size + "px " + font;
  context.fillText(words, 
                    context.canvas.width/2, 
                    context.canvas.height/2 + yOffset);
}

document.onkeydown = (e) => {
  if (e.keyCode === 37 && slide > 0) slide--;
  else if (e.keyCode === 39 && slide < 12) slide++;
};

window.onload = () => {
  canvas = $('#canvas')[0];
  context = canvas.getContext('2d');

  context.canvas.width  = window.innerWidth;
  context.canvas.height = window.innerHeight;

  for (let i = 0; i < 300; i++) {
    makeCircle(getRandomNum(context.canvas.height));
  }

  const fps = 30;
  refresh();
  refreshIntervalId = setInterval(refresh, 1000 / fps);
};