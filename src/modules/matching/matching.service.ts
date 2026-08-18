import { Journey } from '../journeys/journey.model';
import { IPackage } from '../packages/package.model';
import { TravelerProfile } from '../users/traveler.model';
import { Match, IMatch } from './match.model';

// Haversine distance in km
export const calculateDistance = (coord1: [number, number], coord2: [number, number]): number => {
  const [lon1, lat1] = coord1;
  const [lon2, lat2] = coord2;
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const findMatchesForPackage = async (pkg: IPackage): Promise<IMatch[]> => {
  // Find all active traveler journeys
  const journeys = await Journey.find({
    status: 'CREATED',
    departureTime: { $gte: new Date() }, // Active future journeys
  });

  const matches: IMatch[] = [];

  for (const journey of journeys) {
    // 1. Capacity check
    if (journey.availableCapacity < pkg.weight) {
      continue;
    }

    // 2. Trust profile fetch
    const travelerProfile = await TravelerProfile.findOne({ user: journey.user });
    const trustScore = travelerProfile ? travelerProfile.trustScore : 50;

    // 3. Proximity and detour calculations
    const dOrigin = calculateDistance(journey.origin.coordinates, pkg.pickupLocation.coordinates);
    const dDest = calculateDistance(journey.destination.coordinates, pkg.destination.coordinates);
    const directDist = calculateDistance(journey.origin.coordinates, journey.destination.coordinates);

    // Path: Journey Origin -> Package Pickup -> Package Destination -> Journey Destination
    const detourPathDist =
      dOrigin +
      calculateDistance(pkg.pickupLocation.coordinates, pkg.destination.coordinates) +
      dDest;

    let detour = detourPathDist - directDist;
    if (detour < 0) detour = 0; // Floating point protection

    // 4. Scoring Components (Out of 100)
    // - Route compatibility (Detour): Max 50 points. Penalty of -2.5 per km detour.
    const detourScore = Math.max(0, 50 - detour * 2.5);

    // - Origin proximity: Max 15 points. Penalty of -1.5 per km distance.
    const originScore = Math.max(0, 15 - dOrigin * 1.5);

    // - Destination proximity: Max 15 points. Penalty of -1.5 per km distance.
    const destScore = Math.max(0, 15 - dDest * 1.5);

    // - Traveler trust score: Max 20 points. Scaled directly from trustScore (0-100)
    const trustScoreComponent = (trustScore / 100) * 20;

    // - Departure time compatibility check (Bonus/Penalty)
    // Note: Journey departure should be close to package creation or desired pickup.
    const timeDiffHrs = Math.abs(journey.departureTime.getTime() - pkg.createdAt.getTime()) / (1000 * 60 * 60);
    // If departure is within 24 hours, it is fully compatible. Penalty if > 24 hours.
    const timePenalty = timeDiffHrs > 24 ? Math.max(-10, -(timeDiffHrs - 24) * 0.5) : 0;

    const totalScore = Math.min(
      100,
      Math.max(0, detourScore + originScore + destScore + trustScoreComponent + timePenalty)
    );

    // Filter out matches that are extremely incompatible (e.g. score < 10 or detour > 50km)
    if (totalScore < 10 || detour > 50) {
      continue;
    }

    // Save or upsert the Match record
    const match = await Match.findOneAndUpdate(
      { package: pkg._id, journey: journey._id },
      {
        package: pkg._id,
        journey: journey._id,
        matchScore: parseFloat(totalScore.toFixed(2)),
        estimatedDetour: parseFloat(detour.toFixed(2)),
        status: 'PENDING',
      },
      { upsert: true, new: true }
    );

    matches.push(match);
  }

  // Sort matches by score descending
  return matches.sort((a, b) => b.matchScore - a.matchScore);
};
