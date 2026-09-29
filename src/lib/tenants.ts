export const PUBLIC_TENANT_COLUMNS = [
  'id', 'slug', 'name', 'is_active', 'logo_url', 'theme', 'primary_color',
  'font_family', 'body_font_family', 'hero_font_family', 'hero_word_1',
  'hero_word_2', 'hero_word_3', 'hero_word_4', 'hero_image_url',
  'hero_font_color', 'hero_font_size', 'hero_image_size', 'hero_subtitle',
  'hero_subtitle_font', 'hero_subtitle_size', 'logo_size', 'created_at',
].join(',');

export type TenantRow = {
  id: string;
  slug: string;
  name: string;
  is_active: boolean;
  logo_url: string | null;
  theme: string;
  primary_color: string;
  font_family: string;
  body_font_family: string | null;
  hero_font_family: string | null;
  hero_word_1: string | null;
  hero_word_2: string | null;
  hero_word_3: string | null;
  hero_word_4: string | null;
  hero_image_url: string | null;
  hero_font_color: string | null;
  hero_font_size: string | null;
  hero_image_size: string | null;
  hero_subtitle: string | null;
  hero_subtitle_font: string | null;
  hero_subtitle_size: string | null;
  logo_size: string | null;
  created_at: string;
};

export type PublicTenant = {
  id: string;
  slug: string;
  name: string;
  isActive: boolean;
  logoUrl?: string;
  theme: string;
  primaryColor: string;
  fontFamily: string;
  bodyFontFamily?: string;
  heroFontFamily?: string;
  heroWord1?: string;
  heroWord2?: string;
  heroWord3?: string;
  heroWord4?: string;
  heroImageUrl?: string;
  heroFontColor?: string;
  heroFontSize?: string;
  heroImageSize?: string;
  heroSubtitle?: string;
  heroSubtitleFont?: string;
  heroSubtitleSize?: string;
  logoSize?: string;
  footerCopyright?: string;
  footerCnpj?: string;
  createdAt: string;
};

export function normalizeTenantSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function mapTenantRow(row: TenantRow): PublicTenant {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    isActive: row.is_active,
    logoUrl: row.logo_url ?? undefined,
    theme: row.theme === 'design1' ? 'design2' : row.theme,
    primaryColor: row.primary_color,
    fontFamily: row.font_family,
    bodyFontFamily: row.body_font_family ?? undefined,
    heroFontFamily: row.hero_font_family ?? undefined,
    heroWord1: row.hero_word_1 ?? undefined,
    heroWord2: row.hero_word_2 ?? undefined,
    heroWord3: row.hero_word_3 ?? undefined,
    heroWord4: row.hero_word_4 ?? undefined,
    heroImageUrl: row.hero_image_url ?? undefined,
    heroFontColor: row.hero_font_color ?? undefined,
    heroFontSize: row.hero_font_size ?? undefined,
    heroImageSize: row.hero_image_size ?? undefined,
    heroSubtitle: row.hero_subtitle ?? undefined,
    heroSubtitleFont: row.hero_subtitle_font ?? undefined,
    heroSubtitleSize: row.hero_subtitle_size ?? undefined,
    logoSize: row.logo_size ?? undefined,
    createdAt: row.created_at,
  };
}
