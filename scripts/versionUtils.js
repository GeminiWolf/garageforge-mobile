/**
 * Pure helpers for syncing app version across package.json, Android, and iOS.
 */

function parseSemver(version) {
  const match = String(version)
    .trim()
    .match(/^(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  if (!match) {
    return null;
  }
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  };
}

function formatSemver({ major, minor, patch }) {
  return `${major}.${minor}.${patch}`;
}

function bumpSemver(version, type) {
  const parsed = parseSemver(version);
  if (!parsed) {
    throw new Error(`Invalid semver version: ${version}`);
  }

  if (type === 'major') {
    return formatSemver({ major: parsed.major + 1, minor: 0, patch: 0 });
  }
  if (type === 'minor') {
    return formatSemver({
      major: parsed.major,
      minor: parsed.minor + 1,
      patch: 0,
    });
  }
  if (type === 'patch') {
    return formatSemver({
      major: parsed.major,
      minor: parsed.minor,
      patch: parsed.patch + 1,
    });
  }

  throw new Error(`Unknown bump type: ${type}`);
}

function readAndroidVersion(gradleContents) {
  const nameMatch = gradleContents.match(/versionName\s+"([^"]+)"/);
  const codeMatch = gradleContents.match(/versionCode\s+(\d+)/);
  return {
    versionName: nameMatch?.[1] ?? null,
    versionCode: codeMatch ? Number(codeMatch[1]) : null,
  };
}

function applyAndroidVersion(gradleContents, versionName, versionCode) {
  let next = gradleContents;
  if (!/versionName\s+"[^"]+"/.test(next)) {
    throw new Error('Could not find versionName in android/app/build.gradle');
  }
  if (!/versionCode\s+\d+/.test(next)) {
    throw new Error('Could not find versionCode in android/app/build.gradle');
  }
  next = next.replace(/versionName\s+"[^"]+"/, `versionName "${versionName}"`);
  next = next.replace(/versionCode\s+\d+/, `versionCode ${versionCode}`);
  return next;
}

function readIosVersion(pbxprojContents) {
  const marketingMatch = pbxprojContents.match(/MARKETING_VERSION = ([^;]+);/);
  const buildMatch = pbxprojContents.match(
    /CURRENT_PROJECT_VERSION = ([^;]+);/,
  );
  return {
    marketingVersion: marketingMatch?.[1]?.trim() ?? null,
    currentProjectVersion: buildMatch ? Number(buildMatch[1]) : null,
  };
}

function applyIosVersion(
  pbxprojContents,
  marketingVersion,
  currentProjectVersion,
) {
  let next = pbxprojContents;
  if (!/MARKETING_VERSION = [^;]+;/.test(next)) {
    throw new Error('Could not find MARKETING_VERSION in iOS project');
  }
  if (!/CURRENT_PROJECT_VERSION = [^;]+;/.test(next)) {
    throw new Error('Could not find CURRENT_PROJECT_VERSION in iOS project');
  }
  next = next.replace(
    /MARKETING_VERSION = [^;]+;/g,
    `MARKETING_VERSION = ${marketingVersion};`,
  );
  next = next.replace(
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    `CURRENT_PROJECT_VERSION = ${currentProjectVersion};`,
  );
  return next;
}

function nextBuildNumber(...candidates) {
  const numbers = candidates
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);
  const current = numbers.length > 0 ? Math.max(...numbers) : 0;
  return current + 1;
}

module.exports = {
  parseSemver,
  formatSemver,
  bumpSemver,
  readAndroidVersion,
  applyAndroidVersion,
  readIosVersion,
  applyIosVersion,
  nextBuildNumber,
};
