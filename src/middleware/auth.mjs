import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this-in-production';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Token d\'accès requis'
    });
  }

  return jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        code: 403,
        message: 'Token invalide'
      });
    }

    req.user = user;
    return next();
  });
};

export const generateToken = (userId) => jwt.sign({ userId }, JWT_SECRET, { expiresIn: '24h' });

export const checkGroupAdmin = (GroupModel) => async (req, res, next) => {
  try {
    const { id: groupId } = req.params;
    const { userId } = req.user;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({
        code: 404,
        message: 'Groupe non trouvé'
      });
    }

    const isAdmin = group.administrators.some(
      (adminId) => adminId.toString() === userId.toString()
    );

    if (!isAdmin) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls les administrateurs du groupe peuvent effectuer cette action'
      });
    }

    req.group = group;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification des permissions',
      error: error.message
    });
  }
};

export const checkEventOrganizer = (EventModel) => async (req, res, next) => {
  try {
    const { id: eventId } = req.params;
    const { userId } = req.user;

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement non trouvé'
      });
    }

    const isOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    if (!isOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls les organisateurs peuvent effectuer cette action'
      });
    }

    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification des permissions',
      error: error.message
    });
  }
};
