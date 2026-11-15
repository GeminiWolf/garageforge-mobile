#!/usr/bin/env node
'use strict';

const { execFileSync, spawnSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
function capture(command, args) {
  return execFileSync(command, args, { cwd: root, encoding: 'utf8' }).trim();
}
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} failed (${result.status})`);
}

function main() {
  const options = { mode: 'Debug' };
  const args = process.argv.slice(2);
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--help') {
      console.log(
        'Usage: npm run ios -- [--udid ID | --simulator NAME] [--mode Debug|Release] [--list] [--dry-run]\nStart Metro separately with npm start for Debug builds.',
      );
      return;
    }
    if (arg === '--list' || arg === '--dry-run') options[arg.slice(2)] = true;
    else if (
      ['--udid', '--simulator', '--mode'].includes(arg) &&
      args[i + 1] &&
      !args[i + 1].startsWith('--')
    )
      options[arg.slice(2)] = args[++i];
    else
      throw new Error(`Unsupported or incomplete option: ${arg}. Use --help.`);
  }
  if (options.udid && options.simulator)
    throw new Error('Choose --udid or --simulator.');
  if (!['Debug', 'Release'].includes(options.mode))
    throw new Error('Mode must be Debug or Release.');
  const developerDir =
    process.env.DEVELOPER_DIR || capture('xcode-select', ['-p']);
  const hub = path.resolve(developerDir, '../Applications/DeviceHub.app');
  const simulatorApp = path.join(developerDir, 'Applications/Simulator.app');
  const displayApp = existsSync(hub) ? hub : simulatorApp;
  if (!existsSync(displayApp))
    throw new Error(
      `No Device Hub or Simulator found for ${developerDir}. Select a full Xcode installation.`,
    );
  const devices = Object.entries(
    JSON.parse(
      capture('xcrun', ['simctl', 'list', 'devices', 'available', '--json']),
    ).devices,
  )
    .filter(([runtime]) => runtime.includes('.iOS-'))
    .flatMap(([, list]) => list);
  if (options.list) {
    devices.forEach(device =>
      console.log(`${device.name}  ${device.udid}  ${device.state}`),
    );
    return;
  }
  const matches = devices.filter(device =>
    options.udid
      ? device.udid === options.udid
      : options.simulator
      ? device.name === options.simulator
      : device.state === 'Booted',
  );
  if (matches.length !== 1)
    throw new Error(
      'Select one iOS simulator with --udid (see --list), or boot one device in Device Hub.',
    );
  const device = matches[0];
  const buildArgs = [
    '-workspace',
    'ios/garageforge.xcworkspace',
    '-scheme',
    'garageforge',
    '-configuration',
    options.mode,
    '-destination',
    `id=${device.udid}`,
    '-derivedDataPath',
    path.join(root, 'ios/build'),
  ];
  console.log(
    `GarageForge → ${device.name} (${options.mode})\nDisplay: ${displayApp}`,
  );
  if (options['dry-run']) {
    console.log('Build:', ['xcodebuild', ...buildArgs, 'build'].join(' '));
    return;
  }
  if (device.state !== 'Booted') run('xcrun', ['simctl', 'boot', device.udid]);
  run('xcrun', ['simctl', 'bootstatus', device.udid, '-b']);
  run('open', [displayApp]);
  run('xcodebuild', [...buildArgs, 'build']);
  const settings = JSON.parse(
    capture('xcodebuild', [...buildArgs, '-showBuildSettings', '-json']),
  );
  const app = settings.find(
    entry => entry.buildSettings.WRAPPER_EXTENSION === 'app',
  );
  if (!app) throw new Error('Xcode did not return an application product.');
  const product = path.join(
    app.buildSettings.TARGET_BUILD_DIR,
    app.buildSettings.FULL_PRODUCT_NAME,
  );
  run('xcrun', ['simctl', 'install', device.udid, product]);
  run('xcrun', [
    'simctl',
    'launch',
    '--terminate-running-process',
    device.udid,
    app.buildSettings.PRODUCT_BUNDLE_IDENTIFIER,
  ]);
  console.log('GarageForge launched. View the selected device in Device Hub.');
}
try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
