import { Router, Request, Response, NextFunction } from 'express';

const router = Router();

router.get('/get-user', (req: Request, res: Response) => {
  console.log(req.user);
  res.json({ user: req.user || null });
});

router.post('/get-user-by-slug', async (req: Request, res: Response, next: NextFunction) => {
  console.log('Express route: /get-user-by-slug');
  try {
    const { slug } = req.body;

    // Replace with actual user-fetching logic.
    const user = await User.getUserBySlug({ slug });

    res.json({ user });
  } catch (err) {
    next(err); // Pass the error to the next middleware (error handler).
  }
});

router.get('/invitations/get-team-by-token', async (req: Request, res: Response, next: NextFunction) => {
  const token = req.query.token as string;
  try {
    // Replace with actual token-to-team logic.
    const team = await Invitation.getTeamByToken({ token });

    res.json({ team });
  } catch (err) {
    next(err); // Pass the error to the next middleware (error handler).
  }
});

export default router;
