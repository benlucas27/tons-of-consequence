// The app reuses the website's rule files (../src/lib) as they are. Metro is told to watch the repo root, and any
// import of a site data file (../data/x.js) from the shared code is redirected to a "door" in ./doors that reads the
// data from the feed instead (cached on the phone, with a copy bundled in the app). See docs/MOBILE-APP-PLAN.md.
const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const repoRoot = path.resolve(__dirname, '..');
const config = getDefaultConfig(__dirname);

config.watchFolders = [path.join(repoRoot, 'src')];
config.resolver.nodeModulesPaths = [path.join(__dirname, 'node_modules')];

const siteSrc = path.join(repoRoot, 'src') + path.sep;
const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const m = /(?:^|\/)data\/([a-z-]+)(?:\.js)?$/.exec(moduleName);
  if (m && context.originModulePath.startsWith(siteSrc) && !context.originModulePath.includes(`${path.sep}data${path.sep}`)) {
    return { type: 'sourceFile', filePath: path.join(__dirname, 'doors', `${m[1]}.js`) };
  }
  return (upstream || context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
