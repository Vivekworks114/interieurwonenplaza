export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const mainNavigation: NavItem[] = [
  {
    label: 'Woonkamer',
    href: '#',
    children: [
      { label: 'Kledingkast kinderkamer', href: '/beste-kledingkast-kinderkamer/' },
      { label: 'Kruimeldief', href: '/beste-kruimeldief/' },
      { label: 'Prullenbak met sensor', href: '/beste-prullenbak-met-sensor/' },
      { label: 'Wekker op batterijen', href: '/beste-wekker-op-batterijen/' },
    ],
  },
  {
    label: 'Slaapkamer',
    href: '#',
    children: [
      { label: 'Boxspring met TV lift', href: '/beste-boxspring-met-tv-lift/' },
      { label: 'Elektrische bovendeken', href: '/beste-elektrische-bovendeken/' },
      { label: 'Slaapbank tweepersoons', href: '/beste-slaapbank-2-persoons/' },
      { label: 'Stapelbed', href: '/beste-stapelbed/' },
    ],
  },
  {
    label: 'Overige',
    href: '#',
    children: [
      { label: 'Beveiligingscamera buiten', href: '/beste-beveiligingscamera-buiten/' },
      { label: 'Infrarood verwarming', href: '/beste-infrarood-verwarming/' },
      { label: 'Lekbak wasmachine', href: '/beste-lekbak-wasmachine/' },
      { label: 'Stoomreiniger vloer', href: '/beste-stoomreiniger-vloer/' },
      { label: 'Vouwbed', href: '/beste-vouwbed/' },
    ],
  },
  { label: 'Over ons', href: '/over-ons/' },
  { label: 'Contact', href: '/contact/' },
];
