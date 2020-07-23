var slideIndex = 0;
const confettiSlides = [0, 45];
const greySlides = [1, 19, 31, 44];
const justTextSlides = [2, 15, 17, 18];
const quoteSlides = [32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43];
let confetti = [];

// Next/previous controls
const plusSlides = (n) => {
    displaySlide(slideIndex += n);
}

const displaySlide = (n) => {
    var i;
    var slides = document.getElementsByClassName("slide");
    if (n >= slides.length) {
        slideIndex = slides.length - 1
    }
    if (n < 0) {
        slideIndex = 0
    }
    for (i = 0; i < slides.length; i++) {
        slides[i].style.display = "none";
    }



    slides[slideIndex].style.display = "flex";
    slides[slideIndex].style.alignItems = "center";
        // slides[slideIndex].style.flexFlow = "row";

    const confetti = document.getElementById("canvas");
    if (confettiSlides.includes(slideIndex)) {
        confetti.style.display = "block";
        slides[slideIndex].style.color = "white";
        slides[slideIndex].style.display = "block";
    } else {
        confetti.style.display = "none";
        slides[slideIndex].style.color = "black";
        // clearInterval(refreshIntervalId); // stop refreshing
    }

    if (greySlides.includes(slideIndex)) {
        document.body.style.backgroundColor = "#333333";
        slides[slideIndex].style.color = "white";
        slides[slideIndex].style.display = "block";
    } else {
        document.body.style.backgroundColor = "white";
    }

    if (quoteSlides.includes(slideIndex)) {
        slides[slideIndex].style.display = "block";
        document.body.style.backgroundColor = "#fcfcfc";
    }

    if (justTextSlides.includes(slideIndex)) {
        slides[slideIndex].style.display = "block";
    } 
}

const confettiAnimation = () => {
    context.canvas.width = window.innerWidth;
    context.canvas.height = window.innerHeight;

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
}

const colors = ["#defde0", "#fddfdf", "#f0defd", "#def3fd", "#fcf7de"];
const changeBackgroundColor = (index) => {
    document.body.style.backgroundColor = colors[index % colors.length];
} 

const getRandomNum = (upTo) => upTo * Math.random();
const getRandomColor = () => '#' + Math.floor((1 << 24) * Math.random()).toString(16);

const makeCircle = (y) => {
    confetti.push(new Circle(getRandomNum(context.canvas.width),
        y,
        getRandomNum(6),
        getRandomColor(),
        getRandomNum(1) + 3,
        getRandomNum(.5) - .25
    ))
};

document.onkeydown = (e) => {
    const keyCode = e.keyCode;
    if (keyCode == 37) { // left
        plusSlides(-1);
    } else if (keyCode == 39) { // right
        plusSlides(1);
    }
};

window.onload = () => {
    canvas = $('#canvas')[0];
    context = canvas.getContext('2d');

    // confetti goes the whole time (but it's hidden sometimes)
    const fps = 30;
    confettiAnimation();
    refreshIntervalId = setInterval(confettiAnimation, 1000 / fps);

    displaySlide(slideIndex = 0);

    for (let i = 0; i < 300; i++) {
        makeCircle(getRandomNum(context.canvas.height));
    }
}