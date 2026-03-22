import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '../constants/colors';
import type { AuthState } from '../hooks/useAuth';

interface Props {
  stampCount: number;
  auth: AuthState;
  onLoginSpotify: () => void;
  onLogout: () => void;
}


export function Header({ stampCount, auth, onLoginSpotify, onLogout }: Props) {
  return (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.logo}>✈</Text>
        <View>
          <Text style={styles.title}>Musical Passport</Text>
          <Text style={styles.subtitle}>World music discovery</Text>
        </View>
      </View>

      <View style={styles.rightCol}>
        <View style={styles.stampPill}>
          <Text style={styles.stampText}>
            {stampCount === 0 ? '0 stamps' : `${stampCount} stamp${stampCount !== 1 ? 's' : ''}`}
          </Text>
        </View>

        {auth.loading ? (
          <ActivityIndicator size="small" color={Colors.gold} />
        ) : auth.service === 'spotify' && auth.user ? (
          <View style={styles.authRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {auth.user.displayName || auth.user.email}
            </Text>
            <TouchableOpacity onPress={onLogout} style={styles.logoutBtn}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={onLoginSpotify} style={styles.spotifyBtn}>
            <Text style={styles.spotifyText}>Connect Spotify</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    fontSize: 22,
  },
  title: {
    color: Colors.text,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  subtitle: {
    color: Colors.text2,
    fontSize: 11,
    marginTop: 1,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: 6,
  },
  stampPill: {
    backgroundColor: Colors.goldBg,
    borderWidth: 1,
    borderColor: Colors.goldBorder,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  stampText: {
    color: Colors.gold,
    fontSize: 11,
    fontWeight: '500',
  },
  authRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  userName: {
    color: Colors.text2,
    fontSize: 11,
    maxWidth: 100,
  },
  spotifyBtn: {
    backgroundColor: Colors.greenBg,
    borderWidth: 1,
    borderColor: Colors.greenBorder,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spotifyText: {
    color: Colors.green,
    fontSize: 11,
    fontWeight: '500',
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  logoutText: {
    color: Colors.text2,
    fontSize: 11,
  },
});
