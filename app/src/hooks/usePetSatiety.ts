import { useEffect, useState } from 'react';
import type { PetProfile } from '../types/nutrition';
import { getPetSatiety } from '../utils/petSatiety';

export function usePetSatiety(pet: PetProfile): number {
  const [, refresh] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => refresh((tick) => tick + 1), 60_000);
    return () => clearInterval(timer);
  }, []);
  return getPetSatiety(pet);
}
