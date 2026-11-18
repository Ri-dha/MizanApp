const path = require("path")
const { getDefaultConfig } = require("expo/metro-config")

const root = path.resolve(__dirname, "..")
const core = path.resolve(root, "packages/core/src")

/** ADR mobile-2: core is plain TypeScript source, compiled here through the @mizan/core alias. */
const config = getDefaultConfig(__dirname)
config.watchFolders = [core, path.resolve(root, "shared/test-vectors")]
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")]
config.resolver.extraNodeModules = { "@mizan/core": core }
const resolveRequest = config.resolver.resolveRequest
config.resolver.resolveRequest = (context, moduleName, platform) => {
  const resolve = resolveRequest ?? context.resolveRequest
  if (moduleName.startsWith("@mizan/core/")) return resolve(context, path.join(core, moduleName.slice("@mizan/core/".length)), platform)
  return resolve(context, moduleName, platform)
}
module.exports = config
