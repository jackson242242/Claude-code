/**
 * Maps country/team name → flag emoji for 2026 World Cup participant nations.
 * Returns an empty string for TBD / placeholder team names.
 */
const FLAG_MAP: Record<string, string> = {
  // CONCACAF
  Canada: '🇨🇦',
  Mexico: '🇲🇽',
  USA: '🇺🇸',
  'United States': '🇺🇸',
  Honduras: '🇭🇳',
  Jamaica: '🇯🇲',
  Panama: '🇵🇦',
  'Costa Rica': '🇨🇷',
  'Trinidad and Tobago': '🇹🇹',
  // CONMEBOL
  Argentina: '🇦🇷',
  Brazil: '🇧🇷',
  Chile: '🇨🇱',
  Colombia: '🇨🇴',
  Ecuador: '🇪🇨',
  Paraguay: '🇵🇾',
  Peru: '🇵🇪',
  Uruguay: '🇺🇾',
  Venezuela: '🇻🇪',
  // UEFA
  Austria: '🇦🇹',
  Belgium: '🇧🇪',
  Croatia: '🇭🇷',
  Czechia: '🇨🇿',
  Denmark: '🇩🇰',
  England: '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
  France: '🇫🇷',
  Germany: '🇩🇪',
  Greece: '🇬🇷',
  Hungary: '🇭🇺',
  Italy: '🇮🇹',
  Netherlands: '🇳🇱',
  Norway: '🇳🇴',
  Poland: '🇵🇱',
  Portugal: '🇵🇹',
  Scotland: '🏴󠁧󠁢󠁳󠁣󠁴󠁿',
  Serbia: '🇷🇸',
  Slovenia: '🇸🇮',
  Spain: '🇪🇸',
  Sweden: '🇸🇪',
  Switzerland: '🇨🇭',
  Turkey: '🇹🇷',
  Ukraine: '🇺🇦',
  Wales: '🏴󠁧󠁢󠁷󠁬󠁳󠁿',
  // AFC
  Australia: '🇦🇺',
  Iran: '🇮🇷',
  Iraq: '🇮🇶',
  Japan: '🇯🇵',
  'Korea Republic': '🇰🇷',
  'South Korea': '🇰🇷',
  'New Zealand': '🇳🇿',
  Qatar: '🇶🇦',
  'Saudi Arabia': '🇸🇦',
  UAE: '🇦🇪',
  // CAF
  Algeria: '🇩🇿',
  Cameroon: '🇨🇲',
  Egypt: '🇪🇬',
  Ghana: '🇬🇭',
  'Ivory Coast': '🇨🇮',
  Morocco: '🇲🇦',
  Nigeria: '🇳🇬',
  Senegal: '🇸🇳',
  Tunisia: '🇹🇳',
};

/**
 * Returns the flag emoji for the given team name.
 * Returns an empty string for TBD / placeholder entries (e.g. "Winner Group A").
 */
export const getFlag = (teamName: string): string =>
  FLAG_MAP[teamName] ?? '';
