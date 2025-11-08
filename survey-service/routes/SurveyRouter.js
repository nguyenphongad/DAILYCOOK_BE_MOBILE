const router = require('express').Router();
const surveyController = require('../controllers/SurveyController');
const { verifyToken, verifyAdmin } = require('../middleware/SurveyMiddleware');

// =================================
// ONBOARDING ROUTES (Câu hỏi cứng)
// =================================

// User onboarding routes
router.get('/onboarding/status', verifyToken, surveyController.checkOnboardingStatus);
router.get('/onboarding/questions', verifyToken, surveyController.getOnboardingQuestions);
router.post('/onboarding/save', verifyToken, surveyController.saveOnboardingData);

// =================================
// SURVEY ROUTES (Câu hỏi mềm)
// =================================

// Admin survey routes
router.get('/admin/surveys', verifyToken, verifyAdmin, surveyController.getAllSurveysAdmin);
router.post('/admin/surveys', verifyToken, verifyAdmin, surveyController.createSurvey);
router.put('/admin/surveys/:id', verifyToken, verifyAdmin, surveyController.updateSurvey);
router.delete('/admin/surveys/:id', verifyToken, verifyAdmin, surveyController.deleteSurvey);

// User survey routes
router.get('/surveys', verifyToken, surveyController.getAllSurveys);
router.get('/surveys/responses', verifyToken, surveyController.getUserResponse);
router.post('/surveys/responses', verifyToken, surveyController.submitUserResponse);

module.exports = router;
