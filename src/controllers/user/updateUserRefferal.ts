import type { Request, Response } from 'express';
import { userRepository } from '../../database/repositories/userRepository';

export const updateUserReferral = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const userId = req.params.id;
  const { referred_by } = req.body;

  if (!userId || !referred_by) {
    res.status(400).json({ error: 'Missing userId or referred_by' });
    return;
  }

  const telegramUserId = String((req as any).telegramUser?.id);
  if (userId !== telegramUserId) {
    res.status(403).json({ error: 'Forbidden: user ID mismatch' });
    return;
  }

  if (userId === referred_by) {
    console.log(`[${new Date().toISOString()}] ⛔️ Самореферал — отклонено`);
    res.status(200).json({ skipped: true });
    return;
  }

  // Находим только ID реферала (без лишних relations)
  const referrer = await userRepository.findOne({
    where: { id: referred_by },
    relations: ['referred_by'],
  });

  if (!referrer) {
    console.log(
      `[${new Date().toISOString()}] ❌ Реферер не найден (${referred_by})`,
    );
    res.status(404).json({ error: 'Referrer not found' });
    return;
  }

  // Запрещаем взаимную рефералку
  if (referrer.referred_by?.id === userId) {
    console.log(
      `[${new Date().toISOString()}] 🔄 Взаимная рефералка (${userId} ↔ ${referred_by}) — отклонено`,
    );
    res.status(200).json({ skipped: true });
    return;
  }

  // Пробуем обновить, если у пользователя еще нет реферала
  const result = await userRepository
    .createQueryBuilder()
    .update()
    .set({ referred_by: referred_by })
    .where('id = :userId', { userId })
    .andWhere('referred_by IS NULL')
    .execute();

  if (result.affected === 0) {
    const user = await userRepository.findOne({
      where: { id: userId },
      relations: ['referred_by'],
    });

    if (!user) {
      console.log(`[${new Date().toISOString()}] 🚫 Пользователь не найден`);
      res.status(500).json({ error: 'User not found' });
      return;
    }

    console.log(
      `[${new Date().toISOString()}] ⚠️ У пользователя уже есть реферер (${
        user.referred_by?.id
      })`,
    );
    res.status(200).json({ skipped: true });
    return;
  }

  // Возвращаем полные данные пользователя
  const fullUser = await userRepository.findOne({
    where: { id: userId },
    relations: ['referred_by', 'referred_users'],
  });

  if (!fullUser) {
    console.log(
      `[${new Date().toISOString()}] 🚫 Пользователь не найден после обновления`,
    );
    res.status(500).json({ error: 'User not found after referral update' });
    return;
  }

  console.log(
    `[${new Date().toISOString()}] ✅ Рефералка успешно обновлена: ${userId} → ${referred_by}`,
  );
  res.status(200).json(fullUser);
};
