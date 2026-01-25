module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Reanimated plugin'i sadece native build'de yükle
      'react-native-reanimated/plugin',
    ],
  };
};
