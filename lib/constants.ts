// 공간 유형 · 인테리어 스타일 정의 (클라이언트 UI와 서버 프롬프트가 공유)

export type RoomType = {
  id: string;
  label: string;
  /** Gemini 프롬프트에 들어갈 영문 명칭 */
  prompt: string;
};

export type StyleOption = {
  id: string;
  label: string;
  desc: string;
  descLong: string;
  image: string;
  colors: string[];
  /** 스타일 카드에 표시되는 대표 색상 스와치 */
  swatch: [string, string, string];
  /** Gemini 프롬프트에 들어갈 스타일 지시문 */
  prompt: string;
};

export const ROOM_TYPES: RoomType[] = [
  { id: "living_room", label: "거실", prompt: "living room" },
  { id: "bedroom", label: "침실", prompt: "bedroom" },
  { id: "kitchen", label: "주방", prompt: "kitchen" },
  { id: "bathroom", label: "욕실", prompt: "bathroom" },
  { id: "study", label: "서재", prompt: "home office / study room" },
  { id: "studio", label: "원룸", prompt: "studio apartment" },
];

export const STYLES: StyleOption[] = [
  {
    id: "modern",
    label: "모던",
    desc: "깔끔하고 정돈된 분위기",
    descLong: "불필요한 장식을 배제하고 직선의 형태미를 강조한 도시적 스타일입니다. 차콜과 메탈릭한 컬러를 베이스로 하여 차분하면서도 세련된 도시 분위기를 냅니다.",
    image: "/styles/style_modern_v2.png",
    colors: ["차콜", "그레이지", "어스 브라운"],
    swatch: ["#2b2b2e", "#c9c9cd", "#8a6f52"],
    prompt:
      "sleek modern style: clean lines, neutral palette with charcoal and greige, low-profile furniture, matte finishes, statement lighting",
  },
  {
    id: "minimal",
    label: "미니멀",
    desc: "단순함과 절제의 미학",
    descLong: "단순함과 여백의 미를 극대화하여 시각적 노이즈를 완전히 줄인 스타일입니다. 은은하게 퍼지는 조명과 숨겨진 수납 공간이 어우러져 마음의 평온을 줍니다.",
    image: "/styles/style_minimal.png",
    colors: ["웜 화이트", "샌드 그레이", "스톤 베이지"],
    swatch: ["#f4f2ee", "#d8d4cc", "#9a958a"],
    prompt:
      "minimalist style: pared-down furnishings, warm white walls, hidden storage, soft diffuse light, generous negative space",
  },
  {
    id: "scandinavian",
    label: "북유럽",
    desc: "따뜻하고 내추럴한 감성",
    descLong: "밝은 오크 원목과 따뜻한 울, 린넨 패브릭으로 완성하는 포근한 북유럽식 공간입니다. 자연스러운 녹색 식물과 기분 좋은 햇살이 일상에 활력을 더해줍니다.",
    image: "/styles/style_scandinavian.png",
    colors: ["내추럴 베이지", "라떼 브라운", "세이지 그린"],
    swatch: ["#e9e2d5", "#b9a284", "#5f6f5e"],
    prompt:
      "Scandinavian style: light oak wood, cozy wool and linen textiles, white and sage accents, hygge atmosphere, potted greenery",
  },
  {
    id: "industrial",
    label: "인더스트리얼",
    desc: "콘크리트와 철제의 조화",
    descLong: "거친 느낌의 노출 콘크리트 벽면과 블랙 스틸 프레임, 빈티지한 브라운 가죽 가구가 주는 남성적이면서도 자유분방한 인더스트리얼 뉴욕 로프트풍 스타일입니다.",
    image: "/styles/style_industrial.png",
    colors: ["러스트 블랙", "카라멜 레더", "스틸 블루"],
    swatch: ["#4a4a4a", "#7d6a58", "#2f3540"],
    prompt:
      "industrial loft style: exposed concrete texture, black steel frames, leather and reclaimed wood furniture, Edison bulb lighting",
  },
  {
    id: "japandi",
    label: "재팬디",
    desc: "동양적 미와 서양식 실용성",
    descLong: "일본식 와비사비(Wabi-Sabi)의 소박하고 고요한 미학과 북유럽식 실용성이 만난 스타일입니다. 정갈한 화분과 도자기, 따뜻한 어스 톤이 마음을 차분하게 진정시켜 줍니다.",
    image: "/styles/style_japandi.png",
    colors: ["웜 아이보리", "올리브 카키", "소일 오커"],
    swatch: ["#ded5c4", "#8c7b60", "#3d3a33"],
    prompt:
      "Japandi style: low wooden furniture, wabi-sabi ceramics, rice-paper lighting, muted earth tones, calm uncluttered balance",
  },
  {
    id: "mid_century",
    label: "미드센추리",
    desc: "레트로한 컬러와 나무 질감",
    descLong: "1950년대 미국의 실용적이고 기하학적인 가구 디자인에서 영감을 얻은 스타일입니다. 월넛 원목 가구와 빈티지 머스터드, 딥그린 등의 포인트 컬러가 어우러져 레트로한 감각을 자아냅니다.",
    image: "/styles/style_mid_century.png",
    colors: ["테라코타 오렌지", "머스터드 옐로우", "포레스트 그린"],
    swatch: ["#b0562f", "#e0b04e", "#3f5748"],
    prompt:
      "mid-century modern style: walnut furniture with tapered legs, mustard and teal accent colors, geometric patterns, retro lighting",
  },
  {
    id: "hanok",
    label: "한옥",
    desc: "전통적인 선과 나무의 편안함",
    descLong: "전통 한옥의 고즈넉한 목조 대들보와 창틀의 격자 구조를 세련된 현대 아파트에 조화시킨 스타일입니다. 자연 채광을 머금는 한지 조명과 단아한 찻상이 동양적인 편안함을 줍니다.",
    image: "/styles/style_hanok.png",
    colors: ["한지 아이보리", "코지 브라운", "내추럴 리넨"],
    swatch: ["#c7b299", "#6e4f33", "#eae3d2"],
    prompt:
      "modern Korean hanok style: warm wooden beams, hanji paper screens, low traditional furniture, natural linen, serene earthy palette",
  },
  {
    id: "hotel_lounge",
    label: "호텔 라운지",
    desc: "고급스럽고 웅장한 디자인",
    descLong: "고급 호텔의 리셉션이나 라운지에 온 듯 웅장함과 아늑함을 동시에 선사하는 스타일입니다. 벨벳 마감 소파, 대리석 가구, 브라스 금속 장식과 은은한 레이어드 조명으로 고급스러움을 더합니다.",
    image: "/styles/style_hotel_lounge.png",
    colors: ["미드나잇 네이비", "헤리티지 골드", "웜 토프"],
    swatch: ["#1f2430", "#9c8455", "#5c5148"],
    prompt:
      "luxury hotel lounge style: plush velvet seating, brass and marble details, layered ambient lighting, dark sophisticated palette",
  },
];

export const FREE_GENERATIONS = 2;
export const DAILY_IP_LIMIT = 10;
