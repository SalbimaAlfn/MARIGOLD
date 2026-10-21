/* MARIGOLD — hand-coded pixel sprites, baked once at boot into offscreen canvases.
   Every row is checked for length in the dev harness (see README). */

const Sprites = {
  hero: null,
  imp: null,
  beetle: null,
  bat: null,
  guard: null,
  shield: null,
  princess: null,
  beast: null,
  beastRoar: null,
  marigold: null,
  violet: null,
  pod: null,
  lantern: null,
  lanternLit: null,
  sign: null,

  init() {
    this.hero = {
      idle: this.pair(this.compose(HERO_TOP, HERO_LEGS.idle)),
      run: [
        this.pair(this.compose(HERO_TOP, HERO_LEGS.runA)),
        this.pair(this.compose(HERO_TOP, HERO_LEGS.runB))
      ],
      jump: this.pair(this.compose(HERO_TOP, HERO_LEGS.jump)),
      fall: this.pair(this.compose(HERO_TOP, HERO_LEGS.fall)),
      hurt: this.pair(this.compose(HERO_TOP, HERO_LEGS.fall))
    };

    this.imp = [this.pair(bakeSprite(IMP_A)), this.pair(bakeSprite(IMP_B))];
    this.beetle = [this.pair(bakeSprite(BEETLE_A)), this.pair(bakeSprite(BEETLE_B))];
    this.bat = [this.pair(bakeSprite(BAT_UP)), this.pair(bakeSprite(BAT_DOWN))];
    this.guard = [this.pair(bakeSprite(GUARD)), this.pair(bakeSprite(GUARD2))];
    this.shield = bakeSprite(SHIELD);
    this.princess = bakeSprite(PRINCESS);
    this.beast = bakeSprite(BEAST);
    this.beastRoar = bakeSprite(BEAST_ROAR);
    this.marigold = bakeSprite(MARIGOLD);
    this.violet = bakeSprite(VIOLET);
    this.pod = bakeSprite(POD);
    this.lantern = bakeSprite(LANTERN);
    this.lanternLit = bakeSprite(LANTERN_LIT);
    this.sign = bakeSprite(SIGN);
  },

  pair(cv) { return { r: cv, l: flipSprite(cv) }; },
  compose(topRows, legRows) { return bakeSprite(topRows.concat(legRows)); },
  facing(frame, dir) { return dir < 0 ? frame.l : frame.r; }
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

/* ---------- hero Finn: 14 wide, 20 tall ---------- */

const HERO_TOP = [
  '....kkkkkk....',
  '...kHHHHHHk...',
  '..kHHHHHHHHk..',
  '..kHSSSSSSHk..',
  '..kHSESSESHk..',
  '..kHSSSSSSHk..',
  '..kHSSSSSSHk..',
  '...kSSSSSSk...',
  '....krrrrk....',
  '..keeeeeeeek..',
  '..keeeeeeeek..',
  '..keeemeeeek..',
  '..keeeeeeeek..',
  '..kggggggggk..'
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
