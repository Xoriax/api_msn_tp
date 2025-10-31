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
    const { id: groupId, groupId: paramGroupId } = req.params;
    const actualGroupId = groupId || paramGroupId;
    const { userId } = req.user;

    console.log('[DEBUG] checkGroupAdmin - GroupId:', actualGroupId);
    console.log('[DEBUG] checkGroupAdmin - UserId:', userId);

    const group = await GroupModel.findById(actualGroupId);
    if (!group) {
      console.log('[DEBUG] checkGroupAdmin - Group not found');
      return res.status(404).json({
        code: 404,
        message: 'Groupe non trouvé'
      });
    }

    console.log('[DEBUG] checkGroupAdmin - Group found:', group.name);
    console.log('[DEBUG] checkGroupAdmin - Administrators:', group.administrators);

    const isAdmin = group.administrators.some(
      (adminId) => adminId.toString() === userId.toString()
    );

    console.log('[DEBUG] checkGroupAdmin - Is admin?', isAdmin);

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
    const { id: eventId, eventId: paramEventId } = req.params;
    const actualEventId = eventId || paramEventId;
    const { userId } = req.user;

    console.log('[DEBUG] checkEventOrganizer - EventId:', actualEventId);
    console.log('[DEBUG] checkEventOrganizer - UserId from token:', userId);

    const event = await EventModel.findById(actualEventId);
    if (!event) {
      console.log('[DEBUG] checkEventOrganizer - Event not found');
      return res.status(404).json({
        code: 404,
        message: 'Événement non trouvé'
      });
    }

    console.log('[DEBUG] checkEventOrganizer - Event found:', event.name);
    console.log('[DEBUG] checkEventOrganizer - Event organizers:', event.organizers);

    const isOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    console.log('[DEBUG] checkEventOrganizer - Is organizer?', isOrganizer);

    if (!isOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls les organisateurs peuvent effectuer cette action',
        debug: {
          userId,
          organizers: event.organizers,
          eventId: actualEventId
        }
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

export const checkEventCreator = (EventModel) => async (req, res, next) => {
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

    const isCreator = event.organizers.length > 0
      && event.organizers[0].toString() === userId.toString();

    if (!isCreator) {
      return res.status(403).json({
        code: 403,
        message: 'Seul le créateur de l\'événement peut effectuer cette action'
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

export const checkGroupCreator = (GroupModel) => async (req, res, next) => {
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

    const isCreator = group.administrators.length > 0
      && group.administrators[0].toString() === userId.toString();

    if (!isCreator) {
      return res.status(403).json({
        code: 403,
        message: 'Seul le créateur du groupe peut effectuer cette action'
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

export const checkGroupMember = (GroupModel) => async (req, res, next) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.user;

    const group = await GroupModel.findById(groupId);
    if (!group) {
      return res.status(404).json({
        code: 404,
        message: 'Groupe non trouvé'
      });
    }

    const isMember = group.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );

    const isAdmin = group.administrators.some(
      (adminId) => adminId.toString() === userId.toString()
    );

    if (!isMember && !isAdmin) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls les membres du groupe peuvent accéder à cette ressource'
      });
    }

    req.group = group;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification de l\'appartenance au groupe',
      error: error.message
    });
  }
};

export const checkEventParticipant = (EventModel) => async (req, res, next) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.user;

    const event = await EventModel.findById(eventId);
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement non trouvé'
      });
    }

    const isParticipant = event.participants.some(
      (participantId) => participantId.toString() === userId.toString()
    );

    const isOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    if (!isParticipant && !isOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls les participants peuvent accéder à cette ressource'
      });
    }

    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification de la participation à l\'événement',
      error: error.message
    });
  }
};

export const checkDiscussionAccess = (
  DiscussionModel,
  GroupModel,
  EventModel
) => async (req, res, next) => {
  try {
    const { discussionId } = req.params;
    const { userId } = req.user;

    const discussion = await DiscussionModel.findById(discussionId);
    if (!discussion) {
      return res.status(404).json({
        code: 404,
        message: 'Discussion non trouvée'
      });
    }

    if (discussion.linked_to_group) {
      const group = await GroupModel.findById(discussion.linked_to_group);
      if (!group) {
        return res.status(404).json({
          code: 404,
          message: 'Groupe associé à la discussion non trouvé'
        });
      }

      const isMember = group.members.some(
        (memberId) => memberId.toString() === userId.toString()
      );

      const isAdmin = group.administrators.some(
        (adminId) => adminId.toString() === userId.toString()
      );

      if (!isMember && !isAdmin) {
        return res.status(403).json({
          code: 403,
          message: 'Seuls les membres du groupe peuvent accéder à cette discussion'
        });
      }

      req.group = group;
    }

    if (discussion.linked_to_event) {
      const event = await EventModel.findById(discussion.linked_to_event);
      if (!event) {
        return res.status(404).json({
          code: 404,
          message: 'Événement associé à la discussion non trouvé'
        });
      }

      const isParticipant = event.participants.some(
        (participantId) => participantId.toString() === userId.toString()
      );

      const isOrganizer = event.organizers.some(
        (organizerId) => organizerId.toString() === userId.toString()
      );

      if (!isParticipant && !isOrganizer) {
        return res.status(403).json({
          code: 403,
          message: 'Seuls les participants à l\'événement peuvent accéder à cette discussion'
        });
      }

      req.event = event;
    }

    req.discussion = discussion;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification de l\'accès à la discussion',
      error: error.message
    });
  }
};

