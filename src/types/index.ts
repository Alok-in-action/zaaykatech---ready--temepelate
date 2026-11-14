export type MenuItem = {
  name: string;
  price?: number | string;
  prices?: {
    ny: number;
    neap: number;
  };
  variant_prices?: Record<string, string | number>;
  description?: string;
  isMostOrdered?: boolean;
  isSignature?: boolean;
  customTag?: string;
  isMonsoon?: boolean;
  image_url?: string;
  is_veg?: boolean;
  _isSquareMobile?: boolean;
  _isForcedRectangular?: boolean;
};

export type MenuSection = {
  id: string;
  title: string;
  subtitle?: string;
  preheader?: string;
  items: MenuItem[];
};
