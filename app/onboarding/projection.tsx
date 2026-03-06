import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText, Rect } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { useOnboardingStore } from '@/store/onboarding-store';
import { getTargetDate } from '@/utils/target-date';

const CHART_W = 280;
const CHART_H = 160;
const PAD_L = 40;
const PAD_R = 16;
const PAD_T = 20;
const PAD_B = 30;
const PLOT_W = CHART_W - PAD_L - PAD_R;
const PLOT_H = CHART_H - PAD_T - PAD_B;

export default function ProjectionScreen() {
  const router = useRouter();
  const { currentWeight, targetWeight, weightUnit, weeklyGoalSpeed } = useOnboardingStore((s) => s.payload);

  const cw = currentWeight || 80;
  const tw = targetWeight || 65;
  const unit = weightUnit || 'kg';
  const speed = weeklyGoalSpeed || 0.5;
  const diff = Math.abs(cw - tw);
  const weeks = Math.ceil(diff / speed);
  const targetDate = getTargetDate(cw, tw, speed);
  const isLosing = cw > tw;

  // Generate smooth curve points
  const points: { x: number; y: number }[] = [];
  const steps = 8;
  const yMin = Math.min(cw, tw);
  const yMax = Math.max(cw, tw);
  const range = yMax - yMin || 1;

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const x = PAD_L + t * PLOT_W;
    // Ease-out curve for natural weight change
    const progress = 1 - Math.pow(1 - t, 2.2);
    const weight = isLosing ? cw - progress * diff : cw + progress * diff;
    const yNorm = (weight - yMin) / range;
    const y = PAD_T + (isLosing ? (1 - yNorm) * PLOT_H : yNorm * PLOT_H);
    points.push({ x, y });
  }

  const linePath = points.map((p, i) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = points[i - 1];
    const cpx = (prev.x + p.x) / 2;
    return `C ${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
  }).join(' ');

  const fillPath = `${linePath} L ${points[points.length - 1].x},${PAD_T + PLOT_H} L ${points[0].x},${PAD_T + PLOT_H} Z`;

  const startPt = points[0];
  const endPt = points[points.length - 1];

  // Y-axis labels
  const yLabels = [cw, Math.round((cw + tw) / 2), tw];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ProgressHeader step={3} progress={95} />
      <View style={styles.content}>
        <Text style={styles.title}>You have great potential to crush your goal</Text>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Your weight projection</Text>
          <View style={styles.weightRow}>
            <View style={styles.weightBlock}>
              <Text style={styles.weightLabel}>Current</Text>
              <Text style={styles.weightValue}>{cw} {unit}</Text>
            </View>
            <View style={styles.arrowBlock}>
              <Text style={styles.arrowText}>{isLosing ? '\u2192' : '\u2192'}</Text>
            </View>
            <View style={styles.weightBlock}>
              <Text style={styles.weightLabel}>Goal</Text>
              <Text style={[styles.weightValue, { color: Theme.colors.primary }]}>{tw} {unit}</Text>
            </View>
          </View>

          <View style={styles.chartWrapper}>
            <Svg width={CHART_W} height={CHART_H}>
              <Defs>
                <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={Theme.colors.primary} stopOpacity={0.25} />
                  <Stop offset="100%" stopColor={Theme.colors.primary} stopOpacity={0.02} />
                </LinearGradient>
              </Defs>

              {/* Horizontal grid lines */}
              {yLabels.map((label, i) => {
                const yNorm = (label - yMin) / range;
                const y = PAD_T + (isLosing ? (1 - yNorm) * PLOT_H : yNorm * PLOT_H);
                return (
                  <Line
                    key={i}
                    x1={PAD_L}
                    y1={y}
                    x2={PAD_L + PLOT_W}
                    y2={y}
                    stroke="rgba(120,120,128,0.12)"
                    strokeWidth={1}
                    strokeDasharray="4,4"
                  />
                );
              })}

              {/* Y-axis labels */}
              {yLabels.map((label, i) => {
                const yNorm = (label - yMin) / range;
                const y = PAD_T + (isLosing ? (1 - yNorm) * PLOT_H : yNorm * PLOT_H);
                return (
                  <SvgText
                    key={`l${i}`}
                    x={PAD_L - 8}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fontWeight="600"
                    fill={Theme.colors.textMuted}
                  >
                    {label}
                  </SvgText>
                );
              })}

              {/* X-axis labels */}
              <SvgText x={PAD_L} y={CHART_H - 4} textAnchor="start" fontSize={10} fontWeight="700" fill={Theme.colors.textDark}>
                Now
              </SvgText>
              <SvgText x={PAD_L + PLOT_W} y={CHART_H - 4} textAnchor="end" fontSize={10} fontWeight="700" fill={Theme.colors.primary}>
                Goal
              </SvgText>

              {/* Area fill */}
              <Path d={fillPath} fill="url(#areaGrad)" />

              {/* Curve line */}
              <Path d={linePath} fill="none" stroke={Theme.colors.primary} strokeWidth={3} strokeLinecap="round" />

              {/* Start dot */}
              <Circle cx={startPt.x} cy={startPt.y} r={6} fill={Theme.colors.textDark} />
              <Circle cx={startPt.x} cy={startPt.y} r={3} fill="#FFFFFF" />

              {/* End dot */}
              <Circle cx={endPt.x} cy={endPt.y} r={6} fill={Theme.colors.primary} />
              <Circle cx={endPt.x} cy={endPt.y} r={3} fill="#FFFFFF" />
            </Svg>
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateIcon}>{'📅'}</Text>
            <Text style={styles.dateText}>Estimated goal date: <Text style={styles.dateBold}>{targetDate}</Text></Text>
          </View>
        </View>
      </View>
      <View style={styles.bottomAction}>
        <OnboardingButton
          title="Continue"
          onPress={() => router.push('/onboarding/notifications')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { flex: 1, paddingHorizontal: 24 },
  title: {
    fontSize: 24, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark,
    textAlign: 'left', marginTop: 20, lineHeight: 32,
  },
  chartCard: {
    backgroundColor: Theme.colors.surface, borderWidth: 1.5, borderColor: Theme.colors.border,
    borderRadius: 20, marginTop: 24, overflow: 'hidden',
  },
  chartTitle: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, fontSize: 16,
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 4,
  },
  weightRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 20, paddingVertical: 10, gap: 12,
  },
  weightBlock: { alignItems: 'center' },
  weightLabel: {
    fontSize: 11, fontFamily: Theme.fonts.semiBold, color: Theme.colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 0.5,
  },
  weightValue: {
    fontSize: 20, fontFamily: Theme.fonts.extraBold, color: Theme.colors.textDark, marginTop: 2,
  },
  arrowBlock: { paddingHorizontal: 8 },
  arrowText: { fontSize: 18, color: Theme.colors.textMuted },
  chartWrapper: { alignItems: 'center', paddingHorizontal: 10 },
  dateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 14, gap: 6,
    borderTopWidth: 1, borderTopColor: Theme.colors.border,
    marginTop: 4,
  },
  dateIcon: { fontSize: 14 },
  dateText: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
  },
  dateBold: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
