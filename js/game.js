if (!DEBUG_MODE) 
{
    document.getElementById("controlsPanel").style.display = "none";
}

const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let player = { x: 50, y: 130, width: objSize, height: objSize, velocityY: 0 };
let activeObstacles = [];
let isSpacePressed = false;
let isGrounded = true;

let playerSprite = new AnimatedSprite([golferFrame1, golferFrame2], pixelScale);
let cloudSprite = new AnimatedSprite([cloudFrame], pixelScale);

let clouds = [
    { x: 100, y: 20, speed: 0.5 },
    { x: 350, y: 50, speed: 0.8 },
    { x: 650, y: 30, speed: 0.4 }
];

let grassTufts = [
    { x: 120, y: 175, w: 6 },
    { x: 300, y: 182, w: 10 },
    { x: 520, y: 178, w: 8 },
    { x: 740, y: 185, w: 5 }
];

function resetGame() 
{
    currentState = GAME_STATE.PLAYING;
    baseSpeed = initialBaseSpeed;

    if (DEBUG_MODE) 
    {
        document.getElementById("sliderBaseSpeed").value = initialBaseSpeed.toFixed(1);
        document.getElementById("valBaseSpeed").textContent = initialBaseSpeed.toFixed(1);
    }

    score = 0;
    stamina = maxStamina;
    health = maxHealth;
    invulnerabilityTimer = 0;
    player.y = 130;
    player.velocityY = 0;
    activeObstacles = [];
    activeObstacles.push(createObstacle(800));
}

// Slider Event Listener (Labor)
document.getElementById("sliderInitialJump").addEventListener("input", (e) => {
    initialJumpPower = parseFloat(e.target.value);
    document.getElementById("valInitialJump").textContent = initialJumpPower.toFixed(1);
});
document.getElementById("sliderHoldBoost").addEventListener("input", (e) => {
    holdBoostPower = parseFloat(e.target.value);
    document.getElementById("valHoldBoost").textContent = holdBoostPower.toFixed(2);
});
document.getElementById("sliderGravity").addEventListener("input", (e) => {
    gravity = parseFloat(e.target.value);
    document.getElementById("valGravity").textContent = gravity.toFixed(2);
});
document.getElementById("sliderBaseSpeed").addEventListener("input", (e) => {
    initialBaseSpeed = parseFloat(e.target.value);
    baseSpeed = initialBaseSpeed;
    document.getElementById("valBaseSpeed").textContent = initialBaseSpeed.toFixed(1);
});
document.getElementById("sliderStaminaDrain").addEventListener("input", (e) => {
    staminaDrain = parseFloat(e.target.value);
    document.getElementById("valStaminaDrain").textContent = staminaDrain.toFixed(1);
});
document.getElementById("sliderStaminaRegen").addEventListener("input", (e) => {
    staminaRegen = parseFloat(e.target.value);
    document.getElementById("valStaminaRegen").textContent = staminaRegen.toFixed(1);
});
document.getElementById("sliderBaseGap").addEventListener("input", (e) => {
    baseMinGap = parseInt(e.target.value);
    document.getElementById("valBaseGap").textContent = baseMinGap;
});

// Steuerung
document.addEventListener("keydown", (e) => {
    if (e.code === "Space") {
        isSpacePressed = true;

        if (currentState === GAME_STATE.START) {
            resetGame();
            return;
        }

        if (isGrounded && currentState === GAME_STATE.PLAYING && stamina > 10) {
            playJumpSound();
            player.velocityY = initialJumpPower;
            isGrounded = false;
        }
    }

    if (e.code === "KeyP" && currentState !== GAME_STATE.GAMEOVER && currentState !== GAME_STATE.START) {
        if (currentState === GAME_STATE.PLAYING) {
            currentState = GAME_STATE.PAUSED;
        } else {
            currentState = GAME_STATE.PLAYING;
            requestAnimationFrame(gameLoop);
        }
        return;
    }

    if (currentState === GAME_STATE.GAMEOVER && (e.code === "KeyR" || e.code === "Enter")) {
        resetGame();
        requestAnimationFrame(gameLoop);
        return;
    }
});

document.addEventListener("keyup", (e) => {
    if (e.code === "Space") {
        isSpacePressed = false;
    }
});

