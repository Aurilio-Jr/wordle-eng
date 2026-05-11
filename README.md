# Wordle Eng — Multilingual Legacy Refactoring

Projeto refatorado como parte do **DTP: Arquitetura, Construção e GC**.  
O código original (`index.html` monolítico) foi reengenheirado para seguir o padrão **MVC**, boas práticas de construção de software e gerência de configuração profissional com Git.

---

## Integrantes

| Nome | Matrícula |
|---|---|
| Aurilio Oliveira de Sousa Junior | 202506822 |
| Geovanne Rodrigues Pinheiro | 202203979 |

---

## Como Executar

Não há dependências externas nem build step necessário.

```bash
# Clone o repositório
git clone https://github.com/<seu-usuario>/wordle-eng.git
cd wordle-eng

# Abra no navegador (qualquer servidor estático funciona)
# Opção 1 — VS Code Live Server
# Opção 2 — Python
python3 -m http.server 8080
# Acesse: http://localhost:8080
```

A ordem de carregamento dos scripts no `index.html` já garante que Model → View → Controller sejam inicializados corretamente.

---

## Estrutura de Arquivos

```
wordle-eng/
├── index.html          # Estrutura HTML pura (sem lógica inline)
├── style.css           # Todos os estilos centralizados
├── js/
│   ├── model.js        # Camada Model: estado, dicionários, lógica de negócio
│   ├── view.js         # Camada View: renderização DOM, sem lógica de jogo
│   └── controller.js   # Camada Controller: mediador de eventos
└── README.md
```

---

## DTP 01 — Arquitetura MVC

### Separação das Camadas

| Camada | Arquivo | Responsabilidade |
|---|---|---|
| **Model** | `js/model.js` | Dicionários validados, estado da partida (`currentRow`, `currentColumn`, `score`, etc.), lógica de avaliação de palpite e cálculo de pontuação. |
| **View** | `js/view.js` | Toda renderização DOM: construir tabuleiro, exibir letras, animar tiles, mostrar feedback e atualizar estatísticas. Não conhece `GameModel`. |
| **Controller** | `js/controller.js` | Captura eventos (`keydown`, cliques no teclado virtual), chama métodos do Model, passa resultados para a View. |

### Fluxo de uma jogada

```
[Usuário pressiona tecla]
        │
        ▼
 Controller.handleKeyPress()
        │
        ├─► GameModel.addLetter()    ◄── altera estado
        │
        └─► GameView.setTileLetter() ◄── reflete no DOM
```

```
[Usuário pressiona ENTER]
        │
        ▼
 Controller._submitCurrentGuess()
        │
        ├─► GameModel.submitGuess()       ◄── avalia, pontua, atualiza estado
        │         └─ retorna { evaluationResults, isCorrect, isGameOver }
        │
        └─► GameView.revealTile()         ◄── anima cada tile com delay escalonado
            GameView.updateScore()
            GameView.showFeedback()
```

---

## DTP 02 — Construção de Software

### Code Smells Encontrados e Como Foram Resolvidos

#### 1. Nomes Enigmáticos (Mysterious Names)
**Problema:** Variáveis como `r_a`, `c_a`, `sc`, `rd`, `m`, `p_s`, `i_escolhido` e `dic` não revelavam intenção alguma. Qualquer desenvolvedor precisaria ler toda a lógica para entender o papel de cada variável.

**Solução:** Substituídas por nomes que revelam a intenção do dado:
```js
// Antes
let r_a = 0; let c_a = 0; let sc = 0; let rd = 1;
let m = [["","","","",""], ...];
let p_s = ''; let i_escolhido = '';

// Depois (GameModel)
currentRow: 0,
currentColumn: 0,
score: 0,
round: 1,
grid: createEmptyGrid(),
secretWord: '',
language: '',
```

---

#### 2. Função Faz-Tudo / God Function (Large Function)
**Problema:** O handler `window.onkeydown` misturava captura de evento, lógica de negócio (avaliação de letras), cálculo de pontuação, manipulação de DOM e controle de estado em um único bloco de ~40 linhas — impossível de testar isoladamente.

**Solução:** Responsabilidades distribuídas em métodos coesos:
- `GameModel.addLetter()` / `removeLetter()` / `submitGuess()` — lógica pura
- `GameView.setTileLetter()` / `revealTile()` — renderização
- `GameController.handleKeyPress()` — apenas orquestração

---

#### 3. Números Mágicos (Magic Numbers)
**Problema:** Valores como `6` (tentativas), `5` (letras), `10` e `5` (pontos) estavam espalhados inline sem nenhum contexto semântico.

**Solução:** Centralizados como constantes nomeadas no topo de `model.js`:
```js
const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const POINTS_CORRECT_POSITION = 10;
const POINTS_WRONG_POSITION = 5;
```

---

#### 4. Dados Inconsistentes nos Dicionários (Data Clumps / Defect)
**Problema:** O dicionário original em inglês continha `"CODE"` (4 letras), que causaria falha silenciosa no grid de 5 colunas.

**Solução:** Função `validateDictionaries()` no Model que filtra e loga palavras com tamanho diferente de `WORD_LENGTH` antes que o jogo inicie:
```js
function validateDictionaries(dicts) {
  return Object.fromEntries(
    Object.entries(dicts).map(([lang, words]) => [
      lang,
      words.filter((w) => w.length === WORD_LENGTH),
    ])
  );
}
```

---

#### 5. Código Morto / Comentários Enganosos
**Problema:** O código original tinha comentários como `// CODE tem 4 letras, vai dar erro no grid de 5! (Desafio extra)` — sinalizando um bug conhecido mas não corrigido — e comentários irônicos como `// DESIGN RUIM`.

**Solução:** Bug corrigido. Comentários substituídos por documentação JSDoc que explica a *intenção*, não o óbvio.

---

## DTP 03 — Gerência de Configuração

### Estratégia de Branches

```
main
 ├── feature/mvc-architecture     → DTP 01: separação em Model/View/Controller
 ├── feature/clean-code           → DTP 02: nomenclatura, constantes, validações
 └── feature/documentation        → DTP 03: README, relatório
```

### Histórico de Commits (exemplo incremental)

```
feat: add GameModel with dictionary, state and evaluateGuess logic
feat: add GameView with DOM rendering methods
feat: add GameController binding keyboard and click events
refactor: rename cryptic variables (r_a, c_a, sc, p_s)
refactor: extract magic numbers to named constants
fix: validate dictionaries to remove words != WORD_LENGTH
style: separate CSS into style.css, remove inline styles
docs: add README with architecture, smells and execution guide
```

> Cada branch foi mergeada via **Pull Request** na `main`, mantendo o histórico de evolução incremental.

---

## Funcionalidades do Jogo

- Suporte a **Português** e **Inglês**
- Sistema de **pontuação acumulada** entre rodadas
- **Teclado virtual** para dispositivos móveis
- Animação de **flip** nos tiles ao revelar resultado
- **Validação de dicionário** em tempo de inicialização
- Feedback visual com mensagens animadas
