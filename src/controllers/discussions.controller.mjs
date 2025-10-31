import mongoose from 'mongoose';
import DiscussionSchema from '../models/discussion.mjs';
import GroupSchema from '../models/group.mjs';
import EventSchema from '../models/event.mjs';
import {
  authenticateToken,
  checkGroupMember,
  checkEventParticipant,
  checkEventOrganizer,
  checkGroupAdmin,
  checkDiscussionAccess
} from '../middleware/auth.mjs';

export default class Discussions {
  constructor(app, connect) {
    this.app = app;
    this.DiscussionModel = connect.model('Discussion', DiscussionSchema);
    this.GroupModel = connect.model('Group', GroupSchema);
    this.EventModel = connect.model('Event', EventSchema);

    this.run();
  }

  getGroupDiscussion() {
    this.app.get(
      '/groups/:groupId/discussion',
      authenticateToken,
      checkGroupMember(this.GroupModel),
      async (req, res) => {
        try {
          const { groupId } = req.params;
          const { page = 1, limit = 20 } = req.query;
          const skip = (page - 1) * limit;

          const discussion = await this.DiscussionModel
            .findOne({ linked_to_group: groupId })
            .populate('messages.author', 'firstname lastname email')
            .populate('messages.replies.author', 'firstname lastname email');

          if (!discussion) {
            return res.status(404).json({
              code: 404,
              message: 'Discussion non trouvée'
            });
          }

          const totalMessages = discussion.messages.length;
          const messages = discussion.messages
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(skip, skip + parseInt(limit, 10));

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: {
              discussion_id: discussion._id,
              messages,
              pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total: totalMessages,
                pages: Math.ceil(totalMessages / limit)
              }
            }
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la récupération de la discussion',
            error: error.message
          });
        }
      }
    );
  }

  getEventDiscussion() {
    this.app.get(
      '/events/:eventId/discussion',
      authenticateToken,
      checkEventParticipant(this.EventModel),
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const { page = 1, limit = 20 } = req.query;
          const skip = (page - 1) * limit;

          const discussion = await this.DiscussionModel
            .findOne({ linked_to_event: eventId })
            .populate('messages.author', 'firstname lastname email')
            .populate('messages.replies.author', 'firstname lastname email');

          if (!discussion) {
            return res.status(404).json({
              code: 404,
              message: 'Discussion non trouvée'
            });
          }

          const totalMessages = discussion.messages.length;
          const messages = discussion.messages
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(skip, skip + parseInt(limit, 10));

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: {
              discussion_id: discussion._id,
              messages,
              pagination: {
                page: parseInt(page, 10),
                limit: parseInt(limit, 10),
                total: totalMessages,
                pages: Math.ceil(totalMessages / limit)
              }
            }
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la récupération de la discussion',
            error: error.message
          });
        }
      }
    );
  }

  createGroupDiscussion() {
    this.app.post(
      '/groups/:groupId/discussion',
      authenticateToken,
      checkGroupAdmin(this.GroupModel),
      async (req, res) => {
        try {
          const { groupId } = req.params;

          const existingDiscussion = await this.DiscussionModel.findOne({
            linked_to_group: groupId
          });

          if (existingDiscussion) {
            return res.status(400).json({
              code: 400,
              message: 'Une discussion existe déjà pour ce groupe'
            });
          }

          const discussionData = {
            linked_to_group: groupId
          };

          const discussion = new this.DiscussionModel(discussionData);
          const savedDiscussion = await discussion.save();

          return res.status(201).json({
            code: 201,
            message: 'Discussion créée avec succès',
            data: savedDiscussion
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la création de la discussion',
            error: error.message
          });
        }
      }
    );
  }

  createEventDiscussion() {
    this.app.post(
      '/events/:eventId/discussion',
      authenticateToken,
      checkEventOrganizer(this.EventModel),
      async (req, res) => {
        try {
          const { eventId } = req.params;

          const existingDiscussion = await this.DiscussionModel.findOne({
            linked_to_event: eventId
          });

          if (existingDiscussion) {
            return res.status(400).json({
              code: 400,
              message: 'Une discussion existe déjà pour cet événement'
            });
          }

          const discussionData = {
            linked_to_event: eventId
          };

          const discussion = new this.DiscussionModel(discussionData);
          const savedDiscussion = await discussion.save();

          return res.status(201).json({
            code: 201,
            message: 'Discussion créée avec succès',
            data: savedDiscussion
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la création de la discussion',
            error: error.message
          });
        }
      }
    );
  }

  addMessage() {
    this.app.post(
      '/discussions/:discussionId/messages',
      authenticateToken,
      checkDiscussionAccess(
        this.DiscussionModel,
        this.GroupModel,
        this.EventModel
      ),
      async (req, res) => {
        try {
          const { discussionId } = req.params;
          const { content } = req.body;
          const currentUserId = req.user.userId;

          if (!content || content.trim().length === 0) {
            return res.status(400).json({
              code: 400,
              message: 'Le contenu du message est requis'
            });
          }

          const { discussion } = req;

          const newMessage = {
            author: currentUserId,
            content: content.trim(),
            created_at: new Date()
          };

          discussion.messages.push(newMessage);
          discussion.updated_at = new Date();

          await discussion.save();

          const savedDiscussion = await this.DiscussionModel
            .findById(discussionId)
            .populate('messages.author', 'firstname lastname email');

          const addedMessage = savedDiscussion.messages[savedDiscussion.messages.length - 1];

          return res.status(201).json({
            code: 201,
            message: 'Message ajouté avec succès',
            data: addedMessage
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de l\'ajout du message',
            error: error.message
          });
        }
      }
    );
  }

  replyToMessage() {
    this.app.post(
      '/discussions/:discussionId/messages/:messageId/replies',
      authenticateToken,
      checkDiscussionAccess(
        this.DiscussionModel,
        this.GroupModel,
        this.EventModel
      ),
      async (req, res) => {
        try {
          const { discussionId, messageId } = req.params;
          const { content } = req.body;
          const currentUserId = req.user.userId;

          if (!mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
              code: 400,
              message: 'ID de message invalide'
            });
          }

          if (!content || content.trim().length === 0) {
            return res.status(400).json({
              code: 400,
              message: 'Le contenu de la réponse est requis'
            });
          }

          const { discussion } = req;

          const message = discussion.messages.id(messageId);

          if (!message) {
            return res.status(404).json({
              code: 404,
              message: 'Message non trouvé'
            });
          }

          const newReply = {
            author: currentUserId,
            content: content.trim(),
            created_at: new Date()
          };

          message.replies.push(newReply);
          discussion.updated_at = new Date();

          await discussion.save();

          const savedDiscussion = await this.DiscussionModel
            .findById(discussionId)
            .populate('messages.replies.author', 'firstname lastname email');

          const updatedMessage = savedDiscussion.messages.id(messageId);
          const addedReply = updatedMessage.replies[updatedMessage.replies.length - 1];

          return res.status(201).json({
            code: 201,
            message: 'Réponse ajoutée avec succès',
            data: addedReply
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de l\'ajout de la réponse',
            error: error.message
          });
        }
      }
    );
  }

  deleteMessage() {
    this.app.delete(
      '/discussions/:discussionId/messages/:messageId',
      authenticateToken,
      async (req, res) => {
        try {
          const { discussionId, messageId } = req.params;
          const currentUserId = req.user.userId;

          if (!mongoose.Types.ObjectId.isValid(discussionId)
            || !mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
              code: 400,
              message: 'ID invalide'
            });
          }

          const discussion = await this.DiscussionModel.findById(discussionId);

          if (!discussion) {
            return res.status(404).json({
              code: 404,
              message: 'Discussion non trouvée'
            });
          }

          const messageIndex = discussion.messages.findIndex(
            (msg) => msg._id.toString() === messageId
          );

          if (messageIndex === -1) {
            return res.status(404).json({
              code: 404,
              message: 'Message non trouvé'
            });
          }

          const message = discussion.messages[messageIndex];

          if (message.author.toString() !== currentUserId.toString()) {
            return res.status(403).json({
              code: 403,
              message: 'Vous ne pouvez supprimer que vos propres messages'
            });
          }

          discussion.messages.splice(messageIndex, 1);
          discussion.updated_at = new Date();

          await discussion.save();

          return res.status(200).json({
            code: 200,
            message: 'Message supprimé avec succès'
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la suppression du message',
            error: error.message
          });
        }
      }
    );
  }

  updateMessage() {
    this.app.put(
      '/discussions/:discussionId/messages/:messageId',
      authenticateToken,
      async (req, res) => {
        try {
          const { discussionId, messageId } = req.params;
          const { content } = req.body;
          const currentUserId = req.user.userId;

          if (!mongoose.Types.ObjectId.isValid(discussionId)
            || !mongoose.Types.ObjectId.isValid(messageId)) {
            return res.status(400).json({
              code: 400,
              message: 'ID invalide'
            });
          }

          if (!content || content.trim().length === 0) {
            return res.status(400).json({
              code: 400,
              message: 'Le contenu du message est requis'
            });
          }

          const discussion = await this.DiscussionModel.findById(discussionId);

          if (!discussion) {
            return res.status(404).json({
              code: 404,
              message: 'Discussion non trouvée'
            });
          }

          const message = discussion.messages.id(messageId);

          if (!message) {
            return res.status(404).json({
              code: 404,
              message: 'Message non trouvé'
            });
          }

          if (message.author.toString() !== currentUserId.toString()) {
            return res.status(403).json({
              code: 403,
              message: 'Vous ne pouvez modifier que vos propres messages'
            });
          }

          message.content = content.trim();
          message.updated_at = new Date();
          discussion.updated_at = new Date();

          await discussion.save();

          const savedDiscussion = await this.DiscussionModel
            .findById(discussionId)
            .populate('messages.author', 'firstname lastname email');

          const updatedMessage = savedDiscussion.messages.id(messageId);

          return res.status(200).json({
            code: 200,
            message: 'Message modifié avec succès',
            data: updatedMessage
          });
        } catch (error) {
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la modification du message',
            error: error.message
          });
        }
      }
    );
  }

  run() {
    this.getGroupDiscussion();
    this.getEventDiscussion();
    this.createGroupDiscussion();
    this.createEventDiscussion();
    this.addMessage();
    this.replyToMessage();
    this.deleteMessage();
    this.updateMessage();
  }
}
