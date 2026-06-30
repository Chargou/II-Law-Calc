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
  let totalOpens = progress ? BN.fromString(String(progress)) : BN.fromNumber(0);
  let bulkBoost = BN.fromNumber(1);
  let milestoneThresh = BN.mul(BN.fromString('10000'), BN.pow(BN.fromString('1.45'), curTier));

  while (BN.cmp(totalOpens, milestoneThresh) >= 0) {
    curTier++;
    bulkBoost = BN.mul(bulkBoost, BN.fromString('1.1'));
    milestoneThresh = BN.mul(milestoneThresh, BN.fromString('1.45'));
  }

  let opensToNext = BN.sub(milestoneThresh, totalOpens);
  let remainingProcs = effTargetProcs;
  let totalTime = BN.fromNumber(0);

  while (BN.cmp(remainingProcs, BN.fromNumber(0)) > 0) {
    const effectiveMPS = BN.mul(mpsBN, bulkBoost);
    const timeToTarget = BN.div(BN.mul(remainingProcs, rarityBN), effectiveMPS);
    const timeToMilestone = BN.div(opensToNext, effectiveMPS);

    if (BN.cmp(timeToTarget, timeToMilestone) < 0) {
      totalTime = BN.add(totalTime, timeToTarget);
      break;
    }

    const procsInMilestone = BN.div(opensToNext, rarityBN);
    const procsNum = BN.toNumber(procsInMilestone);

    if (isFinite(procsNum) && procsNum < 1) {
      const needed = BN.mul(BN.fromString('0.45'), BN.mul(rarityBN, remainingProcs));
      const targetRatio = BN.div(needed, opensToNext);
      const logTarget = BN.log10(BN.add(targetRatio, BN.fromNumber(1)));
      const n = Math.max(1, Math.ceil(logTarget / Math.log10(1.45)));

      if (isFinite(n) && n > 0) {
        const r = BN.div(BN.fromString('1.45'), BN.fromString('1.1'));
        const firstTerm = BN.div(opensToNext, effectiveMPS);

        const rnMinus1 = BN.pow(r, n - 1);
        const cumTimeNMinus1 = BN.mul(firstTerm, BN.div(BN.sub(rnMinus1, BN.fromNumber(1)), BN.sub(r, BN.fromNumber(1))));

        const cumOpensNMinus1 = BN.add(opensToNext, BN.mul(milestoneThresh, BN.sub(BN.pow(BN.fromString('1.45'), n - 1), BN.fromNumber(1))));
        const cumProcsNMinus1 = BN.div(cumOpensNMinus1, rarityBN);
        const remainingAfterNMinus1 = BN.sub(remainingProcs, cumProcsNMinus1);

        const mpsAtNMinus1 = BN.mul(mpsBN, BN.mul(bulkBoost, BN.pow(BN.fromString('1.1'), n - 1)));
        const finalTime = BN.div(BN.mul(remainingAfterNMinus1, rarityBN), mpsAtNMinus1);

        totalTime = BN.add(totalTime, BN.add(cumTimeNMinus1, finalTime));
        curTier += n - 1;
        bulkBoost = BN.mul(bulkBoost, BN.pow(BN.fromString('1.1'), n - 1));
        remainingProcs = BN.fromNumber(0);
        continue;
      }
    }

    totalTime = BN.add(totalTime, timeToMilestone);
    remainingProcs = BN.sub(remainingProcs, procsInMilestone);

    totalOpens = BN.add(totalOpens, opensToNext);
    curTier++;
    bulkBoost = BN.mul(bulkBoost, BN.fromString('1.1'));
    milestoneThresh = BN.mul(milestoneThresh, BN.fromString('1.45'));
    opensToNext = BN.sub(milestoneThresh, totalOpens);
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
