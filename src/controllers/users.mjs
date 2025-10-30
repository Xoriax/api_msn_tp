import mongoose from 'mongoose';
import UserModel from '../models/user.mjs';
import { generateToken } from '../middleware/auth.mjs';

const Users = class Users {
  constructor(app, connect) {
    this.app = app;
    this.UserModel = connect.model('User', UserModel);

    this.run();
  }

  getall() {
    this.app.get('/users', async (req, res) => {
      try {
        const { page = 1, limit = 10, search } = req.query;
        const skip = (page - 1) * limit;

        let query = {};
        if (search) {
          query = {
            $or: [
              { firstname: { $regex: search, $options: 'i' } },
              { lastname: { $regex: search, $options: 'i' } },
              { email: { $regex: search, $options: 'i' } }
            ]
          };
        }

        const users = await this.UserModel
          .find(query)
          .sort({ created_at: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.UserModel.countDocuments(query);

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: users,
          pagination: {
            page: parseInt(page, 10),
            limit: parseInt(limit, 10),
            total,
            pages: Math.ceil(total / limit)
          }
        });
      } catch (err) {
        console.error(`[ERROR] users/ -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération des utilisateurs',
          error: err.message
        });
      }
    });
  }

  showById() {
    this.app.get('/users/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'utilisateur invalide'
          });
        }

        const user = await this.UserModel.findById(id);

        if (!user) {
          return res.status(404).json({
            code: 404,
            message: 'Utilisateur non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: user
        });
      } catch (err) {
        console.error(`[ERROR] users/:id -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération de l\'utilisateur',
          error: err.message
        });
      }
    });
  }

  create() {
    this.app.post('/users', async (req, res) => {
      try {
        const {
          email, firstname, lastname, avatar, age, city, phone
        } = req.body;

        if (!email || !firstname || !lastname) {
          return res.status(400).json({
            code: 400,
            message: 'L\'email, le prénom et le nom sont requis'
          });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({
            code: 400,
            message: 'Format d\'email invalide'
          });
        }

        const existingUser = await this.UserModel.findOne({ email });
        if (existingUser) {
          return res.status(400).json({
            code: 400,
            message: 'Un utilisateur avec cet email existe déjà'
          });
        }

        const userData = {
          email,
          firstname,
          lastname,
          avatar,
          age,
          city,
          phone
        };

        const userModel = new this.UserModel(userData);
        const savedUser = await userModel.save();

        return res.status(201).json({
          code: 201,
          message: 'Utilisateur créé avec succès',
          data: savedUser
        });
      } catch (err) {
        console.error(`[ERROR] users/create -> ${err}`);

        if (err.code === 11000) {
          return res.status(400).json({
            code: 400,
            message: 'Un utilisateur avec cet email existe déjà'
          });
        }
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la création de l\'utilisateur',
          error: err.message
        });
      }
    });
  }

  update() {
    this.app.put('/users/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'utilisateur invalide'
          });
        }

        const updateData = { ...req.body, updated_at: new Date() };

        if (updateData.email) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(updateData.email)) {
            return res.status(400).json({
              code: 400,
              message: 'Format d\'email invalide'
            });
          }

          const existingUser = await this.UserModel.findOne({
            email: updateData.email,
            _id: { $ne: id }
          });

          if (existingUser) {
            return res.status(400).json({
              code: 400,
              message: 'Cet email est déjà utilisé par un autre utilisateur'
            });
          }
        }

        const user = await this.UserModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!user) {
          return res.status(404).json({
            code: 404,
            message: 'Utilisateur non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Utilisateur mis à jour avec succès',
          data: user
        });
      } catch (err) {
        console.error(`[ERROR] users/update -> ${err}`);

        if (err.code === 11000) {
          return res.status(400).json({
            code: 400,
            message: 'Cet email est déjà utilisé par un autre utilisateur'
          });
        }
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la mise à jour de l\'utilisateur',
          error: err.message
        });
      }
    });
  }

  deleteById() {
    this.app.delete('/users/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'utilisateur invalide'
          });
        }

        const user = await this.UserModel.findByIdAndDelete(id);

        if (!user) {
          return res.status(404).json({
            code: 404,
            message: 'Utilisateur non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Utilisateur supprimé avec succès'
        });
      } catch (err) {
        console.error(`[ERROR] users/:id -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la suppression de l\'utilisateur',
          error: err.message
        });
      }
    });
  }

  getUserByEmail() {
    this.app.get('/users/email/:email', async (req, res) => {
      try {
        const { email } = req.params;

        const user = await this.UserModel.findOne({ email });

        if (!user) {
          return res.status(404).json({
            code: 404,
            message: 'Utilisateur non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: user
        });
      } catch (err) {
        console.error(`[ERROR] users/email/:email -> ${err}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération de l\'utilisateur',
          error: err.message
        });
      }
    });
  }

  login() {
    this.app.post('/auth/login', async (req, res) => {
      try {
        const { email, password } = req.body;

        if (!email || !password) {
          return res.status(400).json({
            code: 400,
            message: 'Email et mot de passe requis'
          });
        }

        const user = await this.UserModel.findOne({ email });
        if (!user) {
          return res.status(401).json({
            code: 401,
            message: 'Email ou mot de passe incorrect'
          });
        }

        if (user.password !== password) {
          return res.status(401).json({
            code: 401,
            message: 'Email ou mot de passe incorrect'
          });
        }

        const token = generateToken(user._id);

        return res.status(200).json({
          code: 200,
          message: 'Connexion réussie',
          data: {
            token,
            user: {
              id: user._id,
              firstname: user.firstname,
              lastname: user.lastname,
              email: user.email
            }
          }
        });
      } catch (error) {
        console.error(`[ERROR] auth/login -> ${error}`);
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la connexion',
          error: error.message
        });
      }
    });
  }

  run() {
    this.getall();
    this.showById();
    this.create();
    this.update();
    this.deleteById();
    this.getUserByEmail();
    this.login();
  }
};

export default Users;
