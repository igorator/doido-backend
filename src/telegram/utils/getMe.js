export const getMe = async (client) => {
  try {
    const me = await client.invoke({
      _: 'getMe',
    });
    return me;
  } catch (error) {
    console.error('Error fetching user information:', error);
    throw error;
  }
};
