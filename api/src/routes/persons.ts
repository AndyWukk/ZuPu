import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  createPerson,
  getPersonById,
  updatePerson,
  deletePerson,
  getPersonRelationships,
  createRelationship,
  deleteRelationship
} from '../controllers/personController'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Create new person
router.post('/', createPerson)

// Get person by ID
router.get('/:id', getPersonById)

// Update person
router.put('/:id', updatePerson)

// Delete person
router.delete('/:id', deletePerson)

// Get person relationships
router.get('/:id/relationships', getPersonRelationships)

// Create relationship
router.post('/:id/relationships', createRelationship)

// Delete relationship
router.delete('/:id/relationships/:relationshipId', deleteRelationship)

export default router