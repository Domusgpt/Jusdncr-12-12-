
import { StylePreset } from "./types";

export const CREDIT_COST_PER_SONG = 1;
export const CREDITS_PACK_PRICE = 5;
export const CREDITS_PER_PACK = 10;

export const TIER_LIMITS = {
  free: {
    maxDuration: 300,
    genCount: 16,
    label: 'Free Preview',
    maxDecks: 2
  },
  pro: {
    maxDuration: 300,
    genCount: 16,
    label: 'Full Access',
    maxDecks: 8
  }
};

/**
 * STYLE PRESETS - Optimized for Frequency Golemz
 *
 * Each style must:
 * 1. Specify a SIMPLE, UNIFORM background (solid, gradient, or abstract pattern)
 * 2. Apply consistent styling to the subject
 * 3. Maintain visual coherence across poses
 *
 * Background keywords that work well:
 * - "solid color background", "gradient background", "abstract background"
 * - "void background", "dark background", "studio lighting"
 * - "simple backdrop", "uniform background"
 */
export const STYLE_PRESETS: StylePreset[] = [
  // ==========================================================================
  // CINEMATIC (8 Options)
  // ==========================================================================
  {
    id: 'neon-cyber',
    name: 'Neon Cyberpunk',
    category: 'Cinematic',
    description: 'Glowing neon, dark tech aesthetic.',
    promptModifier: 'cyberpunk style, neon rim lighting, glowing cyan and magenta edges, dark void background with subtle grid, high contrast, sharp details, futuristic.',
    thumbnail: 'https://picsum.photos/id/132/100/100',
    hologramParams: { geometryType: 0, hue: 280, chaos: 0.3, density: 1.2, speed: 0.8, intensity: 0.7 }
  },
  {
    id: 'noir',
    name: 'Neo Noir',
    category: 'Cinematic',
    description: 'Black and white, dramatic shadows.',
    promptModifier: 'film noir style, black and white, dramatic side lighting, deep shadows, solid dark background, high contrast, moody, cinematic.',
    thumbnail: 'https://picsum.photos/id/237/100/100',
    hologramParams: { geometryType: 6, hue: 0, saturation: 0, chaos: 0.1, density: 0.5, speed: 0.2, intensity: 0.8 }
  },
  {
    id: 'natural',
    name: 'Studio Clean',
    category: 'Cinematic',
    description: 'Clean studio look, natural colors.',
    promptModifier: 'professional studio photography, soft diffused lighting, clean solid gray background, natural colors, high fidelity, sharp focus.',
    thumbnail: 'https://picsum.photos/id/64/100/100',
    hologramParams: { geometryType: 6, hue: 200, chaos: 0.0, density: 0.5, speed: 0.3, intensity: 0.3 }
  },
  {
    id: 'vintage-film',
    name: 'Vintage Film',
    category: 'Cinematic',
    description: 'Warm 70s Kodak look.',
    promptModifier: 'vintage 70s film photography, kodak portra colors, warm orange tint, film grain, soft focus, solid warm beige background, nostalgic.',
    thumbnail: 'https://picsum.photos/id/435/100/100',
    hologramParams: { geometryType: 6, hue: 30, chaos: 0.2, density: 0.7, speed: 0.1, intensity: 0.4 }
  },
  {
    id: 'golden-hour',
    name: 'Golden Hour',
    category: 'Cinematic',
    description: 'Warm sunset glow.',
    promptModifier: 'golden hour lighting, warm orange and pink gradient background, soft rim light, lens flare, dreamy atmosphere, cinematic warmth.',
    thumbnail: 'https://picsum.photos/id/167/100/100',
    hologramParams: { geometryType: 3, hue: 30, chaos: 0.0, density: 0.4, speed: 0.2, intensity: 0.5 }
  },
  {
    id: 'moonlit',
    name: 'Moonlit',
    category: 'Cinematic',
    description: 'Cool blue night mood.',
    promptModifier: 'moonlight atmosphere, cool blue tones, silver rim lighting, dark blue gradient background, mysterious, ethereal glow, night scene.',
    thumbnail: 'https://picsum.photos/id/173/100/100',
    hologramParams: { geometryType: 6, hue: 220, chaos: 0.1, density: 0.6, speed: 0.3, intensity: 0.6 }
  },
  {
    id: 'neon-rain',
    name: 'Neon Rain',
    category: 'Cinematic',
    description: 'Rainy cyberpunk streets.',
    promptModifier: 'rainy night scene, wet reflective surfaces, neon pink and blue lighting, dark background with rain streaks, cinematic, blade runner aesthetic.',
    thumbnail: 'https://picsum.photos/id/188/100/100',
    hologramParams: { geometryType: 0, hue: 300, chaos: 0.3, density: 1.0, speed: 0.6, intensity: 0.7 }
  },
  {
    id: 'hologram',
    name: 'Hologram',
    category: 'Cinematic',
    description: 'Futuristic holographic projection.',
    promptModifier: 'holographic projection effect, cyan blue tint, scan lines, digital grid background, transparent edges, futuristic technology, sci-fi.',
    thumbnail: 'https://picsum.photos/id/201/100/100',
    hologramParams: { geometryType: 1, hue: 180, chaos: 0.2, density: 1.5, speed: 0.5, intensity: 0.8 }
  },

  // ==========================================================================
  // ANIME / 2D (8 Options)
  // ==========================================================================
  {
    id: 'retro-anime',
    name: 'Retro Anime',
    category: 'Anime/2D',
    description: '90s anime cel-shaded look.',
    promptModifier: '90s anime style, cel shaded, bold outlines, flat colors, simple gradient background, retro aesthetic, hand drawn look, nostalgic.',
    thumbnail: 'https://picsum.photos/id/234/100/100',
    hologramParams: { geometryType: 1, hue: 340, chaos: 0.1, density: 0.8, speed: 0.4, intensity: 0.5 }
  },
  {
    id: 'manga-ink',
    name: 'Manga Ink',
    category: 'Anime/2D',
    description: 'Black ink manga style.',
    promptModifier: 'manga art style, black ink drawing, bold expressive lines, white paper background, hatching shading, dramatic poses, japanese comic.',
    thumbnail: 'https://picsum.photos/id/433/100/100',
    hologramParams: { geometryType: 0, hue: 0, chaos: 0.4, density: 1.0, speed: 1.5, intensity: 0.9 }
  },
  {
    id: 'pixel-art',
    name: '16-Bit Pixel',
    category: 'Anime/2D',
    description: 'Retro game sprite.',
    promptModifier: 'pixel art style, 16-bit game sprite, limited color palette, dithering, solid color background, retro video game aesthetic, crisp pixels.',
    thumbnail: 'https://picsum.photos/id/532/100/100',
    hologramParams: { geometryType: 1, hue: 120, chaos: 0.0, density: 2.0, speed: 0.8, intensity: 0.6 }
  },
  {
    id: 'vector-flat',
    name: 'Vector Flat',
    category: 'Anime/2D',
    description: 'Clean minimal vectors.',
    promptModifier: 'flat vector illustration, clean geometric shapes, minimal shading, vibrant solid colors, simple solid background, modern graphic design.',
    thumbnail: 'https://picsum.photos/id/106/100/100',
    hologramParams: { geometryType: 2, hue: 180, chaos: 0.0, density: 0.3, speed: 0.2, intensity: 0.7 }
  },
  {
    id: 'synthwave',
    name: 'Synthwave',
    category: 'Anime/2D',
    description: '80s retro-future neon.',
    promptModifier: 'synthwave aesthetic, neon pink and cyan, chrome reflections, retro 80s style, sunset gradient background with grid, outrun vibes.',
    thumbnail: 'https://picsum.photos/id/244/100/100',
    hologramParams: { geometryType: 3, hue: 320, chaos: 0.1, density: 0.8, speed: 0.4, intensity: 0.7 }
  },
  {
    id: 'chibi-pop',
    name: 'Chibi Pop',
    category: 'Anime/2D',
    description: 'Cute pastel kawaii.',
    promptModifier: 'chibi anime style, soft pastel colors, cute kawaii aesthetic, simple cel shading, solid pastel background, round shapes, adorable.',
    thumbnail: 'https://picsum.photos/id/256/100/100',
    hologramParams: { geometryType: 2, hue: 330, chaos: 0.0, density: 0.4, speed: 0.3, intensity: 0.5 }
  },
  {
    id: 'lineart',
    name: 'Clean Lineart',
    category: 'Anime/2D',
    description: 'Elegant line drawing.',
    promptModifier: 'clean line art, elegant black outlines, white background, no fill, minimal style, technical drawing aesthetic, precise lines.',
    thumbnail: 'https://picsum.photos/id/267/100/100',
    hologramParams: { geometryType: 6, hue: 0, saturation: 0, chaos: 0.0, density: 0.3, speed: 0.1, intensity: 0.4 }
  },
  {
    id: 'comic-book',
    name: 'Comic Book',
    category: 'Anime/2D',
    description: 'Bold American comics.',
    promptModifier: 'comic book style, bold black outlines, halftone dots, vivid primary colors, action pose, dynamic shading, marvel dc aesthetic.',
    thumbnail: 'https://picsum.photos/id/278/100/100',
    hologramParams: { geometryType: 4, hue: 0, chaos: 0.3, density: 0.8, speed: 0.6, intensity: 0.7 }
  },

  // ==========================================================================
  // DIGITAL / GLITCH (8 Options)
  // ==========================================================================
  {
    id: 'acid-glitch',
    name: 'Acid Glitch',
    category: 'Digital/Glitch',
    description: 'Distorted digital chaos.',
    promptModifier: 'glitch art, chromatic aberration, digital distortion, acid neon colors, dark background with noise, psychedelic, data corruption aesthetic.',
    thumbnail: 'https://picsum.photos/id/345/100/100',
    hologramParams: { geometryType: 4, hue: 120, chaos: 0.8, density: 1.5, speed: 1.2, intensity: 0.8 }
  },
  {
    id: 'vaporwave',
    name: 'Vaporwave',
    category: 'Digital/Glitch',
    description: 'Pastel retro aesthetic.',
    promptModifier: 'vaporwave aesthetic, pastel pink and cyan gradient background, 80s nostalgia, soft glow, dreamy atmosphere, retro computer graphics.',
    thumbnail: 'https://picsum.photos/id/321/100/100',
    hologramParams: { geometryType: 3, hue: 300, chaos: 0.0, density: 0.6, speed: 0.2, intensity: 0.5 }
  },
  {
    id: 'crt-terminal',
    name: 'CRT Terminal',
    category: 'Digital/Glitch',
    description: 'Green phosphor monitor.',
    promptModifier: 'crt monitor effect, green phosphor glow, scanlines, black background, digital terminal aesthetic, matrix style, retro computing.',
    thumbnail: 'https://picsum.photos/id/54/100/100',
    hologramParams: { geometryType: 1, hue: 100, chaos: 0.2, density: 1.8, speed: 0.5, intensity: 0.8 }
  },
  {
    id: 'low-poly',
    name: 'Low Poly',
    category: 'Digital/Glitch',
    description: 'Geometric 3D facets.',
    promptModifier: 'low poly 3d style, geometric facets, triangular mesh, flat shading, solid gradient background, playstation 1 aesthetic, angular.',
    thumbnail: 'https://picsum.photos/id/96/100/100',
    hologramParams: { geometryType: 0, hue: 240, chaos: 0.1, density: 0.5, speed: 0.4, intensity: 0.6 }
  },
  {
    id: 'matrix',
    name: 'Matrix Code',
    category: 'Digital/Glitch',
    description: 'Falling green code.',
    promptModifier: 'matrix code aesthetic, green digital rain, dark background, code overlay, green tinted, cyber hacker style, digital world.',
    thumbnail: 'https://picsum.photos/id/356/100/100',
    hologramParams: { geometryType: 1, hue: 120, chaos: 0.3, density: 2.0, speed: 0.8, intensity: 0.9 }
  },
  {
    id: 'corrupted',
    name: 'Corrupted Data',
    category: 'Digital/Glitch',
    description: 'Broken file aesthetic.',
    promptModifier: 'corrupted image effect, datamosh glitches, color banding, static noise background, broken pixels, digital decay, error aesthetic.',
    thumbnail: 'https://picsum.photos/id/367/100/100',
    hologramParams: { geometryType: 4, hue: 0, chaos: 1.0, density: 1.2, speed: 1.5, intensity: 0.8 }
  },
  {
    id: 'thermal',
    name: 'Thermal Vision',
    category: 'Digital/Glitch',
    description: 'Heat map colors.',
    promptModifier: 'thermal imaging camera effect, heat map colors from blue to red, black background, infrared vision style, scientific aesthetic.',
    thumbnail: 'https://picsum.photos/id/378/100/100',
    hologramParams: { geometryType: 0, hue: 0, chaos: 0.2, density: 0.8, speed: 0.4, intensity: 0.7 }
  },
  {
    id: 'xray',
    name: 'X-Ray',
    category: 'Digital/Glitch',
    description: 'Medical scan aesthetic.',
    promptModifier: 'x-ray effect, inverted colors, blue and white tones, dark background, translucent layers, medical imaging style, skeletal glow.',
    thumbnail: 'https://picsum.photos/id/389/100/100',
    hologramParams: { geometryType: 6, hue: 200, chaos: 0.1, density: 0.6, speed: 0.3, intensity: 0.6 }
  },

  // ==========================================================================
  // ARTISTIC (8 Options)
  // ==========================================================================
  {
    id: 'oil-painting',
    name: 'Dreamy Oil',
    category: 'Artistic',
    description: 'Fluid brush strokes.',
    promptModifier: 'oil painting style, thick impasto brush strokes, vivid colors, swirling abstract background, dreamy atmosphere, expressionist art.',
    thumbnail: 'https://picsum.photos/id/456/100/100',
    hologramParams: { geometryType: 3, hue: 200, chaos: 0.0, density: 0.6, speed: 0.2, intensity: 0.6 }
  },
  {
    id: 'watercolor',
    name: 'Watercolor',
    category: 'Artistic',
    description: 'Soft flowing washes.',
    promptModifier: 'watercolor painting, soft color washes, wet on wet technique, white paper background with color bleeds, delicate, artistic.',
    thumbnail: 'https://picsum.photos/id/467/100/100',
    hologramParams: { geometryType: 3, hue: 180, chaos: 0.0, density: 0.4, speed: 0.2, intensity: 0.5 }
  },
  {
    id: 'claymation',
    name: 'Claymation',
    category: 'Artistic',
    description: 'Stop-motion clay look.',
    promptModifier: 'claymation style, plasticine texture, soft diffused lighting, solid color studio background, stop motion aesthetic, tactile.',
    thumbnail: 'https://picsum.photos/id/674/100/100',
    hologramParams: { geometryType: 2, hue: 40, chaos: 0.0, density: 0.4, speed: 0.3, intensity: 0.5 }
  },
  {
    id: 'street-graffiti',
    name: 'Street Graffiti',
    category: 'Artistic',
    description: 'Urban spray paint.',
    promptModifier: 'graffiti art style, spray paint texture, drip effects, vibrant colors, brick wall background, urban street art, bold.',
    thumbnail: 'https://picsum.photos/id/103/100/100',
    hologramParams: { geometryType: 4, hue: 320, chaos: 0.6, density: 0.9, speed: 0.7, intensity: 0.8 }
  },
  {
    id: 'charcoal',
    name: 'Charcoal Sketch',
    category: 'Artistic',
    description: 'Smudged pencil drawing.',
    promptModifier: 'charcoal sketch, smudged graphite, rough paper texture, gray tones, expressive strokes, artistic drawing, tonal shading.',
    thumbnail: 'https://picsum.photos/id/478/100/100',
    hologramParams: { geometryType: 6, hue: 0, saturation: 0, chaos: 0.1, density: 0.5, speed: 0.2, intensity: 0.5 }
  },
  {
    id: 'pop-art',
    name: 'Pop Art',
    category: 'Artistic',
    description: 'Bold Warhol style.',
    promptModifier: 'pop art style, bold primary colors, halftone dots, high contrast, solid color background, andy warhol aesthetic, graphic.',
    thumbnail: 'https://picsum.photos/id/489/100/100',
    hologramParams: { geometryType: 2, hue: 60, chaos: 0.2, density: 0.7, speed: 0.5, intensity: 0.7 }
  },
  {
    id: 'stained-glass',
    name: 'Stained Glass',
    category: 'Artistic',
    description: 'Jewel-toned segments.',
    promptModifier: 'stained glass window style, black leading lines, jewel tone colors, backlit glow, gothic aesthetic, colorful segments, luminous.',
    thumbnail: 'https://picsum.photos/id/490/100/100',
    hologramParams: { geometryType: 5, hue: 280, chaos: 0.1, density: 0.6, speed: 0.3, intensity: 0.6 }
  },
  {
    id: 'ukiyo-e',
    name: 'Ukiyo-e',
    category: 'Artistic',
    description: 'Japanese woodblock.',
    promptModifier: 'ukiyo-e style, japanese woodblock print, flat colors, bold outlines, wave patterns, textured paper background, traditional art.',
    thumbnail: 'https://picsum.photos/id/88/100/100',
    hologramParams: { geometryType: 5, hue: 210, chaos: 0.0, density: 0.4, speed: 0.2, intensity: 0.4 }
  },

  // ==========================================================================
  // ABSTRACT (8 Options) - NEW CATEGORY
  // ==========================================================================
  {
    id: 'geometric',
    name: 'Geometric',
    category: 'Abstract',
    description: 'Angular shapes and lines.',
    promptModifier: 'geometric abstract style, triangular facets, clean angular shapes, solid gradient background, modern minimal, polygon art.',
    thumbnail: 'https://picsum.photos/id/501/100/100',
    hologramParams: { geometryType: 0, hue: 200, chaos: 0.1, density: 0.6, speed: 0.4, intensity: 0.6 }
  },
  {
    id: 'liquid-metal',
    name: 'Liquid Metal',
    category: 'Abstract',
    description: 'Chrome mercury effect.',
    promptModifier: 'liquid metal chrome effect, reflective mercury surface, dark void background, metallic sheen, t-1000 aesthetic, fluid metal.',
    thumbnail: 'https://picsum.photos/id/512/100/100',
    hologramParams: { geometryType: 3, hue: 200, chaos: 0.2, density: 0.8, speed: 0.5, intensity: 0.8 }
  },
  {
    id: 'smoke',
    name: 'Smoke Form',
    category: 'Abstract',
    description: 'Wispy ethereal vapor.',
    promptModifier: 'smoke and vapor effect, wispy ethereal forms, dark gradient background, flowing particles, mystical atmosphere, dissipating edges.',
    thumbnail: 'https://picsum.photos/id/523/100/100',
    hologramParams: { geometryType: 3, hue: 260, chaos: 0.3, density: 0.5, speed: 0.3, intensity: 0.5 }
  },
  {
    id: 'crystal',
    name: 'Crystal',
    category: 'Abstract',
    description: 'Prismatic gemstone.',
    promptModifier: 'crystal gemstone effect, prismatic refractions, faceted surfaces, dark background with light beams, jewel tones, translucent.',
    thumbnail: 'https://picsum.photos/id/534/100/100',
    hologramParams: { geometryType: 0, hue: 300, chaos: 0.1, density: 0.7, speed: 0.4, intensity: 0.7 }
  },
  {
    id: 'neon-outline',
    name: 'Neon Outline',
    category: 'Abstract',
    description: 'Glowing edge lines only.',
    promptModifier: 'neon outline effect, glowing edge lines, dark black background, vibrant neon colors, minimalist silhouette, light trails.',
    thumbnail: 'https://picsum.photos/id/545/100/100',
    hologramParams: { geometryType: 1, hue: 320, chaos: 0.2, density: 1.0, speed: 0.6, intensity: 0.8 }
  },
  {
    id: 'double-exposure',
    name: 'Double Exposure',
    category: 'Abstract',
    description: 'Layered transparency.',
    promptModifier: 'double exposure effect, layered transparent images, nature overlay, ethereal blend, artistic photography, dreamlike composition.',
    thumbnail: 'https://picsum.photos/id/556/100/100',
    hologramParams: { geometryType: 3, hue: 160, chaos: 0.1, density: 0.5, speed: 0.2, intensity: 0.5 }
  },
  {
    id: 'particle',
    name: 'Particle Dissolve',
    category: 'Abstract',
    description: 'Breaking into particles.',
    promptModifier: 'particle dissolve effect, breaking apart into dots, scatter effect, dark background, digital disintegration, floating particles.',
    thumbnail: 'https://picsum.photos/id/567/100/100',
    hologramParams: { geometryType: 4, hue: 40, chaos: 0.4, density: 1.2, speed: 0.7, intensity: 0.7 }
  },
  {
    id: 'aurora',
    name: 'Aurora',
    category: 'Abstract',
    description: 'Northern lights glow.',
    promptModifier: 'aurora borealis effect, flowing green and purple lights, dark sky background, ethereal glow, northern lights colors, magical.',
    thumbnail: 'https://picsum.photos/id/578/100/100',
    hologramParams: { geometryType: 3, hue: 140, chaos: 0.2, density: 0.6, speed: 0.4, intensity: 0.6 }
  }
];
