import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import MenuClient from '@/app/MenuClient';

export default function TestTemplate01Page() {
  // Strictly block test page in production environments
  if (process.env.NODE_ENV === 'production' && process.env.VERCEL_ENV === 'production') {
    notFound();
  }
  const menuPath = '/tmp/template01/content/menu.json';
  const themePath = '/tmp/template01/content/theme.json';

  let sections: any[] = [];
  let theme: any = {};

  if (fs.existsSync(menuPath)) {
    const menuData = JSON.parse(fs.readFileSync(menuPath, 'utf8'));
    sections = (menuData.categories || [])
      .filter((cat: any) => cat.visible !== false)
      .map((cat: any) => ({
        ...cat,
        title: cat.title ? cat.title.toLowerCase() : '',
        items: (cat.items || [])
          .filter((item: any) => item.available !== false)
          .map((item: any) => ({
            ...item,
            price: item.price ? `₹${item.price}` : undefined,
          })),
      }));
  }

  if (fs.existsSync(themePath)) {
    theme = JSON.parse(fs.readFileSync(themePath, 'utf8'));
    theme.logoUrl = undefined;
    theme.heroVideoUrl = undefined;
  }

  return (
    <main>
      <MenuClient initialSections={sections} initialTheme={theme} />
    </main>
  );
}
