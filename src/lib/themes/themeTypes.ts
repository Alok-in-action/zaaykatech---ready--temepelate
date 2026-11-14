export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export interface ThemeConfig {
  id: string;
  name: string;
  description: string;
  restaurantName?: string;
  tagline?: string;
  logoUrl?: string;
  heroVideoUrl?: string;
  heroPosterUrl?: string;
  heroMediaType?: 'image' | 'video';
  instagramUrl?: string;
  mobileNumber?: string;
  whatsappNumber?: string;
  address?: string;
  mapsUrl?: string;
  reviewUrl?: string;
  showHeroVideo?: boolean;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    muted: string;
    border: string;
  };
  typography: {
    heading: string;
    body: string;
  };
  radius: {
    small: string;
    medium: string;
    large: string;
  };
  shadows: {
    card: string;
    floating: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  components: {
    cardStyle: 'soft' | 'outlined' | 'glass' | 'flat';
    buttonStyle: 'pill' | 'rounded' | 'square';
    categoryStyle: 'pill' | 'underline' | 'minimal';
    headingStyle: 'script' | 'serif' | 'sans';
    imageStyle: 'rounded' | 'square' | 'organic';
  };
}
