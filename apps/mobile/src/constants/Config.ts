
import { Platform } from 'react-native';

// NOTE: Automatically detected IP
const LOCAL_IP = '192.168.1.122';

const PORT = '3000';

export const API_URL = Platform.select({
    android: `http://${LOCAL_IP}:${PORT}/api/signals`,
    ios: `http://${LOCAL_IP}:${PORT}/api/signals`, // iOS device also needs LAN IP
    default: `http://localhost:${PORT}/api/signals`,
});

export const Config = {
    REFRESH_INTERVAL_MS: 10000,
    API_URL
};
