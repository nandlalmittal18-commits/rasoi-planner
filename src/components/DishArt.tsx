import { useId, type ReactNode } from 'react';
import type { Dish } from '../engine';

// Illustrated dish pictures, drawn in code so every dish has one.
// Each dish gets a shape (bowl, rice, roti, dosa…) and a food colour from its name.
// A real photo can replace this later without changing the screens that use it.

type Kind =
  | 'bowl'
  | 'pieces'
  | 'rice'
  | 'flatbread'
  | 'dosa'
  | 'idli'
  | 'balls'
  | 'noodles'
  | 'wedge'
  | 'triangle'
  | 'stack'
  | 'wrap'
  | 'glass'
  | 'skewer';

const FOOD = {
  green: '#5e9f3c',
  red: '#d4481c',
  orange: '#f08a24',
  yellow: '#efb321',
  cream: '#f4e8d0',
  brown: '#8b5a36',
  wheat: '#dca85e',
};

const BACKGROUNDS: [string, string][] = [
  ['#ffe9d6', '#ffcfa8'], // peach
  ['#fff3c2', '#ffdf85'], // butter
  ['#e4f5df', '#c4e8bd'], // mint
  ['#e5ecff', '#c8d6ff'], // sky
  ['#ffe4ec', '#ffc4d4'], // blush
  ['#f1e8ff', '#ddccff'], // lilac
];
const BANDS = ['#e8590c', '#2b3a8c', '#138a36', '#c2185b', '#f4a300'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const text = (d: Dish) => `${d.id} ${d.name.toLowerCase()}`;

export function kindOf(d: Dish): Kind {
  const t = text(d);
  if (/chaas|buttermilk|lassi/.test(t)) return 'glass';
  if (/pizza/.test(t)) return 'wedge';
  if (/samosa/.test(t)) return 'triangle';
  if (/sandwich|burger|toast|bruschetta|garlic-bread/.test(t)) return 'stack';
  if (/burrito-bowl|soup|kadhi/.test(t)) return 'bowl';
  if (/bhel|chaat/.test(t)) return 'pieces';
  if (/roll|wrap|shawarma|burrito|quesadilla|tacos/.test(t)) return 'wrap';
  if (/tikka|kabab|grilled/.test(t)) return 'skewer';
  if (/payasam|kheer|kofta/.test(t)) return 'bowl';
  if (/noodles|pasta|lasagne|sevai|sevaiyan|vermicelli|shavige|idiyappam|pad-thai/.test(t)) return 'noodles';
  if (/idli/.test(t)) return 'idli';
  if (/dosa|pesarattu/.test(t)) return 'dosa';
  if (/fried-rice|manchurian-with/.test(t)) return 'rice';
  if (/ladoo|jamun|vada|momos|pakora|makhana|tikki|manchurian|spring-rolls|baati|litti|falafel/.test(t)) return 'balls';
  if (d.category === 'Bread' || /paratha|thepla|thalipeeth|puri|bhature|luchi|pakwan|pancake|uttapam|chilla|akki|appam|handvo/.test(t)) return 'flatbread';
  if (d.category === 'Rice' || /rice|pulao|biryani|khichdi|pongal|bisi|poha|upma|dalia|risotto|oats|puttu/.test(t)) return 'rice';
  if (d.category === 'Sabzi (Dry)' || /bhurji|salad|chaat|bhel|corn|sprouts|dhokla|khandvi|fry|omelette/.test(t)) return 'pieces';
  return 'bowl';
}

export function colourOf(d: Dish): string {
  const t = text(d);
  if (/chaas|buttermilk|raita|kheer|payasam|shrikhand|idli|curd|white-sauce/.test(t)) return FOOD.cream;
  if (/palak|saag|methi|hara|green|spinach|bhindi|beans|poriyal|thoran|cabbage|lauki|turai|tinda|karela|cucumber|fattoush|minestrone|papaya/.test(t)) return FOOD.green;
  if (/gajar|carrot|kaddu|pumpkin|tikka|thai-red|chettinad|tandoori/.test(t)) return FOOD.orange;
  if (/makhani|butter|rajma|chole|tomato|rogan|schezwan|red|masala|manchurian|chilli|misal|pav-bhaji|keema|curry|kadai|matar-paneer|aloo-matar|salsa|tacos|burrito|pizza|rasam|sambar|lasagne/.test(t)) return FOOD.red;
  if (/gulab|kala-chana|bharta|mushroom|ragi|bajra|puttu|lobia|soya|dum-aloo|litti|baati|falafel/.test(t)) return FOOD.brown;
  if (/curd|raita|kheer|payasam|shrikhand|chaas|white|idli|appam|neer|idiyappam|coconut|hummus|steamed-rice|jeera-rice|sabudana|makhana|paneer|cheese|risotto|momos|stew|oats/.test(t)) return FOOD.cream;
  if (d.category === 'Bread') return FOOD.wheat;
  if (/dal|kadhi|khichdi|pongal|lemon|poha|upma|dhokla|khandvi|aloo|corn|pulao|biryani|halwa|ladoo|sevai|pancake|omelette|egg|bisi|chilla|besan|pakora|samosa|vada|kachori/.test(t)) return FOOD.yellow;
  if (d.category === 'Rice') return FOOD.cream;
  if (d.category === 'Non-Veg Main') return FOOD.red;
  return FOOD.yellow;
}

/** Lighter / darker versions of a colour for highlights and shadows. */
function shade(hex: string, amount: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(v + amount * (amount > 0 ? 255 - v : v))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const Leaves = ({ x, y }: { x: number; y: number }) => (
  <g>
    <ellipse cx={x} cy={y} rx="3.2" ry="1.6" fill="#3f8f2f" transform={`rotate(-30 ${x} ${y})`} />
    <ellipse cx={x + 5} cy={y + 1.5} rx="3" ry="1.5" fill="#57a83f" transform={`rotate(25 ${x + 5} ${y + 1.5})`} />
    <ellipse cx={x + 2} cy={y + 4} rx="2.6" ry="1.3" fill="#3f8f2f" transform={`rotate(-10 ${x + 2} ${y + 4})`} />
  </g>
);

const Steam = () => (
  <g fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity="0.85">
    <path d="M40 30 c-4 -5 4 -8 0 -13" />
    <path d="M52 27 c-4 -5 4 -8 0 -13" />
    <path d="M64 30 c-4 -5 4 -8 0 -13" />
  </g>
);

const Plate = () => (
  <g>
    <ellipse cx="50" cy="64" rx="42" ry="25" fill="#000" opacity="0.06" />
    <ellipse cx="50" cy="61" rx="42" ry="25" fill="#fff" />
    <ellipse cx="50" cy="61" rx="33" ry="18.5" fill="#fbf5ee" />
  </g>
);

function Bowl({ food, band, children }: { food: string; band: string; children?: ReactNode }) {
  return (
    <g>
      <ellipse cx="50" cy="86" rx="30" ry="5" fill="#000" opacity="0.08" />
      <path d="M13 50 C13 74 29 86 50 86 C71 86 87 74 87 50 Z" fill="#fff" />
      <path d="M17 64 C24 77 36 82 50 82 C64 82 76 77 83 64 C76 70 64 73 50 73 C36 73 24 70 17 64 Z" fill={band} opacity="0.9" />
      <ellipse cx="50" cy="50" rx="37" ry="11.5" fill="#fff" stroke="#f0e2d2" strokeWidth="1.2" />
      <ellipse cx="50" cy="51" rx="32.5" ry="8.8" fill={food} />
      <ellipse cx="41" cy="49" rx="11" ry="2.6" fill={shade(food, 0.35)} opacity="0.7" />
      {children}
    </g>
  );
}

function Art({ dish }: { dish: Dish }) {
  const kind = kindOf(dish);
  const food = colourOf(dish);
  const h = hash(dish.id);
  const band = BANDS[h % BANDS.length];
  const dark = shade(food, -0.25);
  const sweet = dish.category === 'Sweet';
  const cold = /salad|raita|chaas|shrikhand|overnight|bruschetta|chaat|bhel/.test(dish.id) || dish.category === 'Side';

  switch (kind) {
    case 'bowl':
      return (
        <>
          {!cold && <Steam />}
          <Bowl food={food} band={band}>
            {/kofta|jamun/.test(dish.id) && (
              <g>
                <circle cx="40" cy="50" r="5" fill={FOOD.brown} />
                <circle cx="54" cy="49" r="5" fill={shade(FOOD.brown, 0.1)} />
              </g>
            )}
            {sweet ? (
              <g>
                <rect x="55" y="47" width="5" height="2" rx="1" fill="#8dc26f" transform="rotate(20 57 48)" />
                <rect x="45" y="52" width="5" height="2" rx="1" fill="#f3d9b1" transform="rotate(-15 47 53)" />
              </g>
            ) : (
              <Leaves x={55} y={46} />
            )}
          </Bowl>
        </>
      );
    case 'rice':
      return (
        <>
          {!cold && <Steam />}
          <Plate />
          <path d="M20 63 C22 38 78 38 80 63 C66 69 34 69 20 63 Z" fill={food} />
          <path d="M28 52 C34 44 50 42 58 45" stroke={shade(food, 0.45)} strokeWidth="3" fill="none" strokeLinecap="round" opacity="0.7" />
          {[[30, 58], [38, 52], [46, 57], [54, 50], [62, 56], [70, 59], [42, 46], [58, 61], [35, 62], [66, 50]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.2" ry="1" fill={shade(food, 0.6)} transform={`rotate(${(i * 37) % 180} ${x} ${y})`} />
          ))}
          {food !== FOOD.cream && <circle cx="40" cy="55" r="1.8" fill="#57a83f" />}
          <Leaves x={52} y={42} />
        </>
      );
    case 'flatbread':
      return (
        <>
          <Plate />
          <ellipse cx="46" cy="62" rx="27" ry="15.5" fill={shade(FOOD.wheat, -0.1)} />
          <ellipse cx="52" cy="57" rx="27" ry="15.5" fill={food === FOOD.yellow || food === FOOD.red ? FOOD.wheat : shade(food, 0)} />
          {[[42, 54], [58, 52], [50, 60], [63, 60], [40, 61], [53, 51]].map(([x, y], i) => (
            <ellipse key={i} cx={x} cy={y} rx="2.6" ry="1.4" fill={dark} opacity="0.55" />
          ))}
          {/uttapam|chilla|thalipeeth|akki/.test(dish.id) && (
            <g>
              <circle cx="46" cy="55" r="1.8" fill="#d4481c" />
              <circle cx="57" cy="58" r="1.8" fill="#57a83f" />
              <circle cx="52" cy="53" r="1.6" fill="#f4e8d0" />
            </g>
          )}
          <path d="M70 70 q6 -3 9 0" stroke="#e9c06a" strokeWidth="4" strokeLinecap="round" fill="none" />
        </>
      );
    case 'dosa':
      return (
        <>
          <Plate />
          <path d="M14 66 Q48 46 88 50 L86 58 Q50 58 18 72 Z" fill={FOOD.wheat} />
          <path d="M18 70 Q50 54 86 56" stroke={shade(FOOD.wheat, -0.25)} strokeWidth="1.2" fill="none" />
          <path d="M26 64 Q50 52 80 52" stroke={shade(FOOD.wheat, 0.35)} strokeWidth="2" fill="none" opacity="0.8" />
          <circle cx="30" cy="54" r="7" fill="#fff" stroke="#f0e2d2" />
          <circle cx="30" cy="54" r="5" fill="#f2f0e2" />
          <circle cx="70" cy="70" r="7" fill="#fff" stroke="#f0e2d2" />
          <circle cx="70" cy="70" r="5" fill={FOOD.orange} />
        </>
      );
    case 'idli':
      return (
        <>
          <Steam />
          <Plate />
          {[[36, 58], [58, 57], [47, 66]].map(([x, y], i) => (
            <g key={i}>
              <ellipse cx={x} cy={y + 2} rx="11" ry="5" fill="#e9e1cf" />
              <ellipse cx={x} cy={y} rx="11" ry="5.5" fill="#fffdf6" />
            </g>
          ))}
          <circle cx="72" cy="46" r="8" fill="#fff" stroke="#f0e2d2" />
          <circle cx="72" cy="46" r="6" fill={FOOD.orange} />
        </>
      );
    case 'balls':
      return (
        <>
          <Plate />
          {[[38, 58], [56, 56], [47, 66], [64, 65]].map(([x, y], i) => (
            <g key={i}>
              <circle cx={x} cy={y} r="8.5" fill={food === FOOD.cream ? '#f6efe0' : food} />
              <circle cx={x - 2.5} cy={y - 3} r="2.6" fill="#fff" opacity="0.45" />
              {/vada/.test(dish.id) && !/sabudana/.test(dish.id) && <circle cx={x} cy={y} r="2.4" fill="#fbf5ee" />}
            </g>
          ))}
          {!sweet && <Leaves x={68} y={50} />}
        </>
      );
    case 'noodles':
      return (
        <>
          {!sweet && <Steam />}
          <Bowl food={shade(food === FOOD.red ? FOOD.yellow : food, 0.1)} band={band}>
            <g fill="none" stroke={food === FOOD.red ? FOOD.red : shade(food, -0.18)} strokeWidth="1.6" strokeLinecap="round">
              <path d="M24 50 q5 -4 10 0 t10 0 t10 0 t10 0 t10 0" />
              <path d="M28 54 q5 -4 10 0 t10 0 t10 0 t10 0" />
              <path d="M30 46 q5 -4 10 0 t10 0 t10 0 t10 0" />
            </g>
            {!sweet && (
              <g>
                <circle cx="40" cy="49" r="1.8" fill="#57a83f" />
                <circle cx="58" cy="52" r="1.8" fill="#f08a24" />
                <circle cx="66" cy="48" r="1.6" fill="#d4481c" />
              </g>
            )}
          </Bowl>
        </>
      );
    case 'wedge':
      return (
        <>
          <Plate />
          <path d="M50 30 L80 70 Q50 80 20 70 Z" fill={FOOD.wheat} />
          <path d="M50 36 L74 67 Q50 75 26 67 Z" fill={FOOD.red} />
          <path d="M50 40 L70 65 Q50 71 30 65 Z" fill="#fde7a8" />
          {[[46, 52], [56, 60], [40, 63], [52, 66], [61, 66]].map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r="2.4" fill={i % 2 ? '#57a83f' : '#d4481c'} />
          ))}
        </>
      );
    case 'triangle':
      return (
        <>
          <Plate />
          {[[38, 0], [60, 8]].map(([x, r], i) => (
            <g key={i} transform={`rotate(${r} ${x} 58)`}>
              <path d={`M${x} 38 L${x + 16} 70 L${x - 16} 70 Z`} fill={FOOD.yellow} stroke={shade(FOOD.yellow, -0.2)} strokeWidth="1.2" strokeLinejoin="round" />
              <path d={`M${x} 42 L${x + 2} 68`} stroke={shade(FOOD.yellow, -0.2)} strokeWidth="1" />
            </g>
          ))}
          <circle cx="76" cy="48" r="6" fill="#fff" stroke="#f0e2d2" />
          <circle cx="76" cy="48" r="4.2" fill="#7a3b1c" />
        </>
      );
    case 'stack': {
      const burger = /burger/.test(dish.id);
      return (
        <>
          <Plate />
          {burger ? (
            <g>
              <path d="M28 66 h44 a4 4 0 0 1 -4 6 h-36 a4 4 0 0 1 -4 -6 z" fill={FOOD.wheat} />
              <rect x="27" y="58" width="46" height="8" rx="4" fill={FOOD.brown} />
              <path d="M26 58 q6 -4 12 0 t12 0 t12 0 t12 0" fill="#7cc04f" />
              <rect x="30" y="53" width="40" height="4" rx="1" fill="#f6c343" />
              <path d="M28 54 C28 36 72 36 72 54 Z" fill={FOOD.wheat} />
              <circle cx="44" cy="44" r="1" fill="#fff" />
              <circle cx="54" cy="42" r="1" fill="#fff" />
            </g>
          ) : (
            <g>
              <path d="M24 66 L50 46 L76 66 Z" fill="#f6e2b6" stroke={FOOD.wheat} strokeWidth="2" strokeLinejoin="round" />
              <path d="M28 64 L50 48 L72 64" stroke="#7cc04f" strokeWidth="3" fill="none" />
              <path d="M30 62 L50 51 L70 62" stroke="#e8573b" strokeWidth="2.5" fill="none" />
              <path d="M24 60 L50 40 L76 60 Z" fill="#f6e2b6" stroke={FOOD.wheat} strokeWidth="2" strokeLinejoin="round" />
            </g>
          )}
        </>
      );
    }
    case 'wrap':
      return (
        <>
          <Plate />
          <g transform="rotate(-18 50 60)">
            <rect x="20" y="52" width="58" height="18" rx="9" fill={FOOD.wheat} />
            <ellipse cx="74" cy="61" rx="6" ry="9" fill="#f6e2b6" />
            <circle cx="73" cy="58" r="2.2" fill="#7cc04f" />
            <circle cx="75" cy="63" r="2.2" fill={food} />
            <circle cx="72" cy="64" r="1.6" fill="#e8573b" />
            <path d="M30 56 l6 10 M44 56 l6 10 M58 56 l6 10" stroke={shade(FOOD.wheat, -0.2)} strokeWidth="1.2" />
          </g>
        </>
      );
    case 'glass':
      return (
        <>
          <ellipse cx="50" cy="86" rx="16" ry="3" fill="#000" opacity="0.08" />
          <path d="M34 26 L66 26 L62 84 L38 84 Z" fill="#ffffff" opacity="0.85" stroke="#e8dccd" strokeWidth="1.5" />
          <path d="M35.5 38 L64.5 38 L61.5 82 L38.5 82 Z" fill={food} />
          <ellipse cx="50" cy="38" rx="14.5" ry="2.5" fill={shade(food, 0.3)} />
          <ellipse cx="56" cy="34" rx="4" ry="2" fill="#57a83f" transform="rotate(-30 56 34)" />
        </>
      );
    case 'skewer':
      return (
        <>
          <Plate />
          <path d="M16 74 L84 44" stroke="#9a6b3f" strokeWidth="2.4" strokeLinecap="round" />
          {[0, 1, 2, 3].map((i) => {
            const x = 28 + i * 14;
            const y = 68.5 - i * 6.2;
            const fill = i % 2 ? (i === 1 ? '#7cc04f' : '#d67a8c') : food;
            return (
              <g key={i} transform={`rotate(-24 ${x} ${y})`}>
                <rect x={x - 6} y={y - 6} width="12" height="12" rx="3" fill={fill} />
                <path d={`M${x - 4} ${y - 2} h8 M${x - 4} ${y + 2} h8`} stroke={shade(fill, -0.35)} strokeWidth="1.2" opacity="0.6" />
              </g>
            );
          })}
        </>
      );
    case 'pieces':
    default:
      return (
        <>
          <Plate />
          <path d="M22 64 C24 46 76 44 78 63 C64 70 36 70 22 64 Z" fill={shade(food, 0.25)} />
          {[[32, 60], [40, 54], [48, 62], [56, 55], [64, 61], [44, 68], [58, 67], [36, 66], [52, 49], [66, 53], [70, 66], [28, 56]].map(([x, y], i) => {
            const fill = i % 4 === 3 ? '#57a83f' : i % 5 === 4 ? (food === FOOD.red ? FOOD.yellow : FOOD.red) : i % 2 ? food : shade(food, 0.15);
            return <rect key={i} x={x - 4.5} y={y - 4} width="9" height="8" rx="2.6" fill={fill} transform={`rotate(${(i * 29) % 90} ${x} ${y})`} />;
          })}
        </>
      );
  }
}

/** A dish picture. `size` is the width/height in pixels. */
export function DishArt({ dish, size = 56, className = '', cover = false }: { dish: Dish; size?: number; className?: string; cover?: boolean }) {
  const id = useId().replace(/:/g, '');
  const [a, b] = BACKGROUNDS[hash(dish.id + 'bg') % BACKGROUNDS.length];
  return (
    <svg
      className={`dish-art ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      preserveAspectRatio={cover ? 'xMidYMid slice' : 'xMidYMid meet'}
      role="img"
      aria-label={`Picture of ${dish.name}`}
    >
      <defs>
        <linearGradient id={`bg${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={a} />
          <stop offset="1" stopColor={b} />
        </linearGradient>
      </defs>
      <rect width="100" height="100" fill={`url(#bg${id})`} />
      <circle cx="84" cy="14" r="16" fill="#fff" opacity="0.35" />
      <Art dish={dish} />
    </svg>
  );
}
