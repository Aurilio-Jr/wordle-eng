/**
 * Model - Gerencia estado, dicionários, lógica de negócio e pontuação.
 * Não possui qualquer referência ao DOM.
 */

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const POINTS_CORRECT_POSITION = 10;
const POINTS_WRONG_POSITION = 5;

const DICTIONARIES = {
  pt: ["TESTE", "DADOS", "PILHA", "GRADE", "MOUSE", "TELAS", "PORTA", "BLOCO", "FORCA", "LOOPS"],
  en: ["CLEAN", "SMELL", "PRINT", "FILES", "STACK", "DEBUG", "CACHE", "LOGIC", "BUILD", "CRAFT"],
};

/** Valida que todas as palavras do dicionário têm exatamente WORD_LENGTH letras. */
function validateDictionaries(dicts) {
  for (const [lang, words] of Object.entries(dicts)) {
    const invalid = words.filter((w) => w.length !== WORD_LENGTH);
    if (invalid.length > 0) {
      console.warn(`[Model] Palavras inválidas removidas do dicionário "${lang}":`, invalid);
    }
  }
  return Object.fromEntries(
    Object.entries(dicts).map(([lang, words]) => [
      lang,
      words.filter((w) => w.length === WORD_LENGTH),
    ])
  );
}

const validatedDictionaries = validateDictionaries(DICTIONARIES);

/** Cria uma grade em branco com MAX_ATTEMPTS linhas e WORD_LENGTH colunas. */
function createEmptyGrid() {
  return Array.from({ length: MAX_ATTEMPTS }, () => Array(WORD_LENGTH).fill(""));
}

/** Seleciona uma palavra aleatória do dicionário do idioma escolhido. */
function pickRandomWord(language) {
  const words = validatedDictionaries[language];
  return words[Math.floor(Math.random() * words.length)].toUpperCase();
}

/**
 * Avalia o palpite do usuário contra a palavra secreta.
 * Retorna um array de resultados: 'correct' | 'present' | 'absent'
 */
function evaluateGuess(guess, secretWord) {
  return guess.split("").map((letter, index) => {
    if (letter === secretWord[index]) return "correct";
    if (secretWord.includes(letter)) return "present";
    return "absent";
  });
}

/** Calcula a pontuação de uma rodada com base nos resultados da avaliação. */
function calculateRoundScore(evaluationResults) {
  return evaluationResults.reduce((total, result) => {
    if (result === "correct") return total + POINTS_CORRECT_POSITION;
    if (result === "present") return total + POINTS_WRONG_POSITION;
    return total;
  }, 0);
}

// Estado da partida

const GameModel = {
  language:      "",
  secretWord:    "",
  grid:          createEmptyGrid(),
  currentRow:    0,
  currentColumn: 0,
  score:         0,
  round:         1,
  isGameOver:    false,

  /** Inicializa ou reinicia a partida para o idioma escolhido. */
  startGame(language) {
    this.language      = language;
    this.secretWord    = pickRandomWord(language);
    this.grid          = createEmptyGrid();
    this.currentRow    = 0;
    this.currentColumn = 0;
    this.score         = 0;
    this.round         = 1;
    this.isGameOver    = false;
  },

  /** Inicia uma nova rodada (nova palavra, mantém score e número de rodada). */
  nextRound() {
    this.secretWord    = pickRandomWord(this.language);
    this.grid          = createEmptyGrid();
    this.currentRow    = 0;
    this.currentColumn = 0;
    this.round        += 1;
    this.isGameOver    = false;
  },

  /** Adiciona uma letra à posição atual da grade. */
  addLetter(letter) {
    if (this.currentColumn >= WORD_LENGTH || this.isGameOver) return false;
    this.grid[this.currentRow][this.currentColumn] = letter;
    this.currentColumn += 1;
    return true;
  },

  /** Remove a última letra digitada. */
  removeLetter() {
    if (this.currentColumn <= 0 || this.isGameOver) return false;
    this.currentColumn -= 1;
    this.grid[this.currentRow][this.currentColumn] = "";
    return true;
  },

  /**
   * Submete o palpite da linha atual.
   * Retorna um objeto com: { evaluationResults, isCorrect, isGameOver }
   */
  submitGuess() {
    if (this.currentColumn < WORD_LENGTH) return null;

    const guess             = this.grid[this.currentRow].join("");
    const evaluationResults = evaluateGuess(guess, this.secretWord);
    const roundScore        = calculateRoundScore(evaluationResults);
    this.score             += roundScore;

    const isCorrect  = guess === this.secretWord;
    this.currentRow += 1;
    this.currentColumn = 0;

    if (isCorrect || this.currentRow >= MAX_ATTEMPTS) {
      this.isGameOver = true;
    }

    return { evaluationResults, isCorrect, isGameOver: this.isGameOver };
  },
};
