import Svg, { Path, Circle, Rect, Line, Polyline } from 'react-native-svg';
import { Theme } from '@/constants/theme';

type IconName =
  | 'celebrate' | 'search' | 'target' | 'sparkle' | 'gift'
  | 'check-circle' | 'x-circle' | 'running' | 'calendar'
  | 'walking' | 'lightning' | 'leaf' | 'dumbbell' | 'flame'
  | 'unlock' | 'bell' | 'crown' | 'alert-octagon'
  | 'apple' | 'heart' | 'heart-pulse' | 'body' | 'bar-chart'
  | 'trending-down' | 'scale' | 'trending-up'
  | 'muscle' | 'fire-alt'
  | 'female' | 'male'
  | 'couch' | 'barbell' | 'warning'
  | 'utensils';

interface OnboardingIconProps {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function OnboardingIcon({
  name,
  size = 24,
  color = Theme.colors.textDark,
  strokeWidth = 2,
}: OnboardingIconProps) {
  const props = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    fill: 'none',
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" accessible={false}>
      {renderIcon(name, props)}
    </Svg>
  );
}

function renderIcon(
  name: IconName,
  props: { stroke: string; strokeWidth: number; strokeLinecap: 'round'; strokeLinejoin: 'round'; fill: string },
) {
  const { stroke, strokeWidth, strokeLinecap, strokeLinejoin } = props;
  const common = { stroke, strokeWidth, strokeLinecap, strokeLinejoin };

  switch (name) {
    case 'celebrate':
      return (
        <>
          <Path d="M12 2L12 6" {...common} />
          <Path d="M4.93 4.93L7.76 7.76" {...common} />
          <Path d="M19.07 4.93L16.24 7.76" {...common} />
          <Path d="M2 12L6 12" {...common} />
          <Path d="M18 12L22 12" {...common} />
          <Path d="M8 21C8 21 8 16 12 16C16 16 16 21 16 21" {...common} />
          <Circle cx={12} cy={12} r={3} {...common} />
        </>
      );
    case 'search':
      return (
        <>
          <Circle cx={11} cy={11} r={8} {...common} />
          <Line x1={21} y1={21} x2={16.65} y2={16.65} {...common} />
        </>
      );
    case 'target':
      return (
        <>
          <Circle cx={12} cy={12} r={10} {...common} />
          <Circle cx={12} cy={12} r={6} {...common} />
          <Circle cx={12} cy={12} r={2} {...common} />
        </>
      );
    case 'sparkle':
      return (
        <>
          <Path d="M12 3L13.5 8.5L19 7L14.5 11L19 15L13.5 13.5L12 19L10.5 13.5L5 15L9.5 11L5 7L10.5 8.5Z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} fill="none" />
        </>
      );
    case 'gift':
      return (
        <>
          <Rect x={3} y={8} width={18} height={4} rx={1} {...common} />
          <Path d="M12 8V21" {...common} />
          <Path d="M3 12H21V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V12Z" {...common} />
          <Path d="M7.5 8C7.5 8 7.5 4 9.75 4C12 4 12 8 12 8" {...common} />
          <Path d="M16.5 8C16.5 8 16.5 4 14.25 4C12 4 12 8 12 8" {...common} />
        </>
      );
    case 'check-circle':
      return (
        <>
          <Circle cx={12} cy={12} r={10} {...common} />
          <Polyline points="8,12 11,15 16,9" {...common} fill="none" />
        </>
      );
    case 'x-circle':
      return (
        <>
          <Circle cx={12} cy={12} r={10} {...common} />
          <Line x1={15} y1={9} x2={9} y2={15} {...common} />
          <Line x1={9} y1={9} x2={15} y2={15} {...common} />
        </>
      );
    case 'running':
      return (
        <>
          <Circle cx={14} cy={4} r={2} {...common} />
          <Path d="M6 20L10 14L13 16L16 10" {...common} />
          <Path d="M16 10L19 12" {...common} />
          <Path d="M10 14L7 10" {...common} />
        </>
      );
    case 'walking':
      return (
        <>
          <Circle cx={13} cy={4} r={2} {...common} />
          <Path d="M10 21L11.5 15L14 16V10" {...common} />
          <Path d="M17 21L14 16" {...common} />
          <Path d="M14 10L10 12" {...common} />
        </>
      );
    case 'calendar':
      return (
        <>
          <Rect x={3} y={4} width={18} height={18} rx={2} {...common} />
          <Line x1={16} y1={2} x2={16} y2={6} {...common} />
          <Line x1={8} y1={2} x2={8} y2={6} {...common} />
          <Line x1={3} y1={10} x2={21} y2={10} {...common} />
        </>
      );
    case 'lightning':
      return (
        <Path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} fill="none" />
      );
    case 'leaf':
      return (
        <>
          <Path d="M17 8C8 10 5.9 16.17 3.82 21.34" {...common} />
          <Path d="M17 8C17 8 21 3 21 3C21 3 17 3 13 5C9 7 5 12 3.82 21.34" {...common} />
        </>
      );
    case 'dumbbell':
      return (
        <>
          <Path d="M6.5 6.5L17.5 17.5" {...common} />
          <Path d="M3 10L7 6" {...common} />
          <Path d="M5 12L9 8" {...common} />
          <Path d="M17 16L21 12" {...common} />
          <Path d="M15 18L19 14" {...common} />
        </>
      );
    case 'flame':
      return (
        <Path d="M12 22C15.866 22 19 18.866 19 15C19 11 16 8 14 6C14 9 11.5 11 10 10C10 13 7 14 5 15C5 18.866 8.134 22 12 22Z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} fill="none" />
      );
    case 'unlock':
      return (
        <>
          <Rect x={3} y={11} width={18} height={11} rx={2} {...common} />
          <Path d="M7 11V7C7 4.23858 9.23858 2 12 2C14.419 2 16.4367 3.71776 16.9 6" {...common} />
        </>
      );
    case 'bell':
      return (
        <>
          <Path d="M18 8A6 6 0 0 0 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" {...common} />
          <Path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" {...common} />
        </>
      );
    case 'crown':
      return (
        <>
          <Path d="M2 17L5 7L9 12L12 4L15 12L19 7L22 17Z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} fill="none" />
          <Line x1={2} y1={20} x2={22} y2={20} {...common} />
        </>
      );
    case 'alert-octagon':
      return (
        <>
          <Path d="M7.86 2H16.14L22 7.86V16.14L16.14 22H7.86L2 16.14V7.86L7.86 2Z" {...common} />
          <Line x1={12} y1={8} x2={12} y2={12} {...common} />
          <Circle cx={12} cy={16} r={0.5} fill={stroke} stroke="none" />
        </>
      );
    case 'apple':
      return (
        <>
          <Path d="M12 3C12 3 9 1 7 3C5 5 5 8 7 11C9 14 11 17 12 20C13 17 15 14 17 11C19 8 19 5 17 3C15 1 12 3 12 3Z" {...common} />
          <Path d="M12 3C12 3 12 1 14 1" {...common} />
        </>
      );
    case 'heart':
      return (
        <Path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.1917 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z" {...common} />
      );
    case 'body':
      return (
        <>
          <Circle cx={12} cy={4} r={2} {...common} />
          <Path d="M16 10L12 8L8 10" {...common} />
          <Path d="M12 8V16" {...common} />
          <Path d="M8 22L12 16L16 22" {...common} />
        </>
      );
    case 'bar-chart':
      return (
        <>
          <Line x1={12} y1={20} x2={12} y2={10} {...common} />
          <Line x1={18} y1={20} x2={18} y2={4} {...common} />
          <Line x1={6} y1={20} x2={6} y2={16} {...common} />
        </>
      );
    case 'trending-down':
      return (
        <>
          <Polyline points="23,18 13.5,8.5 8.5,13.5 1,6" {...common} fill="none" />
          <Polyline points="17,18 23,18 23,12" {...common} fill="none" />
        </>
      );
    case 'scale':
      return (
        <>
          <Line x1={12} y1={3} x2={12} y2={21} {...common} />
          <Path d="M4 7L12 3L20 7" {...common} />
          <Path d="M4 7L2 13C2 14.5 3.5 16 6 16C8.5 16 10 14.5 10 13L8 7" {...common} />
          <Path d="M16 7L14 13C14 14.5 15.5 16 18 16C20.5 16 22 14.5 22 13L20 7" {...common} />
        </>
      );
    case 'trending-up':
      return (
        <>
          <Polyline points="23,6 13.5,15.5 8.5,10.5 1,18" {...common} fill="none" />
          <Polyline points="17,6 23,6 23,12" {...common} fill="none" />
        </>
      );
    case 'female':
      return (
        <>
          <Circle cx={12} cy={9} r={5} {...common} />
          <Line x1={12} y1={14} x2={12} y2={22} {...common} />
          <Line x1={9} y1={18} x2={15} y2={18} {...common} />
        </>
      );
    case 'male':
      return (
        <>
          <Circle cx={10} cy={14} r={5} {...common} />
          <Line x1={19} y1={5} x2={13.6} y2={10.4} {...common} />
          <Polyline points="15,5 19,5 19,9" {...common} fill="none" />
        </>
      );
    case 'couch':
      return (
        <>
          <Path d="M4 12V7C4 5.89543 4.89543 5 6 5H18C19.1046 5 20 5.89543 20 7V12" {...common} />
          <Path d="M2 12V17C2 18.1046 2.89543 19 4 19H20C21.1046 19 22 18.1046 22 17V12C22 12 20 12 20 14H4C4 12 2 12 2 12Z" {...common} />
        </>
      );
    case 'barbell':
      return (
        <>
          <Line x1={2} y1={12} x2={22} y2={12} {...common} />
          <Rect x={4} y={7} width={3} height={10} rx={1} {...common} />
          <Rect x={17} y={7} width={3} height={10} rx={1} {...common} />
        </>
      );
    case 'warning':
      return (
        <>
          <Path d="M10.29 3.86L1.82 18C1.64 18.3024 1.54 18.6453 1.54 18.9945C1.54 19.3438 1.64 19.6867 1.82 19.9891C2 20.2916 2.25 20.5434 2.55 20.7217C2.85 20.9 3.19 20.999 3.54 21H20.46C20.81 20.999 21.15 20.9 21.45 20.7217C21.75 20.5434 22 20.2916 22.18 19.9891C22.36 19.6867 22.46 19.3438 22.46 18.9945C22.46 18.6453 22.36 18.3024 22.18 18L13.71 3.86C13.53 3.56 13.28 3.31 12.98 3.13C12.68 2.95 12.34 2.86 12 2.86C11.66 2.86 11.32 2.95 11.02 3.13C10.72 3.31 10.47 3.56 10.29 3.86Z" {...common} />
          <Line x1={12} y1={9} x2={12} y2={13} {...common} />
          <Circle cx={12} cy={17} r={0.5} fill={stroke} stroke="none" />
        </>
      );
    case 'utensils':
      return (
        <>
          <Path d="M3 2V10C3 11.1046 3.89543 12 5 12H7C8.10457 12 9 11.1046 9 10V2" {...common} />
          <Line x1={6} y1={2} x2={6} y2={22} {...common} />
          <Path d="M15 2C15 2 15 7 15 10C15 12 16 14 18 14V22" {...common} />
        </>
      );
    case 'heart-pulse':
      return (
        <>
          <Path d="M20.84 4.61C20.3292 4.099 19.7228 3.69364 19.0554 3.41708C18.3879 3.14052 17.6725 2.99817 16.95 2.99817C16.2275 2.99817 15.5121 3.14052 14.8446 3.41708C14.1772 3.69364 13.5708 4.099 13.06 4.61L12 5.67L10.94 4.61C9.9083 3.57831 8.50903 2.99871 7.05 2.99871C5.59096 2.99871 4.1917 3.57831 3.16 4.61C2.1283 5.64169 1.54871 7.04097 1.54871 8.5C1.54871 9.95903 2.1283 11.3583 3.16 12.39L12 21.23L20.84 12.39C21.351 11.8792 21.7563 11.2728 22.0329 10.6053C22.3095 9.93789 22.4518 9.22249 22.4518 8.5C22.4518 7.77751 22.3095 7.0621 22.0329 6.39464C21.7563 5.72718 21.351 5.12075 20.84 4.61Z" {...common} />
          <Polyline points="3,12 8,12 10,8 12,14 14,10 16,12 21,12" stroke={stroke} strokeWidth={1.5} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} fill="none" />
        </>
      );
    case 'muscle':
      return (
        <>
          <Path d="M7 12.5C7 12.5 4 10 4 7C4 4 6 3 8 4C10 5 9 7 9 7" {...common} />
          <Path d="M17 12.5C17 12.5 20 10 20 7C20 4 18 3 16 4C14 5 15 7 15 7" {...common} />
          <Path d="M9 7L9 16C9 16 9 19 12 19C15 19 15 16 15 16L15 7" {...common} />
        </>
      );
    case 'fire-alt':
      return (
        <Path d="M12 22C15.866 22 19 18.866 19 15C19 11 16 8 14 6C14 9 11.5 11 10 10C10 13 7 14 5 15C5 18.866 8.134 22 12 22Z" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap={strokeLinecap} strokeLinejoin={strokeLinejoin} fill="none" />
      );
    default:
      return null;
  }
}
