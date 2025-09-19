export interface Avatar {
  id: string;
  name: string;
  gender: 'male' | 'female';
  icon: string; // Emoji or icon identifier
  description: string;
}

export const AVAILABLE_AVATARS: Avatar[] = [
  // Masculinos - Administrativos
  {
    id: 'admin-male-1',
    name: 'Executivo',
    gender: 'male',
    icon: '👨‍💼',
    description: 'Executivo masculino profissional'
  },
  {
    id: 'admin-male-2', 
    name: 'Gerente',
    gender: 'male',
    icon: '🧑‍💼',
    description: 'Gerente masculino'
  },
  {
    id: 'admin-male-3',
    name: 'Supervisor',
    gender: 'male',
    icon: '👔',
    description: 'Supervisor masculino'
  },
  {
    id: 'admin-male-4',
    name: 'Diretor',
    gender: 'male',
    icon: '🤵',
    description: 'Diretor masculino'
  },
  {
    id: 'admin-male-5',
    name: 'Analista',
    gender: 'male',
    icon: '👨‍💻',
    description: 'Analista masculino'
  },
  {
    id: 'admin-male-6',
    name: 'Coordenador',
    gender: 'male',
    icon: '🧔‍♂️',
    description: 'Coordenador masculino'
  },

  // Femininos - Administrativos
  {
    id: 'admin-female-1',
    name: 'Executiva',
    gender: 'female',
    icon: '👩‍💼',
    description: 'Executiva feminina profissional'
  },
  {
    id: 'admin-female-2',
    name: 'Gerente',
    gender: 'female',
    icon: '🧑‍💼',
    description: 'Gerente feminina'
  },
  {
    id: 'admin-female-3',
    name: 'Supervisora',
    gender: 'female',
    icon: '👩‍💻',
    description: 'Supervisora feminina'
  },
  {
    id: 'admin-female-4',
    name: 'Diretora',
    gender: 'female',
    icon: '👸',
    description: 'Diretora feminina'
  },
  {
    id: 'admin-female-5',
    name: 'Analista',
    gender: 'female',
    icon: '👩‍🔬',
    description: 'Analista feminina'
  },
  {
    id: 'admin-female-6',
    name: 'Coordenadora',
    gender: 'female',
    icon: '👩‍🎓',
    description: 'Coordenadora feminina'
  }
];

// Helper functions
export const getAvatarById = (id: string): Avatar | undefined => {
  return AVAILABLE_AVATARS.find(avatar => avatar.id === id);
};

export const getAvatarsByGender = (gender: 'male' | 'female'): Avatar[] => {
  return AVAILABLE_AVATARS.filter(avatar => avatar.gender === gender);
};

export const getDefaultAvatar = (): Avatar => {
  return AVAILABLE_AVATARS[0]; // Default to first male executive
};

export const getAvatarIcon = (avatarId?: string): string => {
  if (!avatarId) return getDefaultAvatar().icon;
  const avatar = getAvatarById(avatarId);
  return avatar ? avatar.icon : getDefaultAvatar().icon;
};