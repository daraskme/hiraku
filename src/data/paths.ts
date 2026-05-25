/**
 * 学習パス定義 — 教材を順序立てた推奨ルート集。
 *
 * 各パスは「テーマ／難易度／時代」のどれか軸にそって、教材を読む順序を提案する。
 * 教師の「単元計画」や、自学者の「次に何を読むか」の道しるべとして機能する。
 */

export interface PathStep {
  collection: string;
  id: string;
  /** 説明文 (パスの中での位置づけ) */
  note?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  audience: string;
  estimated_total_minutes: number;
  difficulty: '初級' | '中級' | '上級';
  /** 主たる学校段階 */
  stage: '小学校' | '中学校' | '高等学校' | '横断';
  /** カラーキー (UI 用) */
  accent: 'amber' | 'rose' | 'indigo' | 'teal' | 'lime' | 'violet';
  steps: PathStep[];
}

export const PATHS: LearningPath[] = [
  {
    id: 'shogaku-meisaku',
    title: '小学校 名作短編 5 選',
    subtitle: '心に残る童話・短編の入門',
    description:
      '小学校国語の代表的な短編を、書かれた時代順に読む。新美南吉、宮沢賢治、芥川龍之介の童話まで。',
    audience: '小学校 3〜6 年生、または児童文学に親しみたい大人',
    estimated_total_minutes: 90,
    difficulty: '初級',
    stage: '小学校',
    accent: 'amber',
    steps: [
      { collection: 'kokugo3', id: 'tebukuro-wo-kaini', note: '冬のはじめての雪と、初めて町を見た子狐 (1943)' },
      { collection: 'kokugo4', id: 'momotaro', note: '誰もが知る昔話 — でも改めて読むと違って見える' },
      { collection: 'kokugo3', id: 'gongitsune', note: '償いと、伝わらない思い (1932)' },
      { collection: 'kokugo4', id: 'yamanashi', note: '蟹の親子が見た「クラムボン」の不思議な世界 (1923)' },
      { collection: 'kokugo3', id: 'akai-rousoku-to-ningyo', note: '小川未明が描く、海と人の交差点' },
    ],
  },
  {
    id: 'koten-yondai-bashira',
    title: '古典文学 四大柱',
    subtitle: '平家物語 → 方丈記 → 枕草子 → 源氏物語',
    description:
      '日本古典文学のもっとも有名な冒頭四つを、無常と美意識の系譜として読み解く。',
    audience: '高校生、または古典に再挑戦したい大人',
    estimated_total_minutes: 80,
    difficulty: '中級',
    stage: '高等学校',
    accent: 'rose',
    steps: [
      { collection: 'kotoko1', id: 'heike-monogatari-gion', note: '祇園精舎の鐘 — 諸行無常の響あり' },
      { collection: 'kotoko1', id: 'hojoki-bouto', note: '河は絶えずして、しかも、もとの水にあらず' },
      { collection: 'kotoko1', id: 'makura-no-soshi-dai-ichi', note: '春はあけぼの — 平安の眼差し' },
      { collection: 'kotoko2', id: 'genji-monogatari-kiritsubo', note: '世界最古の長編心理小説の幕開き' },
    ],
  },
  {
    id: 'edo-meiji-koten',
    title: '江戸〜近代の古典紀行',
    subtitle: '芭蕉から芥川まで',
    description:
      '江戸の俳諧紀行 (奥の細道) から始まり、近代の文豪が古典をいかに更新したかを辿る。',
    audience: '高校生、文学愛好家',
    estimated_total_minutes: 110,
    difficulty: '中級',
    stage: '高等学校',
    accent: 'indigo',
    steps: [
      { collection: 'kotoko1', id: 'oku-no-hosomichi-bouto', note: '月日は百代の過客 — 芭蕉の旅の哲学 (1689)' },
      { collection: 'kotoko1', id: 'tsurezuregusa-jodan-92', note: '兼好法師の批評精神' },
      { collection: 'kotoko1', id: 'ise-monogatari-uikoburi', note: '在原業平の恋と元服' },
      { collection: 'kotoko1', id: 'rashomon', note: '芥川龍之介が今昔物語を再話 (1915)' },
      { collection: 'kotoko1', id: 'sangetsuki', note: '中島敦が中国古典を再構成 (1942)' },
    ],
  },
  {
    id: 'kojiki-shinwa',
    title: '古事記 神話の旅',
    subtitle: '天地の始まりから神武東征まで',
    description:
      '古事記の代表的な神話を、時間順に通読する。日本史の入り口として、また文学としての古事記を体感する。',
    audience: '中学生、神話に関心のある人',
    estimated_total_minutes: 100,
    difficulty: '中級',
    stage: '中学校',
    accent: 'teal',
    steps: [
      { collection: 'chugakurekishi1', id: 'ama-no-iwato', note: '天照大神の岩戸隠れ' },
      { collection: 'chugakurekishi1', id: 'yamata-no-orochi', note: 'スサノオと八岐大蛇 — 4 つの解釈' },
      { collection: 'chugakurekishi1', id: 'inaba-no-shirousagi', note: 'オオクニヌシと因幡の白兎' },
      { collection: 'chugakurekishi1', id: 'kuniyuzuri', note: '出雲大社の起源 — 国譲り神話' },
      { collection: 'chugakurekishi1', id: 'tenson-korin', note: '天孫降臨と三種の神器' },
      { collection: 'chugakurekishi1', id: 'jinmu-tosei', note: '神武東征と皇紀の議論' },
    ],
  },
  {
    id: 'kindai-kenpo-rekishi',
    title: '近代立憲主義の系譜',
    subtitle: '五箇条の御誓文 → 大日本帝国憲法 → 日本国憲法',
    description:
      '明治維新から戦後憲法まで、日本の立憲主義の歩みを史料で辿る。',
    audience: '中3 公民・高1 日本史の学習者',
    estimated_total_minutes: 90,
    difficulty: '中級',
    stage: '横断',
    accent: 'violet',
    steps: [
      { collection: 'chugakukomin3', id: 'gokajo-no-goseimon', note: '1868年・明治維新の出発点' },
      { collection: 'chugakukomin3', id: 'gakumon-no-susume', note: '福沢諭吉「天は人の上に人を造らず」(1872)' },
      { collection: 'kotorekishi1', id: 'teikoku-kenpo', note: '1889年・大日本帝国憲法第一章' },
      { collection: 'chugakukomin3', id: 'kyoiku-chokugo', note: '1890年・教育勅語と批判的注釈' },
      { collection: 'chugakukomin3', id: 'kenpo-zenbun', note: '1946年・日本国憲法前文' },
    ],
  },
  {
    id: 'kodai-sekai-shisō',
    title: '古代世界の思想',
    subtitle: 'ペリクレス、カエサル、マグナ・カルタ',
    description:
      '古代ギリシャ・ローマと中世西洋の代表的史料を通じて、立憲・民主・帝国・抵抗の系譜を読む。',
    audience: '高1 世界史の学習者',
    estimated_total_minutes: 75,
    difficulty: '上級',
    stage: '高等学校',
    accent: 'lime',
    steps: [
      { collection: 'kotosekaishi1', id: 'pericles-funeral-oration', note: '紀元前 431 年・民主主義の宣言' },
      { collection: 'kotosekaishi1', id: 'caesar-gallic-wars-i-1', note: 'カエサル『ガリア戦記』冒頭' },
      { collection: 'kotosekaishi1', id: 'magna-carta', note: '1215年・法の支配の起源' },
    ],
  },
  {
    id: 'kindai-meisaku',
    title: '近代日本文学 短編傑作選',
    subtitle: '芥川 → 中島 → 太宰 → 中也',
    description:
      '大正末〜昭和初の名作短編・詩を、簡潔な順で読む。「人間とは何か」を問う書き手たちの系譜。',
    audience: '中3〜高校生、近代文学入門',
    estimated_total_minutes: 95,
    difficulty: '中級',
    stage: '高等学校',
    accent: 'indigo',
    steps: [
      { collection: 'kotoko1', id: 'rashomon', note: '芥川龍之介「羅生門」 — 善悪の境界 (1915)' },
      { collection: 'kotoko1', id: 'sangetsuki', note: '中島敦「山月記」 — 詩才と自我の檻 (1942)' },
      { collection: 'chugaku3', id: 'lemon-aika', note: '高村光太郎「レモン哀歌」 — 死と愛の凝縮 (1939)' },
      { collection: 'chugaku2', id: 'hashire-merosu', note: '太宰治「走れメロス」 — 友情と疑心 (1940)' },
    ],
  },
  {
    id: 'rika-zuihitsu',
    title: '寺田寅彦 — 科学と随筆の間',
    subtitle: '茶碗の湯から電車の混雑まで',
    description:
      '日本初の地球物理学教授・寺田寅彦が、日常を観察対象に変える随筆群。理科への入り口。',
    audience: '中学生〜大人。理科と文章の両方を味わいたい人',
    estimated_total_minutes: 75,
    difficulty: '中級',
    stage: '中学校',
    accent: 'teal',
    steps: [
      { collection: 'chugakurika1', id: 'chawan-no-yu', note: '茶碗から立ち昇る湯気と、大気の対流' },
      { collection: 'chugakurika1', id: 'senko-hanabi', note: '線香花火 — 燃焼の四段階' },
      { collection: 'chugakurika1', id: 'konpeito', note: '金平糖 — 結晶の物理学' },
      { collection: 'chugakurika2', id: 'densha-no-konzatsu', note: '電車の混雑 — 統計力学と日常' },
    ],
  },
];

export function findPathsForLesson(collection: string, id: string): { path: LearningPath; index: number }[] {
  const result: { path: LearningPath; index: number }[] = [];
  for (const p of PATHS) {
    const idx = p.steps.findIndex((s) => s.collection === collection && s.id === id);
    if (idx >= 0) result.push({ path: p, index: idx });
  }
  return result;
}
