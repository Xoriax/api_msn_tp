import AlbumModel from '../models/album.mjs';
import PhotoModel from '../models/photo.mjs';
import EventSchema from '../models/event.mjs';
import GroupSchema from '../models/group.mjs';
import {
  authenticateToken,
  checkAlbumAccess,
  checkAlbumManageAccess,
  checkEventParticipant,
  checkEventOrganizer
} from '../middleware/auth.mjs';

const Albums = class Albums {
  constructor(app, connect) {
    this.app = app;
    this.AlbumModel = connect.model('Album', AlbumModel);
    this.PhotoModel = connect.model('Photo', PhotoModel);
    this.EventModel = connect.model('Event', EventSchema);
    this.GroupModel = connect.model('Group', GroupSchema);

    this.run();
  }

  getAlbumsByEvent() {
    this.app.get(
      '/events/:eventId/albums',
      authenticateToken,
      checkEventParticipant(this.EventModel),
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const { page = 1, limit = 10 } = req.query;
          const skip = (page - 1) * limit;

          const albums = await this.AlbumModel
            .find({ event_id: eventId })
            .populate('photos')
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit, 10));

          const total = await this.AlbumModel.countDocuments({ event_id: eventId });

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: albums,
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
            message: 'Erreur lors de la récupération des albums',
            error: error.message
          });
        }
      }
    );
  }

  getAll() {
    this.app.get('/albums', async (req, res) => {
      try {
        const { page = 1, limit = 10, title } = req.query;
        const skip = (page - 1) * limit;

        const filter = {};
        if (title) {
          filter.title = { $regex: title, $options: 'i' };
        }

        const albums = await this.AlbumModel
          .find(filter)
          .populate('photos')
          .populate('event_id', 'name startDate endDate')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.AlbumModel.countDocuments(filter);

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: albums,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (err) {
        console.error(`[ERROR] albums/ -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération des albums',
          error: err.message
        });
      }
    });
  }

  showById() {
    this.app.get(
      '/albums/:id',
      authenticateToken,
      checkAlbumAccess(this.AlbumModel, this.EventModel, this.GroupModel),
      async (req, res) => {
        try {
          const { id } = req.params;

          const album = await this.AlbumModel
            .findById(id)
            .populate('event_id', 'name startDate endDate')
            .populate({
              path: 'photos',
              populate: {
                path: 'uploadedBy',
                select: 'firstname lastname email'
              }
            });

          if (!album) {
            return res.status(404).json({
              code: 404,
              message: 'Album non trouvé'
            });
          }

          return res.status(200).json({
            code: 200,
            message: 'success',
            data: album
          });
        } catch (err) {
          console.error(`[ERROR] albums/:id -> ${err}`);
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la récupération de l\'album',
            error: err.message
          });
        }
      }
    );
  }

  create() {
    this.app.post(
      '/events/:eventId/albums',
      authenticateToken,
      checkEventOrganizer(this.EventModel),
      async (req, res) => {
        try {
          const { eventId } = req.params;
          const { title, description } = req.body;
          const currentUserId = req.user.userId;

          if (!title) {
            return res.status(400).json({
              code: 400,
              message: 'Le titre de l\'album est requis'
            });
          }

          const albumData = {
            title,
            description,
            event_id: eventId,
            createdBy: currentUserId
          };

          const album = new this.AlbumModel(albumData);
          const savedAlbum = await album.save();

          return res.status(201).json({
            code: 201,
            message: 'Album créé avec succès',
            data: savedAlbum
          });
        } catch (error) {
          console.error(`[ERROR] album/create -> ${error}`);
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la création de l\'album',
            error: error.message
          });
        }
      }
    );
  }

  update() {
    this.app.put(
      '/albums/:id',
      authenticateToken,
      checkAlbumManageAccess(this.AlbumModel, this.EventModel),
      async (req, res) => {
        try {
          const { id } = req.params;

          const updateData = { ...req.body, updated_at: new Date() };

          const album = await this.AlbumModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
          ).populate('photos').populate('event_id', 'name startDate endDate');

          if (!album) {
            return res.status(404).json({
              code: 404,
              message: 'Album non trouvé'
            });
          }

          return res.status(200).json({
            code: 200,
            message: 'Album mis à jour avec succès',
            data: album
          });
        } catch (err) {
          console.error(`[ERROR] albums/:id update -> ${err}`);
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la mise à jour de l\'album',
            error: err.message
          });
        }
      }
    );
  }

  deleteById() {
    this.app.delete(
      '/albums/:id',
      authenticateToken,
      checkAlbumManageAccess(this.AlbumModel, this.EventModel),
      async (req, res) => {
        try {
          const { id } = req.params;

          const album = await this.AlbumModel.findByIdAndDelete(id);

          if (!album) {
            return res.status(404).json({
              code: 404,
              message: 'Album non trouvé'
            });
          }

          return res.status(200).json({
            code: 200,
            message: 'Album supprimé avec succès'
          });
        } catch (err) {
          console.error(`[ERROR] albums/:id delete -> ${err}`);
          return res.status(500).json({
            code: 500,
            message: 'Erreur lors de la suppression de l\'album',
            error: err.message
          });
        }
      }
    );
  }

  run() {
    this.getAlbumsByEvent();
    this.getAll();
    this.showById();
    this.create();
    this.update();
    this.deleteById();
  }
};

export default Albums;
