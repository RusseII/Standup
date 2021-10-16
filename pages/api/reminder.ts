import { VercelRequest, VercelResponse } from '@vercel/node';
import { connectToDatabase } from './lib/_connectToDatabase';
import { sendMsg } from './lib/_helpers';
import { Member } from './lib/_types';
import { NOT_SUBMITTED_MESSAGE, SUBMITTED_MESSAGE } from './lib/_locale.en';

module.exports = async (req: VercelRequest, res: VercelResponse) => {
  if (
    process.env.NODE_ENV === 'production' &&
    req.query.key !== process.env.TELEGRAM_API_KEY
  ) {
    return res.status(401).json({ status: 'invalid api key' });
  }

  const { db } = await connectToDatabase();
  const users = await db.collection('users').find({}).toArray();

  const reminders = [];
  users
    .filter((g) => !!g.groups.length)
    .forEach((user: Member) => {
      const message = user.submitted
        ? SUBMITTED_MESSAGE
        : NOT_SUBMITTED_MESSAGE;

      reminders.push(sendMsg(message, user.userId));
    });

  await Promise.all(reminders);

  return res.status(200).json({ status: 'ok', sendCount: reminders.length });
};
