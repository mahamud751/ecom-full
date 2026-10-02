/** Line-icon set (24px grid, 1.9 stroke) — replaces emoji used as UI icons. */
import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

export type IconName =
  | 'home'
  | 'doctor'
  | 'cart'
  | 'account'
  | 'search'
  | 'camera'
  | 'video'
  | 'phone'
  | 'mic'
  | 'micOff'
  | 'back'
  | 'chevronRight'
  | 'chevronDown'
  | 'close'
  | 'check'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'heart'
  | 'bell'
  | 'star'
  | 'bolt'
  | 'box'
  | 'truck'
  | 'stethoscope'
  | 'file'
  | 'flask'
  | 'refund'
  | 'chat'
  | 'mail'
  | 'pill'
  | 'sparkle'
  | 'leaf'
  | 'baby'
  | 'grid'
  | 'clock'
  | 'calendar'
  | 'pin'
  | 'shield'
  | 'logout'
  | 'user'
  | 'sort'
  | 'arrowRight'
  | 'info'
  | 'upload'
  | 'tag'
  | 'wallet'
  | 'hospital';

export function AppIcon({
  name,
  color,
  size = 22,
  filled = false,
  strokeWidth = 1.9,
}: {
  name: IconName;
  color: string;
  size?: number;
  filled?: boolean;
  strokeWidth?: number;
}) {
  const s = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };
  const f = filled ? color : 'none';

  let body: React.ReactNode = null;
  switch (name) {
    case 'home':
      body = (
        <>
          <Path {...s} fill={f} d="M3.5 10.2 12 3.2l8.5 7V20a1 1 0 0 1-1 1h-4.8v-6h-5.4v6H4.5a1 1 0 0 1-1-1v-9.8Z" />
          {filled ? <Path d="M9.3 21v-6h5.4v6" stroke="#fff" strokeWidth={1.6} /> : null}
        </>
      );
      break;
    case 'doctor':
      body = (
        <>
          <Circle {...s} cx="12" cy="7" r="3.6" fill={f} />
          <Path {...s} d="M5 21v-2.3a7 7 0 0 1 14 0V21M17.5 11.5v4M15.5 13.5h4" />
        </>
      );
      break;
    case 'cart':
      body = (
        <>
          <Path {...s} fill={f} d="M5.5 7.5h13l-1.1 11.1a2 2 0 0 1-2 1.9H8.6a2 2 0 0 1-2-1.9L5.5 7.5Z" />
          <Path {...s} stroke={filled ? '#fff' : color} d="M9 10V6.5a3 3 0 0 1 6 0V10" />
          {filled ? <Path {...s} d="M9 6.5a3 3 0 0 1 6 0" /> : null}
        </>
      );
      break;
    case 'account':
    case 'user':
      body = (
        <>
          <Circle {...s} cx="12" cy="7.8" r="3.8" fill={f} />
          <Path {...s} fill={f} d="M4.5 20.5a7.5 7.5 0 0 1 15 0Z" />
        </>
      );
      break;
    case 'search':
      body = (
        <>
          <Circle {...s} cx="10.8" cy="10.8" r="6.8" />
          <Path {...s} d="m16 16 4.5 4.5" />
        </>
      );
      break;
    case 'camera':
      body = (
        <>
          <Path {...s} d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
          <Circle {...s} cx="12" cy="13" r="3.5" />
        </>
      );
      break;
    case 'video':
      body = (
        <>
          <Rect {...s} fill={f} x="2.5" y="6.5" width="12.5" height="11" rx="2.5" />
          <Path {...s} fill={f} d="M15 10.5 21 7v10l-6-3.5" />
        </>
      );
      break;
    case 'phone':
      body = (
        <Path
          {...s}
          fill={f}
          d="M6.8 3.5c.5 0 .9.3 1 .8l.9 3.1c.1.4 0 .8-.3 1.1L7 10c.9 2.2 2.8 4.1 5 5l1.5-1.4c.3-.3.7-.4 1.1-.3l3.1.9c.5.1.8.5.8 1v3.1c0 .6-.5 1.1-1.1 1.1C10.6 20.5 3.5 13.4 3.5 4.6c0-.6.5-1.1 1.1-1.1Z"
        />
      );
      break;
    case 'mic':
      body = (
        <>
          <Path {...s} fill={f} d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3Z" />
          <Path {...s} d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
        </>
      );
      break;
    case 'micOff':
      body = (
        <>
          <Path {...s} d="M15 10V6a3 3 0 0 0-5.7-1.3M9 9v2a3 3 0 0 0 4.6 2.5" />
          <Path {...s} d="M5.5 11a6.5 6.5 0 0 0 10.8 4.9M18.5 11c0 .8-.1 1.5-.4 2.2M12 17.5V21M8.5 21h7M3.5 3.5l17 17" />
        </>
      );
      break;
    case 'back':
      body = <Path {...s} d="M15 5 8 12l7 7" />;
      break;
    case 'chevronRight':
      body = <Path {...s} d="m9.5 5.5 6.5 6.5-6.5 6.5" />;
      break;
    case 'chevronDown':
      body = <Path {...s} d="m5.5 9.5 6.5 6.5 6.5-6.5" />;
      break;
    case 'close':
      body = <Path {...s} d="M6 6l12 12M18 6 6 18" />;
      break;
    case 'check':
      body = <Path {...s} d="m4.5 12.5 5 5 10-11" />;
      break;
    case 'plus':
      body = <Path {...s} d="M12 5v14M5 12h14" />;
      break;
    case 'minus':
      body = <Path {...s} d="M5 12h14" />;
      break;
    case 'trash':
      body = (
        <Path {...s} d="M4.5 6.5h15M9.5 6.5V4.5h5v2M6.5 6.5l.8 12.6a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4l.8-12.6M10 10.5v6M14 10.5v6" />
      );
      break;
    case 'heart':
      body = (
        <Path
          {...s}
          fill={f}
          d="M12 20s-7.5-4.4-7.5-10.1A4.4 4.4 0 0 1 12 7.1a4.4 4.4 0 0 1 7.5 2.8C19.5 15.6 12 20 12 20Z"
        />
      );
      break;
    case 'bell':
      body = (
        <>
          <Path {...s} fill={f} d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15l1.5-2Z" />
          <Path {...s} d="M10 21h4" />
        </>
      );
      break;
    case 'star':
      body = (
        <Path
          {...s}
          fill={f}
          d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9L12 3.5Z"
        />
      );
      break;
    case 'bolt':
      body = <Path {...s} fill={f} d="M13 2.5 5 13.5h6l-1 8 8-11h-6l1-8Z" />;
      break;
    case 'box':
      body = (
        <>
          <Path {...s} fill={f} d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5v-9Z" />
          <Path {...s} d="M3.5 7.5 12 12l8.5-4.5M12 12v9M7.8 5.3l8.4 4.5" />
        </>
      );
      break;
    case 'truck':
      body = (
        <>
          <Path {...s} d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.2v3.3h-7" />
          <Circle {...s} cx="6.5" cy="17.5" r="1.8" />
          <Circle {...s} cx="17" cy="17.5" r="1.8" />
        </>
      );
      break;
    case 'stethoscope':
      body = (
        <>
          <Path {...s} d="M5.5 3.5H4v5a4.5 4.5 0 0 0 9 0v-5h-1.5M8.5 13v2.5a4.5 4.5 0 0 0 9 0V13" />
          <Circle {...s} cx="17.5" cy="10.5" r="2.5" />
        </>
      );
      break;
    case 'file':
      body = (
        <>
          <Path {...s} fill={f} d="M6 3h8l4.5 4.5V20a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
          <Path {...s} d="M14 3v4.5h4.5M8.5 12.5h7M8.5 16h5" />
        </>
      );
      break;
    case 'flask':
      body = (
        <>
          <Path {...s} d="M9.5 3h5M10 3v6L4.8 18.2A1.9 1.9 0 0 0 6.4 21h11.2a1.9 1.9 0 0 0 1.6-2.8L14 9V3" />
          <Path {...s} fill={f} d="M7.2 14h9.6" />
        </>
      );
      break;
    case 'refund':
      body = (
        <>
          <Path {...s} d="M4 9h11a5 5 0 0 1 0 10H9" />
          <Path {...s} d="M8 5 4 9l4 4" />
        </>
      );
      break;
    case 'chat':
      body = (
        <Path
          {...s}
          fill={f}
          d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v10a1.5 1.5 0 0 1-1.5 1.5H9l-5 4V5.5Z"
        />
      );
      break;
    case 'mail':
      body = (
        <>
          <Rect {...s} x="3" y="5" width="18" height="14" rx="2" />
          <Path {...s} d="m4 6.5 8 6 8-6" />
        </>
      );
      break;
    case 'pill':
      body = (
        <>
          <Rect {...s} fill={f} x="2.8" y="8.2" width="18.4" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
          <Path {...s} d="m8.9 8.9 6.2 6.2" />
        </>
      );
      break;
    case 'sparkle':
      body = (
        <>
          <Path {...s} fill={f} d="M12 3c.6 4.3 2.7 6.4 7 7-4.3.6-6.4 2.7-7 7-.6-4.3-2.7-6.4-7-7 4.3-.6 6.4-2.7 7-7Z" />
          <Path {...s} d="M19 16.5v4M17 18.5h4" />
        </>
      );
      break;
    case 'leaf':
      body = (
        <>
          <Path {...s} fill={f} d="M5 19C5 10 10 5 20 4c-.5 10-5.5 15-15 15Z" />
          <Path {...s} d="M5 19 13 11" />
        </>
      );
      break;
    case 'baby':
      body = (
        <>
          <Circle {...s} cx="12" cy="12" r="8.5" />
          <Circle cx="9.2" cy="11" r="1" fill={color} />
          <Circle cx="14.8" cy="11" r="1" fill={color} />
          <Path {...s} d="M9.5 14.8a3.3 3.3 0 0 0 5 0M12 3.5c-1.5 1.2-1.5 2.8 0 3.5" />
        </>
      );
      break;
    case 'grid':
      body = (
        <>
          <Rect {...s} fill={f} x="4" y="4" width="6.5" height="6.5" rx="1.8" />
          <Rect {...s} fill={f} x="13.5" y="4" width="6.5" height="6.5" rx="1.8" />
          <Rect {...s} fill={f} x="4" y="13.5" width="6.5" height="6.5" rx="1.8" />
          <Rect {...s} fill={f} x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" />
        </>
      );
      break;
    case 'clock':
      body = (
        <>
          <Circle {...s} cx="12" cy="12" r="8.5" />
          <Path {...s} d="M12 7.5V12l3 2" />
        </>
      );
      break;
    case 'calendar':
      body = (
        <>
          <Rect {...s} x="3.5" y="5" width="17" height="15.5" rx="2.5" />
          <Path {...s} d="M3.5 10h17M8 3v4M16 3v4" />
        </>
      );
      break;
    case 'pin':
      body = (
        <>
          <Path {...s} fill={f} d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11Z" />
          <Circle {...s} cx="12" cy="10" r="2.3" fill={filled ? '#fff' : 'none'} />
        </>
      );
      break;
    case 'shield':
      body = (
        <>
          <Path {...s} fill={f} d="M12 3 4.5 6v5.5c0 4.6 3.2 8.2 7.5 9.5 4.3-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
          <Path {...s} stroke={filled ? '#fff' : color} d="m8.8 12 2.2 2.2 4.2-4.4" />
        </>
      );
      break;
    case 'logout':
      body = (
        <>
          <Path {...s} d="M14 4.5H6.5a1 1 0 0 0-1 1v13a1 1 0 0 0 1 1H14" />
          <Path {...s} d="M10.5 12h10M17 8.5l3.5 3.5-3.5 3.5" />
        </>
      );
      break;
    case 'sort':
      body = <Path {...s} d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5" />;
      break;
    case 'arrowRight':
      body = <Path {...s} d="M4.5 12h15M13.5 6l6 6-6 6" />;
      break;
    case 'info':
      body = (
        <>
          <Circle {...s} cx="12" cy="12" r="8.5" />
          <Path {...s} d="M12 11v5.5M12 7.8v.2" />
        </>
      );
      break;
    case 'upload':
      body = (
        <>
          <Path {...s} d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5" />
          <Path {...s} d="M4.5 14.5V19a1.5 1.5 0 0 0 1.5 1.5h12a1.5 1.5 0 0 0 1.5-1.5v-4.5" />
        </>
      );
      break;
    case 'tag':
      body = (
        <>
          <Path {...s} fill={f} d="M3.5 12.3V4.5a1 1 0 0 1 1-1h7.8l8.2 8.2a1.4 1.4 0 0 1 0 2l-6.8 6.8a1.4 1.4 0 0 1-2 0l-8.2-8.2Z" />
          <Circle cx="8" cy="8" r="1.4" fill={filled ? '#fff' : color} />
        </>
      );
      break;
    case 'wallet':
      body = (
        <>
          <Path {...s} d="M4 7.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18V9a1.5 1.5 0 0 0-1.5-1.5H5.5A1.5 1.5 0 0 1 4 6a1.5 1.5 0 0 1 1.5-1.5H17" />
          <Circle cx="16" cy="13.5" r="1.3" fill={color} />
        </>
      );
      break;
    case 'hospital':
      body = (
        <>
          <Path {...s} d="M4 21V7.5L12 3l8 4.5V21M3 21h18M9.5 21v-4h5v4" />
          <Path {...s} d="M12 8v5M9.5 10.5h5" />
        </>
      );
      break;
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      {body}
    </Svg>
  );
}
