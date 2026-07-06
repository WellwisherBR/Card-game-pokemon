const Economy = {
  gold: 0,
  diamonds: 0,

  init() {
    this.gold = cardDatabase.initialGold;
    this.diamonds = cardDatabase.initialDiamonds;
    this.starterPackBought = false;
  },

  addGold(amount) {
    this.gold += amount;
    this.save();
  },

  addDiamonds(amount) {
    this.diamonds += amount;
    this.save();
  },

  spendGold(amount) {
    if (this.gold >= amount) {
      this.gold -= amount;
      this.save();
      return true;
    }
    return false;
  },

  spendDiamonds(amount) {
    if (this.diamonds >= amount) {
      this.diamonds -= amount;
      this.save();
      return true;
    }
    return false;
  },

  buyPack() {
    if (!this.spendGold(cardDatabase.packPrice)) return null;
    const cards = [];
    for (let i = 0; i < cardDatabase.packSize; i++) {
      cards.push(this.generateRandomCard());
    }
    return cards;
  },

  buyStarterPack() {
    if (this.starterPackBought) return null;
    if (!this.spendGold(cardDatabase.starterPackPrice)) return null;
    const cards = [];
    for (let i = 0; i < cardDatabase.starterPackSize; i++) {
      cards.push(this.generateRandomCard());
    }
    this.starterPackBought = true;
    this.save();
    return cards;
  },

  buyRareCard() {
    if (!this.spendDiamonds(cardDatabase.rareCardPrice)) return null;
    return this.generateRareCard();
  },

  convertDiamondsToGold(diamondAmount) {
    if (!this.spendDiamonds(diamondAmount)) return 0;
    const goldAmount = diamondAmount * cardDatabase.diamondToGoldRate;
    this.addGold(goldAmount);
    return goldAmount;
  },

  generateRandomCard() {
    const rarity = this.rollRarity();
    const availableMonsters = cardDatabase.monsters.filter(m => !m.hidden);
    const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
    let effect = null;
    if (rarity !== 'common') {
      effect = this.rollEffect();
    }
    return new Card(monster, rarity, effect);
  },

  generateRareCard() {
    const availableMonsters = cardDatabase.monsters.filter(m => m.sell === true);
    if (availableMonsters.length === 0) return null;
    const monster = availableMonsters[Math.floor(Math.random() * availableMonsters.length)];
    return this.generateSellCard(monster);
  },

  generateSellCard(monster) {
    const rarity = this.rollRareOrBetter();
    const effect = this.rollEffect();
    return new Card(monster, rarity, effect);
  },

  rollRarity() {
    const weights = cardDatabase.rarityWeights;
    const roll = Math.random();
    let cumulative = 0;
    
    cumulative += weights.legendary;
    if (roll < cumulative) return 'legendary';
    
    cumulative += weights.epic;
    if (roll < cumulative) return 'epic';
    
    cumulative += weights.rare;
    if (roll < cumulative) return 'rare';
    
    return 'common';
  },

  rollRareOrBetter() {
    const roll = Math.random();
    if (roll < 0.20) return 'legendary';
    if (roll < 1.00) return 'epic';
    return 'rare';
  },

  rollEffect() {
    const effects = Object.keys(cardDatabase.effects);
    return effects[Math.floor(Math.random() * effects.length)];
  },

  generateStarterPack() {
    const cards = [];
    for (let i = 0; i < cardDatabase.starterPackSize; i++) {
      cards.push(this.generateRandomCard());
    }
    return cards;
  },

  save() {
    localStorage.setItem('cardgame_economy', JSON.stringify({
      gold: this.gold,
      diamonds: this.diamonds,
      starterPackBought: this.starterPackBought
    }));
  },

  load() {
    const data = localStorage.getItem('cardgame_economy');
    if (data) {
      const parsed = JSON.parse(data);
      this.gold = parsed.gold;
      this.diamonds = parsed.diamonds;
      this.starterPackBought = parsed.starterPackBought || false;
    } else {
      this.init();
    }
  }
};
