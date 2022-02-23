import semver from 'semver';
import packageLock from '../package-lock.json' assert {type: 'json'};
import package from '../package.json' assert {type: 'json'};

const typedocVersionStr = packageLock.default.dependencies.typedoc.version;
const selfVersionStr = package.default.version;

const typedocVersion = semver.parse(typedocVersionStr);
const selfVersion = semver.parse(selfVersionStr);
if(semver.gt(`${typedocVersion.major}.${typedocVersion.minor}.0`,`${selfVersion.major}.${selfVersion.minor}.0`)){
    console.log(`${typedocVersion.major}.${typedocVersion.minor}.0`);
} else {
    console.log(selfVersion.inc('patch').format())
}