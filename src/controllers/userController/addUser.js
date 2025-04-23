import { userRepository } from '../../database/repositories/userRepository';

export const addUser = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      id: String(req.body.id),
    };

    const user = userRepository.create(payload);
    const savedUser = await userRepository.save(user);

    res.status(201).json(savedUser);
  } catch (err) {
    res
      .status(500)
      .json({
        message: 'Ошибка при создании пользователя',
        error: err.message,
      });
  }
};
