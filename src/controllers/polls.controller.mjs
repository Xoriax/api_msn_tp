import mongoose from 'mongoose';
import PollSchema from '../models/poll.mjs';
import EventSchema from '../models/event.mjs';
import {
  authenticateToken,
  checkEventParticipant,
  checkPollCreator,
  checkPollDeleteAccess,
  checkPollResultsAccess
} from '../middleware/auth.mjs';

export default class Polls {
  constructor(app, connect) {
    this.app = app;
    this.PollModel = connect.model('Poll', PollSchema);
    this.EventModel = connect.model('Event', EventSchema);

    this.run();
  }

  getPollsByEvent() {
    this.app.get(
      '/events/:eventId/polls',
      authenticateToken,
      checkEventParticipant(this.EventModel),
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const { page = 1, limit = 10 } = req.query;
          const skip = (page - 1) * limit;

          const polls = await this.PollModel
            .find({ event_id: eventId })
            .populate('createdBy', 'firstname lastname email')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10));

          const total = await this.PollModel.countDocuments({ event_id: eventId });

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: polls,
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
            message: 'Erreur lors de la récupération des sondages',
            error: error.message
          });
        }
      }
    );
  }

  getPollById() {
    this.app.get(
      '/polls/:id',
      authenticateToken,
      async (req, res) => {
        try {
          const { id } = req.params;

          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
              code: 400,
              message: 'ID de sondage invalide'
            });
          }

          const poll = await this.PollModel
            .findById(id)
            .populate('createdBy', 'firstname lastname email')
            .populate('event_id', 'name startDate endDate')
            .populate('questions.options.votes', 'firstname lastname email');

          if (!poll) {
            return res.status(404).json({
              code: 404,
              message: 'Sondage non trouvé'
            });
          }

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: poll
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la récupération du sondage',
            error: error.message
          });
        }
      }
    );
  }

  createPoll() {
    this.app.post(
      '/events/:eventId/polls',
      authenticateToken,
      checkEventParticipant(this.EventModel),
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const currentUserId = req.user.userId;
          const {
            title,
            description,
            questions,
            endDate
          } = req.body;

          if (!title || !questions || questions.length === 0) {
            return res.status(400).json({
              code: 400,
              message: 'Le titre et au moins une question sont requis'
            });
          }

          for (const question of questions) {
            if (!question.question_text || !question.options || question.options.length < 2) {
              return res.status(400).json({
                code: 400,
                message: 'Chaque question doit avoir un texte et au moins 2 options'
              });
            }
          }

          const pollData = {
            title,
            description,
            event_id: eventId,
            createdBy: currentUserId,
            questions,
            endDate: endDate ? new Date(endDate) : null
          };

          const poll = new this.PollModel(pollData);
          const savedPoll = await poll.save();

          return res.status(201).json({
            code: 201,
            message: 'Sondage créé avec succès',
            data: savedPoll
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la création du sondage',
            error: error.message
          });
        }
      }
    );
  }

  vote() {
    this.app.post(
      '/polls/:id/vote',
      authenticateToken,
      async (req, res) => {
        try {
          const { id } = req.params;
          const { votes } = req.body;
          const currentUserId = req.user.userId;

          if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
              code: 400,
              message: 'ID de sondage invalide'
            });
          }

          if (!votes || !Array.isArray(votes) || votes.length === 0) {
            return res.status(400).json({
              code: 400,
              message: 'Les votes sont requis'
            });
          }

          const poll = await this.PollModel.findById(id);

          if (!poll) {
            return res.status(404).json({
              code: 404,
              message: 'Sondage non trouvé'
            });
          }

          const event = await this.EventModel.findById(poll.event_id);
          if (!event) {
            return res.status(404).json({
              code: 404,
              message: 'Événement associé au sondage non trouvé'
            });
          }

          const isParticipant = event.participants.some(
            (participantId) => participantId.toString() === currentUserId.toString()
          );

          if (!isParticipant) {
            return res.status(403).json({
              code: 403,
              message: 'Seuls les participants à l\'événement peuvent voter'
            });
          }

          if (!poll.is_active || (poll.endDate && new Date() > poll.endDate)) {
            return res.status(400).json({
              code: 400,
              message: 'Le sondage n\'est plus actif'
            });
          }

          for (const vote of votes) {
            const question = poll.questions.find((q) => q._id.toString() === vote.question_id);
            if (!question) {
              return res.status(400).json({
                code: 400,
                message: `Question ${vote.question_id} non trouvée`
              });
            }

            const option = question.options.find((opt) => opt._id.toString() === vote.option_id);
            if (!option) {
              return res.status(400).json({
                code: 400,
                message: `Option ${vote.option_id} non trouvée`
              });
            }

            question.options.forEach((opt, optIndex) => {
              const filteredVotes = opt.votes.filter(
                (voteUserId) => voteUserId.toString() !== currentUserId
              );
              question.options[optIndex].votes = filteredVotes;
            });

            if (!option.votes.includes(currentUserId)) {
              option.votes.push(currentUserId);
            }
          }

          await poll.save();

          return res.status(200).json({
            code: 200,
            message: 'Vote enregistré avec succès'
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de l\'enregistrement du vote',
            error: error.message
          });
        }
      }
    );
  }

  updatePoll() {
    this.app.put(
      '/polls/:id',
      authenticateToken,
      checkPollCreator(this.PollModel),
      async (req, res) => {
        try {
          const { id } = req.params;

          const updateData = { ...req.body, updated_at: new Date() };

          if (updateData.endDate) {
            updateData.endDate = new Date(updateData.endDate);
          }

          const poll = await this.PollModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
          );

          if (!poll) {
            return res.status(404).json({
              code: 404,
              message: 'Sondage non trouvé'
            });
          }

          return res.status(200).json({
            code: 200,
            message: 'Sondage mis à jour avec succès',
            data: poll
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la mise à jour du sondage',
            error: error.message
          });
        }
      }
    );
  }

  deletePoll() {
    this.app.delete(
      '/polls/:id',
      authenticateToken,
      checkPollDeleteAccess(this.PollModel, this.EventModel),
      async (req, res) => {
        try {
          const { id } = req.params;

          const poll = await this.PollModel.findByIdAndDelete(id);

          if (!poll) {
            return res.status(404).json({
              code: 404,
              message: 'Sondage non trouvé'
            });
          }

          return res.status(200).json({
            code: 200,
            message: 'Sondage supprimé avec succès'
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la suppression du sondage',
            error: error.message
          });
        }
      }
    );
  }

  getPollResults() {
    this.app.get(
      '/polls/:id/results',
      authenticateToken,
      checkPollResultsAccess(this.PollModel, this.EventModel),
      async (req, res) => {
        try {
          const { id } = req.params;

          const poll = await this.PollModel
            .findById(id)
            .populate('questions.options.votes', 'firstname lastname email');

          if (!poll) {
            return res.status(404).json({
              code: 404,
              message: 'Sondage non trouvé'
            });
          }

          const results = poll.questions.map((question) => ({
            question_id: question._id,
            question_text: question.question_text,
            total_votes: question.options.reduce((sum, option) => sum + option.votes.length, 0),
            options: question.options.map((option) => {
              const totalVotes = question.options.reduce((sum, opt) => sum + opt.votes.length, 0);
              return {
                option_id: option._id,
                text: option.text,
                votes_count: option.votes.length,
                percentage: totalVotes > 0
                  ? Math.round((option.votes.length / totalVotes) * 100)
                  : 0
              };
            })
          }));

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: {
              poll_id: poll._id,
              title: poll.title,
              description: poll.description,
              is_active: poll.is_active,
              results
            }
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la récupération des résultats',
            error: error.message
          });
        }
      }
    );
  }

  run() {
    this.getPollsByEvent();
    this.getPollById();
    this.createPoll();
    this.vote();
    this.updatePoll();
    this.deletePoll();
    this.getPollResults();
  }
}
