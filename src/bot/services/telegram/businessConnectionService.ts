const connectionMap = new Map<string, string>();

export const businessConnectionService = {
  get(userId: string): string | undefined {
    return connectionMap.get(userId);
  },

  set(userId: string, connectionId: string): void {
    connectionMap.set(userId, connectionId);
  },

  remove(userId: string): void {
    connectionMap.delete(userId);
  },

  has(userId: string): boolean {
    return connectionMap.has(userId);
  },
};
