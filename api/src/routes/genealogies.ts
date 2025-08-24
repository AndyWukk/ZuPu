import { Router } from 'express'
import { authenticateToken } from '../middleware/auth'
import {
  createGenealogy,
  getGenealogyById,
  updateGenealogy,
  deleteGenealogy,
  getUserGenealogies,
  getGenealogyPersons
} from '../controllers/genealogyController'

const router = Router()

// All routes require authentication
router.use(authenticateToken)

// Get user's genealogies
router.get('/', getUserGenealogies)

// Create new genealogy
router.post('/', createGenealogy)

// Get genealogy by ID
router.get('/:id', getGenealogyById)

// Update genealogy
router.put('/:id', updateGenealogy)

// Delete genealogy
router.delete('/:id', deleteGenealogy)

// Get genealogy persons
router.get('/:id/persons', getGenealogyPersons)

export default router