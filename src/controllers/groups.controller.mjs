import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import GroupSchema from '../models/group.mjs';
import { authenticateToken, checkGroupAdmin, checkGroupCreator } from '../middleware/auth.mjs';

export default class Groups {
  constructor(app, connect) {
    this.app = app;
    this.GroupModel = connect.model('Group', GroupSchema);

    this.run();
  }

  getAllGroups() {
    this.app.get('/groups', async (req, res) => {
      try {
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        const authHeader = req.headers.authorization;
        let currentUserId = null;

        if (authHeader) {
          const token = authHeader.split(' ')[1];
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key-change-this-in-production');
            currentUserId = decoded.userId;
          } catch (err) {
            console.error('Token invalide:', err);
          }
        }

        const groups = await this.GroupModel
          .find({ type: { $ne: 'secret' } })
          .populate('administrators', 'firstname lastname email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.GroupModel.countDocuments({ type: { $ne: 'secret' } });

        const filteredGroups = groups.map((group) => {
          const groupObj = group.toObject();

          if (group.type === 'public') {
            return groupObj;
          }

          if (group.type === 'private') {
            const isMember = currentUserId && (
              group.members.some((member) => member._id.toString() === currentUserId)
              || group.administrators.some((admin) => admin._id.toString() === currentUserId)
            );

            if (isMember) {
              return groupObj;
            }

            return {
              _id: groupObj._id,
              name: groupObj.name,
              description: groupObj.description,
              icon: groupObj.icon,
              coverPhoto: groupObj.coverPhoto,
              type: groupObj.type,
              created_at: groupObj.created_at,
              memberCount: group.members.length,
              isPrivate: true,
              canJoin: true
            };
          }

          return groupObj;
        });

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: filteredGroups,
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
          message: 'Erreur lors de la récupération des groupes',
          error: error.message
        });
      }
    });
  }

  getGroupById() {
    this.app.get('/groups/:id', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.user;

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

        if (group.type === 'secret') {
          const isMember = group.members.some((member) => member._id.toString() === userId)
            || group.administrators.some((admin) => admin._id.toString() === userId);

          if (!isMember) {
            return res.status(404).json({
              code: 404,
              message: 'Groupe non trouvé'
            });
          }
        }

        if (group.type === 'private') {
          const isMember = group.members.some((member) => member._id.toString() === userId)
            || group.administrators.some((admin) => admin._id.toString() === userId);

          if (!isMember) {
            const groupObj = group.toObject();
            return res.status(200).json({
              code: 200,
              message: 'success',
              data: {
                _id: groupObj._id,
                name: groupObj.name,
                description: groupObj.description,
                icon: groupObj.icon,
                coverPhoto: groupObj.coverPhoto,
                type: groupObj.type,
                created_at: groupObj.created_at,
                memberCount: group.members.length,
                isPrivate: true,
                canJoin: true,
                message: 'Informations limitées - Rejoignez le groupe pour voir plus de détails'
              }
            });
          }
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
    this.app.post('/groups', authenticateToken, async (req, res) => {
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
    this.app.delete('/groups/:id', authenticateToken, checkGroupCreator(this.GroupModel), async (req, res) => {
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
    this.app.post('/groups/:id/join', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
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

        if (group.members.includes(userId) || group.administrators.includes(userId)) {
          return res.status(400).json({
            code: 400,
            message: 'Vous êtes déjà membre de ce groupe'
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
    this.app.post('/groups/:id/leave', authenticateToken, async (req, res) => {
      try {
        const { id } = req.params;
        const { userId } = req.user;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de groupe invalide'
          });
        }

        const group = await this.GroupModel.findById(id);

        if (!group) {
          return res.status(404).json({
            code: 404,
            message: 'Groupe non trouvé'
          });
        }

        const isMember = group.members.some(
          (memberId) => memberId.toString() === userId.toString()
        );

        if (!isMember) {
          return res.status(400).json({
            code: 400,
            message: 'Vous n\'êtes pas membre de ce groupe'
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
    this.getAllGroups();
    this.getGroupById();
    this.createGroup();
    this.updateGroup();
    this.deleteGroup();
    this.joinGroup();
    this.leaveGroup();
  }
}
