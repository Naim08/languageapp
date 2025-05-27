module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      'babel-preset-expo',
      '@babel/preset-typescript',
      '@babel/preset-flow'
    ],
    plugins: [
      'react-native-reanimated/plugin'
    ],
  };
};
