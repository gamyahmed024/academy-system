/**
 * Photos on the public welcome page, with where each came from and its
 * licence, all from Wikimedia Commons and all free to use commercially (CC0 or
 * public domain). The page lists them under "photo credits" in the footer;
 * a CC BY photo would need that credit. No people appear in any of them. To swap a photo, replace the file in
 * public/landing/ and update its line here.
 */
export type LandingPhoto = { src: string; title: string; author: string; license: string; source: string };

export const LANDING_PHOTOS = {
  hero: { src: "/landing/hero.webp", title: "Patio de los Arrayanes, Alhambra", author: "Jebulon", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Patio_de_los_Arrayanes_detail_Alhambra_Granada_Spain.jpg" },
  program1: { src: "/landing/program-1.webp", title: "Sculpted calligraphy, Ben Youssef Madrasa, Marrakech", author: "DimiTalen", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Sculpted_calligraphy_on_the_walls,_Ben_Youssef_Madrasa,_Marrakech,_2008.jpg" },
  program2: { src: "/landing/program-2.webp", title: "Partal pavilion, Alhambra", author: "Jebulon", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Partal_pavilion_bassin_detail_1_edit.jpg" },
  program3: { src: "/landing/program-3.webp", title: "Nasrid motto, Alhambra", author: "Jebulon", license: "CC0", source: "https://commons.wikimedia.org/wiki/File:Nasrid_motto_Alhambra_Granada_Andalusia_Spain.jpg" },
  culture: { src: "/landing/culture.webp", title: "Alhambra in the evening", author: "Jebulon", license: "Public domain", source: "https://commons.wikimedia.org/wiki/File:Alhambra_in_the_evening.jpg" },
} satisfies Record<string, LandingPhoto>;
