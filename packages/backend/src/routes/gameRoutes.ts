import { Router } from 'express'
import { gameController } from '../controllers/gameController'

const router = Router()

router.post('/private/create', gameController.createPrivateGame)
router.post('/private/join', gameController.joinPrivateGame)
router.post('/public/join', gameController.joinPublicGame)

export default router 