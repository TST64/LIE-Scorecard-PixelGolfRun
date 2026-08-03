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

// Highscore-Übertragung an Google Apps Script via JSONP
function sendHighscoreToScorecardApp(playerName, score) 
{
    const API_URL = "https://script.google.com/macros/s/AKfycbz-J5f6pzUF5xRN4CEDU1kNX6bbFf-y922-hTZLrjxiJ_QmgY4WYuSg0IabruTuhprh/exec";
    
    const payload = JSON.stringify({
        action: 'savePixelGolfHighscore',
        spielerName: playerName,
        score: parseInt(score) || 0,
        timestamp: new Date().toISOString() // Generiert z. B. "2026-08-03T17:15:00.000Z"
    });

    const callbackName = "gas_hs_cb_" + Math.random().toString(36).substring(2, 15);
    window[callbackName] = function(data) 
    {
        console.log("Server-Antwort:", data);
        delete window[callbackName];
    };

    const script = document.createElement("script");
    script.src = `${API_URL}?callback=${callbackName}&data=${encodeURIComponent(payload)}`;
    document.body.appendChild(script);
}

// Highscore-Prüfung & Auslösung
function checkAndSendHighScore(newScore)
{
    if (newScore > highScore)
    {
        highScore = newScore;
        localStorage.setItem("golfHighScore", highScore);
        console.log(`Neuer Highscore für ${currentPlayerName}: ${highScore}`);
        
        // Sendet den neuen Rekord an Google Sheets
        sendHighscoreToScorecardApp(currentPlayerName, highScore);
    }
}