import { Share, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SHARE_COUNT_KEY = '@rise_share_count';

export type ShareEvent = 'victory' | 'boss_defeat' | 'streak' | 'level_up' | 'wake_score';

interface ShareData {
  event: ShareEvent;
  streak?: number;
  wakeScore?: number;
  bossName?: string;
  level?: number;
  title?: string;
  xp?: number;
  coins?: number;
}

const HASHTAGS = '#RISERPG #ConquerYourMorning';

function buildShareMessage(data: ShareData): string {
  switch (data.event) {
    case 'boss_defeat':
      return `💀 Just defeated ${data.bossName || 'a weekly boss'} at dawn! ${data.streak || 0}-day wake streak. Can you survive the morning quest?\n\n${HASHTAGS}`;

    case 'streak':
      return `🔥 ${data.streak}-day wake streak in RISE! My discipline score is climbing. Who else is conquering their mornings?\n\n${HASHTAGS}`;

    case 'level_up':
      return `⚡ Level ${data.level} — "${data.title}" unlocked in RISE! ${data.xp || 0} XP earned through morning battles.\n\n${HASHTAGS}`;

    case 'wake_score':
      return `🎯 Wake Score: ${data.wakeScore}/100 this morning! RISE tracks every snooze dodge, challenge, and routine.\n\n${HASHTAGS}`;

    case 'victory':
    default:
      return `⚔️ Morning conquered! ${data.wakeScore || '??'}/100 Wake Score, ${data.streak || 0}-day streak. RISE turns waking up into an RPG quest.\n\n${HASHTAGS}`;
  }
}

export async function shareResult(data: ShareData): Promise<boolean> {
  const message = buildShareMessage(data);

  try {
    const result = await Share.share(
      { message },
      {
        dialogTitle: 'Share your RISE victory',
        subject: 'RISE: RPG Alarm Clock — Morning Conquered!',
      }
    );

    if (result.action === Share.sharedAction) {
      // Track share count for coin rewards
      await incrementShareCount();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

async function incrementShareCount(): Promise<number> {
  try {
    const current = await AsyncStorage.getItem(SHARE_COUNT_KEY);
    const count = (parseInt(current || '0', 10) || 0) + 1;
    await AsyncStorage.setItem(SHARE_COUNT_KEY, count.toString());
    return count;
  } catch {
    return 0;
  }
}

export async function getShareCount(): Promise<number> {
  try {
    const current = await AsyncStorage.getItem(SHARE_COUNT_KEY);
    return parseInt(current || '0', 10) || 0;
  } catch {
    return 0;
  }
}
