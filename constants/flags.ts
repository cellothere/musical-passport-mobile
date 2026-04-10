import { COUNTRY_ISO, flagEmojiFromIso } from './countryIso';

const SPECIAL_FLAGS: Record<string, string> = {
  'East Germany': '🏳',
  'Ottoman Empire': '🌙',
  'Soviet Union': '☭',
  'Yugoslavia': '🏳',
  'Czechoslovakia': '🏳',
  'Hawaii': '🌺',
  'Quebec': '🏴',
};

export const FLAGS: Record<string, string> = {
  ...Object.fromEntries(
    Object.entries(COUNTRY_ISO).map(([country, code]) => [country, flagEmojiFromIso(code)])
  ),
  ...SPECIAL_FLAGS,
};
