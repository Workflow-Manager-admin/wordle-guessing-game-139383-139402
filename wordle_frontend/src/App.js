import React, { useState, useEffect, useCallback, useRef } from "react";
import "./App.css";

// --- GAME CONSTANTS (CAN BE IMPROVED TO FETCH WORDS REMOTELY) ---
const WORD_LIST = [
  "APPLE", "BRAVE", "CROWN", "DAILY", "EAGLE",
  "FLOUR", "GIANT", "HOUSE", "INPUT", "JOLLY",
  "KNACK", "LIGHT", "MOVER", "NURSE", "OPERA",
  "PLACE", "QUICK", "RANGE", "SHAPE", "TRIAL",
  "UNION", "VIVID", "WORLD", "YOUNG", "ZEBRA"
];
const DEFAULT_ATTEMPTS = 6;
const WORD_LENGTH = 5;

const GAME_STATES = {
  PLAYING: "playing",
  WIN: "win",
  LOSS: "loss"
};

// --- HELPERS ---
function pickRandomWord() {
  return WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
}

function checkGuess(guess, answer) {
  // Returns feedback: 'correct', 'present', or 'absent' for each letter
  const result = Array(WORD_LENGTH).fill("absent");
  const answerArray = answer.split("");
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct position
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guess[i] === answer[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }
  // Second pass: present but misplaced
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] !== "correct" && answerArray.includes(guess[i])) {
      // Only count unused letters
      let idx = answerArray.findIndex(
        (ch, j) => ch === guess[i] && !used[j]
      );
      if (idx !== -1) {
        result[i] = "present";
        used[idx] = true;
      }
    }
  }
  return result;
}

// MAPS feedback to color variables (can be updated to match theme)
const FEEDBACK_COLORS = {
  correct: "var(--feedback-correct, #7ED957)", // green (accent)
  present: "var(--feedback-present, #F5A623)", // yellow (secondary)
  absent: "var(--feedback-absent, #B0B0B0)",   // gray
  empty: "var(--border-color)"                 // default border color
};

// --- COMPONENTS ---
const KeyboardLayout = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"]
];

// PUBLIC_INTERFACE
function GameBoard({ guesses, feedback, currentGuess, gameState }) {
  // Renders all rows: each guess plus the active (current) row
  let rows = [];
  for (let i = 0; i < DEFAULT_ATTEMPTS; i++) {
    let guess = guesses[i] || "";
    let fb = feedback[i] || [];
    // If current active row, show as user types
    const isCurrent = i === guesses.length && gameState === GAME_STATES.PLAYING;
    let cells = [];
    for (let j = 0; j < WORD_LENGTH; j++) {
      const ch = isCurrent ? currentGuess[j] || "" : guess[j] || "";
      const status = fb[j] || (isCurrent ? "empty" : "empty");
      cells.push(
        <div
          key={j}
          className={`wordle-cell ${status}`}
          style={{
            borderColor: status === "empty" ? "var(--border-color)" : FEEDBACK_COLORS[status],
            backgroundColor: status !== "empty" ? FEEDBACK_COLORS[status] : "transparent",
            color: status !== "empty" && status !== "absent"
              ? "#fff"
              : "var(--text-primary)",
            transition: "background-color 0.2s, color 0.2s"
          }}
          aria-label={ch}
        >
          {ch}
        </div>
      );
    }
    rows.push(
      <div className="wordle-row" key={i}>
        {cells}
      </div>
    );
  }
  return <div className="game-board">{rows}</div>;
}

