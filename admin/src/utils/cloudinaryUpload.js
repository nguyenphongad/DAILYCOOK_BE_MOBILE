/**
 * Utility function để upload ảnh lên Cloudinary
 */

const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_APP_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_APP_CLOUDINARY_UPLOAD_PRESET;
const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;

/**
 * Upload một file ảnh lên Cloudinary
 * @param {File} file - File ảnh cần upload
 * @param {Object} options - Các tùy chọn upload
 * @param {string} options.folder - Thư mục lưu trữ trên Cloudinary
 * @returns {Promise<Object>} - Kết quả upload từ Cloudinary
 */
export const uploadImage = async (file, options = {}) => {
  try {
    if (!file) {
      throw new Error('Không tìm thấy file ảnh');
    }

    // Tạo FormData để gửi lên Cloudinary
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    
    // Thêm folder nếu được cung cấp
    if (options.folder) {
      formData.append('folder', options.folder);
    }

    // Thực hiện request upload
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Lỗi khi upload ảnh');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Upload image error:', error);
    throw error;
  }
};

/**
 * Upload nhiều file ảnh lên Cloudinary
 * @param {File[]} files - Danh sách file ảnh cần upload
 * @param {Object} options - Các tùy chọn upload
 * @returns {Promise<Object[]>} - Kết quả upload từ Cloudinary
 */
export const uploadMultipleImages = async (files, options = {}) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('Không tìm thấy file ảnh');
    }

    // Upload từng file một và trả về kết quả
    const uploadPromises = Array.from(files).map(file => uploadImage(file, options));
    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Upload multiple images error:', error);
    throw error;
  }
};

/**
 * Chuyển đổi file từ Upload component của Ant Design sang định dạng File thông thường
 * @param {Object} fileObj - File object từ Ant Design Upload
 * @returns {File|null} - File đã chuyển đổi hoặc null nếu không thành công
 */
export const convertAntdUploadFileToFile = (fileObj) => {
  if (!fileObj) return null;
  
  // Nếu đã là File hoặc Blob, trả về ngay
  if (fileObj instanceof File || fileObj instanceof Blob) {
    return fileObj;
  }
  
  // Nếu là đối tượng từ Ant Design Upload
  if (fileObj.originFileObj) {
    return fileObj.originFileObj;
  }
  
  return null;
};

export default {
  uploadImage,
  uploadMultipleImages,
  convertAntdUploadFileToFile
};
