/**
 * Image resize configuration and presets
 * @module features/image-resize/constants
 */

export const CONFIG = {
    minWidth: 30,
    minHeight: 30,
    maxWidth: 4000,
    maxHeight: 4000,
    snapThreshold: 6,
    maxHistory: 40,
    toastDuration: 2200,
    handleSize: 11,
    dblClickDelay: 300,
};

export const SIZE_PRESETS = [
    { label: 'Thumbnail', width: 150, icon: '150' },
    { label: 'Small', width: 320, icon: 'S' },
    { label: 'Medium', width: 640, icon: 'M' },
    { label: 'Large', width: 960, icon: 'L' },
    { label: 'X-Large', width: 1200, icon: 'XL' },
    { label: '25% Width', pct: 25, icon: '¼' },
    { label: '33% Width', pct: 33, icon: '⅓' },
    { label: '50% Width', pct: 50, icon: '½' },
    { label: '75% Width', pct: 75, icon: '¾' },
    { label: '100% Width', pct: 100, icon: '■' },
];

export const SHADOW_PRESETS = [
    { label: 'None', value: 'none', icon: '○' },
    { label: 'Subtle', value: '0 1px 3px rgba(0,0,0,0.12)', icon: '◔' },
    { label: 'Medium', value: '0 4px 12px rgba(0,0,0,0.18)', icon: '◑' },
    { label: 'Strong', value: '0 8px 30px rgba(0,0,0,0.28)', icon: '◕' },
    { label: 'Dreamy', value: '0 12px 40px rgba(99,102,241,0.25)', icon: '●' },
    { label: 'Hard', value: '6px 6px 0px rgba(0,0,0,0.25)', icon: '◧' },
];

export const BORDER_RADIUS_PRESETS = [
    { label: 'None', value: '0', icon: '▢' },
    { label: 'Small', value: '4px', icon: '▫' },
    { label: 'Medium', value: '8px', icon: '◻' },
    { label: 'Large', value: '16px', icon: '○' },
    { label: 'Round', value: '50%', icon: '●' },
];

export const FILTER_PRESETS = [
    { label: 'None', value: 'none', icon: '—' },
    { label: 'Grayscale', value: 'grayscale(100%)', icon: '◐' },
    { label: 'Sepia', value: 'sepia(80%)', icon: '◩' },
    { label: 'Blur', value: 'blur(2px)', icon: '◌' },
    { label: 'Brighten', value: 'brightness(130%)', icon: '☀' },
    { label: 'Contrast', value: 'contrast(140%)', icon: '◑' },
    { label: 'Saturate', value: 'saturate(180%)', icon: '◈' },
    { label: 'Vintage', value: 'sepia(40%) contrast(110%) brightness(90%)', icon: '◫' },
];

export const KEYBOARD_SHORTCUTS = {
    'ArrowUp': { dw: 0, dh: -1, desc: 'Shrink height by 1px' },
    'ArrowDown': { dw: 0, dh: 1, desc: 'Grow height by 1px' },
    'ArrowLeft': { dw: -1, dh: 0, desc: 'Shrink width by 1px' },
    'ArrowRight': { dw: 1, dh: 0, desc: 'Grow width by 1px' },
};

export const SHIFT_MULTIPLIER = 10;
