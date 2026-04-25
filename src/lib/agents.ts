import { Agent } from './types';

const COLORS = [
  '#4F46E5', '#7C3AED', '#DB2777', '#DC2626', '#D97706',
  '#059669', '#0891B2', '#2563EB', '#7C3AED', '#BE185D',
  '#065F46', '#1D4ED8', '#9333EA', '#C2410C', '#0F766E',
  '#6D28D9', '#1E40AF',
];

export const AGENTS: Agent[] = [
  { id: '1',  name: 'Ahmed AMasha',              firstName: 'Ahmed',      lastName: 'AMasha',          role: 'Agent', initials: 'AA', color: COLORS[0] },
  { id: '2',  name: 'Gonzalez Alejandro Munoz',  firstName: 'Alejandro',  lastName: 'Gonzalez Munoz',  role: 'Agent', initials: 'AM', color: COLORS[1] },
  { id: '3',  name: 'Brahim Hamimoum',           firstName: 'Brahim',     lastName: 'Hamimoum',        role: 'Agent', initials: 'BH', color: COLORS[2] },
  { id: '4',  name: 'Constance Fode',            firstName: 'Constance',  lastName: 'Fode',            role: 'Agent', initials: 'CF', color: COLORS[3] },
  { id: '5',  name: 'Damien Marie',              firstName: 'Damien',     lastName: 'Marie',           role: 'Agent', initials: 'DM', color: COLORS[4] },
  { id: '6',  name: 'Edgar Castro Zambrano',     firstName: 'Edgar',      lastName: 'Castro Zambrano', role: 'Agent', initials: 'EC', color: COLORS[5] },
  { id: '7',  name: 'Francis Poirier',           firstName: 'Francis',    lastName: 'Poirier',         role: 'Agent', initials: 'FP', color: COLORS[6] },
  { id: '8',  name: 'Gabriel April',             firstName: 'Gabriel',    lastName: 'April',           role: 'Agent', initials: 'GA', color: COLORS[7] },
  { id: '9',  name: 'Hassan Chamkmaki',          firstName: 'Hassan',     lastName: 'Chamkmaki',       role: 'Agent', initials: 'HC', color: COLORS[8] },
  { id: '10', name: 'Kamel Belblidi',            firstName: 'Kamel',      lastName: 'Belblidi',        role: 'Agent', initials: 'KB', color: COLORS[9] },
  { id: '11', name: 'Paradowski Kelly',          firstName: 'Kelly',      lastName: 'Paradowski',      role: 'Agent', initials: 'KP', color: COLORS[10] },
  { id: '12', name: 'Martha Jimenez',            firstName: 'Martha',     lastName: 'Jimenez',         role: 'Agent', initials: 'MJ', color: COLORS[11] },
  { id: '13', name: 'Sarim Ramos',               firstName: 'Sarim',      lastName: 'Ramos',           role: 'Agent', initials: 'SR', color: COLORS[12] },
  { id: '14', name: 'Sepideh Amiri',             firstName: 'Sepideh',    lastName: 'Amiri',           role: 'Agent', initials: 'SA', color: COLORS[13] },
  { id: '15', name: 'Thomas Houdebert',          firstName: 'Thomas',     lastName: 'Houdebert',       role: 'Agent', initials: 'TH', color: COLORS[14] },
  { id: '16', name: 'Vincent Rancourt',          firstName: 'Vincent',    lastName: 'Rancourt',        role: 'Agent', initials: 'VR', color: COLORS[15] },
  { id: '17', name: 'Vitalie Mihaila',           firstName: 'Vitalie',    lastName: 'Mihaila',         role: 'Agent', initials: 'VM', color: COLORS[16] },
];
