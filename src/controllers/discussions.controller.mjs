import mongoose from 'mongoose';
import DiscussionSchema from '../models/discussion.mjs';

export default class Discussions {
  constructor(app, connect) {
    this.app = app;
    this.DiscussionModel = connect.model('Discussion', DiscussionSchema);

    this.run();
  }

  getGroupDiscussion() {
    this.app.get('/groups/:groupId/discussion', async (req, res) => {
      try {
        const { groupId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

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
    });
  }

  getEventDiscussion() {
    this.app.get('/events/:eventId/discussion', async (req, res) => {
      try {
        const { eventId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

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
    });
  }

  createGroupDiscussion() {
    this.app.post('/groups/:groupId/discussion', async (req, res) => {
      try {
        const { groupId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(groupId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

        const existingDiscussion = await this.DiscussionModel.findOne({ linked_to_group: groupId });

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
    });
  }

  createEventDiscussion() {
    this.app.post('/events/:eventId/discussion', async (req, res) => {
      try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const existingDiscussion = await this.DiscussionModel.findOne({ linked_to_event: eventId });

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
    });
  }

  addMessage() {
    this.app.post('/discussions/:discussionId/messages', async (req, res) => {
      try {
        const { discussionId } = req.params;
        const { author, content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(discussionId)
            || !mongoose.Types.ObjectId.isValid(author)) {
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

        const newMessage = {
          author,
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
    });
  }

  replyToMessage() {
    this.app.post('/discussions/:discussionId/messages/:messageId/replies', async (req, res) => {
      try {
        const { discussionId, messageId } = req.params;
        const { author, content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(discussionId)
            || !mongoose.Types.ObjectId.isValid(messageId)
            || !mongoose.Types.ObjectId.isValid(author)) {
          return res.status(400).json({
            code: 400,
            message: 'ID invalide'
          });
        }

        if (!content || content.trim().length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'Le contenu de la réponse est requis'
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

        const newReply = {
          author,
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
    });
  }

  deleteMessage() {
    this.app.delete('/discussions/:discussionId/messages/:messageId', async (req, res) => {
      try {
        const { discussionId, messageId } = req.params;

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
    });
  }

  run() {
    this.getGroupDiscussion();
    this.getEventDiscussion();
    this.createGroupDiscussion();
    this.createEventDiscussion();
    this.addMessage();
    this.replyToMessage();
    this.deleteMessage();
  }
}
