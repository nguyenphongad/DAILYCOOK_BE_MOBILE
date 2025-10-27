const router = require('express').Router();
const surveyController = require('../controllers/SurveyController');
const { verifyToken, verifyAdmin } = require('../middleware/SurveyMiddleware');

// Admin routes
router.get('/admin/surveys', verifyToken, verifyAdmin, surveyController.getAllSurveysAdmin); // Thêm route mới
router.post('/admin/surveys', verifyToken, verifyAdmin, surveyController.createSurvey);
router.put('/admin/surveys/:id', verifyToken, verifyAdmin, surveyController.updateSurvey);
router.delete('/admin/surveys/:id', verifyToken, verifyAdmin, surveyController.deleteSurvey);

// User routes
router.get('/surveys', verifyToken, surveyController.getAllSurveys);
router.get('/responses', verifyToken, surveyController.getUserResponse);
router.post('/responses', verifyToken, surveyController.submitUserResponse);

module.exports = router;
