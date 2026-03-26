import React, { useState } from 'react';
import {
  Modal, View, Text, TouchableOpacity, Share, Linking,
  StyleSheet, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';
import { flagTrack } from '../services/api';
import type { Track } from '../services/api';

interface Props {
  visible: boolean;
  onClose: () => void;
  track: Track;
  country: string;
  genre?: string;
  openUrl: string;
  isExpertTester: boolean;
  userId?: string;
}

export function TrackOptionsSheet({
  visible, onClose, track, country, genre, openUrl, isExpertTester, userId,
}: Props) {
  const [flagging, setFlagging] = useState(false);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleClose() {
    setFlagging(false);
    setComment('');
    setSubmitted(false);
    onClose();
  }

  async function handleShare() {
    await Share.share({
      message: `${track.title}${track.artist ? ` · ${track.artist}` : ''}\n${openUrl}`,
    });
    handleClose();
  }

  async function handleSubmitFlag() {
    setSubmitting(true);
    try {
      await flagTrack({
        trackTitle: track.title,
        trackArtist: track.artist ?? null,
        spotifyId: track.spotifyId ?? null,
        appleId: track.appleId ?? null,
        country,
        genre: genre ?? null,
        comment: comment.trim() || null,
        userId: userId ?? null,
      });
      setSubmitted(true);
    } catch {
      // Silently fail — don't block the expert tester
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={handleClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.sheetWrap}>
        <View style={styles.sheet}>
          <View style={styles.handle} />

          {/* Track info header */}
          <View style={styles.trackHeader}>
            <Text style={styles.trackTitle} numberOfLines={1}>{track.title}</Text>
            {track.artist && <Text style={styles.trackArtist} numberOfLines={1}>{track.artist}</Text>}
          </View>

          {!flagging ? (
            <>
              <TouchableOpacity style={styles.option} onPress={handleShare}>
                <Ionicons name="share-outline" size={20} color={Colors.text} />
                <Text style={styles.optionText}>Share</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.option} onPress={() => { Linking.openURL(openUrl); handleClose(); }}>
                <Ionicons name="open-outline" size={20} color={Colors.blue} />
                <Text style={[styles.optionText, { color: Colors.blue }]}>Open in App</Text>
              </TouchableOpacity>

              {isExpertTester && (
                <TouchableOpacity style={styles.option} onPress={() => setFlagging(true)}>
                  <Ionicons name="flag-outline" size={20} color={Colors.gold} />
                  <Text style={[styles.optionText, { color: Colors.gold }]}>Flag for Review</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={[styles.option, styles.cancelOption]} onPress={handleClose}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : submitted ? (
            <View style={styles.confirmedState}>
              <Ionicons name="checkmark-circle" size={36} color={Colors.green} />
              <Text style={styles.confirmedText}>Flagged — thanks!</Text>
              <TouchableOpacity style={styles.doneBtn} onPress={handleClose}>
                <Text style={styles.doneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.flagLabel}>What's wrong with this track?</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Optional comment (e.g. wrong country, wrong artist…)"
                placeholderTextColor={Colors.text3}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={300}
                autoFocus
              />
              <View style={styles.flagActions}>
                <TouchableOpacity style={styles.cancelFlagBtn} onPress={() => setFlagging(false)}>
                  <Text style={styles.cancelFlagText}>Back</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitFlagBtn, submitting && styles.submitFlagBtnDisabled]}
                  onPress={handleSubmitFlag}
                  disabled={submitting}
                >
                  {submitting
                    ? <ActivityIndicator size="small" color={Colors.bg} />
                    : <Text style={styles.submitFlagText}>Submit Flag</Text>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetWrap: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 36,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  trackHeader: {
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: 6,
  },
  trackTitle: { color: Colors.text, fontSize: 15, fontWeight: '700' },
  trackArtist: { color: Colors.text2, fontSize: 13, marginTop: 3 },

  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionText: { color: Colors.text, fontSize: 16, fontWeight: '500' },
  cancelOption: { borderBottomWidth: 0, justifyContent: 'center' },
  cancelText: { color: Colors.text3, fontSize: 16, fontWeight: '500', textAlign: 'center', flex: 1 },

  flagLabel: {
    color: Colors.text2,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 10,
  },
  commentInput: {
    backgroundColor: Colors.bg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    padding: 12,
    color: Colors.text,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  flagActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  cancelFlagBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelFlagText: { color: Colors.text2, fontSize: 15, fontWeight: '600' },
  submitFlagBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.gold,
    alignItems: 'center',
  },
  submitFlagBtnDisabled: { opacity: 0.6 },
  submitFlagText: { color: Colors.bg, fontSize: 15, fontWeight: '700' },

  confirmedState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  confirmedText: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  doneBtn: {
    marginTop: 8,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  doneBtnText: { color: Colors.text, fontSize: 15, fontWeight: '600' },
});