export const checkPollCreator = (PollModel) => async (req, res, next) => {
  try {
    const { id: pollId } = req.params;
    const { userId } = req.user;

    const poll = await PollModel.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        code: 404,
        message: 'Sondage non trouvé'
      });
    }

    if (poll.createdBy.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: 'Seul le créateur du sondage peut effectuer cette action'
      });
    }

    req.poll = poll;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification du créateur du sondage',
      error: error.message
    });
  }
};

export const checkPollResultsAccess = (PollModel, EventModel) => async (req, res, next) => {
  try {
    const { id: pollId } = req.params;
    const { userId } = req.user;

    const poll = await PollModel.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        code: 404,
        message: 'Sondage non trouvé'
      });
    }

    if (poll.createdBy.toString() === userId.toString()) {
      req.poll = poll;
      return next();
    }

    const event = await EventModel.findById(poll.event_id);
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement associé au sondage non trouvé'
      });
    }

    const isEventOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    if (!isEventOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls le créateur du sondage ou les organisateurs de l\'événement peuvent accéder aux résultats'
      });
    }

    req.poll = poll;
    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification de l\'accès aux résultats',
      error: error.message
    });
  }
};

export const checkPollDeleteAccess = (PollModel, EventModel) => async (req, res, next) => {
  try {
    const { id: pollId } = req.params;
    const { userId } = req.user;

    const poll = await PollModel.findById(pollId);
    if (!poll) {
      return res.status(404).json({
        code: 404,
        message: 'Sondage non trouvé'
      });
    }

    if (poll.createdBy.toString() === userId.toString()) {
      req.poll = poll;
      return next();
    }

    const event = await EventModel.findById(poll.event_id);
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement associé au sondage non trouvé'
      });
    }

    const isEventOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    if (!isEventOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls le créateur du sondage ou les organisateurs de l\'événement peuvent supprimer ce sondage'
      });
    }

    req.poll = poll;
    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification des permissions de suppression',
      error: error.message
    });
  }
};

export const checkAlbumAccess = (AlbumModel, EventModel, GroupModel) => async (req, res, next) => {
  try {
    const { id: albumId, albumId: paramAlbumId } = req.params;
    const { userId } = req.user;
    const albumIdToUse = albumId || paramAlbumId;

    const album = await AlbumModel.findById(albumIdToUse);
    if (!album) {
      return res.status(404).json({
        code: 404,
        message: 'Album non trouvé'
      });
    }

    if (album.createdBy && album.createdBy.toString() === userId.toString()) {
      req.album = album;
      return next();
    }

    const event = await EventModel.findById(album.event_id).populate('groupId');
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement associé à l\'album non trouvé'
      });
    }

    const isParticipant = event.participants.some(
      (participantId) => participantId.toString() === userId.toString()
    );

    const isOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    let isGroupAdmin = false;
    if (event.groupId && GroupModel) {
      const group = await GroupModel.findById(event.groupId);
      if (group) {
        isGroupAdmin = group.administrators.some(
          (adminId) => adminId.toString() === userId.toString()
        );
      }
    }

    if (!isParticipant && !isOrganizer && !isGroupAdmin) {
      return res.status(403).json({
        code: 403,
        message: 'Vous devez être participant, organisateur, créateur de l\'album ou administrateur du groupe pour accéder à cet album'
      });
    }

    req.album = album;
    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification de l\'accès à l\'album',
      error: error.message
    });
  }
};

