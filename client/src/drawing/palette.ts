// Color palettes for CodeMap Hotel visualization
import { CharacterPalette } from './types';

// RPG-STYLE PALETTE - SATURATED warm colors like Pokemon
export const PALETTE = {
  // Warm sand/wood floor (root/default)
  woodFloor: {
    base: '#E8B888',
    highlight: '#F8D0A8',
    shadowLight: '#D8A078',
    shadowDark: '#C89068',
    gap: '#A07048',
  },
  // Vibrant green tiles (client) - Pokemon grass green
  greenTile: {
    base: '#78C850',
    highlight: '#98E870',
    shadowLight: '#68B840',
    shadowDark: '#58A830',
    grout: '#489020',
  },
  // Sky blue tiles (server)
  blueTile: {
    base: '#88A8D0',
    highlight: '#A8C8F0',
    shadowLight: '#7898C0',
    shadowDark: '#6888B0',
    grout: '#4868A0',
  },
  // Warm cream tiles (src)
  creamTile: {
    base: '#F8E8D0',
    highlight: '#FFF8E8',
    shadowLight: '#E8D8C0',
    shadowDark: '#D8C8B0',
    grout: '#B8A078',
  },
  // Warm lilac tiles (components/hooks/utils)
  lavenderTile: {
    base: '#B898C8',
    highlight: '#D0B8E0',
    shadowLight: '#A888B8',
    shadowDark: '#9878A8',
    grout: '#7858A0',
  },
  // Peach tiles (alternative)
  peachTile: {
    base: '#F0B898',
    highlight: '#FFD0B8',
    shadowLight: '#E0A888',
    shadowDark: '#D09878',
    grout: '#B07050',
  },
  // Wall colors (warmer)
  wall: {
    light: '#F0E8D8',
    mid: '#E0D8C8',
    dark: '#D0C8B8',
    baseboard: '#6A5840',
  },
  // Furniture (warmer)
  desk: {
    light: '#E8D0A8',
    white: '#FFF8F0',
    metal: '#C8D0D8',
  },
  // Accents (more saturated)
  green: { base: '#68B850', light: '#88D870', dark: '#489030' },
  blue: { base: '#6898D0', light: '#88B8F0', dark: '#4878B0' },
  amber: { base: '#E8A830', light: '#FFD050', highlight: '#FFE070' },
  shadow: 'rgba(80, 60, 40, 0.18)',
  shadowMid: 'rgba(80, 60, 40, 0.28)',
  // OUTDOOR ENVIRONMENT
  grass: {
    base: '#78C850',
    light: '#88D860',
    dark: '#68B840',
    darkest: '#58A030',
  },
  water: {
    deep: '#3088B8',
    mid: '#48A8D0',
    light: '#68C8E8',
    highlight: '#90E0F8',
    foam: '#E8F8FF',
    foamInner: '#B8E8F8',
  },
  // Warm light colors
  warmWhite: '#FFF8E8',
  warmShadow: '#A08878',
};

// Character color palettes - unique per character
export const CHARACTER_PALETTES: CharacterPalette[] = [
  { // Character 1 - Brown hair, Red shirt
    hair: { dark: '#483020', mid: '#604028', light: '#785038' },
    shirt: { dark: '#A81818', mid: '#C83030', light: '#E85050' },
    pants: { base: '#4858A8', shadow: '#303878' },
  },
  { // Character 2 - Blonde hair, Blue shirt
    hair: { dark: '#C8A028', mid: '#E8C848', light: '#F8E878' },
    shirt: { dark: '#1850A8', mid: '#3070C8', light: '#5090E8' },
    pants: { base: '#484848', shadow: '#303030' },
  },
  { // Character 3 - Black hair, Green shirt
    hair: { dark: '#282828', mid: '#404040', light: '#585858' },
    shirt: { dark: '#188818', mid: '#30A830', light: '#50C850' },
    pants: { base: '#4858A8', shadow: '#303878' },
  },
  { // Character 4 - Red hair, White shirt
    hair: { dark: '#902810', mid: '#B83820', light: '#D84830' },
    shirt: { dark: '#A8A8A8', mid: '#C8C8C8', light: '#E8E8E8' },
    pants: { base: '#484848', shadow: '#303030' },
  },
  { // Character 5 - Blue hair, Yellow shirt
    hair: { dark: '#385888', mid: '#5070A8', light: '#6888C8' },
    shirt: { dark: '#B88000', mid: '#D8A010', light: '#F8C030' },
    pants: { base: '#4858A8', shadow: '#303878' },
  },
];

// Shared character colors
export const SKIN = { base: '#F8D0A8', shadow: '#E0A878' };
export const OUTLINE = '#483828';
