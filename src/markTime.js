import * as BN from './bigNum.js';
import { parseBigNum } from './suffixParser.js';

const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;
const SECONDS_IN_MONTH = 2592000; // 30 days
const SECONDS_IN_YEAR = 31536000;

export function computeMarkTime({ mps, rarity, clone, target, tier, progress }) {
  const mpsBN = parseBigNum(mps);
  const rarityBN = parseBigNum(rarity);
  const cloneBN = parseBigNum(clone);
  const targetBN = parseBigNum(target);

  if (isNaN(mpsBN.mantissa) || isNaN(rarityBN.mantissa) || isNaN(cloneBN.mantissa) || isNaN(targetBN.mantissa)) {
    return { seconds: BN.fromNumber(NaN), tiersCrossed: 0, finalMps: BN.fromNumber(NaN) };
  }

  const effTargetProcs = BN.ceil(BN.div(targetBN, cloneBN));

  if (tier === undefined || tier === null || tier === '' || tier < 0) {
    const seconds = BN.div(BN.mul(effTargetProcs, rarityBN), mpsBN);
    return { seconds, tiersCrossed: 0, finalMps: mpsBN };
  }

  const startTier = Math.floor(Number(tier));
  let curTier = startTier;
  let accumulatedOpens = progress ? BN.fromString(String(progress)) : BN.fromNumber(0);

  let bulkBoost = BN.fromNumber(1);
  let milestoneTarget = BN.mul(BN.fromString('10000'), BN.pow(BN.fromString('1.45'), curTier + 1));

  while (BN.cmp(accumulatedOpens, milestoneTarget) >= 0) {
    accumulatedOpens = BN.sub(accumulatedOpens, milestoneTarget);
    curTier++;
    bulkBoost = BN.mul(bulkBoost, BN.fromString('1.1'));
    milestoneTarget = BN.mul(milestoneTarget, BN.fromString('1.45'));
  }

  let remainingProcs = effTargetProcs;
  let totalTime = BN.fromNumber(0);

  while (BN.cmp(remainingProcs, BN.fromNumber(0)) > 0) {
    const opensToMilestone = BN.sub(milestoneTarget, accumulatedOpens);
    const opensThisStep = BN.cmp(remainingProcs, opensToMilestone) < 0 ? remainingProcs : opensToMilestone;

    const timeThisStep = BN.div(BN.mul(opensThisStep, rarityBN), BN.mul(mpsBN, bulkBoost));
    totalTime = BN.add(totalTime, timeThisStep);

    remainingProcs = BN.sub(remainingProcs, opensThisStep);
    accumulatedOpens = BN.add(accumulatedOpens, opensThisStep);

    if (BN.cmp(accumulatedOpens, milestoneTarget) >= 0) {
      accumulatedOpens = BN.fromNumber(0);
      curTier++;
      bulkBoost = BN.mul(bulkBoost, BN.fromString('1.1'));
      milestoneTarget = BN.mul(milestoneTarget, BN.fromString('1.45'));
    }
  }

  const tiersCrossed = curTier - startTier;
  return { seconds: totalTime, tiersCrossed, finalMps: BN.mul(mpsBN, BN.pow(BN.fromString('1.1'), tiersCrossed)) };
}

export function formatDuration(seconds) {
  if (Number.isNaN(seconds.mantissa)) return 'Time overflow';
  if (seconds.mantissa === 0) return 'Time overflow';

  if (BN.cmp(seconds, BN.fromNumber(1)) < 0) return 'Instant';

  if (BN.cmp(seconds, BN.fromNumber(SECONDS_IN_YEAR)) > 0) {
    const str = BN.toString(seconds);
    if (str === 'Infinity' || str === 'NaN') return 'Time overflow';
    return `Time longer than a year (${str} seconds)`;
  }

  const totalSec = BN.toNumber(seconds);
  if (!isFinite(totalSec)) return 'Time overflow';

  const months = Math.floor(totalSec / SECONDS_IN_MONTH);
  let rem = totalSec % SECONDS_IN_MONTH;
  const days = Math.floor(rem / SECONDS_IN_DAY);
  rem %= SECONDS_IN_DAY;
  const hours = Math.floor(rem / SECONDS_IN_HOUR);
  rem %= SECONDS_IN_HOUR;
  const minutes = Math.floor(rem / SECONDS_IN_MINUTE);
  const secs = Math.floor(rem % SECONDS_IN_MINUTE);

  const parts = [];
  if (months > 0) parts.push(`${months} months`);
  if (days > 0) parts.push(`${days} days`);
  if (hours > 0) parts.push(`${hours} hours`);
  if (minutes > 0) parts.push(`${minutes} minutes`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs} seconds`);

  return parts.join(', ');
}
