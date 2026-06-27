export interface CardItem {
  title: string;
  href: string;
  image: string;
  alt: string;
  category: string;
  author?: string;
  date?: string;
}

export const heroContent = {
  title: 'Interieur en wonen',
  description:
    'Ben je op zoek naar leuke producten en wooninspiratie?\nOp deze website vind je alles wat je zoekt.',
  ctaLabel: 'Lees Meer',
  ctaHref: '/#blok1',
  backgroundImage: '/images/2023/01/Mask-group.svg',
};

export const popularSection = {
  title: 'Populaire producten',
  paragraphs: [
    'Ben je op zoek naar nieuwe producten voor in je woning? Dan zit je op interieurwonenplaza.nl goed. Op deze website vind je namelijk reviews over de beste producten voor in huis. Het gaat hierbij om uiteenlopende producten. Wij zijn bijvoorbeeld op zoek gegaan naar de beste beveiligingscamera voor buiten, maar ook naar de beste inbouw wasmachine.',
    'Om tot de beste koop te komen, voeren wij een uitgebreide test uit. Hierbij kijken wij naar het beschikbare aanbod en gaan we gericht op zoek naar de beste producten. Aan de hand van deze test zijn wij uiteindelijk in staat om een top 5 of top 10 van beste producten aan te wijzen.',
    'Bij ons ligt de focus op allerlei producten voor in huis. Bepaal daarom goed voor jezelf waar je naar op zoek bent en bekijk onze website op je gemakje. Aan de hand van onze bevindingen ben je snel in staat om de beste producten te vinden.',
  ],
};

export const categoryLinks = [
  { label: 'TV meubels', href: '/beste-tv-meubel/', icon: '/images/2023/01/Frame1.svg' },
  { label: 'Stoelen', href: '/beste-hangstoel/', icon: '/images/2023/01/Frame2.svg' },
  { label: 'Rekken', href: '/beste-droogrek-muur/', icon: '/images/2023/01/Frame3.svg' },
  { label: 'Lampen', href: '/beste-buitenlamp-met-dag-en-nacht-sensor/', icon: '/images/2023/01/Frame4.svg' },
  { label: 'Kasten', href: '/beste-boekenkast/', icon: '/images/2023/01/Frame6.svg' },
  { label: 'Tafels', href: '/beste-bijzettafel/', icon: '/images/2023/01/Frame7.svg' },
] as const;

export const ctaSection = {
  title: 'De beste woonartikelen voor een lage prijs',
  ctaLabel: 'Lees Meer',
  ctaHref: '/#blok2',
  backgroundImage: '/images/2023/01/Group-81.svg',
};

export const recentSection = {
  title: 'Recent toegevoegd',
  description:
    'Hier vind je de nieuwste producten op InterieurWonenPlaza.nl. Bekijk de beste en meest goedkope woonartikelen van Nederland.',
};

export const recentCards: CardItem[] = [
  {
    category: 'Badkamer',
    title: 'Bespaar water met deze duurzame douchekop',
    href: '/beste-waterbesparende-douchekop/',
    image: '/images/2023/01/shower-g976959ace_1920-1024x685.jpg',
    alt: 'Duurzame douchekop',
    author: 'Cindy',
    date: '5 Jan 2023',
  },
  {
    category: 'Woonkamer',
    title: 'Deze robotstofzuiger kan stofzuigen en dweilen',
    href: '/beste-robotstofzuiger-met-dweilfunctie/',
    image: '/images/2023/01/robot-vacuum-cleaner-g834ac9020_1920-1024x683.jpg',
    alt: 'Robotstofzuiger met dweilfunctie',
    author: 'Cindy',
    date: '27 Dec 2022',
  },
  {
    category: 'Slaapkamer',
    title: 'Handige boxsprings met opbergruimte',
    href: '/beste-boxspring-met-opbergruimte/',
    image: '/images/2023/01/hd-wallpaper-g32e4eb954_1280-1024x682.jpg',
    alt: 'Boxspring met opbergruimte',
    author: 'Cindy',
    date: '22 Dec 2022',
  },
  {
    category: 'Slaapkamer',
    title: 'Blijf warm met een elektrische bovendeken',
    href: '/beste-elektrische-bovendeken/',
    image: '/images/2023/01/lantern-g62a86f209_1920-1024x682.jpg',
    alt: 'Elektrische bovendeken',
    author: 'Cindy',
    date: '16 Dec 2022',
  },
  {
    category: 'Overige',
    title: 'Dit zijn de beste dubbele wasmanden',
    href: '/beste-dubbele-wasmand/',
    image: '/images/2023/01/washing-machine-g31f28230a_1920-1024x683.jpg',
    alt: 'Dubbele wasmand',
    author: 'Cindy',
    date: '4 Dec 2022',
  },
  {
    category: 'Slaapkamer',
    title: 'Top 10 open kledingkasten van dit moment',
    href: '/beste-open-kledingkast/',
    image: '/images/2023/01/colors-g84ec9d7be_1920-1024x683.jpg',
    alt: 'Open kledingkasten',
    author: 'Cindy',
    date: '25 Nov 2022',
  },
];

export const aboutSection = {
  title: 'Het doel van Interieurwonenplaza.nl',
  paragraphs: [
    'Het kopen van nieuwe producten voor in huis is niet makkelijk. Je koopt veel producten niet dagelijks, waardoor je je mogelijk ietwat onwennig voelt. Ook is de kans groot dat je niet precies weet waar je op moet letten.',
    'Verder heb je te maken met een overweldigend aanbod. Ga je bijvoorbeeld op zoek naar de beste infrarood verwarming? Dan kom je tientallen – of zelfs honderden – verschillende verwarmingen tegen. Wat is dan voor jou de beste keuze? Dat is uiteraard lastig om te bepalen, maar dit maken wij graag zo makkelijk mogelijk voor je.',
    'Met de informatie op deze website hak je snel de juiste knopen voor jezelf door. Daarmee richt je je woning volledig naar wens in. Daarmee geniet je van het gewenste gemak in je woning. En daarmee geniet je van het gewenste wooncomfort!',
  ],
};
