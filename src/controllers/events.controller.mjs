import mongoose from 'mongoose';
import EventSchema from '../models/event.mjs';
import GroupSchema from '../models/group.mjs';
import {
  authenticateToken, checkEventOrganizer, checkEventCreator, checkGroupAdmin
} from '../middleware/auth.mjs';

export default class Events {
  constructor(app, connect) {
    this.app = app;
    this.EventModel = connect.model('Event', EventSchema);
    this.GroupModel = connect.model('Group', GroupSchema);

    this.run();
  }

  getPublicEvents() {
    this.app.get('/events/public', async (req, res) => {
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const events = await this.EventModel
          .find({ is_public: true })
          .populate('organizers', 'firstname lastname email')
          .populate('participants', 'firstname lastname email')
          .populate('groupId', 'name type')
          .sort({ startDate: 1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.EventModel.countDocuments({ is_public: true });

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: events,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération des événements publics',
          error: error.message
        });
      }
    });
  }

  getEventById() {
    this.app.get('/events/:id', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const event = await this.EventModel
          .findById(id)
          .populate('organizers', 'firstname lastname email')
          .populate('participants', 'firstname lastname email')
          .populate('groupId', 'name type')
          .populate('albums')
          .populate('polls');

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Événement non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: event
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération de l\'événement',
          error: error.message
        });
      }
    });
  }

  createEvent() {
    this.app.post('/events', authenticateToken, async (req, res) => {
      try {
        const {
          name,
          description,
          startDate,
          endDate,
          location,
          coverPhoto,
          isPrivate = false,
          organizers,
          groupId,
          currentUserId
        } = req.body;

        if (!name || !description || !startDate || !endDate
            || !location || !organizers || organizers.length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'Tous les champs obligatoires doivent être renseignés'
          });
        }

        if (groupId) {
          if (!mongoose.Types.ObjectId.isValid(groupId)) {
            return res.status(400).json({
              code: 400,
              message: 'ID de groupe invalide'
            });
          }

          if (!currentUserId) {
            return res.status(400).json({
              code: 400,
              message: 'L\'ID de l\'utilisateur est requis pour créer un événement dans un groupe'
            });
          }

          const group = await this.GroupModel.findById(groupId);
          if (!group) {
            return res.status(404).json({
              code: 404,
              message: 'Groupe non trouvé'
            });
          }

          const isGroupAdmin = group.administrators.some(
            (adminId) => adminId.toString() === currentUserId.toString()
          );

          if (!isGroupAdmin) {
            return res.status(403).json({
              code: 403,
              message: 'Seuls les administrateurs du groupe peuvent créer des événements dans ce groupe'
            });
          }

          if (!group.allowMemberEvents && !isGroupAdmin) {
            return res.status(403).json({
              code: 403,
              message: 'Ce groupe n\'autorise pas la création d\'événements par les membres'
            });
          }
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (parsedStartDate >= parsedEndDate) {
          return res.status(400).json({
            code: 400,
            message: 'La date de fin doit être postérieure à la date de début'
          });
        }

        const eventData = {
          name,
          description,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          location,
          coverPhoto,
          isPrivate,
          is_public: !isPrivate,
          organizers,
          groupId
        };

        const event = new this.EventModel(eventData);
        const savedEvent = await event.save();

        return res.status(201).json({
          code: 201,
          message: 'Événement créé avec succès',
          data: savedEvent
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la création de l\'événement',
          error: error.message
        });
      }
    });
  }

  updateEvent() {
    this.app.put('/events/:id', authenticateToken, checkEventOrganizer(this.EventModel), async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const updateData = { ...req.body, updated_at: new Date() };

        if (updateData.startDate && updateData.endDate) {
          const startDate = new Date(updateData.startDate);
          const endDate = new Date(updateData.endDate);

          if (startDate >= endDate) {
            return res.status(400).json({
              code: 400,
              message: 'La date de fin doit être postérieure à la date de début'
            });
          }
        }

        const event = await this.EventModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Événement non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Événement mis à jour avec succès',
          data: event
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la mise à jour de l\'événement',
          error: error.message
        });
      }
    });
  }

  deleteEvent() {
    this.app.delete('/events/:id', authenticateToken, checkEventCreator(this.EventModel), async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const event = await this.EventModel.findByIdAndDelete(id);

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Événement non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Événement supprimé avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la suppression de l\'événement',
          error: error.message
        });
      }
    });
  }

  joinEvent() {
    this.app.post('/events/:id/join', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const event = await this.EventModel.findById(id).populate('groupId');

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Événement non trouvé'
          });
        }

        if (event.groupId) {
          const group = await this.GroupModel.findById(event.groupId);

          if (!group) {
            return res.status(404).json({
              code: 404,
              message: 'Groupe associé non trouvé'
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
              message: 'Vous devez être membre du groupe pour rejoindre cet événement'
            });
          }
        }

        if (event.participants.includes(userId)) {
          return res.status(400).json({
            code: 400,
            message: 'Vous participez déjà à cet événement'
          });
        }

        event.participants.push(userId);
        await event.save();

        return res.status(200).json({
          code: 200,
          message: 'Participation ajoutée avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la participation à l\'événement',
          error: error.message
        });
      }
    });
  }

  leaveEvent() {
    this.app.post('/events/:id/leave', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const event = await this.EventModel.findById(id);

        if (!event) {
          return res.status(404).json({
            code: 404,
            message: 'Événement non trouvé'
          });
        }

        const isParticipant = event.participants.some(
          (participantId) => participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
          return res.status(400).json({
            code: 400,
            message: 'Vous ne participez pas à cet événement'
          });
        }

        event.participants = event.participants.filter(
          (participantId) => participantId.toString() !== userId
        );

        await event.save();

        return res.status(200).json({
          code: 200,
          message: 'Participation retirée avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors du retrait de la participation',
          error: error.message
        });
      }
    });
  }

  createGroupEvent() {
    this.app.post('/groups/:groupId/events', authenticateToken, checkGroupAdmin, async (req, res) => {
      try {
        const { groupId } = req.params;
        const {
          name,
          description,
          startDate,
          endDate,
          location,
          coverPhoto,
          isPrivate = false,
          organizers
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

        if (!name || !description || !startDate || !endDate
            || !location || !organizers || organizers.length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'Tous les champs obligatoires doivent être renseignés'
          });
        }

        const parsedStartDate = new Date(startDate);
        const parsedEndDate = new Date(endDate);

        if (parsedStartDate >= parsedEndDate) {
          return res.status(400).json({
            code: 400,
            message: 'La date de fin doit être postérieure à la date de début'
          });
        }

        const eventData = {
          name,
          description,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          location,
          coverPhoto,
          isPrivate,
          is_public: !isPrivate,
          organizers,
          groupId
        };

        const event = new this.EventModel(eventData);
        const savedEvent = await event.save();

        await this.GroupModel.findByIdAndUpdate(
          groupId,
          { $push: { events: savedEvent._id } }
        );

        return res.status(201).json({
          code: 201,
          message: 'Événement de groupe créé avec succès',
          data: savedEvent
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la création de l\'événement de groupe',
          error: error.message
        });
      }
    });
  }

  run() {
    this.getPublicEvents();
    this.getEventById();
    this.createEvent();
    this.createGroupEvent();
    this.updateEvent();
    this.deleteEvent();
    this.joinEvent();
    this.leaveEvent();
  }
}
