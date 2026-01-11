# AI Title and Description Generation Template

## Purpose
Ensure consistent format and style for all AI-generated product titles and descriptions across all products.

## Template Structure

### For Slovak (SK) Products:

**Title Format:**
- Start with descriptive adjective/noun (e.g., "Unikátna drevorezba", "Detailná socha")
- Include main subject/theme (e.g., "prírodného motívu", "fantasy postavy")
- Optionally include size reference if visible (e.g., "strednej veľkosti")
- Length: 3-6 words
- Examples:
  - "Unikátna drevorezba prírodného motívu"
  - "Detailná socha fantasy postavy"
  - "Stredná drevorezba abstraktného tvaru"

**Description Format:**
```
[Opening sentence] Táto [type: drevorezba/socha] bola [verb: vyrezaná/vytvorená] ručne z [wood type: lipového dreva/jelšového dreva] Igorom Mrazom v jeho [location: slovenskej dielni].

[Detail sentence 1] [Describe main visual elements, patterns, or artistic style visible in image]

[Detail sentence 2] [Describe texture, finish, dimensions if visible, or artistic technique]

[Closing sentence] Ide o jedinečný originálny kus - každý kus je unikátny a nebude replikovaný.
```

**Example:**
```
Táto drevorezba bola vyrezaná ručne z lipového dreva Igorom Mrazom v jeho slovenskej dielni. 
Zobrazuje organické tvary inšpirované prírodou s detailným vypracovaním povrchovej textúry. 
Kus má prirodzený povrch s jemnou olejovou úpravou, ktorá zdôrazňuje prirodzenú krásu dreva. 
Ide o jedinečný originálny kus - každý kus je unikátny a nebude replikovaný.
```

### For English (EN) Products:

**Title Format:**
- Start with descriptive adjective/noun (e.g., "Unique wood carving", "Detailed sculpture")
- Include main subject/theme (e.g., "nature-inspired", "fantasy character")
- Optionally include size reference if visible (e.g., "medium size")
- Length: 3-6 words
- Examples:
  - "Unique nature-inspired wood carving"
  - "Detailed fantasy character sculpture"
  - "Medium abstract wood carving"

**Description Format:**
```
[Opening sentence] This [type: wood carving/sculpture] was [verb: hand-carved/handcrafted] by Igor Mraz in his [location: Slovak workshop] from [wood type: linden wood/alder wood].

[Detail sentence 1] [Describe main visual elements, patterns, or artistic style visible in image]

[Detail sentence 2] [Describe texture, finish, dimensions if visible, or artistic technique]

[Closing sentence] This is a one-of-a-kind original piece — each piece is unique and will not be replicated.
```

**Example:**
```
This wood carving was hand-carved by Igor Mraz in his Slovak workshop from linden wood.
It features organic shapes inspired by nature with detailed surface texture work.
The piece has a natural finish with light oil treatment that highlights the natural beauty of the wood.
This is a one-of-a-kind original piece — each piece is unique and will not be replicated.
```

## AI Prompt Template for Gemini API

```
Analyze this image of a handcrafted wooden art piece and generate:

1. A concise title (3-6 words) that describes the piece
2. A detailed description (3-4 sentences, ~150 words) following this format:

[Opening: "This wood carving/sculpture was hand-carved by Igor Mraz in his Slovak workshop from linden wood."]
[Detail 1: Describe visual elements, patterns, style]
[Detail 2: Describe texture, finish, dimensions if visible]
[Closing: "This is a one-of-a-kind original piece — each piece is unique and will not be replicated."]

Language: {locale}
Style: Professional, descriptive, highlighting craftsmanship and uniqueness
Tone: Elegant but accessible

Return as JSON:
{
  "title": "...",
  "description": "..."
}
```

## Categories Mapping
- PAINTINGS → "wall carving", "nástenný reliéf"
- SCULPTURES → "sculpture", "socha"
- WALL_CARVINGS → "wall carving", "nástenný reliéf"
- FREE_STANDING → "free-standing sculpture", "samostatná socha"
- NATURE_INSPIRED → "nature-inspired", "prírodne inšpirované"
- FANTASY_MYTH → "fantasy/mythological", "fantasy/mytologické"
- CUSTOM → "custom piece", "kus na mieru"

## Implementation Notes
- Always use consistent wood type (linden/lipové)
- Always mention "hand-carved/handcrafted"
- Always include uniqueness statement
- Always mention Igor Mraz and Slovak workshop
- Adjust description length based on visible details in image
- If image quality is poor, focus on general style and craftsmanship
