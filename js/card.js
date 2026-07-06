class Card {
  constructor(monsterData, rarity, effect = null) {
    this.uniqueId = this.generateUniqueId();
    this.id = monsterData.id;
    this.name = monsterData.name;
    this.baseHP = monsterData.baseHP;
    this.image = monsterData.image;
    this.rarity = rarity;
    this.effect = effect;
    this.level = 1;
    this.currentHP = this.calculateHP();
    this.maxHP = this.currentHP;
    this.frozen = false;
    this.poisoned = 0;
    this.hasAttacked = false;
  }

  generateUniqueId() {
    return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  calculateHP() {
    const rarityBonus = cardDatabase.rarityBonus[this.rarity] || 0;
    const upgradeBonus = (this.level - 1) * cardDatabase.upgradeBonus;
    return this.baseHP + rarityBonus + upgradeBonus;
  }

  getDamage() {
    return this.currentHP;
  }

  takeDamage(damage) {
    this.currentHP = Math.max(0, this.currentHP - damage);
    return this.currentHP <= 0;
  }

  heal(amount) {
    this.currentHP = Math.min(this.maxHP, this.currentHP + amount);
  }

  canAttack() {
    return !this.frozen && this.currentHP > 0;
  }

  canBeTargeted() {
    return this.currentHP > 0;
  }

  applyFreeze() {
    this.frozen = true;
  }

  removeFreeze() {
    this.frozen = false;
  }

  applyPoison(duration) {
    this.poisoned = duration;
  }

  tickPoison() {
    if (this.poisoned > 0) {
      this.poisoned--;
      return true;
    }
    return false;
  }

  resetTurn() {
    this.hasAttacked = false;
  }

  canUpgrade(collection) {
    const requirements = cardDatabase.upgradeRequirements;
    if (this.level > requirements.length) return false;
    const needed = requirements[this.level - 1];
    const sameType = collection.filter(c => 
      c.id === this.id && c.rarity === this.rarity && (c.effect || 'none') === (this.effect || 'none') && c.uniqueId !== this.uniqueId
    );
    return sameType.length >= needed;
  }

  getUpgradeInfo(collection) {
    const requirements = cardDatabase.upgradeRequirements;
    const needed = this.level <= requirements.length ? requirements[this.level - 1] : 'MAX';
    const sameType = collection.filter(c => 
      c.id === this.id && c.rarity === this.rarity && (c.effect || 'none') === (this.effect || 'none') && c.uniqueId !== this.uniqueId
    );
    return { available: sameType.length, needed: needed, canUpgrade: this.canUpgrade(collection) };
  }

  upgrade() {
    this.level++;
    this.maxHP = this.calculateHP();
    this.currentHP = this.maxHP;
  }

  getRarityColor() {
    return cardDatabase.rarityColors[this.rarity];
  }

  getEffectIcon() {
    if (!this.effect) return '';
    return cardDatabase.effects[this.effect]?.icon || '';
  }

  canEvolve(collection) {
    const monsterData = cardDatabase.monsters.find(m => m.id === this.id);
    if (!monsterData || !monsterData.evolutionLine) return false;

    const currentStage = monsterData.evolutionStage || 0;
    const requirements = cardDatabase.evolutionRequirements[monsterData.evolutionLine];
    if (!requirements) return false;

    const nextStageReq = requirements.find(r => r.stage === currentStage + 1);
    if (!nextStageReq) return false;

    const sameLine = collection.filter(c => {
      const cData = cardDatabase.monsters.find(m => m.id === c.id);
      return cData && cData.evolutionLine === monsterData.evolutionLine 
        && cData.evolutionStage === currentStage 
        && c.uniqueId !== this.uniqueId;
    });

    return sameLine.length >= nextStageReq.cardsNeeded;
  }

  getEvolutionInfo(collection) {
    const monsterData = cardDatabase.monsters.find(m => m.id === this.id);
    if (!monsterData || !monsterData.evolutionLine) return null;

    const currentStage = monsterData.evolutionStage || 0;
    const requirements = cardDatabase.evolutionRequirements[monsterData.evolutionLine];
    if (!requirements) return null;

    const nextStageReq = requirements.find(r => r.stage === currentStage + 1);
    if (!nextStageReq) return { maxStage: true };

    const sameLine = collection.filter(c => {
      const cData = cardDatabase.monsters.find(m => m.id === c.id);
      return cData && cData.evolutionLine === monsterData.evolutionLine 
        && cData.evolutionStage === currentStage 
        && c.uniqueId !== this.uniqueId;
    });

    const nextMonster = cardDatabase.monsters.find(m => 
      m.evolutionLine === monsterData.evolutionLine && m.evolutionStage === currentStage + 1
    );

    return {
      canEvolve: this.canEvolve(collection),
      available: sameLine.length,
      needed: nextStageReq.cardsNeeded,
      currentStage,
      nextStage: currentStage + 1,
      nextCardName: nextMonster?.name || null
    };
  }

  evolve(collection) {
    const monsterData = cardDatabase.monsters.find(m => m.id === this.id);
    if (!monsterData || !monsterData.evolutionLine) return false;

    const currentStage = monsterData.evolutionStage || 0;
    const requirements = cardDatabase.evolutionRequirements[monsterData.evolutionLine];
    if (!requirements) return false;

    const nextStageReq = requirements.find(r => r.stage === currentStage + 1);
    if (!nextStageReq) return false;

    const sameLine = collection.filter(c => {
      const cData = cardDatabase.monsters.find(m => m.id === c.id);
      return cData && cData.evolutionLine === monsterData.evolutionLine 
        && cData.evolutionStage === currentStage 
        && c.uniqueId !== this.uniqueId;
    });

    if (sameLine.length < nextStageReq.cardsNeeded) return false;

    const nextMonster = cardDatabase.monsters.find(m => 
      m.evolutionLine === monsterData.evolutionLine && m.evolutionStage === currentStage + 1
    );

    if (!nextMonster) return false;

    this.id = nextMonster.id;
    this.name = nextMonster.name;
    this.baseHP = nextMonster.baseHP;
    this.image = nextMonster.image;
    this.maxHP = this.calculateHP();
    this.currentHP = this.maxHP;

    return true;
  }

  toJSON() {
    return {
      uniqueId: this.uniqueId,
      id: this.id,
      name: this.name,
      baseHP: this.baseHP,
      image: this.image,
      rarity: this.rarity,
      effect: this.effect,
      level: this.level,
      currentHP: this.currentHP,
      maxHP: this.maxHP
    };
  }

  static fromJSON(data) {
    const monsterData = cardDatabase.monsters.find(m => m.id === data.id);
    const card = new Card(monsterData, data.rarity, data.effect);
    card.uniqueId = data.uniqueId;
    card.level = data.level;
    card.currentHP = data.currentHP;
    card.maxHP = data.maxHP;
    return card;
  }
}