// PUBLIC_INTERFACE
function OnScreenKeyboard({ disabled, letterStatus, onKeyPress }) {
  return (
    <div className="keyboard">
      {KeyboardLayout.map((row, rIdx) => (
        <div className="keyboard-row" key={rIdx}>
          {row.map((key) => {
            let keyLower = key.length === 1 ? key : key; // don't lowercase Enter/⌫
            let status = letterStatus[keyLower] || "empty";
            let isSpecial = key === "Enter" || key === "⌫";
            return (
              <button
                key={key}
                className={`key ${isSpecial ? "special" : ""} ${status}`}
                disabled={disabled}
                style={{
                  backgroundColor: status !== "empty" && !isSpecial
                    ? FEEDBACK_COLORS[status]
                    : "var(--button-bg)",
                  color: isSpecial
                    ? "var(--text-primary)"
                    : (status !== "empty" ? "#fff" : "var(--button-text)")
                }}
                data-key={key}
                onClick={() => onKeyPress(key)}
                tabIndex={0}
                aria-label={key}
              >
                {key}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// PUBLIC_INTERFACE
function Instructions() {
  return (
    <div className="instructions" style={{ marginBottom: 16 }}>
      <h2>How to Play</h2>
      <ul>
        <li>Guess the <b>5-letter word</b> in six tries.</li>
        <li>
          Each guess must be a valid 5-letter word. Hit <b>Enter</b> to submit.
        </li>
        <li>
          After each guess, letter tiles show:
          <span>
            <span className="cell-sample" style={{ backgroundColor: FEEDBACK_COLORS.correct }}>A</span> in correct place,
          </span>
          <span>
            <span className="cell-sample" style={{ backgroundColor: FEEDBACK_COLORS.present }}>B</span> in the word but wrong place,
          </span>
          <span>
            <span className="cell-sample" style={{ backgroundColor: FEEDBACK_COLORS.absent, color: "#fff" }}>C</span> not in the word.
          </span>
        </li>
        <li>
          Use your keyboard or the on-screen buttons below.
        </li>
      </ul>
    </div>
  );
}

function useKeyboardInput({ onLetter, onEnter, onBackspace, enabled }) {
  // Handles physical keyboard input for game
  useEffect(() => {
    if (!enabled) return;
    function handler(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === "Enter") {
        onEnter();
      } else if (e.key === "Backspace") {
        onBackspace();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        onLetter(e.key.toUpperCase());
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBackspace, onEnter, onLetter, enabled]);
}

// PUBLIC_INTERFACE
function App() {
  // --- GAME STATE ---
  const [target, setTarget] = useState(() => pickRandomWord());
  const [guesses, setGuesses] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameState, setGameState] = useState(GAME_STATES.PLAYING);
  const [alert, setAlert] = useState("");
  const [letterStatus, setLetterStatus] = useState({});
  const [theme, setTheme] = useState("light");
  const inputRef = useRef(null);

  // Update the document's theme attribute for light/dark
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Update letter status on feedback change (keyboard coloring)
  useEffect(() => {
    // 'correct' > 'present' > 'absent'
    const priority = { correct: 3, present: 2, absent: 1 };
    let nextStatus = { ...letterStatus };
    guesses.forEach((guess, i) => {
      const fb = feedback[i];
      for (let j = 0; j < guess.length; j++) {
        const letter = guess[j];
        const stat = fb[j];
        if (!nextStatus[letter] || priority[stat] > priority[nextStatus[letter]]) {
          nextStatus[letter] = stat;
        }
      }
    });
    setLetterStatus(nextStatus);
    // eslint-disable-next-line
  }, [feedback, guesses]);

  // PUBLIC_INTERFACE: handle on-screen and physical keyboard
  const handleKeyPress = useCallback(
    (key) => {
      if (gameState !== GAME_STATES.PLAYING) return;
      if (key === "Enter") {
        doSubmitGuess();
      } else if (key === "⌫" || key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-Z]$/.test(key)) {
        setCurrentGuess((prev) =>
          prev.length < WORD_LENGTH ? prev + key : prev
        );
      }
    },
    [gameState, currentGuess]
  );

  useKeyboardInput({
    onLetter: (ch) => handleKeyPress(ch),
    onBackspace: () => handleKeyPress("Backspace"),
    onEnter: () => handleKeyPress("Enter"),
    enabled: gameState === GAME_STATES.PLAYING
  });

  // PUBLIC_INTERFACE: Submits current guess if valid
  function doSubmitGuess() {
    if (currentGuess.length < WORD_LENGTH) {
      setAlert("Not enough letters");
      return;
    }
    if (!WORD_LIST.includes(currentGuess)) {
      setAlert("Invalid word");
      return;
    }
    const guessFeedback = checkGuess(currentGuess, target);
    const newGuesses = [...guesses, currentGuess];
    const newFeedback = [...feedback, guessFeedback];
    setGuesses(newGuesses);
    setFeedback(newFeedback);
    setCurrentGuess("");

    // Win condition
    if (currentGuess === target) {
      setGameState(GAME_STATES.WIN);
      setAlert("🎉 You Win!");
      return;
    }
    // Lose condition
    if (newGuesses.length === DEFAULT_ATTEMPTS) {
      setGameState(GAME_STATES.LOSS);
      setAlert(`Word was: ${target}`);
    }
  }

  // PUBLIC_INTERFACE: Restart/new game
  function restartGame() {
    setTarget(pickRandomWord());
    setGuesses([]);
    setFeedback([]);
    setCurrentGuess("");
    setGameState(GAME_STATES.PLAYING);
    setAlert("");
    setLetterStatus({});
    // Focus on first interaction
    if (inputRef.current) inputRef.current.focus();
  }

  // Hide alert after a short delay (except on win/loss)
  useEffect(() => {
    if (!alert || gameState !== GAME_STATES.PLAYING) return;
    const timeout = setTimeout(() => setAlert(""), 1400);
    return () => clearTimeout(timeout);
  }, [alert, gameState]);

  // Set CSS custom props for accent colors (match requirements)
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--feedback-correct", "#7ED957");
    root.style.setProperty("--feedback-present", "#F5A623");
    root.style.setProperty("--feedback-absent", "#B0B0B0");
    root.style.setProperty("--button-bg", "#4A90E2");
    root.style.setProperty("--button-text", "#fff");
  }, []);

  // --- RENDER ---
  return (
    <div className="App">
      <header className="App-header" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: 0 }}>
        <button
          className="theme-toggle"
          onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
          aria-label={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
        >
          {theme === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
        <h1 style={{
          color: "#4A90E2",
          letterSpacing: "0.12em",
          fontWeight: 800,
          margin: "32px 0 8px",
          fontSize: "2.4rem"
        }}>
          Wordle Game
        </h1>
        <div style={{ color: "var(--text-secondary)", fontSize: 18, marginBottom: 8 }}>
          Guess the <span style={{ color: "#F5A623" }}>Word</span>!
        </div>
        <Instructions />
      </header>
      <main style={{
        display: "flex", flexDirection: "column", alignItems: "center",
        padding: 16, minHeight: "60vh"
      }}>
        <GameBoard
          guesses={guesses}
          feedback={feedback}
          currentGuess={currentGuess}
          gameState={gameState}
        />

        {alert && (
          <div
            className="alert"
            aria-live="assertive"
            style={{
              margin: "14px 0",
              padding: "7px 20px",
              borderRadius: "7px",
              color: "#fff",
              background: "#4A90E2",
              fontWeight: 700,
              fontSize: 18,
              boxShadow: "0 2px 10px #0002"
            }}
          >
            {alert}
          </div>
        )}

        {gameState !== GAME_STATES.PLAYING && (
          <button
            className="btn btn-large"
            style={{
              margin: "22px 0 8px",
              padding: "14px 38px",
              background: "#7ED957",
              color: "#fff",
              fontWeight: 800,
              letterSpacing: "0.04em",
              fontSize: "1.2rem",
              borderRadius: "10px",
              border: "none",
              cursor: "pointer"
            }}
            onClick={restartGame}
          >
            {gameState === GAME_STATES.WIN ? "Play Again" : "New Game"}
          </button>
        )}

        <input
          type="text"
          inputMode="text"
          autoFocus
          maxLength={WORD_LENGTH}
          ref={inputRef}
          tabIndex={-1}
          value={currentGuess}
          style={{ opacity: 0, width: 0, position: "absolute", pointerEvents: "none" }}
          onChange={() => {}}
        />

        <OnScreenKeyboard
          disabled={gameState !== GAME_STATES.PLAYING}
          letterStatus={letterStatus}
          onKeyPress={handleKeyPress}
        />
      </main>
      <footer style={{
        fontSize: 13,
        color: "var(--text-secondary)",
        padding: "14px 0",
        borderTop: "1px solid var(--border-color)"
      }}>
        <span>
          Inspired by <a className="App-link" href="https://www.nytimes.com/games/wordle/index.html" target="_blank" rel="noopener noreferrer">Wordle</a>.
          &nbsp;Colors: <span style={{ color: "#4A90E2", fontWeight: 600 }}>Blue</span>, <span style={{ color: "#F5A623", fontWeight: 600 }}>Orange</span>, <span style={{ color: "#7ED957", fontWeight: 600 }}>Green</span>
        </span>
      </footer>
      {/* --- Additional inline styles for "wordle" look and feel below --- */}
      <style>{`
        .App-header {
          box-shadow: 0 4px 12px 0 rgba(74, 144, 226, 0.05);
        }
        .game-board {
          display: grid;
          grid-template-rows: repeat(${DEFAULT_ATTEMPTS}, 1fr);
          gap: 7px;
          margin: 24px 0 18px;
          min-width: 320px;
        }
        .wordle-row {
          display: grid;
          grid-template-columns: repeat(${WORD_LENGTH}, 52px);
          gap: 7px;
          justify-content: center;
        }
        @media (max-width: 480px) {
          .game-board { min-width: 90vw; }
          .wordle-row { grid-template-columns: repeat(${WORD_LENGTH}, 11vw); }
        }
        .wordle-cell {
          border: 2px solid var(--border-color);
          border-radius: 8px;
          width: 52px; height: 52px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
          font-weight: 700;
          text-transform: uppercase;
          user-select: none;
          transition: background 0.18s, color 0.16s;
          margin: 0;
          background: transparent;
        }
        .wordle-cell.correct { border: none; }
        .wordle-cell.present { border: none; }
        .wordle-cell.absent { border: none; }
        .keyboard { max-width: 98vw; margin: 18px auto 0; }
        .keyboard-row { display: flex; justify-content: center; margin-bottom: 5px; }
        .key {
          min-width: 36px;
          padding: 13px 10px;
          margin: 0 2.5px;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          background: var(--button-bg);
          color: var(--button-text);
          box-shadow: 0 1.5px 6px #1a1a1a19;
          cursor: pointer;
          transition: background 0.13s, color 0.13s, scale 0.11s;
        }
        .key.correct, .key.present, .key.absent { color: #fff; }
        .key.correct { background: ${FEEDBACK_COLORS.correct}; }
        .key.present { background: ${FEEDBACK_COLORS.present}; }
        .key.absent { background: ${FEEDBACK_COLORS.absent}; }
        .key:active, .key:focus { scale: 0.96; }
        .key.special {
          background: #e8e8e8;
          color: #404040;
          font-weight: 700;
        }
        @media (max-width: 480px) {
          .key { font-size: 14px; padding: 9px 4px; min-width: 8vw; }
        }
        .btn-large {
          font-size: 1.1rem;
          font-weight: bold;
        }
        .cell-sample {
          display: inline-block;
          border-radius: 6px;
          width: 22px; height: 22px;
          line-height: 23px;
          margin: 0 2px;
          text-align: center;
          font-size: 15px;
          color: #fff;
          font-weight: 600;
        }
        .instructions ul {
          text-align: left;
          margin: 0 0 0 1.1em;
          display: inline-block;
        }
        .instructions h2 { font-size: 20px; margin: 14px 0; }
      `}</style>
    </div>
  );
}

export default App;
