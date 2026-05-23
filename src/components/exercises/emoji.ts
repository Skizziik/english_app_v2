// Emoji map for words that have a clear visual representation.
// Used by ImageWord exercise; words not in this map will fall through to
// alternative exercise types so we don't show four identical "abc" placeholders.

export const EMOJI_MAP: Record<string, string> = {
  // animals
  dog: '🐕', cat: '🐈', fish: '🐟', bird: '🐦', cow: '🐄', horse: '🐴', pig: '🐖',
  sheep: '🐑', chicken: '🐔', duck: '🦆', rabbit: '🐇', mouse: '🐁', bear: '🐻',
  lion: '🦁', tiger: '🐅', elephant: '🐘', monkey: '🐒', wolf: '🐺', fox: '🦊',
  snake: '🐍', frog: '🐸', butterfly: '🦋', bee: '🐝', spider: '🕷', shark: '🦈',
  whale: '🐋', dolphin: '🐬', penguin: '🐧',

  // food + drinks
  bread: '🍞', milk: '🥛', tea: '🍵', coffee: '☕', water: '💧', juice: '🧃',
  apple: '🍎', banana: '🍌', orange: '🍊', lemon: '🍋', strawberry: '🍓',
  grape: '🍇', watermelon: '🍉', pineapple: '🍍', peach: '🍑', tomato: '🍅',
  carrot: '🥕', potato: '🥔', onion: '🧅', garlic: '🧄', corn: '🌽',
  cucumber: '🥒', salad: '🥗', mushroom: '🍄', pepper: '🫑',
  egg: '🥚', meat: '🥩', chicken_meat: '🍗', sausage: '🌭', cheese: '🧀',
  rice: '🍚', soup: '🍲', pizza: '🍕', burger: '🍔', sandwich: '🥪',
  pasta: '🍝', sushi: '🍣', cake: '🍰', cookie: '🍪', chocolate: '🍫',
  candy: '🍬', icecream: '🍦', donut: '🍩', honey: '🍯', butter: '🧈',
  salt: '🧂', sugar: '🍬', wine: '🍷', beer: '🍺',

  // home + objects
  house: '🏠', home: '🏠', room: '🚪', door: '🚪', window: '🪟', table: '🪑',
  chair: '🪑', bed: '🛏️', sofa: '🛋️', lamp: '💡', clock: '🕒', mirror: '🪞',
  toilet: '🚽', bath: '🛁', shower: '🚿', kitchen: '🍳', garden: '🌳',
  key: '🔑', lock: '🔒', umbrella: '☂️', glasses: '👓', watch: '⌚',
  bag: '👜', book: '📖', pen: '🖊️', pencil: '✏️', paper: '📄', notebook: '📓',
  phone: '📱', computer: '💻', laptop: '💻', tv: '📺', camera: '📷', radio: '📻',
  map: '🗺️', letter: '✉️', envelope: '✉️', gift: '🎁', box: '📦',
  fork: '🍴', knife: '🔪', spoon: '🥄', plate: '🍽️', cup: '☕', bottle: '🍼',
  bowl: '🥣',

  // clothes
  shirt: '👕', tshirt: '👕', dress: '👗', skirt: '👗', pants: '👖', jeans: '👖',
  shoes: '👟', boots: '🥾', hat: '🎩', cap: '🧢', socks: '🧦', gloves: '🧤',
  jacket: '🧥', coat: '🧥', scarf: '🧣', tie: '👔', shorts: '🩳', swimsuit: '🩱',

  // body
  hand: '✋', foot: '🦶', eye: '👁️', ear: '👂', nose: '👃', mouth: '👄',
  tooth: '🦷', teeth: '🦷', tongue: '👅', lip: '👄', lips: '👄', face: '😀',
  hair: '💇', head: '🧠', brain: '🧠', heart: '❤️', leg: '🦵', arm: '💪',
  finger: '👆', knee: '🦵',

  // people
  mother: '👩', father: '👨', brother: '👦', sister: '👧', son: '👦', daughter: '👧',
  friend: '👫', boy: '👦', girl: '👧', man: '👨', woman: '👩', baby: '👶',
  child: '🧒', teacher: '👩‍🏫', doctor: '👨‍⚕️', nurse: '🧑‍⚕️', cook: '👨‍🍳',
  artist: '🧑‍🎨', police: '👮', driver: '🚗', farmer: '🧑‍🌾',
  king: '🤴', queen: '👸',

  // nature
  tree: '🌳', flower: '🌸', sun: '☀️', moon: '🌙', sky: '☁️', star: '⭐',
  cloud: '☁️', rain: '🌧️', snow: '❄️', wind: '💨', fire: '🔥', earth: '🌍',
  mountain: '⛰️', sea: '🌊', river: '🏞️', forest: '🌲', beach: '🏖️',
  island: '🏝️', leaf: '🍃', grass: '🌱', rock: '🪨', diamond: '💎',

  // places + transport
  school: '🏫', shop: '🏪', store: '🏬', city: '🏙️', street: '🛣️',
  road: '🛣️', bridge: '🌉', church: '⛪', hospital: '🏥', bank: '🏦',
  hotel: '🏨', restaurant: '🍽️', cafe: '☕', park: '🏞️', zoo: '🦁',
  museum: '🏛️', library: '📚', office: '🏢', factory: '🏭',
  airport: '🛫', station: '🚉',
  car: '🚗', train: '🚆', bus: '🚌', plane: '✈️', ship: '🚢', boat: '⛵',
  bike: '🚲', bicycle: '🚲', motorcycle: '🏍️', taxi: '🚕', truck: '🚚',
  ticket: '🎫',

  // colors (as colored squares)
  red: '🟥', blue: '🟦', green: '🟩', yellow: '🟨', orange: '🟧', purple: '🟪',
  black: '⬛', white: '⬜', brown: '🟫', pink: '🌸',

  // time + numbers (a few)
  monday: '📅', tuesday: '📅', wednesday: '📅', thursday: '📅', friday: '📅',
  saturday: '📅', sunday: '📅',
  morning: '🌅', evening: '🌆', night: '🌙', day: '☀️',
  one: '1️⃣', two: '2️⃣', three: '3️⃣', four: '4️⃣', five: '5️⃣',
  six: '6️⃣', seven: '7️⃣', eight: '8️⃣', nine: '9️⃣', ten: '🔟',

  // emotions (faces)
  happy: '😊', sad: '😢', angry: '😡', tired: '😴', sleepy: '😴', surprised: '😲',
  bored: '😑', scared: '😨', love: '❤️', laugh: '😂', cry: '😭',

  // misc
  music: '🎵', game: '🎮', movie: '🎬', sport: '⚽', ball: '⚽', football: '⚽',
  basketball: '🏀', tennis: '🎾', swimming: '🏊', running: '🏃', dance: '💃',
  party: '🎉', birthday: '🎂', wedding: '💒',
  money: '💵', dollar: '💲', card: '💳',
  hot: '🔥', cold: '❄️', big: '🐘', small: '🐭',
  yes: '✅', no: '❌', ok: '👌', good: '👍', bad: '👎',
  hello: '👋', goodbye: '👋', please: '🙏', sorry: '🙇',
  question: '❓', answer: '💡',
};

export function hasEmoji(en: string): boolean {
  return EMOJI_MAP[en.toLowerCase()] !== undefined;
}

export function emojiFor(en: string): string {
  return EMOJI_MAP[en.toLowerCase()] ?? '🔤';
}
