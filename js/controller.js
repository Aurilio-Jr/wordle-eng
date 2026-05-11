const REVEAL_DELAY_PER_TILE_MS = 300;

const MESSAGES = {
  pt: {
    instruction: "Tente adivinhar a palavra de 5 letras.",
    correct:     "🎉 Acertou! Próxima rodada...",
    gameover:    (word) => `Fim de jogo! A palavra era: ${word}`,
    overlayWin:  "🎉 Acertou!",
    overlayLose: "😞 Fim de Jogo",
    overlayWordLabel:  (w) => `A palavra era: ${w}`,
    overlayScoreLabel: (s) => `Pontuação: ${s}`,
    btnRestart:  "Reiniciar",
    btnMenu:     "Menu Inicial",
  },
  en: {
    instruction: "Guess the 5-letter word.",
    correct:     "🎉 Correct! Next round...",
    gameover:    (word) => `Game over! The word was: ${word}`,
    overlayWin:  "🎉 You got it!",
    overlayLose: "😞 Game Over",
    overlayWordLabel:  (w) => `The word was: ${w}`,
    overlayScoreLabel: (s) => `Score: ${s}`,
    btnRestart:  "Restart",
    btnMenu:     "Main Menu",
  },
};

const GameController = {
  // ── Inicialização ─────────────────────────────────────────────────────────

  init() {
    this._bindLanguageButtons();
    this._bindKeyboard();
    this._bindOverlayButtons();
    GameView.showStartScreen();
  },

  // ── Início de partida ──────────────────────────────────────────────────────

  startGame(language) {
    GameModel.startGame(language);
    GameView.showGameScreen();
    GameView.setInstruction(MESSAGES[language].instruction);
    GameView.buildBoard(MAX_ATTEMPTS, WORD_LENGTH);
    GameView.updateScore(0);
    GameView.updateRound(1);
    this._updateOverlayButtons(language);
  },

  restartGame() {
    const lang = GameModel.language;
    this.startGame(lang);
  },

  goToMenu() {
    GameView.showStartScreen();
  },

  // ── Processamento de teclas ───────────────────────────────────────────────

  handleKeyPress(key) {
    if (GameModel.isGameOver || GameModel.language === "") return;

    if (key === "BACKSPACE") {
      const removed = GameModel.removeLetter();
      if (removed) {
        GameView.setTileLetter(
          GameModel.currentRow,
          GameModel.currentColumn,
          ""
        );
      }
      return;
    }

    if (key === "ENTER") {
      this._submitCurrentGuess();
      return;
    }

    if (/^[A-Z]$/.test(key)) {
      const colBeforeAdd = GameModel.currentColumn;
      const added = GameModel.addLetter(key);
      if (added) {
        GameView.setTileLetter(GameModel.currentRow, colBeforeAdd, key);
      }
    }
  },

  // ── Submissão do palpite ──────────────────────────────────────────────────

  _submitCurrentGuess() {
    const result = GameModel.submitGuess();
    if (!result) return; // Linha incompleta — ignora

    const { evaluationResults, isCorrect, isGameOver } = result;
    const submittedRow = GameModel.currentRow - 1;
    const lang = GameModel.language;
    const guess = GameModel.grid[submittedRow].join("");

    // Revela tiles com animação escalonada
    evaluationResults.forEach((tileResult, col) => {
      GameView.revealTile(
        submittedRow,
        col,
        tileResult,
        col * REVEAL_DELAY_PER_TILE_MS
      );
    });

    GameView.updateScore(GameModel.score);

    const totalRevealTime = evaluationResults.length * REVEAL_DELAY_PER_TILE_MS;

    // Atualiza teclado após animação de flip
    setTimeout(() => {
      GameView.updateKeyboard(guess, evaluationResults);
    }, totalRevealTime);

    if (isCorrect) {
      setTimeout(() => {
        GameView.showFeedback(MESSAGES[lang].correct, "success");
        GameView.updateRound(GameModel.round + 1);
        setTimeout(() => this._nextRound(), 1500);
      }, totalRevealTime);
    } else if (isGameOver) {
      setTimeout(() => {
        const msgs = MESSAGES[lang];
        GameView.showOverlay({
          title: msgs.overlayLose,
          word:  msgs.overlayWordLabel(GameModel.secretWord),
          score: msgs.overlayScoreLabel(GameModel.score),
        });
      }, totalRevealTime + 400);
    }
  },

  // ── Nova rodada ────────────────────────────────────────────────────────────

  _nextRound() {
    GameModel.nextRound();
    GameView.buildBoard(MAX_ATTEMPTS, WORD_LENGTH);
    GameView.updateRound(GameModel.round);
    GameView._resetKeyboardColors();
  },

  // ── Binding de eventos ────────────────────────────────────────────────────

  _bindLanguageButtons() {
    document.querySelectorAll("[data-language]").forEach((button) => {
      button.addEventListener("click", () => {
        this.startGame(button.dataset.language);
      });
    });
  },

  _bindKeyboard() {
    window.addEventListener("keydown", (event) => {
      this.handleKeyPress(event.key.toUpperCase());
    });

    // Teclado virtual (mobile)
    document.addEventListener("click", (event) => {
      const key = event.target.dataset.key;
      if (key) this.handleKeyPress(key);
    });
  },

  _bindOverlayButtons() {
    document.getElementById("btn-restart").addEventListener("click", () => {
      this.restartGame();
    });
    document.getElementById("btn-menu").addEventListener("click", () => {
      this.goToMenu();
    });
  },

  /** Atualiza os textos dos botões do overlay conforme o idioma. */
  _updateOverlayButtons(lang) {
    document.getElementById("btn-restart").textContent = MESSAGES[lang].btnRestart;
    document.getElementById("btn-menu").textContent    = MESSAGES[lang].btnMenu;
  },
};

// ── Ponto de entrada ─────────────────────────────────────────────────────────
document.addEventListener("DOMContentLoaded", () => {
  GameController.init();
});
