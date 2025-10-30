import mongoose from 'mongoose';
import AlbumModel from '../models/album.mjs';
import PhotoModel from '../models/photo.mjs';

const Photos = class Photos {
  constructor(app, connect) {
    this.app = app;
    this.AlbumModel = connect.model('Album', AlbumModel);
    this.PhotoModel = connect.model('Photo', PhotoModel);

    this.run();
  }

  getAllForAlbum() {
    this.app.get('/albums/:albumId/photos', async (req, res) => {
      try {
        const { albumId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(albumId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'album invalide'
          });
        }

        const photos = await this.PhotoModel
          .find({ album_id: albumId })
          .populate('uploadedBy', 'firstname lastname email')
          .populate('comments.author', 'firstname lastname email')
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.PhotoModel.countDocuments({ album_id: albumId });

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: photos,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (err) {
        console.error(`[ERROR] albums/:albumId/photos -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération des photos',
          error: err.message
        });
      }
    });
  }

  showById() {
    this.app.get('/photos/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de photo invalide'
          });
        }

        const photo = await this.PhotoModel
          .findById(id)
          .populate('uploadedBy', 'firstname lastname email')
          .populate('album_id', 'title event_id')
          .populate('comments.author', 'firstname lastname email');

        if (!photo) {
          return res.status(404).json({
            code: 404,
            message: 'Photo non trouvée'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: photo
        });
      } catch (err) {
        console.error(`[ERROR] photos/:id -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération de la photo',
          error: err.message
        });
      }
    });
  }

  create() {
    this.app.post('/albums/:albumId/photos', async (req, res) => {
      try {
        const { albumId } = req.params;
        const {
          title, url, caption, uploadedBy
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(albumId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'album invalide'
          });
        }

        if (!title || !url || !uploadedBy) {
          return res.status(400).json({
            code: 400,
            message: 'Le titre, l\'URL et l\'utilisateur qui upload sont requis'
          });
        }

        if (!mongoose.Types.ObjectId.isValid(uploadedBy)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'utilisateur invalide'
          });
        }

        const album = await this.AlbumModel.findById(albumId);
        if (!album) {
          return res.status(404).json({
            code: 404,
            message: 'Album non trouvé'
          });
        }

        const photoData = {
          title,
          url,
          caption,
          album_id: albumId,
          uploadedBy
        };

        const photo = new this.PhotoModel(photoData);
        const savedPhoto = await photo.save();

        await this.AlbumModel.findByIdAndUpdate(
          albumId,
          { $push: { photos: savedPhoto._id } }
        );

        return res.status(201).json({
          code: 201,
          message: 'Photo ajoutée avec succès',
          data: savedPhoto
        });
      } catch (error) {
        console.error(`[ERROR] albums/:albumId/photos create -> ${error}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de l\'ajout de la photo',
          error: error.message
        });
      }
    });
  }

  update() {
    this.app.put('/photos/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de photo invalide'
          });
        }

        const updateData = { ...req.body, updated_at: new Date() };

        const photo = await this.PhotoModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        ).populate('uploadedBy', 'firstname lastname email')
          .populate('album_id', 'title event_id')
          .populate('comments.author', 'firstname lastname email');

        if (!photo) {
          return res.status(404).json({
            code: 404,
            message: 'Photo non trouvée'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Photo mise à jour avec succès',
          data: photo
        });
      } catch (err) {
        console.error(`[ERROR] photos/:id update -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la mise à jour de la photo',
          error: err.message
        });
      }
    });
  }

  deleteById() {
    this.app.delete('/photos/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de photo invalide'
          });
        }

        const photo = await this.PhotoModel.findById(id);

        if (!photo) {
          return res.status(404).json({
            code: 404,
            message: 'Photo non trouvée'
          });
        }

        await this.PhotoModel.findByIdAndDelete(id);

        await this.AlbumModel.findByIdAndUpdate(
          photo.album_id,
          { $pull: { photos: photo._id } }
        );

        return res.status(200).json({
          code: 200,
          message: 'Photo supprimée avec succès'
        });
      } catch (err) {
        console.error(`[ERROR] photos/:id delete -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la suppression de la photo',
          error: err.message
        });
      }
    });
  }

  addComment() {
    this.app.post('/photos/:id/comments', async (req, res) => {
      try {
        const { id } = req.params;
        const { author, content } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(author)) {
          return res.status(400).json({
            code: 400,
            message: 'ID invalide'
          });
        }

        if (!content || content.trim().length === 0) {
          return res.status(400).json({
            code: 400,
            message: 'Le contenu du commentaire est requis'
          });
        }

        const photo = await this.PhotoModel.findById(id);

        if (!photo) {
          return res.status(404).json({
            code: 404,
            message: 'Photo non trouvée'
          });
        }

        const newComment = {
          author,
          content: content.trim(),
          created_at: new Date()
        };

        photo.comments.push(newComment);
        photo.updated_at = new Date();

        await photo.save();

        const savedPhoto = await this.PhotoModel
          .findById(id)
          .populate('comments.author', 'firstname lastname email');

        const addedComment = savedPhoto.comments[savedPhoto.comments.length - 1];

        return res.status(201).json({
          code: 201,
          message: 'Commentaire ajouté avec succès',
          data: addedComment
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de l\'ajout du commentaire',
          error: error.message
        });
      }
    });
  }

  deleteComment() {
    this.app.delete('/photos/:id/comments/:commentId', async (req, res) => {
      try {
        const { id, commentId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id) || !mongoose.Types.ObjectId.isValid(commentId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID invalide'
          });
        }

        const photo = await this.PhotoModel.findById(id);

        if (!photo) {
          return res.status(404).json({
            code: 404,
            message: 'Photo non trouvée'
          });
        }

        const commentIndex = photo.comments.findIndex(
          (comment) => comment._id.toString() === commentId
        );

        if (commentIndex === -1) {
          return res.status(404).json({
            code: 404,
            message: 'Commentaire non trouvé'
          });
        }

        photo.comments.splice(commentIndex, 1);
        photo.updated_at = new Date();

        await photo.save();

        return res.status(200).json({
          code: 200,
          message: 'Commentaire supprimé avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la suppression du commentaire',
          error: error.message
        });
      }
    });
  }

  run() {
    this.getAllForAlbum();
    this.showById();
    this.create();
    this.update();
    this.deleteById();
    this.addComment();
    this.deleteComment();
  }
};

export default Photos;
