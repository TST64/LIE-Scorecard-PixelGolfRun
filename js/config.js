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
function sendHighscoreToScorecardApp(playerName, scoreToSave)
{
    const API_URL = "https://script.google.com/macros/s/AKfycbyG7sesoWaskN4vsg5rfgYzi96Zkpu4CemLm-WKEkDW4Cg6h8jyMOIXlG9uhejkqVI6/exec";
    
    const payload = JSON.stringify({
        action: 'savePixelGolfHighscore',
        spielerName: playerName,
        score: scoreToSave
    });

    const callbackName = "gas_hs_cb_" + Math.random().toString(36).substring(2, 15);
    window[callbackName] = function(data)
    {
        console.log("Highscore erfolgreich an GAS übermittelt:", data);
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