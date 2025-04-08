import { userRepository } from '../../database/repositories/userRepository';

export const addUser = async (req, res) => {
  try {
    const user = userRepository.create(req.body);
    const savedUser = await userRepository.save(user);
    res.status(201).json(savedUser);
  } catch (err) {
    res
      .status(500)
      .json({ message: 'Ошибка при создании подарка', error: err.message });
  }
};
