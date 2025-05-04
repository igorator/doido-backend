let businessConnectionId: string | null = null;

export const setBusinessConnectionId = (id: string) => {
  console.log('💾 Business Connection ID установлен:', id);
  businessConnectionId = id;
};

export const getBusinessConnectionId = (): string => {
  if (!businessConnectionId) {
    throw new Error('❌ Business Connection ID не установлен');
  }
  return businessConnectionId;
};

export const hasBusinessConnectionId = (): boolean => {
  return businessConnectionId !== null;
};
