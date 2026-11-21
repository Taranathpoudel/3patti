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

  // ---------- Share as image (WhatsApp) ----------
  const FONT = '"Iowan Old Style","Palatino Linotype",Palatino,Georgia,serif';

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawHandImage() {
    const W = 1080, H = 660, cw = 300, ch = 420, gap = 40;
    const canvas = document.createElement("canvas");
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");

    const bg = ctx.createRadialGradient(W / 2, H * 0.4, 40, W / 2, H * 0.4, W * 0.7);
    bg.addColorStop(0, "#1f6b4a");
    bg.addColorStop(0.55, "#124a33");
    bg.addColorStop(1, "#0a2f20");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    const tilts = [-5, 0, 5];
    const lifts = [10, 0, 10];
    const startX = (W - (3 * cw + 2 * gap)) / 2;

    dealt.forEach((card, i) => {
      ctx.save();
      ctx.translate(startX + i * (cw + gap) + cw / 2, H / 2 + lifts[i]);
      ctx.rotate((tilts[i] * Math.PI) / 180);

      ctx.shadowColor = "rgba(0,0,0,0.45)";
      ctx.shadowBlur = 30;
      ctx.shadowOffsetY = 10;
      ctx.fillStyle = "#fbf7ee";
      roundRect(ctx, -cw / 2, -ch / 2, cw, ch, 21);
      ctx.fill();
      ctx.shadowColor = "transparent";

      ctx.fillStyle = card.suit.red ? "#b4232c" : "#1b1c20";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      ctx.font = (card.rank === "A" ? 216 : 168) + "px " + FONT;
      ctx.fillText(card.suit.symbol, 0, 6);

      const corner = () => {
        ctx.font = "bold 57px " + FONT;
        ctx.fillText(card.rank, 0, 0);
        ctx.font = "bold 45px " + FONT;
        ctx.fillText(card.suit.symbol, 0, 52);
      };
      ctx.save();
      ctx.translate(-cw / 2 + 48, -ch / 2 + 48);
      corner();
      ctx.restore();
      ctx.save();
      ctx.translate(cw / 2 - 48, ch / 2 - 48);
      ctx.rotate(Math.PI);
      corner();
      ctx.restore();

      ctx.restore();
    });
    return canvas;
  }

  const filePromise = new Promise((resolve) => {
    drawHandImage().toBlob(
      (blob) => resolve(blob ? new File([blob], "teen-patti-hand.png", { type: "image/png" }) : null),
      "image/png"
    );
  });

  const shareBtn = document.getElementById("share");
  const note = document.getElementById("note");
  const message = "My Teen Patti hand";

  shareBtn.addEventListener("click", async () => {
    note.textContent = "";
    const file = await filePromise;
    if (!file) {
      note.textContent = "Could not create the image. Please refresh and try again.";
      return;
    }

    // Phones: opens the share sheet with the image, pick WhatsApp
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: message });
      } catch (err) {
        if (err && err.name !== "AbortError") {
          note.textContent = "Sharing failed. Please try again.";
        }
      }
      return;
    }

    // Desktop fallback: open WhatsApp and save the image to attach
    window.open("https://wa.me/?text=" + encodeURIComponent(message), "_blank", "noopener");
    const url = URL.createObjectURL(file);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    note.textContent = "Image saved. Attach it in the WhatsApp chat.";
  });
})();
