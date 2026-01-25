/**
 * PANTHEON COUNCIL CARD
 * Display Grand Council decision with expandable module votes
 * Based on Argus Terminal CouncilCard design
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CouncilDecision, ModuleVote } from '../../types/api';
import { Theme, getVerdictColor } from '../../constants/Theme';
import { GlassCard } from './GlassCard';

// ============ PROPS ============
export interface CouncilCardProps {
  decision: CouncilDecision;
  symbol?: string;
  compact?: boolean;
  showExplanation?: boolean;
}

// ============ MODULE VOTE ROW ============
interface ModuleVoteRowProps {
  vote: ModuleVote;
  showGuage?: boolean;
}

const ModuleVoteRow: React.FC<ModuleVoteRowProps> = ({ vote, showGuage = true }) => {
  const voteColor = getVerdictColor(vote.oy as string);
  const isBuy = vote.oy === 'AL' || vote.oy === 'GÜÇLÜ AL';
  const isSell = vote.oy === 'SAT' || vote.oy === 'GÜÇLÜ SAT';

  return (
    <View style={styles.voteRow}>
      <View style={styles.voteLeft}>
        <View style={[styles.voteDot, { backgroundColor: voteColor }]} />
        <Text style={styles.voteModule}>{vote.modul}</Text>
      </View>

      <View style={styles.voteMiddle}>
        {showGuage && (
          <View style={styles.gaugeContainer}>
            <LinearGradient
              colors={[voteColor, voteColor + '66']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.gaugeBar, { width: `${vote.guven}%` }]}
            />
          </View>
        )}
        {vote.aciklama && (
          <Text style={styles.voteExplanation} numberOfLines={2}>
            {vote.aciklama}
          </Text>
        )}
      </View>

      <View style={styles.voteRight}>
        <Text style={[styles.voteVerdict, { color: voteColor }]}>
          {vote.oy}
        </Text>
        <Text style={styles.voteConfidence}>{vote.guven}%</Text>
      </View>
    </View>
  );
};

// ============ COUNCIL CARD COMPONENT ============
export const CouncilCard: React.FC<CouncilCardProps> = ({
  decision,
  symbol,
  compact = false,
  showExplanation = true,
}) => {
  const [expanded, setExpanded] = useState(false);
  const verdict = decision.sonKarar;
  const consensus = decision.konsensus;
  const verdictColor = getVerdictColor(verdict);
  const votes = decision.oylar || [];

  // Count votes by type
  const buyVotes = votes.filter((v) => v.oy === 'AL' || v.oy === 'GÜÇLÜ AL').length;
  const sellVotes = votes.filter((v) => v.oy === 'SAT' || v.oy === 'GÜÇLÜ SAT').length;
  const holdVotes = votes.filter((v) => v.oy === 'TUT' || v.oy === 'BEKLE').length;

  if (compact) {
    return (
      <GlassCard style={styles.compactContainer}>
        <View style={styles.compactHeader}>
          <Text style={styles.compactLabel}>KONSEY</Text>
          <View style={[styles.compactBadge, { borderColor: verdictColor }]}>
            <Text style={[styles.compactVerdict, { color: verdictColor }]}>
              {verdict}
            </Text>
          </View>
        </View>
        <View style={styles.compactConsensus}>
          <Text style={styles.compactConsensusLabel}>Konsensus:</Text>
          <Text style={[styles.compactConsensusValue, { color: verdictColor }]}>
            %{consensus}
          </Text>
        </View>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerIcon}>👥</Text>
          <View>
            <Text style={styles.headerTitle}>
              KONSEY KARARI{symbol && ` - ${symbol}`}
            </Text>
            <Text style={styles.headerSubtitle}>
              Grand Council Oylaması
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.verdictBadge,
            { backgroundColor: `${verdictColor}20`, borderColor: verdictColor },
          ]}
        >
          <Text style={[styles.verdictText, { color: verdictColor }]}>
            {verdict}
          </Text>
        </View>
      </View>

      {/* Consensus Bar */}
      <View style={styles.consensusSection}>
        <View style={styles.consensusHeader}>
          <Text style={styles.consensusLabel}>Net Destek</Text>
          <Text style={[styles.consensusValue, { color: verdictColor }]}>
            %{consensus}
          </Text>
        </View>

        {/* Vote Distribution */}
        <View style={styles.voteDistribution}>
          <View style={styles.distBar}>
            {buyVotes > 0 && (
              <View
                style={[
                  styles.distSegment,
                  { flex: buyVotes, backgroundColor: Theme.colors.positive },
                ]}
              />
            )}
            {holdVotes > 0 && (
              <View
                style={[
                  styles.distSegment,
                  { flex: holdVotes, backgroundColor: Theme.colors.warning },
                ]}
              />
            )}
            {sellVotes > 0 && (
              <View
                style={[
                  styles.distSegment,
                  { flex: sellVotes, backgroundColor: Theme.colors.negative },
                ]}
              />
            )}
          </View>
          <View style={styles.distLabels}>
            {buyVotes > 0 && (
              <Text style={[styles.distLabel, { color: Theme.colors.positive }]}>
                AL {buyVotes}
              </Text>
            )}
            {holdVotes > 0 && (
              <Text style={[styles.distLabel, { color: Theme.colors.warning }]}>
                BEKLE {holdVotes}
              </Text>
            )}
            {sellVotes > 0 && (
              <Text style={[styles.distLabel, { color: Theme.colors.negative }]}>
                SAT {sellVotes}
              </Text>
            )}
          </View>
        </View>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <LinearGradient
            colors={[verdictColor, verdictColor + 'CC', verdictColor + '66']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.progressBar, { width: `${consensus}%` }]}
          />
        </View>
      </View>

      {/* Expandable Vote List */}
      {votes.length > 0 && (
        <TouchableOpacity
          style={styles.expandButton}
          onPress={() => setExpanded(!expanded)}
          activeOpacity={0.7}
        >
          <Text style={styles.expandText}>
            {expanded ? 'Detayları Gizle' : `Detayları Göster (${votes.length})`}
          </Text>
          <Text style={styles.expandIcon}>{expanded ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      )}

      {expanded && votes.length > 0 && (
        <View style={styles.votesList}>
          {votes.map((vote, index) => (
            <ModuleVoteRow key={index} vote={vote} />
          ))}
        </View>
      )}

      {/* Explanation Section */}
      {showExplanation && !expanded && (
        <View style={styles.explanationSection}>
          <Text style={styles.explanationText}>
            {verdict === 'AL' || verdict === 'GÜÇLÜ AL'
              ? 'Çoğunluk modüller AL sinyali veriyor. Güven seviyesi yüksek.'
              : verdict === 'SAT' || verdict === 'GÜÇLÜ SAT'
              ? 'Çoğunluk modüller SAT sinyali veriyor. Risk seviyesi yüksek.'
              : 'Modüller kararsız. Daha fazla veri gerekiyor.'}
          </Text>
        </View>
      )}
    </GlassCard>
  );
};

