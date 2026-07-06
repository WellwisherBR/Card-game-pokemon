class Battle {
  constructor(playerCards, enemyCards, firstTurn = 'player') {
    this.playerBoard = playerCards.slice(0, 3);
    this.playerBench = playerCards.slice(3);
    this.enemyBoard = enemyCards.slice(0, 3);
    this.enemyBench = enemyCards.slice(3);
    this.currentTurn = firstTurn;
    this.round = 1;
    this.selectedAttacker = null;
    this.selectedTarget = null;
    this.logs = [];
    this.isOver = false;
    this.winner = null;
  }

  static rollForFirstTurn() {
    let playerRoll, enemyRoll;
    let attempts = 0;
    const maxAttempts = 100;
    
    do {
      playerRoll = Math.floor(Math.random() * 6) + 1;
      enemyRoll = Math.floor(Math.random() * 6) + 1;
      attempts++;
      
      if (attempts >= maxAttempts) {
        playerRoll = Math.floor(Math.random() * 6) + 1;
        break;
      }
    } while (playerRoll === enemyRoll);
    
    const firstTurn = playerRoll > enemyRoll ? 'player' : 'enemy';
    
    return {
      playerRoll,
      enemyRoll,
      firstTurn,
      isTie: playerRoll === enemyRoll
    };
  }

  getAllPlayerCards() {
    return [...this.playerBoard, ...this.playerBench];
  }

  getAllEnemyCards() {
    return [...this.enemyBoard, ...this.enemyBench];
  }

  selectAttacker(card) {
    if (!card.canAttack()) return false;
    this.selectedAttacker = card;
    return true;
  }

  selectTarget(card) {
    if (!card.canBeTargeted()) return false;
    const isOnBoard = this.playerBoard.some(c => c.uniqueId === card.uniqueId) || 
                      this.enemyBoard.some(c => c.uniqueId === card.uniqueId);
    if (!isOnBoard) return false;
    if (this.selectedAttacker) {
      const attackerIsPlayer = this.isPlayerCard(this.selectedAttacker);
      const targetIsPlayer = this.isPlayerCard(card);
      if (attackerIsPlayer === targetIsPlayer) return false;
    }
    this.selectedTarget = card;
    return true;
  }

  executeAttack() {
    if (!this.selectedAttacker || !this.selectedTarget) return { logs: [], killedCards: [], fireTargetId: null };
    if (!this.selectedAttacker.canAttack() || !this.selectedTarget.canBeTargeted()) return { logs: [], killedCards: [], fireTargetId: null };
    const attacker = this.selectedAttacker;
    const target = this.selectedTarget;
    const attackerIsPlayer = this.isPlayerCard(attacker);
    const targetIsPlayer = this.isPlayerCard(target);
    if (attackerIsPlayer === targetIsPlayer) return { logs: [], killedCards: [], fireTargetId: null };
    const logs = [];
    const killedCards = [];

    if (attacker.effect === 'heal') {
      const allyBoard = this.isPlayerCard(attacker) ? this.playerBoard : this.enemyBoard;
      const aliveAllies = allyBoard.filter(c => c.currentHP > 0 && c.uniqueId !== attacker.uniqueId);
      if (aliveAllies.length > 0) {
        const healTarget = aliveAllies.reduce((lowest, current) => 
          current.currentHP < lowest.currentHP ? current : lowest
        );
        const healAmt = EffectSystem.getHealAmount(attacker);
        healTarget.heal(healAmt);
        logs.push(`💚 ${attacker.name} curou ${healTarget.name} (menor HP) em ${healAmt} HP!`);
      }
    }

    const attackerDamage = attacker.getDamage();
    const targetDamage = target.getDamage();
    
    const targetKilled = target.takeDamage(attackerDamage);
    logs.push(`${attacker.name} atacou ${target.name} causando ${attackerDamage} de dano!`);

    if (attacker.effect !== 'range') {
      const attackerKilled = attacker.takeDamage(targetDamage);
      logs.push(`${target.name} contra-atacou ${attacker.name} causando ${targetDamage} de dano!`);
      
      if (attackerKilled) {
        logs.push(`${attacker.name} foi eliminado!`);
        logs.push(...EffectSystem.onCardKilled(attacker, target));
        killedCards.push(attacker.uniqueId);
      }
    }

    if (targetKilled) {
      logs.push(`${target.name} foi eliminado!`);
      logs.push(...EffectSystem.onCardKilled(target, attacker));
      killedCards.push(target.uniqueId);
    }

    let fireTargetId = null;
    if (attacker.effect === 'fire') {
      const enemyBoard = this.isPlayerCard(attacker) ? this.enemyBoard : this.playerBoard;
      const aliveEnemies = enemyBoard.filter(c => c.currentHP > 0);
      if (aliveEnemies.length > 0) {
        const fireTarget = aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
        const fireDmg = cardDatabase.effects.fire.fixedDamage;
        const fireKilled = fireTarget.takeDamage(fireDmg);
        fireTargetId = fireTarget.uniqueId;
        logs.push(`🔥 ${attacker.name} lançou bola de fogo em ${fireTarget.name} causando ${fireDmg} de dano!`);
        if (fireKilled) {
          logs.push(`${fireTarget.name} foi eliminado pelo fogo!`);
          killedCards.push(fireTarget.uniqueId);
        }
      }
    }

    if (attacker.effect === 'ice' && !targetKilled && !target.frozen) {
      target.applyFreeze();
      logs.push(`❄️ ${attacker.name} congelou ${target.name} por ${cardDatabase.effects.ice.duration} rodada!`);
    }

    attacker.hasAttacked = true;
    this.selectedAttacker = null;
    this.selectedTarget = null;

    return { logs, killedCards, fireTargetId };
  }

  performBenchSwaps(killedCards) {
    const newCards = [];
    killedCards.forEach(uniqueId => {
      const isPlayer = this.getAllPlayerCards().some(c => c.uniqueId === uniqueId);
      const board = isPlayer ? this.playerBoard : this.enemyBoard;
      const bench = isPlayer ? this.playerBench : this.enemyBench;
      
      const boardIdx = board.findIndex(c => c.uniqueId === uniqueId);
      if (boardIdx !== -1 && bench.length > 0) {
        const nextCard = bench.shift();
        board[boardIdx] = nextCard;
        newCards.push(nextCard.uniqueId);
      } else if (boardIdx !== -1) {
        board.splice(boardIdx, 1);
      }
    });
    return newCards;
  }

  autoSwapFromBench(deadCard) {
    const isPlayer = this.isPlayerCard(deadCard);
    const board = isPlayer ? this.playerBoard : this.enemyBoard;
    const bench = isPlayer ? this.playerBench : this.enemyBench;

    const boardIdx = board.findIndex(c => c.uniqueId === deadCard.uniqueId);
    if (boardIdx === -1 || bench.length === 0) return null;

    const nextCard = bench.shift();
    board[boardIdx] = nextCard;
    return { position: boardIdx, newCard: nextCard };
  }

  isPlayerCard(card) {
    return this.getAllPlayerCards().some(c => c.uniqueId === card.uniqueId);
  }

  endRound() {
    const logs = [];
    const killedCards = [];
    const fireEffects = [];

    const playerResult = EffectSystem.processEndOfRound(this.playerBoard, this.enemyBoard);
    logs.push(...playerResult.logs);
    fireEffects.push(...playerResult.fireEffects);

    const enemyResult = EffectSystem.processEndOfRound(this.enemyBoard, this.playerBoard);
    logs.push(...enemyResult.logs);
    fireEffects.push(...enemyResult.fireEffects);

    this.playerBoard.forEach(c => {
      if (c.currentHP <= 0) {
        killedCards.push(c.uniqueId);
      }
    });

    this.enemyBoard.forEach(c => {
      if (c.currentHP <= 0) {
        killedCards.push(c.uniqueId);
      }
    });

    this.playerBoard.forEach(c => c.resetTurn());
    this.enemyBoard.forEach(c => c.resetTurn());

    this.round++;
    this.checkWinCondition();

    return { logs, killedCards, fireEffects };
  }

  checkWinCondition() {
    const playerBoardAlive = this.playerBoard.some(c => c.currentHP > 0);
    const playerBenchAlive = this.playerBench.length > 0;
    const enemyBoardAlive = this.enemyBoard.some(c => c.currentHP > 0);
    const enemyBenchAlive = this.enemyBench.length > 0;

    const playerAlive = playerBoardAlive || playerBenchAlive;
    const enemyAlive = enemyBoardAlive || enemyBenchAlive;

    if (!playerAlive) {
      this.isOver = true;
      this.winner = 'enemy';
    } else if (!enemyAlive) {
      this.isOver = true;
      this.winner = 'player';
    }
  }

  swapCard(cardOnBoard, cardOnBench) {
    const playerIdx = this.playerBoard.findIndex(c => c.uniqueId === cardOnBoard.uniqueId);
    if (playerIdx !== -1) {
      const benchIdx = this.playerBench.findIndex(c => c.uniqueId === cardOnBench.uniqueId);
      if (benchIdx !== -1 && this.playerBench[benchIdx].currentHP > 0) {
        this.playerBoard[playerIdx] = this.playerBench[benchIdx];
        this.playerBench[benchIdx] = cardOnBoard;
        return true;
      }
    }

    const enemyIdx = this.enemyBoard.findIndex(c => c.uniqueId === cardOnBoard.uniqueId);
    if (enemyIdx !== -1) {
      const benchIdx = this.enemyBench.findIndex(c => c.uniqueId === cardOnBench.uniqueId);
      if (benchIdx !== -1 && this.enemyBench[benchIdx].currentHP > 0) {
        this.enemyBoard[enemyIdx] = this.enemyBench[benchIdx];
        this.enemyBench[benchIdx] = cardOnBoard;
        return true;
      }
    }

    return false;
  }

  getAvailableAttackers(side) {
    const cards = side === 'player' ? this.playerBoard : this.enemyBoard;
    return cards.filter(c => c.canAttack());
  }

  getAvailableTargets(side) {
    const cards = side === 'player' ? this.playerBoard : this.enemyBoard;
    return cards.filter(c => c.canBeTargeted());
  }
}
