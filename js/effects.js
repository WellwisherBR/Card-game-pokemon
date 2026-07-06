const EffectSystem = {
  getHealAmount(card) {
    const baseHeal = cardDatabase.effects.heal.baseHeal[card.rarity] || 2;
    return baseHeal + (card.level - 1) * cardDatabase.effects.heal.upgradeBonus;
  },

  applyEffect(card, effectType, targetCards, allAlliedCards) {
    const effect = cardDatabase.effects[effectType];
    if (!effect) return { applied: false, message: '' };

    switch (effectType) {
      case 'poison':
        return { applied: false, message: '' };
      case 'heal':
        return this.applyHeal(card, allAlliedCards);
      case 'fire':
        return this.applyFire(card, targetCards);
      case 'ice':
        return this.applyIce(card, targetCards, effect);
      case 'range':
        return { applied: true, message: `${card.name} tem Range!` };
      default:
        return { applied: false, message: '' };
    }
  },

  applyHeal(card, alliedCards) {
    const aliveAllies = alliedCards.filter(c => c.currentHP > 0 && c.uniqueId !== card.uniqueId);
    if (aliveAllies.length === 0) return { applied: false, message: '' };
    const healTarget = aliveAllies.reduce((lowest, current) => 
      current.currentHP < lowest.currentHP ? current : lowest
    );
    const healAmt = this.getHealAmount(card);
    healTarget.heal(healAmt);
    return { applied: true, message: `${card.name} curou ${healTarget.name} (menor HP) em ${healAmt} HP!` };
  },

  applyFire(card, enemyCards) {
    const aliveEnemies = enemyCards.filter(c => c.currentHP > 0);
    if (aliveEnemies.length === 0) return { applied: false, message: '' };
    const target = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
    const fireDmg = cardDatabase.effects.fire.fixedDamage;
    target.takeDamage(fireDmg);
    return { applied: true, message: `🔥 ${card.name} queimou ${target.name} causando ${fireDmg} de dano fixo!` };
  },

  applyIce(card, targetCards, effect) {
    const aliveTargets = targetCards.filter(c => c.currentHP > 0 && !c.frozen);
    if (aliveTargets.length === 0) return { applied: false, message: '' };
    const target = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    target.applyFreeze();
    return { applied: true, message: `❄️ ${card.name} congelou ${target.name}!` };
  },

  processEndOfRound(allyCards, enemyCards) {
    const logs = [];
    const fireEffects = [];

    allyCards.forEach(card => {
      if (card.currentHP <= 0) return;

      if (card.frozen) {
        card.removeFreeze();
        logs.push(`${card.name} descongelou!`);
        return;
      }

      if (card.effect === 'heal') {
        const aliveAllies = allyCards.filter(c => c.currentHP > 0 && c.uniqueId !== card.uniqueId);
        if (aliveAllies.length > 0) {
          const healTarget = aliveAllies.reduce((lowest, current) => 
            current.currentHP < lowest.currentHP ? current : lowest
          );
          const healAmt = this.getHealAmount(card);
          healTarget.heal(healAmt);
          logs.push(`💚 ${card.name} curou ${healTarget.name} (menor HP) em ${healAmt} HP!`);
        }
      }

      if (card.poisoned > 0) {
        const poisonDamage = cardDatabase.effects.poison.fixedDamage;
        card.takeDamage(poisonDamage);
        card.poisoned--;
        logs.push(`☠️ ${card.name} sofreu ${poisonDamage} de dano de veneno! (${card.poisoned} rodadas restantes)`);
      }
    });

    return { logs, fireEffects };
  },

  onCardKilled(killedCard, killerCard) {
    const logs = [];
    if (killedCard.effect === 'poison' && killerCard && killerCard.currentHP > 0) {
      killerCard.applyPoison(cardDatabase.effects.poison.duration);
      logs.push(`☠️ ${killedCard.name} envenenou ${killerCard.name}! (${cardDatabase.effects.poison.fixedDamage} dano/rodada por ${cardDatabase.effects.poison.duration} rodadas)`);
    }
    return logs;
  },

  avoidsCounterAttack(card) {
    return card.effect === 'range';
  }
};
