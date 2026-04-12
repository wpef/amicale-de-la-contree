import type { Bid } from './bid.js';
import type { TeamId } from './team.js';

export interface Contract {
  readonly bid: Bid;
  readonly team: TeamId;
  readonly contred: boolean;
  readonly surcontred: boolean;
}

export function contreMultiplier(contract: Contract): 1 | 2 | 4 {
  if (contract.surcontred) return 4;
  if (contract.contred) return 2;
  return 1;
}
