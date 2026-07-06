const UI = {
  currentScreen: 'menu',
  battle: null,

  init() {
    this.showScreen('menu');
    this.updateEconomyDisplay();
  },

  showScreen(screen) {
    this.currentScreen = screen;
    document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(`screen-${screen}`).classList.remove('hidden');
  },

  updateEconomyDisplay() {
    document.getElementById('gold-display').textContent = Economy.gold;
    document.getElementById('diamond-display').textContent = Economy.diamonds;
  },

  renderCard(card, clickable = false, side = '') {
    const rarityColor = card.getRarityColor();
    const effectIcon = card.getEffectIcon();
    const frozenClass = (side === 'player' || side === 'enemy') && card.frozen ? 'frozen' : '';
    const deadClass = (side === 'player' || side === 'enemy') && card.currentHP <= 0 ? 'dead' : '';
    const selectedClass = card.uniqueId === UI.battle?.selectedAttacker?.uniqueId ? 'selected' : '';
    const targetClass = card.uniqueId === UI.battle?.selectedTarget?.uniqueId ? 'target' : '';

    return `
      <div class="card ${frozenClass} ${deadClass} ${selectedClass} ${targetClass}" 
           style="border-color: ${rarityColor}" 
           data-unique-id="${card.uniqueId}" 
           data-side="${side}"
           ${clickable ? 'onclick="UI.onCardClick(this)"' : ''}>
        <div class="card-rarity" style="background-color: ${rarityColor}"></div>
        <div class="card-image">
          <img src="${card.image}" alt="${card.name}" onerror="this.src='cards/images/placeholder.png'">
        </div>
        <div class="card-name">${card.name}</div>
        <div class="card-stats">
          <span class="card-hp">⚔️ ${side === 'player' || side === 'enemy' ? card.currentHP : card.maxHP}</span>
          <span class="card-level">⭐ ${card.level}</span>
        </div>
        ${effectIcon ? `<div class="card-effect">${effectIcon}</div>` : ''}
        ${card.poisoned > 0 ? `<div class="card-poison">☠️ ${card.poisoned}</div>` : ''}
      </div>
    `;
  },

  renderBattle() {
    if (!this.battle) return;

    const playerBoard = document.getElementById('player-board');
    const playerBench = document.getElementById('player-bench');
    const enemyBoard = document.getElementById('enemy-board');
    const enemyBench = document.getElementById('enemy-bench');

    playerBoard.innerHTML = this.battle.playerBoard.map(c => this.renderCard(c, true, 'player')).join('');
    playerBench.innerHTML = this.renderBenchStack(this.battle.playerBench, 'player');
    enemyBoard.innerHTML = this.battle.enemyBoard.map(c => this.renderCard(c, true, 'enemy')).join('');
    enemyBench.innerHTML = this.renderBenchStack(this.battle.enemyBench, 'enemy');

    document.getElementById('round-display').textContent = `Rodada: ${this.battle.round}`;
    document.getElementById('turn-display').textContent = this.battle.currentTurn === 'player' ? 'Seu Turno' : 'Turno do Inimigo';
  },

  renderBenchStack(benchCards, side) {
    if (benchCards.length === 0) return '<div class="bench-empty">Sem cartas</div>';
    
    const stackSize = benchCards.length;
    return `
      <div class="bench-stack" data-side="${side}">
        <div class="card card-back">
          <div class="card-back-design">
            <div class="card-back-count">${stackSize}</div>
          </div>
        </div>
      </div>
    `;
  },

  onCardClick(element) {
    const uniqueId = element.dataset.uniqueId;
    const side = element.dataset.side;

    if (!this.battle || this.battle.currentTurn !== 'player') return;

    const clickedCard = [...this.battle.playerBoard, ...this.battle.enemyBoard].find(c => c.uniqueId === uniqueId);
    if (!clickedCard) return;

    if (side === 'player') {
      if (clickedCard.canAttack()) {
        this.battle.selectAttacker(clickedCard);
        this.renderBattle();
      }
    } else if (side === 'enemy') {
      if (this.battle.selectedAttacker && clickedCard.canBeTargeted()) {
        this.battle.selectTarget(clickedCard);
        this.renderBattle();
        this.executePlayerAttack();
      }
    }
  },

  async executePlayerAttack() {
    const attacker = this.battle.selectedAttacker;
    const target = this.battle.selectedTarget;
    
    // 1. Captura estado antes do ataque
    const snapshot = this.captureBoardSnapshot();
    
    // 2. Animação física do ataque (movimento + impacto)
    await this.animateAttack(attacker, target);
    
    // 3. Executa lógica do ataque
    const attackResult = this.battle.executeAttack();
    this.addLogs(attackResult.logs);
    const killedCards = attackResult.killedCards;
    
    // 4. Anima efeitos especiais (bola de fogo, cura, gelo) DEPOIS do ataque
    await this.animateAttackEffects(attacker, target, attackResult.logs, attackResult.fireTargetId);
    
    // 5. Anima mortes das cartas derrotadas
    await this.animateDeaths(snapshot);
    
    // 6. Faz swap do banco e anima novas cartas entrando
    const newCards = this.battle.performBenchSwaps(killedCards);
    this.renderBattle();
    
    if (newCards.length > 0) {
      await this.animateNewCardsEntering(newCards);
    }

    await this.delay(300);

    this.battle.currentTurn = 'enemy';
    this.renderBattle();

    await this.delay(800);
    await this.executeEnemyTurn();
  },

  async executeEnemyTurn() {
    const attacker = AI.chooseAttacker(this.battle);
    const target = AI.chooseTarget(this.battle, attacker);
    
    if (attacker && target) {
      this.battle.selectAttacker(attacker);
      this.battle.selectTarget(target);
      
      // 1. Captura estado antes do ataque
      const snapshot = this.captureBoardSnapshot();
      
      // 2. Animação física do ataque
      await this.animateAttack(attacker, target);
      
      // 3. Executa lógica do ataque
      const { logs, killedCards, fireTargetId } = this.battle.executeAttack();
      this.addLogs(logs);
      
      // 4. Anima efeitos especiais DEPOIS do ataque
      await this.animateAttackEffects(attacker, target, logs, fireTargetId);
      
      // 5. Anima mortes
      await this.animateDeaths(snapshot);
      
      // 6. Faz swap do banco e anima novas cartas
      const newCards = this.battle.performBenchSwaps(killedCards);
      this.renderBattle();
      
      if (newCards.length > 0) {
        await this.animateNewCardsEntering(newCards);
      }
    }

    await this.delay(500);
    const preEndRoundSnapshot = this.captureBoardSnapshot();
    const endRoundResult = this.battle.endRound();
    this.addLogs(endRoundResult.logs);
    
    // Anima mortes por veneno/efeitos de fim de rodada
    if (endRoundResult.killedCards.length > 0) {
      await this.animateDeaths(preEndRoundSnapshot);
      
      const newCards = this.battle.performBenchSwaps(endRoundResult.killedCards);
      this.renderBattle();
      
      if (newCards.length > 0) {
        await this.animateNewCardsEntering(newCards);
      }
    } else {
      this.renderBattle();
    }

    if (this.battle.isOver) {
      await this.delay(1000);
      this.showBattleResult();
      return;
    }

    this.battle.currentTurn = 'player';
    this.renderBattle();
  },

  // Animação física do ataque (movimento e impacto visual)
  async animateAttack(attacker, target) {
    if (!attacker || !target) return;

    const attackerEl = document.querySelector(`[data-unique-id="${attacker.uniqueId}"]`);
    const targetEl = document.querySelector(`[data-unique-id="${target.uniqueId}"]`);

    if (attackerEl) {
      attackerEl.classList.add('attacking');
      await this.delay(300);
    }

    if (targetEl) {
      targetEl.classList.add('taking-damage');
      await this.delay(300);
    }

    // Contra-ataque visual (atacante recebe dano se não for range)
    if (attacker.effect !== 'range' && attackerEl) {
      attackerEl.classList.remove('attacking');
      attackerEl.classList.add('taking-damage');
      await this.delay(300);
    }

    // Limpa animações
    if (attackerEl) attackerEl.classList.remove('attacking', 'taking-damage');
    if (targetEl) targetEl.classList.remove('taking-damage');
  },

  // Anima efeitos especiais DEPOIS do ataque principal
  async animateAttackEffects(attacker, target, logs, fireTargetId) {
    if (!attacker || !target) return;

    // Bola de fogo - executa DEPOIS do ataque, mirando na carta aleatória atingida
    if (attacker.effect === 'fire' && fireTargetId) {
      const attackerEl = document.querySelector(`[data-unique-id="${attacker.uniqueId}"]`);
      const fireTargetEl = document.querySelector(`[data-unique-id="${fireTargetId}"]`);
      if (attackerEl && fireTargetEl) {
        await this.animateFireball(attackerEl, fireTargetEl);
      }
    }

    // Cura
    if (attacker.effect === 'heal') {
      const allyBoard = this.battle.isPlayerCard(attacker) ? this.battle.playerBoard : this.battle.enemyBoard;
      const aliveAllies = allyBoard.filter(c => c.currentHP > 0 && c.uniqueId !== attacker.uniqueId);
      if (aliveAllies.length > 0) {
        const healTarget = aliveAllies[0];
        const healEl = document.querySelector(`[data-unique-id="${healTarget.uniqueId}"]`);
        if (healEl) {
          healEl.classList.add('healing');
          await this.delay(400);
          healEl.classList.remove('healing');
        }
      }
    }

    // Congelamento
    if (attacker.effect === 'ice' && !target.frozen) {
      const targetEl = document.querySelector(`[data-unique-id="${target.uniqueId}"]`);
      if (targetEl) {
        targetEl.classList.add('frozen');
        await this.delay(200);
      }
    }
  },

  // Anima a bola de fogo voando da origem até o alvo
  async animateFireball(fromEl, toEl) {
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    const startX = fromRect.left + fromRect.width / 2 - 25;
    const startY = fromRect.top + fromRect.height / 2 - 25;
    const endX = toRect.left + toRect.width / 2 - 25;
    const endY = toRect.top + toRect.height / 2 - 25;

    const fireball = document.createElement('div');
    fireball.className = 'fireball';
    fireball.innerHTML = '<div class="fireball-trail"></div><div class="fireball-core"></div><div class="fireball-sparks"></div>';
    fireball.style.left = `${startX}px`;
    fireball.style.top = `${startY}px`;
    fireball.style.opacity = '0';
    fireball.style.transform = 'scale(0.3)';
    document.body.appendChild(fireball);

    // Fase 1: Surge na origem
    await fireball.animate([
      { transform: 'scale(0.3) rotate(0deg)', opacity: 0 },
      { transform: 'scale(1) rotate(90deg)', opacity: 1 }
    ], { duration: 200, easing: 'ease-out', fill: 'forwards' }).finished;

    // Fase 2: Voa até o alvo com curva
    const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
    const duration = Math.min(800, Math.max(400, distance * 0.8));

    await fireball.animate([
      { 
        left: `${startX}px`, 
        top: `${startY}px`, 
        transform: 'scale(1) rotate(90deg)',
        offset: 0
      },
      { 
        left: `${(startX + endX) / 2}px`, 
        top: `${(startY + endY) / 2 - 40}px`, 
        transform: 'scale(1.1) rotate(270deg)',
        offset: 0.5
      },
      { 
        left: `${endX}px`, 
        top: `${endY}px`, 
        transform: 'scale(0.9) rotate(450deg)',
        offset: 1
      }
    ], { duration: duration, easing: 'ease-in-out' }).finished;

    fireball.remove();

    // Explosão no alvo
    await this.animateFireExplosion(toRect);

    // Efeito de impacto na carta
    toEl.classList.add('fire-hit');
    await this.delay(800);
    toEl.classList.remove('fire-hit');
  },

  async animateFireExplosion(targetRect) {
    const explosion = document.createElement('div');
    explosion.className = 'fire-explosion';
    explosion.style.left = `${targetRect.left + targetRect.width / 2 - 60}px`;
    explosion.style.top = `${targetRect.top + targetRect.height / 2 - 60}px`;

    const ring = document.createElement('div');
    ring.className = 'fire-explosion-ring';
    explosion.appendChild(ring);

    // Partículas
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'fire-explosion-particles';

    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.className = 'fire-particle';
      const angle = (i * 30) * (Math.PI / 180);
      const distance = 40 + Math.random() * 20;
      const tx = Math.cos(angle) * distance;
      const ty = Math.sin(angle) * distance;

      particle.style.left = '50%';
      particle.style.top = '50%';
      particle.style.transform = 'translate(-50%, -50%)';

      particle.animate([
        { transform: 'translate(-50%, -50%) scale(1)', opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) scale(0.3)`, opacity: 0 }
      ], { duration: 500 + Math.random() * 200, easing: 'ease-out' });

      particlesContainer.appendChild(particle);
    }

    explosion.appendChild(particlesContainer);
    document.body.appendChild(explosion);

    // Anima o anel de explosão
    await ring.animate([
      { transform: 'scale(0)', opacity: 1 },
      { transform: 'scale(1.5)', opacity: 0 }
    ], { duration: 400, easing: 'ease-out' }).finished;

    explosion.remove();
  },

  // Captura estado do tabuleiro antes do ataque
  captureBoardSnapshot() {
    return {
      playerBoard: this.battle.playerBoard.map(c => ({ uniqueId: c.uniqueId, currentHP: c.currentHP })),
      enemyBoard: this.battle.enemyBoard.map(c => ({ uniqueId: c.uniqueId, currentHP: c.currentHP })),
      playerBench: this.battle.playerBench.map(c => ({ uniqueId: c.uniqueId })),
      enemyBench: this.battle.enemyBench.map(c => ({ uniqueId: c.uniqueId }))
    };
  },

  // Identifica cartas mortas comparando snapshot
  getKilledCards(snapshot) {
    const killedCards = [];

    this.battle.playerBoard.forEach(card => {
      const before = snapshot.playerBoard.find(c => c.uniqueId === card.uniqueId);
      if (before && before.currentHP > 0 && card.currentHP <= 0) {
        killedCards.push(card.uniqueId);
      }
    });

    this.battle.enemyBoard.forEach(card => {
      const before = snapshot.enemyBoard.find(c => c.uniqueId === card.uniqueId);
      if (before && before.currentHP > 0 && card.currentHP <= 0) {
        killedCards.push(card.uniqueId);
      }
    });

    return killedCards;
  },

  // Anima mortes: detecta cartas com HP reduzido a 0 e aplica animação dying
  async animateDeaths(snapshot) {
    const deadIds = this.getKilledCards(snapshot);

    if (deadIds.length === 0) return;

    for (const id of deadIds) {
      const el = document.querySelector(`[data-unique-id="${id}"]`);
      if (el) el.classList.add('dying');
    }

    await this.delay(800);
  },

  // Anima cartas entrando do deck reserva com flip
  async animateNewCardsEntering(newCards) {
    if (!newCards || newCards.length === 0) return;

    // Adiciona entering imediatamente antes do próximo paint para evitar flash
    for (const uniqueId of newCards) {
      const el = document.querySelector(`[data-unique-id="${uniqueId}"]`);
      if (el) {
        el.style.opacity = '0';
        el.style.visibility = 'hidden';
      }
    }

    // Força reflow e adiciona entering no próximo frame
    await new Promise(resolve => requestAnimationFrame(() => {
      for (const uniqueId of newCards) {
        const el = document.querySelector(`[data-unique-id="${uniqueId}"]`);
        if (el) {
          el.style.opacity = '';
          el.style.visibility = '';
          el.classList.add('entering');
        }
      }
      requestAnimationFrame(resolve);
    }));

    for (const uniqueId of newCards) {
      const el = document.querySelector(`[data-unique-id="${uniqueId}"]`);
      if (el) {
        setTimeout(() => el.classList.add('flipped'), 500);
      }
    }

    await this.delay(950);

    for (const uniqueId of newCards) {
      const el = document.querySelector(`[data-unique-id="${uniqueId}"]`);
      if (el) {
        el.classList.remove('entering', 'flipped');
      }
    }
  },

  addLogs(logs) {
    const logContainer = document.getElementById('battle-log');
    logs.forEach(log => {
      const logEntry = document.createElement('div');
      logEntry.className = 'log-entry';
      logEntry.textContent = log;
      logContainer.appendChild(logEntry);
    });
    logContainer.scrollTop = logContainer.scrollHeight;
  },

  showBattleResult() {
    const result = this.battle.winner === 'player' ? 'Vitória!' : 'Derrota!';
    const reward = this.battle.winner === 'player' ? 50 : 10;
    Economy.addGold(reward);
    this.updateEconomyDisplay();

    const modal = document.getElementById('result-modal');
    document.getElementById('result-text').textContent = result;
    document.getElementById('result-reward').textContent = `+${reward} ouro`;
    modal.classList.remove('hidden');
  },

  renderCollection(collection) {
    const container = document.getElementById('collection-grid');
    const selectedIds = Game.selectedBattleCards.map(c => c.uniqueId);
    
    const totalCards = collection.length;
    const byRarity = {
      common: collection.filter(c => c.rarity === 'common').length,
      rare: collection.filter(c => c.rarity === 'rare').length,
      epic: collection.filter(c => c.rarity === 'epic').length,
      legendary: collection.filter(c => c.rarity === 'legendary').length
    };
    
    const byEffect = {
      poison: collection.filter(c => c.effect === 'poison').length,
      heal: collection.filter(c => c.effect === 'heal').length,
      fire: collection.filter(c => c.effect === 'fire').length,
      ice: collection.filter(c => c.effect === 'ice').length,
      range: collection.filter(c => c.effect === 'range').length,
      none: collection.filter(c => !c.effect).length
    };
    
    const filters = this.getCollectionFilters();
    let filteredCollection = [...collection];
    
    if (filters.rarity !== 'all') {
      filteredCollection = filteredCollection.filter(c => c.rarity === filters.rarity);
    }
    
    if (filters.effect !== 'all') {
      filteredCollection = filteredCollection.filter(c => c.effect === filters.effect);
    }
    
    if (filters.search) {
      filteredCollection = filteredCollection.filter(c => 
        c.name.toLowerCase().includes(filters.search.toLowerCase())
      );
    }
    
    filteredCollection.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'rarity': 
          const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };
          return rarityOrder[b.rarity] - rarityOrder[a.rarity];
        case 'level': return b.level - a.level;
        case 'hp': return b.maxHP - a.maxHP;
        case 'damage': return b.getDamage() - a.getDamage();
        default: return 0;
      }
    });
    
    const groupMap = new Map();
    filteredCollection.forEach(c => {
      const key = `${c.id}_${c.rarity}_${c.effect || 'none'}`;
      if (!groupMap.has(key)) {
        groupMap.set(key, { card: c, count: 0, uniqueIds: [] });
      }
      const group = groupMap.get(key);
      group.count++;
      group.uniqueIds.push(c.uniqueId);
    });
    const groupedCards = Array.from(groupMap.values());
    
    const selectedSlotsHtml = [];
    for (let i = 0; i < 6; i++) {
      const c = Game.selectedBattleCards[i];
      if (c) {
        selectedSlotsHtml.push(`
          <div class="slot-mini filled" onclick="UI.toggleCardSelection('${c.uniqueId}')" title="${c.name}">
            <div class="slot-mini-num">${i + 1}</div>
            <img src="${c.image}" alt="${c.name}" onerror="this.src='cards/images/placeholder.png'">
            <div class="slot-mini-name">${c.name}</div>
            <div class="slot-mini-hp">${c.maxHP}</div>
          </div>
        `);
      } else {
        selectedSlotsHtml.push(`
          <div class="slot-mini empty">
            <div class="slot-empty-icon">?</div>
          </div>
        `);
      }
    }
    
    const cardsHtml = groupedCards.map(group => {
      const c = group.card;
      const isSelected = selectedIds.includes(c.uniqueId);
      const selectedClass = isSelected ? 'card-selected' : '';
      const rarityColor = c.getRarityColor();
      const rarityLabel = c.rarity.charAt(0).toUpperCase() + c.rarity.slice(1);
      const effectLabel = c.effect ? c.effect.charAt(0).toUpperCase() + c.effect.slice(1) : 'Sem efeito';
      
      return `
        <div class="collection-card-wrapper ${selectedClass}" onclick="UI.openCardDetail('${c.id}', '${c.rarity}', '${c.effect || 'none'}')">
          ${this.renderCard(c, false, 'collection')}
          ${isSelected ? '<div class="selection-badge">✓</div>' : ''}
          ${group.count > 1 ? `<div class="card-count-badge">${group.count}</div>` : ''}
          <div class="card-info-overlay">
            <div class="card-info-rarity">${rarityLabel}</div>
            <div class="card-info-effect">${effectLabel}</div>
            <div class="card-info-damage">⚔️ ${c.getDamage()}</div>
          </div>
          <div class="card-tooltip">
            <div class="tooltip-header">
              <strong>${c.name}</strong>
              <span class="tooltip-rarity" style="color: ${rarityColor}">${rarityLabel}</span>
            </div>
            <div class="tooltip-stats">
              <div>❤️ HP: ${c.maxHP}</div>
              <div>⚔️ Dano: ${c.getDamage()}</div>
              <div>⭐ Nível: ${c.level}</div>
            </div>
            ${c.effect ? `<div class="tooltip-effect">✨ Efeito: ${effectLabel}</div>` : ''}
            <div class="tooltip-hint">Clique para ${isSelected ? 'remover' : 'selecionar'}</div>
          </div>
        </div>
      `;
    }).join('');
    
    container.innerHTML = `
      <div class="collection-panel">
        <div class="collection-panel-top">
          <div class="collection-panel-title">📚 Coleção (${totalCards})</div>
          
          <div class="collection-panel-stats">
            <div class="panel-stat rarity-common">
              <span class="panel-stat-label">Comum</span>
              <span class="panel-stat-value">${byRarity.common}</span>
            </div>
            <div class="panel-stat rarity-rare">
              <span class="panel-stat-label">Rara</span>
              <span class="panel-stat-value">${byRarity.rare}</span>
            </div>
            <div class="panel-stat rarity-epic">
              <span class="panel-stat-label">Épica</span>
              <span class="panel-stat-value">${byRarity.epic}</span>
            </div>
            <div class="panel-stat rarity-legendary">
              <span class="panel-stat-label">Lendária</span>
              <span class="panel-stat-value">${byRarity.legendary}</span>
            </div>
          </div>
          
          <div class="collection-panel-controls">
            <input type="text" id="search-input" placeholder="🔍 Buscar..." 
                   value="${filters.search || ''}" 
                   oninput="UI.updateCollectionFilter('search', this.value)">
            
            <select id="filter-rarity" onchange="UI.updateCollectionFilter('rarity', this.value)">
              <option value="all" ${filters.rarity === 'all' ? 'selected' : ''}>Todas Raridades</option>
              <option value="common" ${filters.rarity === 'common' ? 'selected' : ''}>Comum</option>
              <option value="rare" ${filters.rarity === 'rare' ? 'selected' : ''}>Rara</option>
              <option value="epic" ${filters.rarity === 'epic' ? 'selected' : ''}>Épica</option>
              <option value="legendary" ${filters.rarity === 'legendary' ? 'selected' : ''}>Lendária</option>
            </select>
            
            <select id="filter-effect" onchange="UI.updateCollectionFilter('effect', this.value)">
              <option value="all" ${filters.effect === 'all' ? 'selected' : ''}>Todos Efeitos</option>
              <option value="poison" ${filters.effect === 'poison' ? 'selected' : ''}>Veneno (${byEffect.poison})</option>
              <option value="heal" ${filters.effect === 'heal' ? 'selected' : ''}>Cura (${byEffect.heal})</option>
              <option value="fire" ${filters.effect === 'fire' ? 'selected' : ''}>Fogo (${byEffect.fire})</option>
              <option value="ice" ${filters.effect === 'ice' ? 'selected' : ''}>Gelo (${byEffect.ice})</option>
              <option value="range" ${filters.effect === 'range' ? 'selected' : ''}>Alcance (${byEffect.range})</option>
            </select>
            
            <select id="sort-by" onchange="UI.updateCollectionFilter('sortBy', this.value)">
              <option value="rarity" ${filters.sortBy === 'rarity' ? 'selected' : ''}>Raridade</option>
              <option value="name" ${filters.sortBy === 'name' ? 'selected' : ''}>Nome</option>
              <option value="level" ${filters.sortBy === 'level' ? 'selected' : ''}>Nível</option>
              <option value="hp" ${filters.sortBy === 'hp' ? 'selected' : ''}>HP</option>
            </select>
            
            <button class="panel-btn panel-btn-auto" onclick="UI.selectAllCards()">✓ Auto</button>
            <button class="panel-btn panel-btn-clear" onclick="UI.clearSelection()">✗ Limpar</button>
            <button class="panel-btn panel-btn-battle" onclick="Game.startBattle()" ${Game.selectedBattleCards.length < 6 ? 'disabled' : ''}>
              ⚔️ Batalhar (${Game.selectedBattleCards.length}/6)
            </button>
          </div>
        </div>
        
        <div class="selected-slots">
          ${selectedSlotsHtml.join('')}
        </div>
      </div>
      
      <div class="collection-grid">${cardsHtml}</div>
      
      ${filteredCollection.length === 0 ? '<div class="no-results">Nenhuma carta encontrada com esses filtros.</div>' : ''}
    `;
  },

  getCollectionFilters() {
    if (!this.collectionFilters) {
      this.collectionFilters = {
        search: '',
        rarity: 'all',
        effect: 'all',
        sortBy: 'rarity'
      };
    }
    return this.collectionFilters;
  },

  updateCollectionFilter(filterType, value) {
    const filters = this.getCollectionFilters();
    filters[filterType] = value;
    this.renderCollection(Game.collection);
  },

  selectAllCards() {
    if (Game.collection.length < 6) {
      alert(`Você tem apenas ${Game.collection.length} cartas. Selecione pelo menos 6 cartas para batalhar!`);
      return;
    }
    
    const sorted = [...Game.collection].sort((a, b) => b.maxHP - a.maxHP);
    
    Game.selectedBattleCards = [];
    sorted.slice(0, 6).forEach(c => Game.selectedBattleCards.push(c));
    Game.saveSelectedCards();
    this.renderCollection(Game.collection);
  },

  clearSelection() {
    Game.selectedBattleCards = [];
    Game.saveSelectedCards();
    this.renderCollection(Game.collection);
  },

  toggleCardSelection(uniqueId) {
    const card = Game.collection.find(c => c.uniqueId === uniqueId);
    if (card) {
      Game.toggleCardSelection(card);
      this.renderCollection(Game.collection);
    }
  },

  openCardDetail(cardId, rarity, effect) {
    const matchingCards = Game.collection.filter(c => 
      c.id === cardId && c.rarity === rarity && (c.effect || 'none') === effect
    );
    
    if (matchingCards.length === 0) return;
    
    const card = matchingCards[0];
    const rarityColor = card.getRarityColor();
    const rarityLabel = card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1);
    const effectLabel = card.effect ? card.effect.charAt(0).toUpperCase() + card.effect.slice(1) : 'Sem efeito';
    const effectDescription = card.effect ? cardDatabase.effects[card.effect]?.description || '' : '';
    
    const canUpgrade = card.canUpgrade(Game.collection);
    const upgradeInfo = card.getUpgradeInfo(Game.collection);
    const evolutionInfo = card.getEvolutionInfo(Game.collection);
    
    const modal = document.getElementById('card-detail-modal');
    const body = document.getElementById('card-detail-body');
    
    body.innerHTML = `
      <div class="card-detail-header" style="border-color: ${rarityColor}">
        <img src="${card.image}" alt="${card.name}" onerror="this.src='cards/images/placeholder.png'">
        <div class="card-detail-info">
          <h2>${card.name}</h2>
          <div class="card-detail-rarity" style="color: ${rarityColor}">${rarityLabel}</div>
          <div class="card-detail-stats">
            <div>❤️ HP: ${card.maxHP}</div>
            <div>⚔️ Dano: ${card.getDamage()}</div>
            <div>⭐ Nível: ${card.level}</div>
          </div>
          ${card.effect ? `
            <div class="card-detail-effect">
              <div class="effect-name">✨ ${effectLabel}</div>
              <div class="effect-desc">${effectDescription}</div>
            </div>
          ` : ''}
          <div class="card-detail-count">Quantidade: ${matchingCards.length}</div>
        </div>
      </div>
      
      <div class="card-detail-actions">
        <button class="panel-btn panel-btn-battle" onclick="UI.selectCardFromDetail('${card.uniqueId}')">
          ${Game.selectedBattleCards.some(c => c.uniqueId === card.uniqueId) ? '✓ Selecionada' : '⚔️ Selecionar para Batalha'}
        </button>
        
        ${canUpgrade ? `
          <button class="panel-btn panel-btn-upgrade" onclick="UI.upgradeCardFromDetail('${card.id}', '${card.rarity}', '${card.effect || 'none'}')">
            ⬆️ Upgrade (${upgradeInfo.available}/${upgradeInfo.needed})
          </button>
        ` : upgradeInfo ? `
          <button class="panel-btn" disabled>
            ⬆️ Upgrade (${upgradeInfo.available}/${upgradeInfo.needed})
          </button>
        ` : ''}
        
        ${evolutionInfo && !evolutionInfo.maxStage ? `
          ${evolutionInfo.canEvolve ? `
            <button class="panel-btn panel-btn-evolve" onclick="UI.evolveCardFromDetail('${card.id}', '${card.rarity}', '${card.effect || 'none'}')">
              🌟 Evoluir (${evolutionInfo.available}/${evolutionInfo.needed})
            </button>
          ` : `
            <button class="panel-btn" disabled>
              🌟 Evoluir (${evolutionInfo.available}/${evolutionInfo.needed})
            </button>
          `}
        ` : ''}
      </div>
      
      <div class="card-detail-upgrade-info">
        ${upgradeInfo ? `
          <div>Próximo nível: ${card.level + 1}</div>
          <div>Cartas necessárias: ${upgradeInfo.needed}</div>
          <div>Cartas disponíveis: ${upgradeInfo.available}</div>
        ` : ''}
        ${evolutionInfo && !evolutionInfo.maxStage ? `
          <hr style="margin: 8px 0; border-color: rgba(255,255,255,0.2);">
          <div>Próxima evolução: ${evolutionInfo.nextCardName || 'Desconhecida'}</div>
          <div>Cartas necessárias: ${evolutionInfo.needed}</div>
          <div>Cartas disponíveis: ${evolutionInfo.available}</div>
        ` : ''}
        ${evolutionInfo && evolutionInfo.maxStage ? `
          <div>✨ Evolução máxima atingida!</div>
        ` : ''}
      </div>
    `;
    
    modal.classList.remove('hidden');
  },

  closeCardDetail(event) {
    if (event && event.target.id !== 'card-detail-modal') return;
    document.getElementById('card-detail-modal').classList.add('hidden');
  },

  selectCardFromDetail(uniqueId) {
    this.toggleCardSelection(uniqueId);
    this.closeCardDetail();
  },

  upgradeCardFromDetail(cardId, rarity, effect) {
    const card = Game.collection.find(c => 
      c.id === cardId && c.rarity === rarity && (c.effect || 'none') === effect
    );
    
    if (card) {
      Game.upgradeCard(card);
      this.closeCardDetail();
      this.renderCollection(Game.collection);
    }
  },

  async evolveCardFromDetail(cardId, rarity, effect) {
    const card = Game.collection.find(c => 
      c.id === cardId && c.rarity === rarity && (c.effect || 'none') === effect
    );
    
    if (card) {
      this.closeCardDetail();
      await Game.evolveCard(card);
    }
  },

  renderPackOpening(cards) {
    const container = document.getElementById('pack-cards');
    container.innerHTML = cards.map(c => this.renderCard(c, false, 'pack')).join('');
  },

  renderShop() {
    const shopCards = document.getElementById('shop-cards');
    
    let packsHtml = '';
    
    if (!Economy.starterPackBought) {
      packsHtml += `
        <div class="shop-item shop-pack" onclick="UI.buyStarterPack()">
          <div class="pack-icon">🎁</div>
          <div class="pack-name">Starter Pack</div>
          <div class="pack-description">6 cartas aleatórias<br><small>(1x por conta)</small></div>
          <div class="shop-price">💰 ${cardDatabase.starterPackPrice}</div>
        </div>
      `;
    }
    
    packsHtml += `
      <div class="shop-item shop-pack" onclick="UI.buyBasicPack()">
        <div class="pack-icon">🎴</div>
        <div class="pack-name">Basic Pack</div>
        <div class="pack-description">4 cartas aleatórias</div>
        <div class="shop-price">💰 ${cardDatabase.packPrice}</div>
      </div>
    `;
    
    const rareCards = [];
    const sellableMonsters = cardDatabase.monsters.filter(m => m.sell === true);
    const maxCards = Math.min(5, sellableMonsters.length);
    
    for (let i = 0; i < maxCards; i++) {
      const card = Economy.generateRareCard();
      if (card) rareCards.push(card);
    }
    
    const rareCardsHtml = rareCards.length > 0 ? rareCards.map((c, idx) => `
      <div class="shop-item" onclick="UI.buyShopCard(${idx})">
        ${this.renderCard(c, false, 'shop')}
        <div class="shop-price">💎 ${cardDatabase.rareCardPrice}</div>
      </div>
    `).join('') : '<div class="shop-empty">Nenhuma carta especial disponível</div>';
    
    shopCards.innerHTML = packsHtml + rareCardsHtml;
    window.shopCards = rareCards;
  },

  buyStarterPack() {
    if (Economy.starterPackBought) {
      alert('Você já comprou o Starter Pack!');
      return;
    }
    
    const cards = Economy.buyStarterPack();
    if (!cards) {
      alert('Ouro insuficiente!');
      return;
    }

    cards.forEach(c => Game.addToCollection(c));
    this.updateEconomyDisplay();
    this.showScreen('pack-opening');
    this.renderPackOpening(cards);
  },

  buyBasicPack() {
    const cards = Economy.buyPack();
    if (!cards) {
      alert('Ouro insuficiente!');
      return;
    }

    cards.forEach(c => Game.addToCollection(c));
    this.updateEconomyDisplay();
    this.showScreen('pack-opening');
    this.renderPackOpening(cards);
  },

  buyShopCard(index) {
    const card = window.shopCards[index];
    if (!card) return;

    if (Economy.spendDiamonds(cardDatabase.rareCardPrice)) {
      Game.addToCollection(card);
      this.updateEconomyDisplay();
      console.log(`Comprou ${card.name}!`);
      this.renderShop();
    } else {
      console.log('Diamantes insuficientes!');
    }
  },

  diceFaces: ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'],

  showDiceRoll() {
    const modal = document.getElementById('dice-modal');
    const playerDice = document.getElementById('dice-player');
    const enemyDice = document.getElementById('dice-enemy');
    const playerRoll = document.getElementById('dice-player-roll');
    const enemyRoll = document.getElementById('dice-enemy-roll');
    const message = document.getElementById('dice-message');
    const continueBtn = document.getElementById('dice-continue-btn');

    for (let i = 1; i <= 6; i++) {
      playerDice.classList.remove(`show-${i}`);
      enemyDice.classList.remove(`show-${i}`);
    }
    playerDice.classList.remove('rolling', 'landing');
    enemyDice.classList.remove('rolling', 'landing');
    playerDice.style.transform = '';
    enemyDice.style.transform = '';
    playerRoll.textContent = '-';
    playerRoll.className = 'dice-result';
    enemyRoll.textContent = '-';
    enemyRoll.className = 'dice-result';
    message.textContent = 'Rolando dados...';
    message.className = 'dice-message';
    continueBtn.classList.add('hidden');
    modal.classList.remove('hidden');

    setTimeout(() => this.rollDice(), 400);
  },

  async animateDiceRoll(element, targetValue, duration) {
    const targetRotations = {
      1: { x: 0, y: 0 },
      2: { x: 0, y: 180 },
      3: { x: 0, y: 90 },
      4: { x: 0, y: -90 },
      5: { x: -90, y: 0 },
      6: { x: 90, y: 0 }
    };

    const target = targetRotations[targetValue];
    const start = performance.now();
    const totalSpins = 4;
    const finalX = target.x + (totalSpins * 360);
    const finalY = target.y + (totalSpins * 360);

    return new Promise(resolve => {
      const animate = (now) => {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        
        const eased = 1 - Math.pow(1 - progress, 4);
        
        const currentX = finalX * (1 - eased) + target.x * eased;
        const currentY = finalY * (1 - eased) + target.y * eased;
        
        const bounceHeight = Math.sin(progress * Math.PI) * 80 * (1 - progress);
        
        element.style.transform = `rotateX(${currentX}deg) rotateY(${currentY}deg) translateY(-${bounceHeight}px)`;
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          element.style.transform = `rotateX(${target.x}deg) rotateY(${target.y}deg)`;
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  },

  async rollDice() {
    const playerDice = document.getElementById('dice-player');
    const enemyDice = document.getElementById('dice-enemy');
    const playerRollEl = document.getElementById('dice-player-roll');
    const enemyRollEl = document.getElementById('dice-enemy-roll');
    const message = document.getElementById('dice-message');

    let playerResult = Math.floor(Math.random() * 6) + 1;
    let enemyResult = Math.floor(Math.random() * 6) + 1;

    while (playerResult === enemyResult) {
      playerResult = Math.floor(Math.random() * 6) + 1;
      enemyResult = Math.floor(Math.random() * 6) + 1;
    }

    await Promise.all([
      this.animateDiceRoll(playerDice, playerResult, 2000),
      this.animateDiceRoll(enemyDice, enemyResult, 2000)
    ]);

    playerRollEl.textContent = playerResult;
    enemyRollEl.textContent = enemyResult;

    const firstTurn = playerResult > enemyResult ? 'player' : 'enemy';

    if (firstTurn === 'player') {
      playerRollEl.className = 'dice-result winner';
      enemyRollEl.className = 'dice-result loser';
      message.textContent = 'Você começa! 🎉';
      message.className = 'dice-message player-wins';
    } else {
      enemyRollEl.className = 'dice-result winner';
      playerRollEl.className = 'dice-result loser';
      message.textContent = 'Inimigo começa! 💀';
      message.className = 'dice-message enemy-wins';
    }

    this.diceResult = firstTurn;

    await this.delay(1000);
    document.getElementById('dice-continue-btn').classList.remove('hidden');
  },

  continueAfterDice() {
    Game.finalizeBattleStart(this.diceResult);
  },

  hideDiceModal() {
    document.getElementById('dice-modal').classList.add('hidden');
  },

  async showEvolutionAnimation(oldCard, newCard) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'evolution-overlay';
      
      const container = document.createElement('div');
      container.className = 'evolution-container';
      
      const oldCardDiv = document.createElement('div');
      oldCardDiv.className = 'evolution-card';
      oldCardDiv.innerHTML = this.renderCard(oldCard, false, 'evolution');
      
      const arrow = document.createElement('div');
      arrow.className = 'evolution-arrow';
      arrow.textContent = '→';
      
      const newCardDiv = document.createElement('div');
      newCardDiv.className = 'evolution-card';
      newCardDiv.innerHTML = this.renderCard(newCard, false, 'evolution');
      newCardDiv.style.opacity = '0';
      
      container.appendChild(oldCardDiv);
      container.appendChild(arrow);
      container.appendChild(newCardDiv);
      
      const glow = document.createElement('div');
      glow.className = 'evolution-glow';
      container.appendChild(glow);
      
      const particles = document.createElement('div');
      particles.className = 'evolution-particles';
      container.appendChild(particles);
      
      const text = document.createElement('div');
      text.className = 'evolution-text';
      text.textContent = `Evoluiu para ${newCard.name}!`;
      container.appendChild(text);
      
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      
      for (let i = 0; i < 20; i++) {
        setTimeout(() => {
          const particle = document.createElement('div');
          particle.className = 'particle';
          const angle = (Math.PI * 2 * i) / 20;
          const distance = 150 + Math.random() * 100;
          particle.style.setProperty('--tx', `${Math.cos(angle) * distance}px`);
          particle.style.setProperty('--ty', `${Math.sin(angle) * distance}px`);
          particle.style.left = '50%';
          particle.style.top = '50%';
          particles.appendChild(particle);
        }, i * 50);
      }
      
      setTimeout(() => {
        oldCardDiv.classList.add('evolving');
      }, 100);
      
      setTimeout(() => {
        oldCardDiv.style.opacity = '0';
        newCardDiv.style.opacity = '1';
        newCardDiv.style.transition = 'opacity 0.5s ease-out';
      }, 1500);
      
      setTimeout(() => {
        overlay.style.animation = 'fadeIn 0.3s ease-out reverse';
        setTimeout(() => {
          overlay.remove();
          resolve();
        }, 300);
      }, 2500);
    });
  },

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};