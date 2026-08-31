import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

type IconName = 'home' | 'doctor' | 'cart' | 'account' | 'search' | 'camera';

export function AppIcon({
  name,
  color,
  size = 22,
  filled = false,
}: {
  name: IconName;
  color: string;
  size?: number;
  filled?: boolean;
}) {
  const common = {
    stroke: color,
    strokeWidth: 1.9,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {name === 'home' ? (
        <>
          <Path {...common} fill={filled ? color : 'none'} d="M3.5 10.5 12 3l8.5 7.5" />
          <Path {...common} fill={filled ? color : 'none'} d="M5.5 9.3V21h13V9.3M9.5 21v-6h5v6" />
        </>
      ) : null}
      {name === 'doctor' ? (
        <>
          <Circle {...common} cx="12" cy="7" r="3.5" fill={filled ? color : 'none'} />
          <Path {...common} d="M5 21v-2.5a7 7 0 0 1 14 0V21M19 10v4M17 12h4" />
        </>
      ) : null}
      {name === 'cart' ? (
        <>
          <Path {...common} d="M3 4h2l2.2 10.2a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 1.9-1.4L21 8H6" />
          <Circle cx="9.5" cy="20" r="1.2" fill={color} />
          <Circle cx="17.5" cy="20" r="1.2" fill={color} />
        </>
      ) : null}
      {name === 'account' ? (
        <>
          <Circle {...common} cx="12" cy="7.5" r="3.5" fill={filled ? color : 'none'} />
          <Path {...common} d="M5 21a7 7 0 0 1 14 0" />
        </>
      ) : null}
      {name === 'search' ? (
        <>
          <Circle {...common} cx="10.5" cy="10.5" r="6.5" />
          <Path {...common} d="m15.5 15.5 5 5" />
        </>
      ) : null}
      {name === 'camera' ? (
        <>
          <Path {...common} d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <Circle {...common} cx="12" cy="13" r="3.5" />
        </>
      ) : null}
    </Svg>
  );
}
