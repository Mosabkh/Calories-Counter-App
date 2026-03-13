import { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { Theme } from '@/constants/theme';
import { ProgressHeader } from '@/components/onboarding/ProgressHeader';
import { OnboardingButton } from '@/components/onboarding/OnboardingButton';
import { OnboardingIcon } from '@/components/onboarding/OnboardingIcon';
import { useOnboardingStore } from '@/store/onboarding-store';
import { getTargetDate } from '@/utils/target-date';
import { BouncyView } from '@/components/onboarding/BouncyView';

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
  const { currentWeight, targetWeight, weightUnit, weeklyGoalSpeed, goal } = useOnboardingStore((s) => s.payload);

  const cw = currentWeight || 80;
  const tw = targetWeight || (goal === 'gain' ? 90 : 65);
  const unit = weightUnit || 'kg';
  const speed = weeklyGoalSpeed || 0.5;
  const diff = Math.abs(cw - tw);
  const targetDate = getTargetDate(cw, tw, speed, unit);
  const isLosing = goal === 'lose';
  const isGaining = goal === 'gain';

  const chart = useMemo(() => {
    const steps = 8;
    const yMin = Math.min(cw, tw) - 2;
    const yMax = Math.max(cw, tw) + 2;
    const range = yMax - yMin || 1;
    const weightToY = (w: number) => PAD_T + (1 - (w - yMin) / range) * PLOT_H;

    const points: { x: number; y: number }[] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = PAD_L + t * PLOT_W;
      const progress = 1 - Math.pow(1 - t, 2.2);
      const weight = isGaining ? cw + progress * diff : cw - progress * diff;
      points.push({ x, y: weightToY(weight) });
    }

    const linePath = points.map((p, i) => {
      if (i === 0) return `M ${p.x},${p.y}`;
      const prev = points[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C ${cpx},${prev.y} ${cpx},${p.y} ${p.x},${p.y}`;
    }).join(' ');

    const fillPath = `${linePath} L ${points[points.length - 1].x},${PAD_T + PLOT_H} L ${points[0].x},${PAD_T + PLOT_H} Z`;

    const yLabels = isGaining
      ? [tw, Math.round((cw + tw) / 2), cw]
      : [cw, Math.round((cw + tw) / 2), tw];

    return { points, linePath, fillPath, yLabels, weightToY, startPt: points[0], endPt: points[points.length - 1] };
  }, [cw, tw, diff, isGaining]);

  const { linePath, fillPath, startPt, endPt, yLabels } = chart;
  const weightToY = chart.weightToY;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BouncyView>
      <ProgressHeader step={3} progress={95} />
      <View style={styles.content}>
        <Text style={styles.title}>
          {goal === 'gain'
            ? 'Your weight gain projection looks great'
            : 'You have great potential to crush your goal'}
        </Text>

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
              <Text style={[styles.weightValue, styles.weightValueGoal]}>{tw} {unit}</Text>
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
                const y = weightToY(label);
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
                const y = weightToY(label);
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
              <Circle cx={startPt.x} cy={startPt.y} r={3} fill={Theme.colors.white} />

              {/* End dot */}
              <Circle cx={endPt.x} cy={endPt.y} r={6} fill={Theme.colors.primary} />
              <Circle cx={endPt.x} cy={endPt.y} r={3} fill={Theme.colors.white} />
            </Svg>
          </View>

          <View style={styles.dateRow}>
            <OnboardingIcon name="calendar" size={16} color={Theme.colors.textMuted} />
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
      </BouncyView>
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
  dateText: {
    fontSize: 13, fontFamily: Theme.fonts.regular, color: Theme.colors.textMuted,
  },
  dateBold: {
    fontFamily: Theme.fonts.extraBold, color: Theme.colors.primary,
  },
  weightValueGoal: {
    color: Theme.colors.primary,
  },
  bottomAction: { paddingHorizontal: 24, paddingBottom: 36 },
});
