(() => {
  const SUITS = [
    { symbol: "♠", name: "spades",   red: false },
    { symbol: "♥", name: "hearts",   red: true  },
    { symbol: "♦", name: "diamonds", red: true  },
    { symbol: "♣", name: "clubs",    red: false }
  ];
  const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"];
  const RANK_NAMES = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };

  // Unbiased random integer in [0, max)
  function randomInt(max) {
    if (!window.crypto || !crypto.getRandomValues) return Math.floor(Math.random() * max);
    const buf = new Uint32Array(1);
    const limit = Math.floor(0x100000000 / max) * max;
    do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
    return buf[0] % max;
  }

  // Build a 52-card deck and draw 3 distinct cards
  const deck = [];
  for (const suit of SUITS) for (const rank of RANKS) deck.push({ rank, suit });

  const dealt = [];
  for (let i = 0; i < 3; i++) {
    const j = i + randomInt(deck.length - i);
    [deck[i], deck[j]] = [deck[j], deck[i]];
    dealt.push(deck[i]);
  }

  function span(className, text) {
    const el = document.createElement("span");
    el.className = className;
    el.textContent = text;
    return el;
  }

  function corner(position, card) {
    const el = document.createElement("div");
    el.className = "corner " + position;
    el.append(span("rank", card.rank), span("suit", card.suit.symbol));
    return el;
  }

  function buildCard(card, index) {
    const el = document.createElement("div");
    el.className = "card" + (card.suit.red ? " red" : "");
    el.style.setProperty("--i", index);
    el.setAttribute("role", "img");
    el.setAttribute("aria-label", (RANK_NAMES[card.rank] || card.rank) + " of " + card.suit.name);

    const inner = document.createElement("div");
    inner.className = "inner";

    const face = document.createElement("div");
    face.className = "face";
    const pip = span("pip" + (card.rank === "A" ? " ace" : ""), card.suit.symbol);
    face.append(corner("tl", card), pip, corner("br", card));

    const back = document.createElement("div");
    back.className = "back";

    inner.append(face, back);
    el.append(inner);
    return el;
  }

  const hand = document.getElementById("hand");
  dealt.forEach((card, i) => hand.append(buildCard(card, i)));
})();
