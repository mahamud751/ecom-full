import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

type IconName =
  | 'home'
  | 'doctor'
  | 'cart'
  | 'account'
  | 'search'
  | 'camera'
  | 'video'
  | 'phone'
  | 'mic';

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
      {name === 'video' ? (
        <>
          <Rect {...common} x="2.5" y="6.5" width="12.5" height="11" rx="2.5" />
          <Path {...common} d="M15 10.5 21 7v10l-6-3.5" />
        </>
      ) : null}
      {name === 'phone' ? (
        <Path
          {...common}
          d="M6.8 3.5c.5 0 .9.3 1 .8l.9 3.1c.1.4 0 .8-.3 1.1L7 10c.9 2.2 2.8 4.1 5 5l1.5-1.4c.3-.3.7-.4 1.1-.3l3.1.9c.5.1.8.5.8 1v3.1c0 .6-.5 1.1-1.1 1.1C10.6 20.5 3.5 13.4 3.5 4.6c0-.6.5-1.1 1.1-1.1Z"
        />
      ) : null}
      {name === 'mic' ? (
        <>
          <Path
            {...common}
            fill={filled ? color : 'none'}
            d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z"
          />
          <Path {...common} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </>
      ) : null}
    </Svg>
  );
}
