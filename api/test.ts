import { NextApiRequest, NextApiResponse } from '@vercel/node';

export default (req: NextApiRequest, res: NextApiResponse) => {
  res.status(200).send('Hello from test API');
};
