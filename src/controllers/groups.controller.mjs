import mongoose from 'mongoose';
import GroupSchema from '../models/group.mjs';
import { authenticateToken, checkGroupAdmin } from '../middleware/auth.mjs';

export default class Groups {
  constructor(app, connect) {
    this.app = app;
    this.GroupModel = connect.model('Group', GroupSchema);

    this.run();
  }

  getPublicGroups() {
    this.app.get('/groups/public', async (req, res) => {
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const groups = await this.GroupModel
          .find({ type: 'public' })
          .populate('administrators', 'firstname lastname email')
          .populate('members', 'firstname lastname email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.GroupModel.countDocuments({ type: 'public' });

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: groups,
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
          message: 'Erreur lors de la récupération des groupes publics',
          error: error.message
        });
      }
    });
  }

  getGroupById() {
    this.app.get('/groups/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

        const group = await this.GroupModel
          .findById(id)
          .populate('administrators', 'firstname lastname email')
          .populate('members', 'firstname lastname email')
          .populate('events')
          .populate('discussion_id');

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Groupe non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: group
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération du groupe',
          error: error.message
        });
      }
    });
  }

  createGroup() {
    this.app.post('/groups', async (req, res) => {
      try {
        const {
          name,
          description,
          icon,
          coverPhoto,
          type = 'public',
          allowMemberPosts = true,
          allowMemberEvents = true,
          administrators
        } = req.body;

        if (!name || !description || !administrators || administrators.length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'Le nom, la description et au moins un administrateur sont requis'
          });
        }

        if (!['public', 'private', 'secret'].includes(type)) {
          return res.status(400).json({
            code: 400,
            message: 'Le type de groupe doit être public, private ou secret'
          });
        }

        const groupData = {
          name,
          description,
          icon,
          coverPhoto,
          type,
          allowMemberPosts,
          allowMemberEvents,
          administrators
        };

        const group = new this.GroupModel(groupData);
        const savedGroup = await group.save();

        return res.status(201).json({
          code: 201,
          message: 'Groupe créé avec succès',
          data: savedGroup
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la création du groupe',
          error: error.message
        });
      }
    });
  }

  updateGroup() {
    this.app.put('/groups/:id', authenticateToken, checkGroupAdmin(this.GroupModel), async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

        const updateData = { ...req.body, updated_at: new Date() };

        if (updateData.type && !['public', 'private', 'secret'].includes(updateData.type)) {
          return res.status(400).json({
            code: 400,
            message: 'Le type de groupe doit être public, private ou secret'
          });
        }

        const group = await this.GroupModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Groupe non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Groupe mis à jour avec succès',
          data: group
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la mise à jour du groupe',
          error: error.message
        });
      }
    });
  }

  deleteGroup() {
    this.app.delete('/groups/:id', authenticateToken, checkGroupAdmin(this.GroupModel), async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

        const group = await this.GroupModel.findByIdAndDelete(id);

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Groupe non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Groupe supprimé avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la suppression du groupe',
          error: error.message
        });
      }
    });
  }

  joinGroup() {
    this.app.post('/groups/:id/join', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID invalide'
          });
        }

        const group = await this.GroupModel.findById(id);

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Groupe non trouvé'
          });
        }

        if (group.type === 'secret') {
          return res.status(403).json({
            code: 403,
            message: 'Impossible de rejoindre un groupe secret'
          });
        }

        if (group.members.includes(userId)) {
          return res.status(400).json({
            code: 400,
            message: 'L\'utilisateur est déjà membre de ce groupe'
          });
        }

        group.members.push(userId);
        await group.save();

        return res.status(200).json({
          code: 200,
          message: 'Membre ajouté avec succès au groupe'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de l\'ajout au groupe',
          error: error.message
        });
      }
    });
  }

  leaveGroup() {
    this.app.post('/groups/:id/leave', async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(userId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID invalide'
          });
        }

        const group = await this.GroupModel.findById(id);

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Groupe non trouvé'
          });
        }

        if (group.administrators.includes(userId)) {
          return res.status(400).json({
            code: 400,
            message: 'Un administrateur ne peut pas quitter le groupe'
          });
        }

        group.members = group.members.filter(
          (memberId) => memberId.toString() !== userId
        );

        await group.save();

        return res.status(200).json({
          code: 200,
          message: 'Membre retiré du groupe avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors du retrait du groupe',
          error: error.message
        });
      }
    });
  }

  run() {
    this.getPublicGroups();
    this.getGroupById();
    this.createGroup();
    this.updateGroup();
    this.deleteGroup();
    this.joinGroup();
    this.leaveGroup();
  }
}
