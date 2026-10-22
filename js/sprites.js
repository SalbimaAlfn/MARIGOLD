/* MARIGOLD — hand-coded pixel sprites, baked once at boot into offscreen canvases.
   Every row is checked for length in the dev harness (see README). */

const Sprites = {
  hero: null,
  keeper: null,
  imp: null,
  beetle: null,
  bat: null,
  guard: null,
  husk: null,
  shield: null,
  princess: null,
  princessWeak: null,
  beast: null,
  beastRoar: null,
  marigold: null,
  violet: null,
  bloom: null,
  bloomDead: null,
  glint: null,
  pod: null,
  lantern: null,
  lanternLit: null,
  sign: null,

  init() {
    this.hero = {
      idle: this.pair(this.compose(HERO_TOP, HERO_LEGS.idle, 3)),
      run: [
        this.pair(this.compose(HERO_TOP, HERO_LEGS.runA, 3)),
        this.pair(this.compose(HERO_TOP, HERO_LEGS.runB, 3))
      ],
      jump: this.pair(this.compose(HERO_TOP, HERO_LEGS.jump, 3)),
      fall: this.pair(this.compose(HERO_TOP, HERO_LEGS.fall, 3)),
      hurt: this.pair(this.compose(HERO_TOP, HERO_LEGS.fall, 3)),
      kneel: this.pair(bakeSprite(HERO_KNEEL))
    };

    /* SnoozyPaw, the keeper: no sword, no shield, and a way to grow things */
    this.keeper = {
      idle: this.pair(this.compose(KEEPER_TOP, KEEPER_LEGS.idle)),
      run: [
        this.pair(this.compose(KEEPER_TOP, KEEPER_LEGS.runA)),
        this.pair(this.compose(KEEPER_TOP, KEEPER_LEGS.runB))
      ],
      jump: this.pair(this.compose(KEEPER_TOP, KEEPER_LEGS.jump)),
      fall: this.pair(this.compose(KEEPER_TOP, KEEPER_LEGS.fall)),
      hurt: this.pair(this.compose(KEEPER_TOP, KEEPER_LEGS.fall)),
      kneel: this.pair(bakeSprite(KEEPER_KNEEL))
    };

    this.imp = [this.pair(bakeSprite(IMP_A)), this.pair(bakeSprite(IMP_B))];
    this.beetle = [this.pair(bakeSprite(BEETLE_A)), this.pair(bakeSprite(BEETLE_B))];
    this.bat = [this.pair(bakeSprite(BAT_UP)), this.pair(bakeSprite(BAT_DOWN))];
    this.guard = [this.pair(bakeSprite(GUARD)), this.pair(bakeSprite(GUARD2))];
    this.husk = [this.pair(bakeSprite(HUSK_A)), this.pair(bakeSprite(HUSK_B))];
    this.shield = bakeSprite(SHIELD);
    this.princess = bakeSprite(PRINCESS);
    this.princessWeak = bakeSprite(PRINCESS_WEAK);
    this.beast = bakeSprite(BEAST);
    this.beastRoar = bakeSprite(BEAST_ROAR);
    this.marigold = bakeSprite(MARIGOLD);
    this.violet = bakeSprite(VIOLET);
    this.bloom = [bakeSprite(BLOOM_SPROUT), bakeSprite(BLOOM_BUD), bakeSprite(BLOOM_FULL)];
    this.bloomDead = bakeSprite(BLOOM_DEAD);
    this.glint = bakeSprite(GLINT);
    this.pod = bakeSprite(POD);
    this.lantern = bakeSprite(LANTERN);
    this.lanternLit = bakeSprite(LANTERN_LIT);
    this.sign = bakeSprite(SIGN);
    this.light = this.makeLight(72);
  },

  pair(cv) { return { r: cv, l: flipSprite(cv) }; },
  compose(topRows, legRows, leftPad) {
    const w = Math.max.apply(null, topRows.map(r => r.length));
    const legs = legRows.map((r) => {
      const gap = Math.max(0, w - r.length);
      const lp = leftPad === undefined ? Math.floor(gap / 2) : leftPad;
      return ' '.repeat(lp) + r + ' '.repeat(Math.max(0, gap - lp));
    });
    return bakeSprite(topRows.concat(legs));
  },
  facing(frame, dir) { return dir < 0 ? frame.l : frame.r; },

  /* the keeper's light: a dithered warm disc, baked once */
  makeLight(size) {
    const cv = document.createElement('canvas');
    cv.width = size;
    cv.height = size;
    const c = cv.getContext('2d');
    const img = c.createImageData(size, size);
    const r = size / 2;
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const dx = x - r + 0.5;
        const dy = y - r + 0.5;
        const d = Math.sqrt(dx * dx + dy * dy) / r;
        let a = 0;
        if (d < 1) {
          a = Math.pow(1 - d, 1.7);
          if (a < bayer[(y & 3) * 4 + (x & 3)] / 16) a = 0;
        }
        const i = (y * size + x) * 4;
        img.data[i] = 255;
        img.data[i + 1] = 236;
        img.data[i + 2] = 176;
        img.data[i + 3] = Math.round(a * 255);
      }
    }
    c.putImageData(img, 0, 0);
    return cv;
  }
};

