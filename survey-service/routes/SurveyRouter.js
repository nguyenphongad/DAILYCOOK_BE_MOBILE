const router = require('express').Router();
const surveyController = require('../controllers/SurveyController');
const { verifyToken, verifyAdmin, verifyApiKey } = require('../middleware/SurveyMiddleware');

// =================================
// ONBOARDING ROUTES (Câu hỏi cứng)
// =================================

// User onboarding routes
router.get('/onboarding/status', verifyApiKey, verifyToken, surveyController.checkOnboardingStatus); // Kiểm tra trạng thái hoàn thành onboarding
router.get('/onboarding/questions', verifyApiKey, verifyToken, surveyController.getOnboardingQuestions); // Lấy danh sách câu hỏi onboarding theo loại
router.post('/onboarding/save', verifyApiKey, verifyToken, surveyController.saveOnboardingData); // Lưu thông tin onboarding của user

// Admin onboarding routes
router.get('/admin/onboarding', verifyApiKey, verifyToken, verifyAdmin, surveyController.getAllUserProfiles); // Admin xem tất cả hồ sơ onboarding
router.get('/admin/onboarding/:id', verifyApiKey, verifyToken, verifyAdmin, surveyController.getUserProfileDetail); // Admin xem chi tiết hồ sơ onboarding

// =================================
// SURVEY ROUTES (Câu hỏi mềm)
// =================================

// Admin survey routes
router.get('/admin/surveys', verifyApiKey, verifyToken, verifyAdmin, surveyController.getAllSurveysAdmin); // Admin xem tất cả khảo sát
router.post('/admin/surveys', verifyApiKey, verifyToken, verifyAdmin, surveyController.createSurvey); // Admin tạo khảo sát mới
router.put('/admin/surveys/:id', verifyApiKey, verifyToken, verifyAdmin, surveyController.updateSurvey); // Admin cập nhật khảo sát
router.delete('/admin/surveys/:id', verifyApiKey, verifyToken, verifyAdmin, surveyController.deleteSurvey); // Admin xóa khảo sát

// User survey routes
router.get('/surveys', verifyApiKey, verifyToken, surveyController.getAllSurveys); // User xem khảo sát đang hoạt động
router.get('/surveys/responses', verifyApiKey, verifyToken, surveyController.getUserResponse); // User xem câu trả lời của mình
router.post('/surveys/responses', verifyApiKey, verifyToken, surveyController.submitUserResponse); // User gửi câu trả lời khảo sát

module.exports = router;
