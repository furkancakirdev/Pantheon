
import { Platform } from 'react-native';
import Constants from 'expo-constants';

// NOTE: Automatically detected IP
// Production için bu IP adresini production sunucusunun IP adresiyle değiştirin
// Production için: const LOCAL_IP = 'your-production-server-ip';
const LOCAL_IP = '192.168.1.122';

// Production için bu portu production sunucusunun portuyla değiştirin
const PORT = '3000';

// Production API URL
const PRODUCTION_API_BASE = 'https://pantheon.vercel.app/api';

// Development veya Production modunu belirle
const IS_PRODUCTION = __DEV__ === false;

// API URL seçimi
export const API_URL = Platform.select({
    android: IS_PRODUCTION ? `${PRODUCTION_API_BASE}/signals` : `http://${LOCAL_IP}:${PORT}/api/signals`,
    ios: IS_PRODUCTION ? `${PRODUCTION_API_BASE}/signals` : `http://${LOCAL_IP}:${PORT}/api/signals`,
    default: IS_PRODUCTION ? `${PRODUCTION_API_BASE}/signals` : `http://localhost:${PORT}/api/signals`,
});

export const Config = {
    REFRESH_INTERVAL_MS: 10000,
    API_URL,
    API_BASE_URL: IS_PRODUCTION ? PRODUCTION_API_BASE : `http://${LOCAL_IP}:${PORT}/api`,
    PRODUCTION_API_BASE,
};
