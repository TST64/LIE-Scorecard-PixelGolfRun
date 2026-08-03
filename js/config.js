// --- GLOBALE SKALIERUNGSWERTE ---
const pixelScale = 5;
const objSize = 8 * pixelScale;

// --- DEBUGSCHALTER & SPIELZUSTÄNDE ---
const DEBUG_MODE = false; // Setze auf false, um das Balancing-Panel auszublenden

const GAME_STATE = 
{
    START: "START",
    PLAYING: "PLAYING",
    PAUSED: "PAUSED",
    GAMEOVER: "GAMEOVER"
};

let currentState = GAME_STATE.START;

// Spieler-Identifikation (Vorbereitung für Google Sheets / Web App)
const urlParams = new URLSearchParams(window.location.search);
const currentPlayerName = urlParams.get('player') || "Golfer";

// Dynamische Balancing-Parameter
let initialJumpPower = -4.0;
let holdBoostPower = -0.45;
let gravity = 0.30;

let initialBaseSpeed = 4.7;
let baseSpeed = initialBaseSpeed;

let staminaDrain = 2.0;
let staminaRegen = 0.8;
let baseMinGap = 480;

const speedIncrement = 0.1;

// Status-Werte
let stamina = 100;
const maxStamina = 100;

let health = 100;
const maxHealth = 100;

let invulnerabilityTimer = 0;
const invulnerabilityDuration = 60; // ~1 Sekunde Unverwundbarkeit

let score = 0;
let highScore = localStorage.getItem("golfHighScore") || 0;

// Highscore-Senden vorbereiten
function checkAndSendHighScore(newScore)
{
    if (newScore > highScore)
    {
        highScore = newScore;
        localStorage.setItem("golfHighScore", highScore);
        console.log(`Neuer Highscore für ${currentPlayerName}: ${highScore}`);
    }
}