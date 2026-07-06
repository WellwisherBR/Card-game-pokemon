const cardDatabase = {
  monsters: [
    {
      id: "bulbasaur",
      name: "Bulbasaur",
      baseHP: 3,
      image: "cards/images/01.png",
      evolutionLine: "Bulbasaur",
      evolutionStage: 0
    },
    {
      id: "ivysaur",
      name: "Ivysaur",
      baseHP: 5,
      image: "cards/images/02.png",
      evolutionLine: "Bulbasaur",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "venusaur",
      name: "Venusaur",
      baseHP: 7,
      image: "cards/images/03.png",
      evolutionLine: "Bulbasaur",
      evolutionStage: 2,
      hidden: true
    },
    {
      id: "venusaur_shiny",
      name: "Venusaur Shiny",
      baseHP: 10,
      image: "cards/images/04.png",
      hidden: true,
      sell: true
    },

    {
      id: "charmander",
      name: "Charmander",
      baseHP: 3,
      image: "cards/images/05.png",
      evolutionLine: "Charmander",
      evolutionStage: 0
    },
    {
      id: "charmeleon",
      name: "Charmeleon",
      baseHP: 5,
      image: "cards/images/06.png",
      evolutionLine: "Charmander",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "charizard",
      name: "Charizard",
      baseHP: 7,
      image: "cards/images/07.png",
      evolutionLine: "Charmander",
      evolutionStage: 2,
      hidden: true
    },
    {
      id: "charizard_shiny",
      name: "Charizard Shiny",
      baseHP: 10,
      image: "cards/images/235.png",
      hidden: true,
      sell: true
    },

    {
      id: "squirtle",
      name: "Squirtle",
      baseHP: 3,
      image: "cards/images/08.png",
      evolutionLine: "Squirtle",
      evolutionStage: 0
    },
    {
      id: "wartortle",
      name: "Wartortle",
      baseHP: 5,
      image: "cards/images/09.png",
      evolutionLine: "Squirtle",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "blastoise",
      name: "Blastoise",
      baseHP: 7,
      image: "cards/images/10.png",
      evolutionLine: "Squirtle",
      evolutionStage: 2,
      hidden: true
    },
    {
      id: "blastoise_shiny",
      name: "Blastoise Shiny",
      baseHP: 10,
      image: "cards/images/236.png",
      hidden: true,
      sell: true
    },

    {
      id: "caterpie",
      name: "Caterpie",
      baseHP: 2,
      image: "cards/images/11.png",
      evolutionLine: "Caterpie",
      evolutionStage: 0
    },
    {
      id: "metapod",
      name: "Metapod",
      baseHP: 4,
      image: "cards/images/12.png",
      evolutionLine: "Caterpie",
      evolutionStage: 1
    },
    {
      id: "butterfree",
      name: "Butterfree",
      baseHP: 6,
      image: "cards/images/13.png",
      evolutionLine: "Caterpie",
      evolutionStage: 2
    },
    {
      id: "butterfree_shiny",
      name: "Butterfree Shiny",
      baseHP: 10,
      image: "cards/images/14.png",
      hidden: true,
      sell: true
    },

    {
      id: "weedle",
      name: "Weedle",
      baseHP: 2,
      image: "cards/images/15.png",
      evolutionLine: "Weedle",
      evolutionStage: 0
    },
    {
      id: "kakuna",
      name: "Kakuna",
      baseHP: 4,
      image: "cards/images/16.png",
      evolutionLine: "Weedle",
      evolutionStage: 1
    },
    {
      id: "beedrill",
      name: "Beedrill",
      baseHP: 6,
      image: "cards/images/17.png",
      evolutionLine: "Weedle",
      evolutionStage: 2,
      hidden: true
    },

    {
      id: "pidgey",
      name: "Pidgey",
      baseHP: 3,
      image: "cards/images/18.png",
      evolutionLine: "Pidgey",
      evolutionStage: 0
    },
    {
      id: "pidgotto",
      name: "Pidgotto",
      baseHP: 5,
      image: "cards/images/19.png",
      evolutionLine: "Pidgey",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "pidgeot",
      name: "Pidgeot",
      baseHP: 7,
      image: "cards/images/20.png",
      evolutionLine: "Pidgey",
      evolutionStage: 2,
      hidden: true
    },

    {
      id: "rattata",
      name: "Rattata",
      baseHP: 3,
      image: "cards/images/21.png",
      evolutionLine: "Rattata",
      evolutionStage: 0
    },
    {
      id: "rattata_shiny",
      name: "Rattata Shiny",
      baseHP: 8,
      image: "cards/images/23.png",
      hidden: true,
      sell: true
    },
    {
      id: "raticate",
      name: "Raticate",
      baseHP: 6,
      image: "cards/images/24.png",
      evolutionLine: "Rattata",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "raticate_shiny",
      name: "Raticate Shiny",
      baseHP: 10,
      image: "cards/images/26.png",
      hidden: true,
      sell: true
    },

    {
      id: "spearow",
      name: "Spearow",
      baseHP: 4,
      image: "cards/images/27.png",
      evolutionLine: "Spearow",
      evolutionStage: 0
    },
    {
      id: "fearow",
      name: "Fearow",
      baseHP: 8,
      image: "cards/images/28.png",
      evolutionLine: "Spearow",
      evolutionStage: 1,
      hidden: true
    },

    {
      id: "ekans",
      name: "Ekans",
      baseHP: 4,
      image: "cards/images/29.png",
      evolutionLine: "Ekans",
      evolutionStage: 0
    },
    {
      id: "arbok",
      name: "Arbok",
      baseHP: 8,
      image: "cards/images/30.png",
      evolutionLine: "Ekans",
      evolutionStage: 1,
      hidden: true
    },

    {
      id: "pikachu",
      name: "Pikachu",
      baseHP: 3,
      image: "cards/images/31.png",
      evolutionLine: "Pikachu",
      evolutionStage: 0
    },
    {
      id: "pikachu_shiny",
      name: "Pikachu Shiny",
      baseHP: 8,
      image: "cards/images/32.png",
      hidden: true,
      sell: true
    },
    {
      id: "raichu",
      name: "Raichu",
      baseHP: 6,
      image: "cards/images/33.png",
      evolutionLine: "Pikachu",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "raichu_shiny",
      name: "Raichu Shiny",
      baseHP: 10,
      image: "cards/images/35.png",
      hidden: true,
      sell: true
    },

    {
      id: "sandshrew",
      name: "Sandshrew",
      baseHP: 3,
      image: "cards/images/36.png",
      evolutionLine: "Sandshrew",
      evolutionStage: 0
    },
    {
      id: "sandshrew_shiny",
      name: "Sandshrew Shiny",
      baseHP: 8,
      image: "cards/images/37.png",
      hidden: true,
      sell: true
    },
    {
      id: "sandslash",
      name: "Sandslash",
      baseHP: 6,
      image: "cards/images/38.png",
      evolutionLine: "Sandshrew",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "sandslash_shiny",
      name: "Sandslash Shiny",
      baseHP: 10,
      image: "cards/images/39.png",
      hidden: true,
      sell: true
    },

    {
      id: "nidoran",
      name: "Nidoran [F]",
      baseHP: 3,
      image: "cards/images/40.png",
      evolutionLine: "Nidoran [F]",
      evolutionStage: 0
    },
    {
      id: "nidorina",
      name: "Nidorina",
      baseHP: 5,
      image: "cards/images/41.png",
      evolutionLine: "Nidoran [F]",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "nidoqueen",
      name: "Nidoqueen",
      baseHP: 7,
      image: "cards/images/42.png",
      evolutionLine: "Nidoran [F]",
      evolutionStage: 2,
      hidden: true
    },

    {
      id: "nidoran2",
      name: "Nidoran [M]",
      baseHP: 3,
      image: "cards/images/43.png",
      evolutionLine: "Nidoran [M]",
      evolutionStage: 0
    },
    {
      id: "nidorino",
      name: "Nidorino",
      baseHP: 5,
      image: "cards/images/44.png",
      evolutionLine: "Nidoran [M]",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "nidoking",
      name: "Nidoking",
      baseHP: 7,
      image: "cards/images/45.png",
      evolutionLine: "Nidoran [M]",
      evolutionStage: 2,
      hidden: true
    },

    {
      id: "clefairy",
      name: "Clefairy",
      baseHP: 4,
      image: "cards/images/46.png",
      evolutionLine: "Clefairy",
      evolutionStage: 0
    },
    {
      id: "clefable",
      name: "Clefable",
      baseHP: 8,
      image: "cards/images/47.png",
      evolutionLine: "Clefairy",
      evolutionStage: 1,
      hidden: true
    },

    {
      id: "vulpix",
      name: "Vulpix",
      baseHP: 4,
      image: "cards/images/48.png",
      evolutionLine: "Vulpix",
      evolutionStage: 0
    },
    {
      id: "vulpix_shiny",
      name: "Vulpix Shiny",
      baseHP: 8,
      image: "cards/images/49.png",
      hidden: true,
      sell: true
    },
    {
      id: "ninetales",
      name: "Ninetales",
      baseHP: 8,
      image: "cards/images/50.png",
      evolutionLine: "Vulpix",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "ninetales_shiny",
      name: "Ninetales Shiny",
      baseHP: 10,
      image: "cards/images/51.png",
      hidden: true,
      sell: true
    },

    {
      id: "jigglypuff",
      name: "Jigglypuff",
      baseHP: 4,
      image: "cards/images/52.png",
      evolutionLine: "Jigglypuff",
      evolutionStage: 0
    },
    {
      id: "wigglytuff",
      name: "Wigglytuff",
      baseHP: 8,
      image: "cards/images/53.png",
      evolutionLine: "Jigglypuff",
      evolutionStage: 1,
      hidden: true
    },

    {
      id: "zubat",
      name: "Zubat",
      baseHP: 4,
      image: "cards/images/54.png",
      evolutionLine: "Zubat",
      evolutionStage: 0
    },
    {
      id: "zubat_shiny",
      name: "Zubat Shiny",
      baseHP: 8,
      image: "cards/images/55.png",
      hidden: true,
      sell: true
    },
    {
      id: "golbat",
      name: "Golbat",
      baseHP: 8,
      image: "cards/images/56.png",
      evolutionLine: "Zubat",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "golbat_shiny",
      name: "Golbat Shiny",
      baseHP: 10,
      image: "cards/images/57.png",
      hidden: true,
      sell: true
    },

    {
      id: "oddish",
      name: "Oddish",
      baseHP: 3,
      image: "cards/images/58.png",
      evolutionLine: "Oddish",
      evolutionStage: 0
    },
    {
      id: "gloom",
      name: "Gloom",
      baseHP: 6,
      image: "cards/images/59.png",
      evolutionLine: "Oddish",
      evolutionStage: 1,
      hidden: true
    },
    {
      id: "gloom_shiny",
      name: "Gloom Shiny",
      baseHP: 8,
      image: "cards/images/60.png",
      hidden: true,
      sell: true
    },
    {
      id: "vileplume",
      name: "Vileplume",
      baseHP: 8,
      image: "cards/images/61.png",
      evolutionLine: "Oddish",
      evolutionStage: 2,
      hidden: true
    },
    {
      id: "vileplume_shiny",
      name: "Vileplume Shiny",
      baseHP: 10,
      image: "cards/images/62.png",
      hidden: true,
      sell: true
    }
  ],

  rarityWeights: {
    common: 0.84,
    rare: 0.10,
    epic: 0.04,
    legendary: 0.02
  },

  rarityBonus: {
    common: 0,
    rare: 5,
    epic: 7,
    legendary: 10
  },

  rarityColors: {
    common: "#ffffff",
    rare: "#4ade80",
    epic: "#3b82f6",
    legendary: "#ef4444"
  },

  upgradeRequirements: [2, 4, 6, 8, 10],

  upgradeBonus: 2,

  evolutionRequirements: {
    "Bulbasaur": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Charmander": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Squirtle": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Caterpie": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Weedle": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Pidgey": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Rattata": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Spearow": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Ekans": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Pikachu": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Sandshrew": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Nidoran [F]": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Nidoran [M]": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ],
    "Clefairy": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Vulpix": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Jigglypuff": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Zubat": [
      { stage: 1, cardsNeeded: 2 }
    ],
    "Oddish": [
      { stage: 1, cardsNeeded: 2 },
      { stage: 2, cardsNeeded: 3 }
    ]
  },

  packPrice: 100,
  packSize: 4,
  starterPackPrice: 50,
  starterPackSize: 6,

  rareCardPrice: 50,
  diamondToGoldRate: 10,

  effects: {
    poison: {
      duration: 3,
      fixedDamage: 2,
      description: "Veneno: 2 de dano fixo por 3 turnos ao matar",
      icon: "☠️"
    },
    heal: {
      baseHeal: {
        common: 2,
        rare: 3,
        epic: 4,
        legendary: 5
      },
      upgradeBonus: 1,
      description: "Cura aliados (não a si mesmo)",
      icon: "💚"
    },
    fire: {
      fixedDamage: 2,
      description: "Ao atacar, lança bola de fogo em carta aleatória",
      icon: "🔥"
    },
    ice: {
      duration: 1,
      description: "Congela e cancela efeitos no turno",
      icon: "❄️"
    },
    range: {
      description: "Não recebe dano quando ataca",
      icon: "🏹"
    }
  },

  initialGold: 100,
  initialDiamonds: 0
};
