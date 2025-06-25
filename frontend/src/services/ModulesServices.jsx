export const fetchUserModules = async () => {
  const response = await api.get('/api/user/modules/');
  return response.data;
};