// Game Loop
function gameLoop() {
    // --- 1. SPLASHSCREEN (START) ---
    if (currentState === GAME_STATE.START) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Hintergrund & Wolken
        for (let i = 0; i < clouds.length; i++) cloudSprite.draw(ctx, clouds[i].x, clouds[i].y);
        ctx.fillStyle = "#2E8B57";
        ctx.fillRect(0, 170, canvas.width, 30);

        // Overlay
        ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = "#ffaa00";
        ctx.font = "bold 28px Arial";
        ctx.fillText("LOCH IHN EIN - Pixel Golf Run", 200, 65);

        ctx.fillStyle = "white";
        ctx.font = "16px Arial";
        ctx.fillText(`Hallo ${currentPlayerName}! Drücke 'LEERTASTE' zum Starten`, 230, 105);

        ctx.font = "12px Arial";
        ctx.fillStyle = "#ddd";
        ctx.fillText("Steuerung: LEERTASTE kurz = Hüpfen | LEERTASTE halten = Segeln (Stamina)", 195, 140);
        ctx.fillText("'P' = Pause", 380, 160);

        requestAnimationFrame(gameLoop);
        return;
    }

    // --- 2. GAME OVER SCREEN ---
    if (currentState === GAME_STATE.GAMEOVER) {
        checkAndSendHighScore(score);

        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("GAME OVER", 280, 70);

        ctx.font = "20px Arial";
        ctx.fillText("Dein Score: " + score + "   |   Highscore: " + highScore, 240, 110);
        ctx.fillText("Drücke 'R' oder 'Enter' für Neustart", 240, 150);
        return;
    }

    // --- 3. PAUSE SCREEN ---
    if (currentState === GAME_STATE.PAUSED) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "40px Arial";
        ctx.fillText("PAUSE", 340, 90);
        ctx.font = "20px Arial";
        ctx.fillText("Drücke 'P' zum Fortsetzen", 280, 130);
        return;
    }

    // --- 4. UPDATE (Spiellogik) ---
    if (!isGrounded && isSpacePressed && stamina > 0) {
        player.velocityY += holdBoostPower;
        stamina -= staminaDrain;
        if (stamina < 0) stamina = 0;
    }

    player.velocityY += gravity;
    player.y += player.velocityY;

    if (player.y >= 130) {
        player.y = 130;
        player.velocityY = 0;
        isGrounded = true;

        if (stamina < maxStamina) {
            stamina += staminaRegen;
            if (stamina > maxStamina) stamina = maxStamina;
        }
    }

    if (invulnerabilityTimer > 0) invulnerabilityTimer--;

    let lastObstacle = activeObstacles[activeObstacles.length - 1];
    let currentMinGap = Math.max(240, baseMinGap - (score * 8));
    let minGap = currentMinGap + Math.random() * 150;

    if (lastObstacle && (canvas.width - lastObstacle.x) >= minGap) {
        activeObstacles.push(createObstacle(canvas.width + 50));
    }

    for (let i = activeObstacles.length - 1; i >= 0; i--) {
        let obs = activeObstacles[i];
        obs.x -= baseSpeed;

        if (obs.flying) obs.y = 85 + Math.sin(obs.x * 0.015) * 35;

        if (obs.x + obs.width < 0) {
            activeObstacles.splice(i, 1);
            score++;
            baseSpeed += speedIncrement;

            if (DEBUG_MODE) {
                document.getElementById("sliderBaseSpeed").value = baseSpeed.toFixed(1);
                document.getElementById("valBaseSpeed").textContent = baseSpeed.toFixed(1);
            }
            continue;
        }

        let hitMargin = 10;
        if (
            invulnerabilityTimer === 0 &&
            player.x < obs.x + obs.width - hitMargin &&
            player.x + player.width - hitMargin > obs.x &&
            player.y < obs.y + obs.height - hitMargin &&
            player.y + player.height - hitMargin > obs.y
        ) {
            health -= obs.damage;
            if (health <= 0) {
                health = 0;
                playGameOverSound();
                currentState = GAME_STATE.GAMEOVER;
            } else {
                playHitSound();
                invulnerabilityTimer = invulnerabilityDuration;
            }
        }

        for (let sprite of obs.sprites) sprite.update();
    }

    // Hintergründe bewegen
    for (let i = 0; i < clouds.length; i++) {
        clouds[i].x -= clouds[i].speed * (baseSpeed / 6);
        if (clouds[i].x + objSize < 0) {
            clouds[i].x = canvas.width + Math.random() * 100;
            clouds[i].y = 10 + Math.random() * 60;
        }
    }

    for (let tuft of grassTufts) {
        tuft.x -= baseSpeed;
        if (tuft.x < 0) tuft.x = canvas.width + Math.random() * 50;
    }

    if (isGrounded) playerSprite.update();
    else playerSprite.currentFrame = 0;

    // --- 5. DRAW (Zeichnen) ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < clouds.length; i++) cloudSprite.draw(ctx, clouds[i].x, clouds[i].y);

    ctx.fillStyle = "#2E8B57";
    ctx.fillRect(0, 170, canvas.width, 30);

    ctx.fillStyle = "#246B43";
    for (let tuft of grassTufts) ctx.fillRect(tuft.x, tuft.y, tuft.w, 3);

    // HUD
    ctx.fillStyle = "black";
    ctx.font = "18px Arial";
    ctx.fillText("Score: " + score + "  |  HI: " + highScore, 200, 30);

    // Health Bar
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText("Health:", 420, 27);
    ctx.fillStyle = "#555";
    ctx.fillRect(470, 15, 100, 14);
    ctx.fillStyle = "#e74c3c";
    ctx.fillRect(470, 15, Math.max(0, (health / maxHealth) * 100), 14);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(470, 15, 100, 14);

    // Stamina Bar
    ctx.fillStyle = "black";
    ctx.font = "14px Arial";
    ctx.fillText("Stamina:", 600, 27);
    ctx.fillStyle = "#555";
    ctx.fillRect(660, 15, 110, 14);

    if (stamina > 50) ctx.fillStyle = "#2ecc71";
    else if (stamina > 20) ctx.fillStyle = "#f1c40f";
    else ctx.fillStyle = "#e74c3c";

    ctx.fillRect(660, 15, (stamina / maxStamina) * 110, 14);
    ctx.strokeStyle = "white";
    ctx.lineWidth = 2;
    ctx.strokeRect(660, 15, 110, 14);

    // Spieler (Blink-Effekt)
    if (invulnerabilityTimer === 0 || Math.floor(invulnerabilityTimer / 6) % 2 === 0) {
        playerSprite.draw(ctx, player.x, player.y);
    }

    for (let obs of activeObstacles) {
        for (let i = 0; i < obs.sprites.length; i++) {
            obs.sprites[i].draw(ctx, obs.x + (i * objSize), obs.y);
        }
    }

    // Copyright-Hinweis
    ctx.fillStyle = "rgba(255, 255, 255, 0.75)";
    ctx.font = "10px sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Developed by Gemini © 2026 LochIhnEin", canvas.width - 10, canvas.height - 8);
    ctx.textAlign = "left";

    requestAnimationFrame(gameLoop);
}

gameLoop();