// ============ MINI VARIANT ============
export interface CouncilCardMiniProps {
  verdict: string;
  consensus: number;
  onPress?: () => void;
}

export const CouncilCardMini: React.FC<CouncilCardMiniProps> = ({
  verdict,
  consensus,
  onPress,
}) => {
  const verdictColor = getVerdictColor(verdict);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View
        style={[
          styles.miniContainer,
          { backgroundColor: `${verdictColor}15`, borderColor: verdictColor },
        ]}
      >
        <Text style={[styles.miniVerdict, { color: verdictColor }]}>
          {verdict}
        </Text>
        <View style={styles.miniConsensusBar}>
          <View
            style={[styles.miniConsensusFill, { width: `${consensus}%`, backgroundColor: verdictColor }]}
          />
        </View>
        <Text style={[styles.miniConsensus, { color: verdictColor }]}>
          %{consensus}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

// ============ STYLES ============
const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.medium,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.medium,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
  },
  headerIcon: {
    fontSize: 24,
  },
  headerTitle: {
    ...Theme.typography.h4,
    fontWeight: '700',
  },
  headerSubtitle: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  verdictBadge: {
    paddingHorizontal: Theme.spacing.medium,
    paddingVertical: 8,
    borderRadius: Theme.radius.medium,
    borderWidth: 1.5,
  },
  verdictText: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  consensusSection: {
    gap: Theme.spacing.small,
  },
  consensusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  consensusLabel: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
  },
  consensusValue: {
    ...Theme.typography.body,
    fontWeight: '700',
  },
  voteDistribution: {
    gap: 4,
  },
  distBar: {
    flexDirection: 'row',
    height: 8,
    borderRadius: Theme.radius.small,
    overflow: 'hidden',
  },
  distSegment: {
    height: '100%',
  },
  distLabels: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  distLabel: {
    ...Theme.typography.captionSmall,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: Theme.radius.pill,
  },
  expandButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Theme.spacing.medium,
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
  expandText: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  expandIcon: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  votesList: {
    marginTop: Theme.spacing.medium,
    gap: Theme.spacing.small,
  },
  voteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.small,
    paddingHorizontal: Theme.spacing.medium,
    backgroundColor: Theme.colors.secondaryBackground,
    borderRadius: Theme.radius.small,
  },
  voteLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    width: 100,
  },
  voteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  voteModule: {
    ...Theme.typography.caption,
    fontWeight: '600',
  },
  voteMiddle: {
    flex: 1,
    gap: 4,
  },
  gaugeContainer: {
    height: 4,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  gaugeBar: {
    height: '100%',
  },
  voteExplanation: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textSecondary,
  },
  voteRight: {
    alignItems: 'flex-end',
  },
  voteVerdict: {
    ...Theme.typography.bodySmall,
    fontWeight: '700',
  },
  voteConfidence: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  explanationSection: {
    marginTop: Theme.spacing.medium,
    padding: Theme.spacing.medium,
    backgroundColor: `${Theme.colors.accent}10`,
    borderRadius: Theme.radius.small,
    borderLeftWidth: 3,
    borderLeftColor: Theme.colors.accent,
  },
  explanationText: {
    ...Theme.typography.bodySmall,
    color: Theme.colors.textSecondary,
    lineHeight: 18,
  },
  // Compact variant
  compactContainer: {
    padding: Theme.spacing.small,
  },
  compactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  compactLabel: {
    ...Theme.typography.caption,
    color: Theme.colors.textSecondary,
  },
  compactBadge: {
    paddingHorizontal: Theme.spacing.small,
    paddingVertical: 4,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
  },
  compactVerdict: {
    ...Theme.typography.captionSmall,
    fontWeight: '700',
  },
  compactConsensus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  compactConsensusLabel: {
    ...Theme.typography.captionSmall,
    color: Theme.colors.textTertiary,
  },
  compactConsensusValue: {
    ...Theme.typography.captionSmall,
    fontWeight: '700',
  },
  // Mini variant
  miniContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.small,
    padding: Theme.spacing.small,
    borderRadius: Theme.radius.small,
    borderWidth: 1,
  },
  miniVerdict: {
    ...Theme.typography.caption,
    fontWeight: '700',
  },
  miniConsensusBar: {
    flex: 1,
    height: 4,
    backgroundColor: Theme.colors.background,
    borderRadius: Theme.radius.pill,
    overflow: 'hidden',
  },
  miniConsensusFill: {
    height: '100%',
  },
  miniConsensus: {
    ...Theme.typography.captionSmall,
    fontWeight: '700',
  },
});

export default CouncilCard;
