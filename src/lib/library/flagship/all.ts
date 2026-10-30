// Every flagship course. Add new courses here.
import type { FlagshipCourse } from './types.ts';
import { SCRATCH_3_5_BEGINNER } from './scratch-3-5/index.ts';
import { SCRATCH_3_5_INTERMEDIATE } from './scratch-3-5-int/index.ts';
import { SCRATCH_3_5_ADVANCED } from './scratch-3-5-adv/index.ts';
import { SCRATCH_6_8_BEGINNER } from './scratch-6-8/index.ts';
import { SCRATCH_6_8_INTERMEDIATE } from './scratch-6-8-int/index.ts';
import { SCRATCH_6_8_ADVANCED } from './scratch-6-8-adv/index.ts';
import { SCRATCHJR_BEGINNER } from './scratchjr/index.ts';
import { SCRATCHJR_INTERMEDIATE } from './scratchjr-int/index.ts';
import { SCRATCHJR_ADVANCED } from './scratchjr-adv/index.ts';

export const FLAGSHIPS: FlagshipCourse[] = [SCRATCH_3_5_BEGINNER, SCRATCH_3_5_INTERMEDIATE, SCRATCH_3_5_ADVANCED, SCRATCH_6_8_BEGINNER, SCRATCH_6_8_INTERMEDIATE, SCRATCH_6_8_ADVANCED, SCRATCHJR_BEGINNER, SCRATCHJR_INTERMEDIATE, SCRATCHJR_ADVANCED];
