const AI = {
  chooseAttacker(battle) {
    const attackers = battle.getAvailableAttackers('enemy');
    if (attackers.length === 0) return null;

    attackers.sort((a, b) => b.getDamage() - a.getDamage());
    return attackers[0];
  },

  chooseTarget(battle, attacker) {
    if (!attacker) return null;
    const targets = battle.getAvailableTargets('player');
    if (targets.length === 0) return null;

    const attackerIsPlayer = battle.isPlayerCard(attacker);
    const validTargets = targets.filter(t => battle.isPlayerCard(t) !== attackerIsPlayer);
    if (validTargets.length === 0) return null;

    const lowHP = validTargets.filter(t => t.currentHP <= attacker.getDamage());
    if (lowHP.length > 0) {
      lowHP.sort((a, b) => b.getDamage() - a.getDamage());
      return lowHP[0];
    }

    validTargets.sort((a, b) => a.currentHP - b.currentHP);
    return validTargets[0];
  },

  takeTurn(battle) {
    const logs = [];
    const attacker = this.chooseAttacker(battle);
    if (!attacker) return logs;

    const target = this.chooseTarget(battle, attacker);
    if (!target) return logs;

    battle.selectAttacker(attacker);
    battle.selectTarget(target);
    const attackResult = battle.executeAttack();
    logs.push(...attackResult.logs);

    return logs;
  }
};
