const GameView = {
  // ── Referências aos elementos do DOM ──────────────────────────────────────

  screens: {
    start: document.getElementById("screen-start"),
    game:  document.getElementById("screen-game"),
  },

  elements: {
    board:              document.getElementById("board"),
    scoreValue:         document.getElementById("score-value"),
    roundValue:         document.getElementById("round-value"),
    instructionMessage: document.getElementById("instruction-message"),
    feedbackMessage:    document.getElementById("feedback-message"),
    gameOverlay:        document.getElementById("game-overlay"),
    overlayTitle:       document.getElementById("overlay-title"),
    overlayWord:        document.getElementById("overlay-word"),
    overlayScore:       document.getElementById("overlay-score"),
  },

  // ── Transições de tela ────────────────────────────────────────────────────

  showStartScreen() {
    this.screens.start.classList.remove("hidden");
    this.screens.game.classList.add("hidden");
  },

  showGameScreen() {
    this.screens.start.classList.add("hidden");
    this.screens.game.classList.remove("hidden");
    this.hideOverlay();
    this._resetKeyboardColors();
  },

  // ── Construção do tabuleiro ────────────────────────────────────────────────

  /**
   * Reconstrói o tabuleiro do zero (MAX_ATTEMPTS linhas × WORD_LENGTH colunas).
   */
  buildBoard(maxAttempts, wordLength) {
    const board = this.elements.board;
    board.innerHTML = "";

    for (let row = 0; row < maxAttempts; row++) {
      const rowElement = document.createElement("div");
      rowElement.className = "board-row";

      for (let col = 0; col < wordLength; col++) {
        const tile = document.createElement("div");
        tile.className = "tile";
        tile.id = `tile-${row}-${col}`;
        rowElement.appendChild(tile);
      }

      board.appendChild(rowElement);
    }
  },

  // ── Atualização de tiles ───────────────────────────────────────────────────

  /** Exibe uma letra em um tile específico. */
  setTileLetter(row, col, letter) {
    const tile = document.getElementById(`tile-${row}-${col}`);
    if (!tile) return;
    tile.textContent = letter;
    tile.classList.toggle("tile--filled", letter !== "");
  },

  /** Aplica a cor de resultado a um tile (com animação de flip). */
  revealTile(row, col, result, delayMs) {
    const tile = document.getElementById(`tile-${row}-${col}`);
    if (!tile) return;

    setTimeout(() => {
      tile.classList.add("tile--revealed", `tile--${result}`);
    }, delayMs);
  },

  // ── Teclado Virtual — coloração ───────────────────────────────────────────

  /**
   * Atualiza a cor das teclas do teclado virtual com base nos resultados.
   * Prioridade: correct > present > absent
   */
  updateKeyboard(guess, evaluationResults) {
    const PRIORITY = { correct: 3, present: 2, absent: 1 };

    guess.split("").forEach((letter, i) => {
      const result = evaluationResults[i];
      const key = document.querySelector(`.key[data-key="${letter}"]`);
      if (!key) return;

      const current = key.dataset.state || "";
      if ((PRIORITY[result] || 0) > (PRIORITY[current] || 0)) {
        key.dataset.state = result;
        key.className = `key${key.classList.contains("key--wide") ? " key--wide" : ""} key--${result}`;
      }
    });
  },

  /** Remove coloração de todas as teclas ao iniciar nova partida. */
  _resetKeyboardColors() {
    document.querySelectorAll(".key[data-key]").forEach((key) => {
      delete key.dataset.state;
      const isWide = key.dataset.key === "ENTER" || key.dataset.key === "BACKSPACE";
      key.className = isWide ? "key key--wide" : "key";
    });
  },

  // ── Overlay de fim de jogo ─────────────────────────────────────────────────

  /** Exibe o painel de resultado quando o jogo termina. */
  showOverlay({ title, word, score }) {
    this.elements.overlayTitle.textContent = title;
    this.elements.overlayWord.textContent = word;
    this.elements.overlayScore.textContent = score;
    this.elements.gameOverlay.classList.remove("hidden");
  },

  hideOverlay() {
    this.elements.gameOverlay.classList.add("hidden");
  },

  // ── Estatísticas ──────────────────────────────────────────────────────────

  updateScore(score) {
    this.elements.scoreValue.textContent = score;
  },

  updateRound(round) {
    this.elements.roundValue.textContent = round;
  },

  // ── Mensagens ─────────────────────────────────────────────────────────────

  setInstruction(message) {
    this.elements.instructionMessage.textContent = message;
  },

  showFeedback(message, type = "info") {
    const el = this.elements.feedbackMessage;
    el.textContent = message;
    el.className = `feedback feedback--${type} feedback--visible`;

    clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      el.classList.remove("feedback--visible");
    }, 2500);
  },
};
