/*
Game Loop
*/
export const purple = "#993f70";
import { create_show_send_score_button, hide_send_score_button } from "./compat.js";
import { addUIEventListeners, drawUI, clearUI, drawPauseScreen } from "./ui.js";
import { Grid } from "./grid.js";
import { Paddle } from "./paddle.js";
import { Wall, walls } from "./wall.js";
import { Ball, balls } from "./ball.js";

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, addDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
            apiKey: "AIzaSyC4bjg7lVwd8FU8MREaPhBsBENv5qmiYYM",
            authDomain: "calendrier-de-l-avent-54e3a.firebaseapp.com",
            databaseURL: "https://calendrier-de-l-avent-54e3a-default-rtdb.europe-west1.firebasedatabase.app",
            projectId: "calendrier-de-l-avent-54e3a",
            storageBucket: "calendrier-de-l-avent-54e3a.appspot.com",
            messagingSenderId: "850639567855",
            appId: "1:850639567855:web:0d799a1ecca005fcff141a",
            measurementId: "G-PC1W7RYVEH"
        };

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let userId = '';
let highestScore = 0;

onAuthStateChanged(auth, async (user) => {
            if (user) {
                userId = user.uid;
                document.getElementById('userStatus').innerText = `Bienvenue : ${user.email}`;

                const userRef = doc(db, 'users', userId);
                const docSnap = await getDoc(userRef);

                if (!docSnap.exists()) {
                    await setDoc(userRef, { userId: userId, highestScoreGame17: 0, UserEmail: user.email });
                } else {
                    const userData = docSnap.data();
                    highestScore = userData.highestScoreGame17 || 0;
              
                }
            } else {
                window.location.href = 'login.html';
            }
        });

let gamediv = document.getElementById("game");
export const canvas = document.createElement("canvas");
canvas.setAttribute("id", "game-layer");
window.addEventListener("load", () => {
    /* set the size of canvas element after stylesheets are loaded */
    canvas.width = gamediv.offsetWidth;
    canvas.height = gamediv.offsetHeight;
    gamediv.appendChild(canvas);
});
export const ctx = canvas.getContext("2d", { alpha: false });
export const fps_ratio = (ms) => {
    return Math.min(ms / (1000 / 60), 2);
};
export const paddle = new Paddle();
export const grid = new Grid();

export let score = 0;
export let percent = 0;
export let lives = 3;
export let gameOver = false;
export let gamePaused = false;
let then = Date.now();
const show_send_score_button = create_show_send_score_button(score);


// Timer for pausing the ball during countdowns
// and giving invincibility frames after a death
export let timer = {
    active: false,
    ballPause: 0,
    diedRecently: 0,
    dying: 0,
};

function resetWalls() {
    while (walls.length > 0) {
        walls.pop();
    }
}

function resetBall() {
    // remove all balls but the first two, and replace them to center of screen
    while (balls.length > 2) {
        balls.pop();
    }
    timer.ballPause = 180;
    timer.active = true;
    timer.dying = 0;
}

let level = {
    ballCount: 2,
};

export function initGame() {
    /* Create global objects defined in other js files */
    balls[0] = new Ball(0);
    balls[1] = new Ball(1);
    swapDirection();

    /* Add event listeners */
    addUIEventListeners();

    startGame();
}

export function startGame() {
    /* Starts a new game */
    if (hide_send_score_button != undefined) {
        hide_send_score_button();
    }
    balls[0].x = canvas.width / 2 - 48;
    balls[0].y = canvas.height - 96;
    balls[1].x = canvas.width / 2 + 48;
    balls[1].y = canvas.height - 96;
    balls[0].dy = -Ball.speed;
    balls[0].dx = -Ball.speed;
    balls[1].dy = Ball.speed;
    balls[1].dx = Ball.speed;
    level.ballCount = 2;
    percent = 0;
    score = 0;
    lives = 3;
    gameOver = false;
    grid.clear();
    resetWalls();
    resetBall();
    /* Start game loop by drawing the first frame */
    draw();
}

/*
 *  MAIN GAME LOOP
 */

function draw() {
    let now = Date.now();
    let delta = now - then;

    /* Clear the game-layer canvas on every frame & abort early if game is paused */
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (gamePaused == true) {
        drawPauseScreen();
        requestAnimationFrame(draw);
        return;
    }

    /* Expand walls, turn them into buildings, & flood_fill the grid if building is created */
    for (let wall of walls.filter((wall) => {
        if (wall.building === null) {
            return wall;
        }
    })) {
        wall.expand(delta);
    }

    /* Move and collide balls & delete expanding walls that intersect balls */
    for (let i_ = 0; i_ < balls.length; i_++) {
        let collision = balls[i_].move(delta);

        // Collision will be -1 if no collision occurred
        if (collision > -1) {
            // Collision is the index of an expanding wall
            if (timer.dying == 0) {
                // Decrease `lives` if not already decreasing from a recent collision
                timer.dying = 30;
                if (lives > 0) {
                    timer.diedRecently = 90;
                }
                lives--;
            }
            Wall.remove(collision);
        }
    }
    /* If the player is dying, tick down the timer that will cause a gameOver soon */
    if (timer.dying > 0) {
        timer.dying--;
        if (timer.dying == 0) {
            if (lives < 0) {
                saveScore(score)
                show_send_score_button();
                gameOver = true;
            }
        }
    }

    drawUI();
    if (gameOver) return
    for (let i = 0; i < walls.length; i++) {
        walls[i].draw();
    }
    for (let i = 0; i < balls.length; i++) {
        balls[i].draw();
    }
    paddle.draw();
    requestAnimationFrame(draw);
    then = Date.now();
}

export function swapDirection() {
    if (paddle.direction == 0) {
        paddle.direction = 1;
    } else {
        paddle.direction = 0;
    }
}

export function pauseGame() {
    if (gamePaused == true) {
        gamePaused = false;
        clearUI();
        drawUI(true);
    } else {
        gamePaused = true;
    }
}

export function updateScore() {
    percent = Math.round(grid.percentFilled());
    if (percent > 75) {
        nextLevel();
    }
}

function nextLevel() {
    score += (level.ballCount*2);
    percent = 0;
    level.ballCount += 1;
    resetBall();
    resetWalls();
    grid.clear();
    for (let i = 2; i < level.ballCount; i++) {
        balls[balls.length] = new Ball(balls.length);
        balls[balls.length - 1].x =
            canvas.width * (Math.min(0.8, Math.random()) + 0.1);
        balls[balls.length - 1].y =
            canvas.height * (Math.min(0.8, Math.random()) + 0.1);
        if (Math.random() > 0.5) {
            balls[balls.length - 1].dx = -Ball.speed;
        } else {
            balls[balls.length - 1].dx = Ball.speed;
        }
        if (Math.random() > 0.5) {
            balls[balls.length - 1].dy = -Ball.speed;
        } else {
            balls[balls.length - 1].dy = Ball.speed;
        }
    }
}

async function saveScore(score) {
            try {
                const gameData = { score: score, timestamp: new Date() };
                await addDoc(collection(db, 'users', userId, 'Game17'), gameData);

                const userRef = doc(db, 'users', userId);
                if ( score > (highestScore*100)) {
                    highestScore = score;
                    await updateDoc(userRef, { highestScoreGame17: highestScore });
                }
            } catch (error) {
                console.error("Error saving score:", error);
            }
        }
