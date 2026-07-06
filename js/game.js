const Game = {
  collection: [],
  currentBattle: null,
  selectedBattleCards: [],

  init() {
    Economy.load();
    this.loadCollection();
    this.loadSelectedCards();
    
    if (this.collection.length === 0) {
      this.giveStarterPack();
    }
    
    UI.init();
  },

  giveStarterPack() {
    const cards = Economy.generateStarterPack();
    cards.forEach(c => this.addToCollection(c));
    this.saveCollection();
  },

  addToCollection(card) {
    this.collection.push(card);
    this.saveCollection();
  },

  loadCollection() {
    const data = localStorage.getItem('cardgame_collection');
    if (data) {
      const cards = JSON.parse(data);
      this.collection = cards.map(c => Card.fromJSON(c));
    }
  },

  saveCollection() {
    localStorage.setItem('cardgame_collection', JSON.stringify(this.collection.map(c => c.toJSON())));
  },

  loadSelectedCards() {
    const data = localStorage.getItem('cardgame_selected_cards');
    if (data) {
      const ids = JSON.parse(data);
      this.selectedBattleCards = this.collection.filter(c => ids.includes(c.uniqueId));
    } else {
      this.selectedBattleCards = [];
    }
  },

  saveSelectedCards() {
    const ids = this.selectedBattleCards.map(c => c.uniqueId);
    localStorage.setItem('cardgame_selected_cards', JSON.stringify(ids));
  },

  toggleCardSelection(card) {
    const idx = this.selectedBattleCards.findIndex(c => c.uniqueId === card.uniqueId);
    if (idx !== -1) {
      this.selectedBattleCards.splice(idx, 1);
    } else {
      if (this.selectedBattleCards.length < 6) {
        this.selectedBattleCards.push(card);
      } else {
        alert('Você só pode selecionar 6 cartas!');
        return;
      }
    }
    this.saveSelectedCards();
  },

  startBattle() {
    if (this.selectedBattleCards.length < 6) {
      alert('Você precisa selecionar 6 cartas para batalhar! Vá até a Coleção e selecione suas cartas.');
      return;
    }

    const shuffled = [...this.selectedBattleCards].sort(() => Math.random() - 0.5);
    const playerCards = shuffled;

    playerCards.forEach(c => {
      c.currentHP = c.maxHP;
      c.frozen = false;
      c.poisoned = 0;
    });

    const enemyCards = [];
    for (let i = 0; i < 6; i++) {
      enemyCards.push(Economy.generateRandomCard());
    }

    this.pendingBattle = { playerCards, enemyCards };
    UI.showDiceRoll();
  },

  finalizeBattleStart(firstTurn) {
    const { playerCards, enemyCards } = this.pendingBattle;
    this.currentBattle = new Battle(playerCards, enemyCards, firstTurn);
    UI.battle = this.currentBattle;
    UI.hideDiceModal();
    UI.showScreen('battle');
    UI.renderBattle();
    
    if (firstTurn === 'enemy') {
      UI.executeEnemyTurn();
    }
  },

  openPack() {
    const isFirstPack = this.collection.length === 0;
    const cards = isFirstPack ? Economy.buyStarterPack() : Economy.buyPack();
    if (!cards) {
      alert('Ouro insuficiente!');
      return;
    }

    cards.forEach(c => this.addToCollection(c));
    UI.showScreen('pack-opening');
    UI.renderPackOpening(cards);
    UI.updateEconomyDisplay();
  },

  showCollection() {
    UI.showScreen('collection');
    UI.renderCollection(this.collection);
  },

  showShop() {
    UI.showScreen('shop');
    UI.renderShop();
  },

  upgradeCard(card) {
    if (!card.canUpgrade(this.collection)) {
      alert('Cartas insuficientes para upgrade!');
      return;
    }

    const needed = cardDatabase.upgradeRequirements[card.level - 1];
    const sameType = this.collection.filter(c => 
      c.id === card.id && c.rarity === card.rarity && (c.effect || 'none') === (card.effect || 'none') && c.uniqueId !== card.uniqueId
    );
    const toRemove = sameType.slice(0, needed);
    const removedIds = toRemove.map(c => c.uniqueId);

    toRemove.forEach(c => {
      const idx = this.collection.findIndex(x => x.uniqueId === c.uniqueId);
      if (idx !== -1) this.collection.splice(idx, 1);
    });

    this.selectedBattleCards = this.selectedBattleCards.filter(c => !removedIds.includes(c.uniqueId));

    card.upgrade();

    const selectedIdx = this.selectedBattleCards.findIndex(c => c.uniqueId === card.uniqueId);
    if (selectedIdx !== -1) {
      this.selectedBattleCards[selectedIdx] = card;
    }

    this.saveCollection();
    this.saveSelectedCards();
    UI.renderCollection(this.collection);
  },

  async evolveCard(card) {
    const monsterData = cardDatabase.monsters.find(m => m.id === card.id);
    if (!monsterData || !monsterData.evolutionLine) {
      alert('Esta carta não pode evoluir!');
      return;
    }

    const currentStage = monsterData.evolutionStage || 0;
    const requirements = cardDatabase.evolutionRequirements[monsterData.evolutionLine];
    const nextStageReq = requirements?.find(r => r.stage === currentStage + 1);
    
    if (!nextStageReq) {
      alert('Esta carta já atingiu a evolução máxima!');
      return;
    }

    const sameLine = this.collection.filter(c => {
      const cData = cardDatabase.monsters.find(m => m.id === c.id);
      return cData && cData.evolutionLine === monsterData.evolutionLine 
        && cData.evolutionStage === currentStage 
        && c.uniqueId !== card.uniqueId;
    });

    if (sameLine.length < nextStageReq.cardsNeeded) {
      alert(`Cartas insuficientes para evoluir! Precisa de ${nextStageReq.cardsNeeded} cartas do estágio ${currentStage}.`);
      return;
    }

    const oldCardCopy = new Card(
      cardDatabase.monsters.find(m => m.id === card.id),
      card.rarity,
      card.effect
    );
    oldCardCopy.level = card.level;
    oldCardCopy.maxHP = card.maxHP;
    oldCardCopy.currentHP = card.currentHP;

    const evolved = card.evolve(this.collection);
    if (!evolved) {
      alert('Erro ao evoluir a carta!');
      return;
    }

    const toRemove = sameLine.slice(0, nextStageReq.cardsNeeded);
    const removedIds = toRemove.map(c => c.uniqueId);
    
    toRemove.forEach(c => {
      const idx = this.collection.findIndex(x => x.uniqueId === c.uniqueId);
      if (idx !== -1) this.collection.splice(idx, 1);
    });

    this.selectedBattleCards = this.selectedBattleCards.filter(c => !removedIds.includes(c.uniqueId));

    const selectedIdx = this.selectedBattleCards.findIndex(c => c.uniqueId === card.uniqueId);
    if (selectedIdx !== -1) {
      this.selectedBattleCards[selectedIdx] = card;
    }

    this.saveCollection();
    this.saveSelectedCards();
    
    await UI.showEvolutionAnimation(oldCardCopy, card);
    UI.renderCollection(this.collection);
  },

  convertDiamonds(amount) {
    const gold = Economy.convertDiamondsToGold(amount);
    if (gold > 0) {
      UI.updateEconomyDisplay();
      UI.addLog(`Convertido ${amount} diamantes em ${gold} ouro!`);
    } else {
      UI.addLog('Diamantes insuficientes!');
    }
  },

  backToMenu() {
    const resultModal = document.getElementById('result-modal');
    if (resultModal) {
      resultModal.classList.add('hidden');
    }
    UI.showScreen('menu');
  },

  backToShop() {
    UI.showScreen('shop');
    UI.renderShop();
  },

  openNewPack() {
    this.openPack();
  },

  resetAccount() {
    if (confirm('Tem certeza que deseja resetar sua conta? Todo progresso será perdido!')) {
      localStorage.removeItem('cardgame_economy');
      localStorage.removeItem('cardgame_collection');
      localStorage.removeItem('cardgame_selected_cards');
      location.reload();
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Game.init();
});