export const checkAlbumManageAccess = (AlbumModel, EventModel) => async (req, res, next) => {
  try {
    const { id: albumId } = req.params;
    const { userId } = req.user;

    const album = await AlbumModel.findById(albumId);
    if (!album) {
      return res.status(404).json({
        code: 404,
        message: 'Album non trouvé'
      });
    }

    if (album.createdBy && album.createdBy.toString() === userId.toString()) {
      req.album = album;
      return next();
    }

    const event = await EventModel.findById(album.event_id);
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement associé à l\'album non trouvé'
      });
    }

    const isEventOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    if (!isEventOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls le créateur de l\'album ou les organisateurs de l\'événement peuvent effectuer cette action'
      });
    }

    req.album = album;
    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification des permissions sur l\'album',
      error: error.message
    });
  }
};

export const checkPhotoUploader = (PhotoModel) => async (req, res, next) => {
  try {
    const { id: photoId } = req.params;
    const { userId } = req.user;

    const photo = await PhotoModel.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        code: 404,
        message: 'Photo non trouvée'
      });
    }

    if (photo.uploadedBy.toString() !== userId.toString()) {
      return res.status(403).json({
        code: 403,
        message: 'Seul celui qui a uploadé la photo peut effectuer cette action'
      });
    }

    req.photo = photo;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification du créateur de la photo',
      error: error.message
    });
  }
};

export const checkPhotoAccess = (
  PhotoModel,
  AlbumModel,
  EventModel,
  GroupModel
) => async (req, res, next) => {
  try {
    const { id: photoId } = req.params;
    const { userId } = req.user;

    const photo = await PhotoModel.findById(photoId);
    if (!photo) {
      return res.status(404).json({
        code: 404,
        message: 'Photo non trouvée'
      });
    }

    if (photo.uploadedBy && photo.uploadedBy.toString() === userId.toString()) {
      req.photo = photo;
      return next();
    }

    const album = await AlbumModel.findById(photo.album_id);
    if (!album) {
      return res.status(404).json({
        code: 404,
        message: 'Album associé à la photo non trouvé'
      });
    }

    // Vérifier si l'utilisateur est le créateur de l'album
    if (album.createdBy && album.createdBy.toString() === userId.toString()) {
      req.photo = photo;
      req.album = album;
      return next();
    }

    const event = await EventModel.findById(album.event_id).populate('groupId');
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement associé à la photo non trouvé'
      });
    }

    // Vérifier les permissions (participant, organisateur, ou admin de groupe)
    const isParticipant = event.participants.some(
      (participantId) => participantId.toString() === userId.toString()
    );

    const isOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    let isGroupAdmin = false;
    if (event.groupId && GroupModel) {
      const group = await GroupModel.findById(event.groupId);
      if (group) {
        isGroupAdmin = group.administrators.some(
          (adminId) => adminId.toString() === userId.toString()
        );
      }
    }

    if (!isParticipant && !isOrganizer && !isGroupAdmin) {
      return res.status(403).json({
        code: 403,
        message: 'Vous devez être participant, organisateur, créateur de la photo/album ou administrateur du groupe pour accéder à cette photo'
      });
    }

    req.photo = photo;
    req.album = album;
    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification de l\'accès à la photo',
      error: error.message
    });
  }
};

export const checkTicketOwner = (TicketModel) => async (req, res, next) => {
  try {
    const { ticketNumber } = req.params;

    const ticket = await TicketModel.findOne({ ticket_number: ticketNumber });
    if (!ticket) {
      return res.status(404).json({
        code: 404,
        message: 'Billet non trouvé'
      });
    }

    const { user } = req;
    if (ticket.buyerInfo.email !== user.email) {
      return res.status(403).json({
        code: 403,
        message: 'Seul l\'acheteur du billet peut effectuer cette action'
      });
    }

    req.ticket = ticket;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification du propriétaire du billet',
      error: error.message
    });
  }
};

export const checkTicketTypeManageAccess = (
  TicketTypeModel,
  EventModel
) => async (req, res, next) => {
  try {
    const { id: ticketTypeId } = req.params;
    const { userId } = req.user;

    const ticketType = await TicketTypeModel.findById(ticketTypeId);
    if (!ticketType) {
      return res.status(404).json({
        code: 404,
        message: 'Type de billet non trouvé'
      });
    }

    const event = await EventModel.findById(ticketType.event_id);
    if (!event) {
      return res.status(404).json({
        code: 404,
        message: 'Événement associé au type de billet non trouvé'
      });
    }

    const isEventOrganizer = event.organizers.some(
      (organizerId) => organizerId.toString() === userId.toString()
    );

    if (!isEventOrganizer) {
      return res.status(403).json({
        code: 403,
        message: 'Seuls les organisateurs de l\'événement peuvent gérer les types de billets'
      });
    }

    req.ticketType = ticketType;
    req.event = event;
    return next();
  } catch (error) {
    return res.status(500).json({
      code: 500,
      message: 'Erreur lors de la vérification des permissions sur le type de billet',
      error: error.message
    });
  }
};
