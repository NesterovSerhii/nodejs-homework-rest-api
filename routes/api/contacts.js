import express from "express";

import contactsController from "../../controllers/contacts-controller.js";

import { isEmptyBody } from "../../middlewares/index.js";

import { validateBody } from "../../decorators/index.js";

import { contactsAddSchema } from "../../schemas/contacts-schemas.js";

const contactAddValidate = validateBody(contactsAddSchema)

const contactsRouter = express.Router();

contactsRouter.get('/', contactsController.getAllContacts);

contactsRouter.get('/:id', contactsController.getContactById);

contactsRouter.post('/', isEmptyBody, contactAddValidate, contactsController.addContact)

contactsRouter.delete('/:id', contactsController.removeContact)

contactsRouter.put('/:id', isEmptyBody, contactAddValidate, contactsController.updateContact)

export default contactsRouter;
