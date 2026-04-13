const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ajoute le support pour les fichiers JSON dans src/data
config.resolver.assetExts.push('json');

module.exports = config;