/* ---------- baking ---------- */

function bakeSprite(rows) {
  let w = 0;
  for (const r of rows) if (r.length > w) w = r.length;
  const h = rows.length;
  const cv = document.createElement('canvas');
  cv.width = w;
  cv.height = h;
  const ctx = cv.getContext('2d');
  for (let y = 0; y < h; y++) {
    const row = rows[y];
    for (let x = 0; x < row.length; x++) {
      const ch = row[x];
      if (ch && ch !== ' ' && SPRITE_MAP[ch]) {
        ctx.fillStyle = SPRITE_MAP[ch];
        ctx.fillRect(x, y, 1, 1);
      }
    }
  }
  return cv;
}

function flipSprite(src) {
  const cv = document.createElement('canvas');
  cv.width = src.width;
  cv.height = src.height;
  const ctx = cv.getContext('2d');
  ctx.save();
  ctx.translate(src.width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(src, 0, 0);
  ctx.restore();
  return cv;
}

/* ---------- hero Finn: 18 wide, 20 tall (shield on the back arm) ---------- */

const HERO_TOP = [
  '.......kkkkkk.....',
  '......kHHHHHHk....',
  '.....kHHHHHHHHk...',
  '.....kHSSSSSSHk...',
  '.....kHSESSESHk...',
  '.ggg.kHSSSSSSHk...',
  'gsssgkHSSSSSSHk...',
  'gsmsgkSSSSSSk.....',
  'gsssgkrrrrk.......',
  'gsssgkeeeeeeeek...',
  'gsmsgkeeeeeeeek...',
  'gsssgkeeemeeeek...',
  '.gsg.keeeeeeeek...',
  '.ggg.kggggggggk...'
];

const HERO_LEGS = {
  idle: [
    '...kddddddk...',
    '...kddkkddk...',
    '...kddkkddk...',
    '...kbbkkbbk...',
    '..kbbbk.kbbbk.',
    '..kkkkk.kkkkk.'
  ],
  runA: [
    '...kddddddk...',
    '..kddk.kddk...',
    '..kddk..kddk..',
    '.kbbbk...kbbk.',
    '.kbbbk...kbbk.',
    '.kkkkk...kkkk.'
  ],
  runB: [
    '...kddddddk...',
    '...kddkkddk...',
    '..kddk..kddk..',
    '..kbbk..kbbk..',
    '..kbbk..kbbk..',
    '..kkkk..kkkk..'
  ],
  jump: [
    '...kddddddk...',
    '..kddkkddk....',
    '..kddkkddk....',
    '..kbbkkbbk....',
    '..kkkkkkkk....',
    '..............'
  ],
  fall: [
    '...kddddddk...',
    '...kddkkddk...',
    '..kddk..kddk..',
    '..kbbk..kbbk..',
    '.kbbbk...kbbk.',
    '.kkkkk...kkkk.'
  ]
};

/* ---------- hero Finn on one knee: 18 wide, 20 tall.
   The body drops three rows and the legs fold under. ---------- */

const HERO_KNEEL = [
  '..................',
  '..................',
  '..................',
  '.......kkkkkk.....',
  '......kHHHHHHk....',
  '.....kHHHHHHHHk...',
  '.....kHSSSSSSHk...',
  '.....kHSESSESHk...',
  '.ggg.kHSSSSSSHk...',
  'gsssgkHSSSSSSHk...',
  'gsmsgkSSSSSSk.....',
  'gsssgkrrrrk.......',
  'gsssgkeeeeeeeek...',
  'gsmsgkeeeeeeeek...',
  'gsssgkeeemeeeek...',
  '.gsg.keeeeeeeek...',
  '..kddk.kddddk.....',
  '..kbbk.kbbbbk.....',
  '..kkkk.kkkkkk.....'
];

/* ---------- SnoozyPaw, the keeper: 18 wide, 20 tall.
   A flower crown, a green dress, boots under the hem. ---------- */

const KEEPER_TOP = [
  '.....kmmmmmmk.....',
  '....kmmmmmmmmk....',
  '...kHHHmmmmHHHk...',
  '..kHHHHHHHHHHk....',
  '..kHHffffffHHk....',
  '..kHffEfffEffk....',
  '..kHffEfffEffk....',
  '..kHHffffffHHk....',
  '...kHffffffHk.....',
  '.....kffffk.......',
  '..kffkeeeeek......',
  '..kffkecccek......',
  '..kffkemmmmek.....',
  '.keeeeeeeeeeeek...',
  'keeeeeeeeeeeeeeek.',
  'keeeeeeeeeeeeeeek.',
  '..kkkkkkkkkkkkkk..'
];

const KEEPER_LEGS = {
  idle: [
    '.....kxxxxxxk.....',
    '.....kxxxxxxk.....',
    '....kxxxkkxxxk....'
  ],
  runA: [
    '....kxxxxk.kxxxk..',
    '...kxxxk...kxxxk..',
    '..kxxxxk...kxxxxk.'
  ],
  runB: [
    '.....kxxxxxxk.....',
    '....kxxxkkxxxk....',
    '...kxxxk...kxxxk..'
  ],
  jump: [
    '.....kxxxxxxk.....',
    '.....kxxxxxxk.....',
    '.....kxxxxxxk.....'
  ],
  fall: [
    '.....kxxxxxxk.....',
    '....kxxxxk.kxxxk..',
    '....kxxxxk.kxxxk..'
  ]
};

/* ---------- SnoozyPaw on one knee: 18 wide, 20 tall ---------- */

const KEEPER_KNEEL = [
  '.....kmmmmmmk.....',
  '....kmmmmmmmmk....',
  '...kHHHmmmmHHHk...',
  '..kHHHHHHHHHHk....',
  '..kHHffffffHHk....',
  '..kHffEfffEffk....',
  '..kHffEfffEffk....',
  '..kHHffffffHHk....',
  '...kHffffffHk.....',
  '.....kffffk.......',
  '..kffkeeeeek......',
  '..kffkecccek......',
  '..kffkemmmmek.....',
  '.keeeeeeeeeeeek...',
  'keeeeeeeeeeeeeeek.',
  'keeeeeeeeeeeeeeek.',
  '..kkkkkkkkkkkkkk..',
  '...kxxxxxxk.......',
  '..kxxxk..kxxxk....',
  '..kkkkk..kkkkk....'
];

/* ---------- the bloom she grows: 16 wide, 10 tall.
   The head fills the top eight rows - that is the surface you stand on -
   and two rows of leaf hang under it. ---------- */

const BLOOM_SPROUT = [
  '.......kk.......',
  '......keeek.....',
  '.....keeeeek....',
  '.....keeek......',
  '......kek.......',
  '......kek.......',
  '......kek.......',
  '......kek.......',
  '......kek.......',
  '.....kkkkk......'
];

const BLOOM_BUD = [
  '......kkkk......',
  '.....kmmmmk.....',
  '....kmmmmmmk....',
  '....kmgmmgmk....',
  '....kmmmmmmk....',
  '.....kmmmmk.....',
  '.....keeek......',
  '.....keeek......',
  '......kek.......',
  '.....kkkkk......'
];

const BLOOM_FULL = [
  '..kkmmmmmmmmkk..',
  '.kmmmmmmmmmmmmk.',
  'kmmmmmmmmmmmmmmk',
  'kmmggmmmmggmmmmk',
  'kmmmmmmmmmmmmmmk',
  'kmmmmmmmmmmmmmmk',
  '.kmmmmmmmmmmmmk.',
  '..kkmmmmmmmmkk..',
  '....kkeeeekk....',
  '.....keeeek.....'
];

/* the same bloom, spent */
const BLOOM_DEAD = BLOOM_FULL.map(function (r) {
  return r.replace(/m/g, 'x').replace(/g/g, 'x').replace(/e/g, 'D');
});

/* ---------- a glint: only visible in the keeper's light ---------- */

const GLINT = [
  '...gg...',
  '..gwwg..',
  '.gwmmwg.',
  'gwmmmmwg',
  'gwmmmmwg',
  '.gwmmwg.',
  '..gwwg..',
  '...gg...'
];

/* ---------- a husk: the things the first briar left behind ---------- */

const HUSK_A = [
  '....kkkkkkkk....',
  '...kssssssssk...',
  '..ksxxxxxxxxsk..',
  '..ksxEEkkEExsk..',
  '..ksxEEkkEExsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '...kssssssssk...',
  '....kssssssk....',
  '..ksxxxxxxxxsk..',
  '.ksxkxxxxxxkxsk.',
  '.ksxkxxxxxxkxsk.',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '.ksxkxxkxxkxxsk.',
  '..ksxxxxxxxxsk..',
  '..kkkkkkkkkkkk..'
];

const HUSK_B = [
  '....kkkkkkkk....',
  '...kssssssssk...',
  '..ksxxxxxxxxsk..',
  '..ksxEEkkEExsk..',
  '..ksxEEkkEExsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '...kssssssssk...',
  '....kssssssk....',
  '..ksxxxxxxxxsk..',
  '.ksxkxxxxxxkxsk.',
  '.ksxkxxxxxxkxsk.',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '..ksxxxxxxxxsk..',
  '.ksxkxxkxxkxxsk.',
  '..kkkkkkkkkkkk..'
];

/* ---------- enemies ---------- */

const IMP_A = [
  '..............',
  '...k......k...',
  '..kdk....kdk..',
  '..kddkkkkddk..',
  '.kddddddddddk.',
  '.kddddddddddk.',
  '.kddggddggddk.',
  '.kddddddddddk.',
  '..kddddddddk..',
  '..kdkddddkdk..',
  '...kddddddk...',
  '..kbbk..kbbk..'
];

const IMP_B = [
  '..............',
  '...k......k...',
  '..kdk....kdk..',
  '..kddkkkkddk..',
  '.kddddddddddk.',
  '.kddddddddddk.',
  '.kddggddggddk.',
  '.kddddddddddk.',
  '..kddddddddk..',
  '..kdkddddkdk..',
  '...kddddddk...',
  '...kbbkkbbk...'
];

const BEETLE_A = [
  '................',
  '......kkkk......',
  '.....kssssk.....',
  '..k..kssssk..k..',
  '..kk.kssssk.kk..',
  '.kssssssssssssk.',
  '.kssssssssssssk.',
  '.kssggssssggssk.',
  '.kssssssssssssk.',
  '..kssssssssssk..',
  '...ksskkkkssk...',
  '..kWk..kk..kWk..'
];

const BEETLE_B = [
  '................',
  '......kkkk......',
  '.....kssssk.....',
  '..k..kssssk..k..',
  '..kk.kssssk.kk..',
  '.kssssssssssssk.',
  '.kssssssssssssk.',
  '.kssggssssggssk.',
  '.kssssssssssssk.',
  '..kssssssssssk..',
  '...ksskkkkssk...',
  '...kWk..kWk.....'
];

const BAT_UP = [
  '..kk......kk..',
  '.kddk....kddk.',
  '.kddkk..kkddk.',
  '..kddkkkkddk..',
  '...kddddddk...',
  '...kdRRRRdk...',
  '....kddddk....',
  '.....kddk.....',
  '......kk......',
  '..............'
];

const BAT_DOWN = [
  '..............',
  '..kk......kk..',
  '.kddk....kddk.',
  '.kddkk..kkddk.',
  '..kddkkkkddk..',
  '...kdRRRRdk...',
  '....kddddk....',
  '.....kddk.....',
  '......kk......',
  '..............'
];

const GUARD = [
  '...kkkkkkkk...',
  '..kssssssssk..',
  '..kssssssssk..',
  '..kssssssssk..',
  '..ksGGGGGGsk..',
  '..kssssssssk..',
  '..kssssssssk..',
  '...kssssssk...',
  '...kppppppk...',
  '..kppppppppk..',
  '..kppppppppk..',
  '..kppppppppk..',
  '..kppppppppk..',
  '..kggggggggk..',
  '...kxxxxxxk...',
  '...kxxkkxxk...',
  '...kxxkkxxk...',
  '...kbbkkbbk...',
  '..kbbbk.kbbbk.',
  '..kkkkkkkkkk..'
];

const GUARD2 = [
  '...kkkkkkkk...',
  '..kssssssssk..',
  '..kssssssssk..',
  '..kssssssssk..',
  '..ksGGGGGGsk..',
  '..kssssssssk..',
  '..kssssssssk..',
  '...kssssssk...',
  '...kppppppk...',
  '..kppppppppk..',
  '..kppppppppk..',
  '..kppppppppk..',
  '..kppppppppk..',
  '..kggggggggk..',
  '...kxxxxxxk...',
  '...kxxkkxxk...',
  '..kxxk..kxxk..',
  '..kbbk..kbbk..',
  '.kbbbk...kbbk.',
  '.kkkkk...kkkk.'
];

const SHIELD = [
  'kkkkkkk',
  'ksssssk',
  'ksgggsk',
  'ksmmmsk',
  'ksmmmsk',
  'ksgggsk',
  'ksssssk',
  'ksssssk',
  '.ksssk.',
  '..kkk..'
];

const PRINCESS = [
  '..kggggggk..',
  '.kyyyyyyyyk.',
  '.kyffffffyk.',
  '.kyfEfffEyk.',
  '.kyffffffyk.',
  '...kffffk...',
  '...kRRRRk...',
  '..kRRRRRRk..',
  '..kRRRRRRk..',
  '.kRRRRRRRRk.',
  '.kRRRRRRRRk.',
  'kRRRRRRRRRRk',
  'kRgggggggRRk',
  'kRRRRRRRRRRk',
  'kRRRRRRRRRRk',
  'kkkkkkkkkkkk',
  '............',
  '............'
];

/* the same princess, spent and drained of colour */
const PRINCESS_WEAK = PRINCESS.map(r => r.replace(/R/g, 'p'));

/* ---------- pickups & props ---------- */

const MARIGOLD = [
  '..kggggk..',
  '.kgmmmmgk.',
  'kgmmggmmgk',
  'kgmggggmgk',
  'kgmmggmmgk',
  '.kgmmmmgk.',
  '..kggggk..',
  '....kk....',
  '...kek....',
  '..kek.....'
];

const VIOLET = [
  '..kggggk..',
  '.kvvvvvvk.',
  'kvvvwwvvvk',
  'kvvwwwwvvk',
  'kvvvwwvvvk',
  '.kvvvvvvk.',
  '..kggggk..',
  '....kk....',
  '...kek....',
  '..kek.....'
];

const POD = [
  '.....DD.....',
  '....kDDk....',
  '...kDDDDk...',
  '..kDDDDDDk..',
  '.kDDkkkkDDk.',
  '.kDDkrrkDDk.',
  'kDDDkrrkDDDk',
  'kDDDkkkkDDDk',
  '.kDDDDDDDDk.',
  '..kDDDDDDk..',
  '...kDDDDk...',
  '....kkkk....'
];

const LANTERN = [
  '....kkkk....',
  '...kxxxxk...',
  '...kxSSxk...',
  '...kxSSxk...',
  '...kxxxxk...',
  '....kkkk....',
  '.....kk.....',
  '.....kk.....',
  '....kkkk....',
  '...kxxxxk...',
  '..kxxxxxxk..',
  '..kssssssk..'
];

const LANTERN_LIT = [
  '....kkkk....',
  '...kxSSxk...',
  '...kxyyxk...',
  '...kxttxk...',
  '...kxyyxk...',
  '....kkkk....',
  '.....kk.....',
  '.....kk.....',
  '....kkkk....',
  '...kxxxxk...',
  '..kxxxxxxk..',
  '..kssssssk..'
];

const SIGN = [
  '.kkkkkkkkkk.',
  '.kwwwwwwwwk.',
  '.kwkkkwwkkw.',
  '.wkkwwkkwwk.',
  '.kwwwwwwwwk.',
  '.kkkkkkkkkk.',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '....kkkk....',
  '...kkkkkk...'
];

/* ---------- the briar beast: 30 wide, 24 tall ---------- */

const BEAST = [
  '...kk.....' + '.........' + '.....kk...',
  '....kk....' + '.........' + '....kk....',
  '...kMk....' + '.........' + '....kMk...',
  '..kMMMk...' + '..kkkkkk..' + '...kMMMk..',
  '..kMMMk...' + '.kMMMMMMk.' + '...kMMMk..',
  '..kMMMk...' + '.kMgEgEgM.' + '...kMMMk..',
  '..kMMMk...' + '.kMgEgEgM.' + '...kMMMk..',
  '..kMMMk...' + '.kMkkkkMk.' + '...kMMMk..',
  '..kMMMk...' + '.kMkrrrMk.' + '...kMMMk..',
  '...kMMk...' + '..kMMMMk..' + '...kMMk...',
  '..kMMMMk..' + '.kMMMMMMk.' + '..kMMMMk..',
  '...kMMk...' + 'kMMMMMMMMk' + '...kMMk...',
  '...kMMk...' + 'kMkkkkkkMk' + '...kMMk...',
  '....kkk...' + '.kMMMMMMk.' + '...kkk....',
  '.........k' + 'kMMMMMMMMk' + 'k.........',
  '.........k' + 'kMMkkkkMMk' + 'k.........',
  '........k.' + 'kMMkkkkMMk' + '.k........',
  '.........k' + 'kMMMMMMMMk' + 'k.........',
  '....k.....' + '.kDDDDDDk.' + '.....k....',
  '...kDk....' + '..DDDDDD..' + '....kDk...',
  '...kDDk...' + '.kDDDDDDk.' + '...kDDk...',
  '..kDDDk...' + 'kDDDDDDDDk' + '...kDDDk..',
  '..kDDDk...' + 'kDDDDDDDDk' + '...kDDDk..',
  '..kkkkk...' + '.kkkkkkkk.' + '...kkkkk..'
];

/* the same beast, mid-roar: the maw hangs open */
const BEAST_ROAR = BEAST.slice();
BEAST_ROAR[7] = '..kMMMk...' + '.kMMMMMMk.' + '...kMMMk..';
BEAST_ROAR[8] = '..kMMMk...' + '.kMkrrrMk.' + '...kMMMk..';
BEAST_ROAR[9] = '...kMMk...' + '.kMkkkkMk.' + '...kMMk...';
