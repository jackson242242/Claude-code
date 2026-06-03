export type GroupId =
  | 'A'
  | 'B'
  | 'C'
  | 'D'
  | 'E'
  | 'F'
  | 'G'
  | 'H'
  | 'I'
  | 'J'
  | 'K'
  | 'L';

export type Confederation =
  | 'AFC'
  | 'CAF'
  | 'CONCACAF'
  | 'CONMEBOL'
  | 'OFC'
  | 'UEFA';

export interface Team {
  id: string;
  name: string;
  group: GroupId;
  confederation: Confederation;
}
