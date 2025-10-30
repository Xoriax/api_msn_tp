import mongoose from 'mongoose';
import TicketTypeSchema from '../models/ticketType.mjs';
import TicketSchema from '../models/ticket.mjs';

export default class Tickets {
  constructor(app, connect) {
    this.app = app;
    this.TicketTypeModel = connect.model('TicketType', TicketTypeSchema);
    this.TicketModel = connect.model('Ticket', TicketSchema);

    this.run();
  }

  getTicketTypesByEvent() {
    this.app.get('/events/:eventId/ticket-types', async (req, res) => {
      try {
        const { eventId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const ticketTypes = await this.TicketTypeModel
          .find({ event_id: eventId, is_active: true })
          .sort({ price: 1 });

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: ticketTypes
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération des types de billets',
          error: error.message
        });
      }
    });
  }

  createTicketType() {
    this.app.post('/events/:eventId/ticket-types', async (req, res) => {
      try {
        const { eventId } = req.params;
        const {
          name,
          price,
          quantityLimit,
          description
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        if (!name || price === undefined || !quantityLimit) {
          return res.status(400).json({
            code: 400,
            message: 'Le nom, le prix et la quantité limite sont requis'
          });
        }

        if (price < 0 || quantityLimit < 1) {
          return res.status(400).json({
            code: 400,
            message: 'Le prix doit être positif et la quantité limite au moins 1'
          });
        }

        const ticketTypeData = {
          name,
          price,
          quantityLimit,
          description,
          event_id: eventId
        };

        const ticketType = new this.TicketTypeModel(ticketTypeData);
        const savedTicketType = await ticketType.save();

        return res.status(201).json({
          code: 201,
          message: 'Type de billet créé avec succès',
          data: savedTicketType
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la création du type de billet',
          error: error.message
        });
      }
    });
  }

  purchaseTicket() {
    this.app.post('/ticket-types/:ticketTypeId/purchase', async (req, res) => {
      try {
        const { ticketTypeId } = req.params;
        const {
          buyerInfo
        } = req.body;

        if (!mongoose.Types.ObjectId.isValid(ticketTypeId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de type de billet invalide'
          });
        }

        if (!buyerInfo || !buyerInfo.firstname || !buyerInfo.lastname
            || !buyerInfo.email || !buyerInfo.address) {
          return res.status(400).json({
            code: 400,
            message: 'Toutes les informations de l\'acheteur sont requises'
          });
        }

        const ticketType = await this.TicketTypeModel.findById(ticketTypeId);

        if (!ticketType) {
          return res.status(404).json({
            code: 404,
            message: 'Type de billet non trouvé'
          });
        }

        if (!ticketType.is_active) {
          return res.status(400).json({
            code: 400,
            message: 'Ce type de billet n\'est plus disponible'
          });
        }

        if (ticketType.quantity_sold >= ticketType.quantityLimit) {
          return res.status(400).json({
            code: 400,
            message: 'Plus de billets disponibles pour ce type'
          });
        }

        const existingTicket = await this.TicketModel.findOne({
          event_id: ticketType.event_id,
          'buyerInfo.email': buyerInfo.email
        });

        if (existingTicket) {
          return res.status(400).json({
            code: 400,
            message: 'Une personne ne peut acheter qu\'un seul billet par événement'
          });
        }

        const ticketData = {
          ticket_type_id: ticketTypeId,
          event_id: ticketType.event_id,
          buyerInfo,
          ticket_number: `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
        };

        const ticket = new this.TicketModel(ticketData);
        const savedTicket = await ticket.save();

        ticketType.quantity_sold += 1;
        await ticketType.save();

        return res.status(201).json({
          code: 201,
          message: 'Billet acheté avec succès',
          data: savedTicket
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de l\'achat du billet',
          error: error.message
        });
      }
    });
  }

  getTicketByNumber() {
    this.app.get('/tickets/:ticketNumber', async (req, res) => {
      try {
        const { ticketNumber } = req.params;

        const ticket = await this.TicketModel
          .findOne({ ticket_number: ticketNumber })
          .populate('ticket_type_id')
          .populate('event_id', 'name startDate endDate location');

        if (!ticket) {
          return res.status(404).json({
            code: 404,
            message: 'Billet non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: ticket
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la récupération du billet',
          error: error.message
        });
      }
    });
  }

  getTicketsByEvent() {
    this.app.get('/events/:eventId/tickets', async (req, res) => {
      try {
        const { eventId } = req.params;
        const { page = 1, limit = 10 } = req.query;
        const skip = (page - 1) * limit;

        if (!mongoose.Types.ObjectId.isValid(eventId)) {
          return res.status(400).json({
            code: 400,
            message: 'ID d\'événement invalide'
          });
        }

        const tickets = await this.TicketModel
          .find({ event_id: eventId })
          .populate('ticket_type_id', 'name price')
          .sort({ purchase_date: -1 })
          .skip(skip)
          .limit(parseInt(limit, 10));

        const total = await this.TicketModel.countDocuments({ event_id: eventId });

        const stats = await this.TicketModel.aggregate([
          { $match: { event_id: new mongoose.Types.ObjectId(eventId) } },
          {
            $lookup: {
              from: 'ticket_types',
              localField: 'ticket_type_id',
              foreignField: '_id',
              as: 'ticket_type'
            }
          },
          { $unwind: '$ticket_type' },
          {
            $group: {
              _id: '$ticket_type_id',
              type_name: { $first: '$ticket_type.name' },
              count: { $sum: 1 },
              total_revenue: { $sum: '$ticket_type.price' }
            }
          }
        ]);

        return res.status(200).json({
          code: 200,
          message: 'success',
          data: tickets,
          statistics: stats,
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
          message: 'Erreur lors de la récupération des billets',
          error: error.message
        });
      }
    });
  }

  useTicket() {
    this.app.post('/tickets/:ticketNumber/use', async (req, res) => {
      try {
        const { ticketNumber } = req.params;

        const ticket = await this.TicketModel.findOne({ ticket_number: ticketNumber });

        if (!ticket) {
          return res.status(404).json({
            code: 404,
            message: 'Billet non trouvé'
          });
        }

        if (ticket.is_used) {
          return res.status(400).json({
            code: 400,
            message: 'Ce billet a déjà été utilisé',
            data: { used_at: ticket.used_at }
          });
        }

        ticket.is_used = true;
        ticket.used_at = new Date();
        await ticket.save();

        return res.status(200).json({
          code: 200,
          message: 'Billet marqué comme utilisé avec succès',
          data: { used_at: ticket.used_at }
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de l\'utilisation du billet',
          error: error.message
        });
      }
    });
  }

  updateTicketType() {
    this.app.put('/ticket-types/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de type de billet invalide'
          });
        }

        const updateData = { ...req.body, updated_at: new Date() };

        if (updateData.price !== undefined && updateData.price < 0) {
          return res.status(400).json({
            code: 400,
            message: 'Le prix doit être positif'
          });
        }

        if (updateData.quantityLimit !== undefined && updateData.quantityLimit < 1) {
          return res.status(400).json({
            code: 400,
            message: 'La quantité limite doit être au moins 1'
          });
        }

        const ticketType = await this.TicketTypeModel.findByIdAndUpdate(
          id,
          updateData,
          { new: true, runValidators: true }
        );

        if (!ticketType) {
          return res.status(404).json({
            code: 404,
            message: 'Type de billet non trouvé'
          });
        }

        return res.status(200).json({
          code: 200,
          message: 'Type de billet mis à jour avec succès',
          data: ticketType
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la mise à jour du type de billet',
          error: error.message
        });
      }
    });
  }

  deleteTicketType() {
    this.app.delete('/ticket-types/:id', async (req, res) => {
      try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({
            code: 400,
            message: 'ID de type de billet invalide'
          });
        }

        const ticketType = await this.TicketTypeModel.findById(id);

        if (!ticketType) {
          return res.status(404).json({
            code: 404,
            message: 'Type de billet non trouvé'
          });
        }

        if (ticketType.quantity_sold > 0) {
          return res.status(400).json({
            code: 400,
            message: `Impossible de supprimer ce type de billet, ${ticketType.quantity_sold} billet(s) actif(s) restant(s)`
          });
        }

        await this.TicketTypeModel.findByIdAndDelete(id);

        return res.status(200).json({
          code: 200,
          message: 'Type de billet supprimé avec succès'
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de la suppression du type de billet',
          error: error.message
        });
      }
    });
  }

  cancelTicket() {
    this.app.delete('/tickets/:ticketNumber', async (req, res) => {
      try {
        const { ticketNumber } = req.params;
        const { reason } = req.body;

        const ticket = await this.TicketModel.findOne({ ticket_number: ticketNumber });

        if (!ticket) {
          return res.status(404).json({
            code: 404,
            message: 'Billet non trouvé'
          });
        }

        if (ticket.is_used) {
          return res.status(400).json({
            code: 400,
            message: 'Impossible d\'annuler un billet déjà utilisé'
          });
        }

        if (ticket.status === 'cancelled') {
          return res.status(400).json({
            code: 400,
            message: 'Ce billet est déjà annulé'
          });
        }

        ticket.status = 'cancelled';
        ticket.cancelled_at = new Date();
        ticket.cancellation_reason = reason || 'Annulé par l\'utilisateur';
        await ticket.save();

        const ticketType = await this.TicketTypeModel.findById(ticket.ticket_type_id);
        if (ticketType && ticketType.quantity_sold > 0) {
          ticketType.quantity_sold -= 1;
          await ticketType.save();
        }

        return res.status(200).json({
          code: 200,
          message: 'Billet annulé avec succès',
          data: {
            ticketNumber: ticket.ticket_number,
            status: 'cancelled',
            cancelledAt: ticket.cancelled_at,
            reason: ticket.cancellation_reason
          }
        });
      } catch (error) {
        return res.status(500).json({
          code: 500,
          message: 'Erreur lors de l\'annulation du billet',
          error: error.message
        });
      }
    });
  }

  run() {
    this.getTicketTypesByEvent();
    this.createTicketType();
    this.purchaseTicket();
    this.getTicketByNumber();
    this.getTicketsByEvent();
    this.useTicket();
    this.updateTicketType();
    this.deleteTicketType();
    this.cancelTicket();
  }
}
